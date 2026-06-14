/* lampham extensions on top of the upstream MIT mario port.
 * Patches added without touching the original game.js / player.js / etc.
 *
 *   1. Force music autoplay on first user gesture (browsers block <audio>
 *      .play() without one — upstream calls it at level-load time which
 *      silently rejects).
 *   2. Lives counter persisted across the death/reload cycle, with a HUD.
 *   3. Mario.OneUp class — Mushroom subclass that grants +1 life.
 *   4. Mario.Level.prototype.putHiddenBlock — invisible block until bonked.
 *   5. World 1-2 — Mario.onetwo, a remixed variant of 1-1 with extra
 *      goombas/koopas + a star. The world loader is patched so winning
 *      1-1 advances to 1-2 and winning 1-2 cycles back to 1-1.
 *   6. Lives-aware auto-restart on death; GAME OVER flash on lives -1.
 *   7. Floating "+1 LIFE" / "GAME OVER" / "WORLD" text overlay.
 */
(function () {
  // ─── Music autoplay ─────────────────────────────────────────────────
  var startMusic = function () {
    try {
      if (typeof music !== 'undefined' && music.overworld) {
        var p = music.overworld.play();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
    window.removeEventListener('keydown', startMusic, true);
    window.removeEventListener('pointerdown', startMusic, true);
  };
  window.addEventListener('keydown', startMusic, true);
  window.addEventListener('pointerdown', startMusic, true);

  // ─── Persisted state ────────────────────────────────────────────────
  var INITIAL_LIVES = 3;
  var parsed = parseInt(sessionStorage.getItem('marioLives'), 10);
  var lives = (isNaN(parsed) || parsed < 0) ? INITIAL_LIVES : parsed;

  // ─── HUD ────────────────────────────────────────────────────────────
  var hud = document.createElement('div');
  hud.style.cssText =
    'position:fixed;top:8px;left:50%;transform:translateX(-50%);' +
    'color:#fff;font-family:ui-monospace,monospace;font-size:14px;' +
    'background:rgba(0,0,0,0.65);padding:4px 12px;border-radius:6px;' +
    'z-index:1000;pointer-events:none;text-shadow:1px 1px 0 #000;' +
    'white-space:nowrap;';
  document.body.appendChild(hud);

  function worldLabel() {
    if (typeof level === 'undefined' || !level) return '1-1';
    if (level._world) return level._world;
    if (level.loader === Mario.oneonetunnel) return '1-1 ⤵';
    return '1-1';
  }
  function updateHUD() {
    hud.textContent = '🍄 × ' + lives + '  ·  World ' + worldLabel();
  }
  updateHUD();

  function showFloating(text, color) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText =
      'position:fixed;left:50%;top:32%;transform:translateX(-50%);' +
      'color:' + color + ';font-family:ui-monospace,monospace;' +
      'font-size:22px;font-weight:700;text-shadow:2px 2px 0 #000;' +
      'z-index:1001;pointer-events:none;transition:transform 1.3s ease-out,opacity 1.3s ease-out;';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.transform = 'translateX(-50%) translateY(-60px)';
      el.style.opacity = '0';
    });
    setTimeout(function () { el.remove(); }, 1400);
  }

  // ─── Class extensions (OneUp + hidden block + level 1-2) ────────────
  function setupExtensions() {
    if (typeof Mario === 'undefined' || typeof player === 'undefined'
        || !Mario.Mushroom || !Mario.Block || !Mario.Level || !Mario.oneone
        || Mario.OneUp) {
      return false;
    }

    player.addLife = function () {
      lives++;
      sessionStorage.setItem('marioLives', lives);
      updateHUD();
      showFloating('+1 LIFE', '#86efac');
    };

    // OneUp — visually a super mushroom but grants +1 life on pickup.
    Mario.OneUp = function (pos) { Mario.Mushroom.call(this, pos); };
    Mario.OneUp.prototype = Object.create(Mario.Mushroom.prototype);
    Mario.OneUp.prototype.constructor = Mario.OneUp;
    Mario.OneUp.prototype.isPlayerCollided = function () {
      var a = [this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1]];
      var b = [player.pos[0] + player.hitbox[0], player.pos[1] + player.hitbox[1]];
      if (!(a[0] > b[0] + player.hitbox[2] || a[0] + this.hitbox[2] < b[0])) {
        if (!(a[1] > b[1] + player.hitbox[3] || a[1] + this.hitbox[3] < b[1])) {
          delete level.items[this.idx];
          try { sounds.powerup.play(); } catch (e) {}
          player.addLife();
        }
      }
    };

    // putHiddenBlock — invisible until bonked from below; afterwards
    // renders as a normal "used" block + spawns its item.
    Mario.Level.prototype.putHiddenBlock = function (x, y, item) {
      var block = new Mario.Block({
        pos: [16 * x, 16 * y],
        sprite: this.ublockSprite,
        usedSprite: this.ublockSprite,
        bounceSprite: null,
        breakable: false,
        item: item,
      });
      block.standing = true;
      var inner = block.render.bind(block);
      block.render = function (ctx, vX, vY) {
        if (this.standing) return; // hidden
        inner(ctx, vX, vY);
      };
      this.blocks[y][x] = block;
    };

    // World 1-2 — remix of 1-1: same geometry + extra enemies + a star.
    // The upstream only ships ONE level layout (11.js), so each "new
    // world" reuses it with more pressure layered on top.
    Mario.onetwo = function () {
      Mario.oneone();
      level._world = '1-2';
      level.loader = Mario.onethree;
      [30, 45, 60, 80, 135, 155, 180].forEach(function (x) {
        level.putGoomba(x, x === 80 ? 4 : 12);
      });
      level.putKoopa(70, 11);
      level.putKoopa(140, 11);
      level.putQBlock(40, 5, new Mario.Star([40 * 16, 5 * 16]));
    };

    // World 1-3 — even more enemies, fewer power-ups, koopa heavy.
    Mario.onethree = function () {
      Mario.oneone();
      level._world = '1-3';
      level.loader = Mario.onefour;
      [25, 38, 55, 90, 105, 130, 165, 185].forEach(function (x) {
        level.putGoomba(x, 12);
      });
      [60, 85, 120, 150, 175].forEach(function (x) {
        level.putKoopa(x, 11);
      });
    };

    // World 1-4 — boss-rush feel: enemies clustered near the flag.
    Mario.onefour = function () {
      Mario.oneone();
      level._world = '1-4';
      level.loader = Mario.oneone;        // → cycle back to 1-1
      // Pack the final approach with goombas + koopas.
      for (var x = 140; x <= 195; x += 4) level.putGoomba(x, 12);
      [150, 160, 170, 180, 190].forEach(function (x) {
        level.putKoopa(x, 11);
      });
      // Compensate with a star, fire flower, and an extra 1-up.
      level.putQBlock(30, 5, new Mario.Star([30 * 16, 5 * 16]));
      level.putQBlock(60, 5, new Mario.Fireflower([60 * 16, 5 * 16]));
      level.putHiddenBlock(110, 5, new Mario.OneUp([110 * 16, 5 * 16]));
    };

    return true;
  }

  // ─── Level-loaded watcher ───────────────────────────────────────────
  // Re-runs whenever the level object is replaced so we can:
  //   - inject the hidden 1-up on World 1-1
  //   - patch level.loader so the first-load 1-1 advances to 1-2 (the
  //     later worlds set their own loader pointer when they build).
  var lastLevel = null;
  var injectedFor = null;
  var watcher = setInterval(function () {
    if (!setupExtensions()) return;
    if (typeof level === 'undefined' || !level) return;
    if (level === lastLevel) return;
    lastLevel = level;

    updateHUD();

    // First-load 1-1 (no `_world` tag) → its built-in loader is
    // Mario.oneone (loops to itself). Patch to Mario.onetwo so the
    // chain becomes 1-1 → 1-2 → 1-3 → 1-4 → 1-1 → …
    if (level.loader === Mario.oneone && !level._world) {
      level._world = '1-1';
      level.loader = Mario.onetwo;
    }

    console.info('[mario] World', worldLabel(), '— loader →',
      level.loader === Mario.oneone   ? 'Mario.oneone' :
      level.loader === Mario.onetwo   ? 'Mario.onetwo' :
      level.loader === Mario.onethree ? 'Mario.onethree' :
      level.loader === Mario.onefour  ? 'Mario.onefour' : '?');

    // Inject the hidden 1-up at the classic SMB 1-1 location once per
    // visit to that level (tile 94, 5 — above the 4-pipe section).
    if (level._world === '1-1' && injectedFor !== level) {
      try {
        level.putHiddenBlock(94, 5, new Mario.OneUp([94 * 16, 5 * 16]));
        injectedFor = level;
      } catch (e) {}
    }
  }, 150);

  // ─── Lives-aware auto-restart on death ──────────────────────────────
  var scheduled = false;
  var deathWatch = setInterval(function () {
    try {
      if (typeof player !== 'undefined' && player.dying && !scheduled) {
        scheduled = true;
        clearInterval(deathWatch);
        setTimeout(function () {
          lives--;
          if (lives < 0) {
            sessionStorage.removeItem('marioLives');
            showFloating('GAME OVER', '#ef4444');
            setTimeout(function () { window.location.reload(); }, 1500);
          } else {
            sessionStorage.setItem('marioLives', lives);
            window.location.reload();
          }
        }, 2800);
      }
    } catch (e) {}
  }, 250);
})();
