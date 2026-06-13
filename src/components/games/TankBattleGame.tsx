"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { GameShell, useBestScore } from "./GameShell";

/* ──────────────────────────────────────────────────────────────────────────
 * A small tribute to Battle City (Tank 1990). Not pixel-perfect — it borrows
 * the feel: random brick/steel maps, simple AI enemies, bricks crumble when
 * shot, steel doesn't, you respawn until you run out of lives. Plays on
 * desktop (arrows/WASD + Space) and mobile (D-pad + Fire).
 * ────────────────────────────────────────────────────────────────────────── */

const COLS = 13;
const ROWS = 13;
const TILE = 26;                    // pixels per tile
const W = COLS * TILE;              // 338px
const H = ROWS * TILE;              // 338px
const TANK_SIZE = TILE * 2;         // 2×2 tiles, classic
const BULLET_W = 4;
const BULLET_H = 8;
const ENEMIES_TO_BEAT = 5;
const MAX_ALIVE_ENEMIES = 3;
const MAX_LIVES = 3;

type Tile = "empty" | "brick" | "steel";
type Dir = "up" | "down" | "left" | "right";
const DIRS: Dir[] = ["up", "down", "left", "right"];

const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
};

type Tank = {
  id: number;
  x: number;            // top-left in pixels
  y: number;
  dir: Dir;
  isPlayer: boolean;
  cooldown: number;     // ms until can fire again
  hasBullet: boolean;   // tank fires one bullet at a time
  spawnInvuln: number;  // ms of invulnerability after spawning
  // AI bookkeeping
  aiNextTurnAt: number; // ms timestamp
  aiNextFireAt: number;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  dir: Dir;
  ownerId: number;      // tank id
  fromPlayer: boolean;
};

let __id = 1;
const nextId = () => __id++;

export function TankBattleGame() {
  const game = games.find((g) => g.slug === "tank-battle")!;
  const t = useT();
  const [best, submitBest] = useBestScore(game.highScoreKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<Tile[]>([]);
  const playerRef = useRef<Tank | null>(null);
  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const pressedRef = useRef<{ [k in Dir]?: boolean } & { fire?: boolean }>({});
  const remainingSpawnsRef = useRef(ENEMIES_TO_BEAT);
  const lastTickRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  // Score / lives mirrored in refs so the rAF loop can read them without
  // capturing stale state.
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [enemiesLeft, setEnemiesLeft] = useState(ENEMIES_TO_BEAT);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState<null | "win" | "lose">(null);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const newMap = useCallback(() => {
    mapRef.current = generateMap();
    bulletsRef.current = [];
    enemiesRef.current = [];
    remainingSpawnsRef.current = ENEMIES_TO_BEAT;
    lastEnemySpawnRef.current = 0;
    playerRef.current = makePlayer();
    setEnemiesLeft(ENEMIES_TO_BEAT);
  }, []);

  const reset = useCallback(() => {
    newMap();
    setScore(0);
    setLives(MAX_LIVES);
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    setOver(null);
  }, [newMap]);

  const handleStart = useCallback(() => {
    reset();
    setRunning(true);
  }, [reset]);

  const handleNewMap = useCallback(() => {
    newMap();
    setRunning(true);
    setOver(null);
  }, [newMap]);

  // ──────────────── input helpers ────────────────
  const tryFire = useCallback((tank: Tank, now: number) => {
    if (tank.cooldown > now) return;
    if (tank.hasBullet) return;
    tank.cooldown = now + 350;
    tank.hasBullet = true;
    const center = tankCenter(tank);
    const v = DIR_VEC[tank.dir];
    bulletsRef.current.push({
      id: nextId(),
      x: center.x - BULLET_W / 2 + v.x * (TANK_SIZE / 2 - 2),
      y: center.y - BULLET_H / 2 + v.y * (TANK_SIZE / 2 - 2),
      dir: tank.dir,
      ownerId: tank.id,
      fromPlayer: tank.isPlayer,
    });
  }, []);

  const respawnPlayer = useCallback(() => {
    const p = makePlayer();
    // Don't reset score, just put player back
    playerRef.current = p;
  }, []);

  // ──────────────── game step ────────────────
  const step = useCallback(
    (now: number) => {
      const dt = lastTickRef.current ? Math.min(33, now - lastTickRef.current) : 16;
      lastTickRef.current = now;

      // 1. Move player
      const p = playerRef.current;
      if (p) {
        p.spawnInvuln = Math.max(0, p.spawnInvuln - dt);
        let inputDir: Dir | null = null;
        if (pressedRef.current.up) inputDir = "up";
        else if (pressedRef.current.down) inputDir = "down";
        else if (pressedRef.current.left) inputDir = "left";
        else if (pressedRef.current.right) inputDir = "right";

        if (inputDir) {
          p.dir = inputDir;
          tryMove(p, dt * 0.07);
        }
        if (pressedRef.current.fire) {
          tryFire(p, now);
        }
      }

      // 2. Spawn enemies
      if (
        remainingSpawnsRef.current > 0 &&
        enemiesRef.current.length < MAX_ALIVE_ENEMIES &&
        now - lastEnemySpawnRef.current > 1200
      ) {
        const e = makeEnemy(mapRef.current, enemiesRef.current, p);
        if (e) {
          enemiesRef.current.push(e);
          remainingSpawnsRef.current -= 1;
          lastEnemySpawnRef.current = now;
        }
      }

      // 3. Move enemies (simple AI)
      for (const e of enemiesRef.current) {
        e.spawnInvuln = Math.max(0, e.spawnInvuln - dt);

        if (now > e.aiNextTurnAt || isBlockedAhead(e)) {
          // Pick a new direction: 60% toward player, 40% random
          const choices: Dir[] = [...DIRS];
          if (p && Math.random() < 0.6) {
            const towardP = DIRS.filter((d) => {
              const v = DIR_VEC[d];
              return (
                (v.x !== 0 && Math.sign(p.x - e.x) === v.x) ||
                (v.y !== 0 && Math.sign(p.y - e.y) === v.y)
              );
            });
            if (towardP.length) choices.unshift(...towardP, ...towardP);
          }
          e.dir = choices[Math.floor(Math.random() * choices.length)];
          e.aiNextTurnAt = now + 700 + Math.random() * 1500;
        }
        tryMove(e, dt * 0.045);

        if (now > e.aiNextFireAt) {
          tryFire(e, now);
          e.aiNextFireAt = now + 800 + Math.random() * 1400;
        }
      }

      // 4. Bullets
      const liveBullets: Bullet[] = [];
      for (const b of bulletsRef.current) {
        const v = DIR_VEC[b.dir];
        const speed = dt * 0.35;
        b.x += v.x * speed;
        b.y += v.y * speed;

        // Out of bounds
        if (b.x < -BULLET_W || b.x > W || b.y < -BULLET_H || b.y > H) {
          freeOwnerBullet(b);
          continue;
        }

        // Hit terrain
        const hit = checkBulletTerrain(b);
        if (hit) {
          freeOwnerBullet(b);
          continue;
        }

        // Hit a tank
        let consumed = false;
        if (b.fromPlayer) {
          for (let i = 0; i < enemiesRef.current.length; i++) {
            const e = enemiesRef.current[i];
            if (e.spawnInvuln > 0) continue;
            if (bulletHitsTank(b, e)) {
              enemiesRef.current.splice(i, 1);
              setEnemiesLeft((x) => x - 1);
              setScore((s) => {
                const ns = s + 1;
                scoreRef.current = ns;
                return ns;
              });
              consumed = true;
              freeOwnerBullet(b);
              break;
            }
          }
        } else {
          // Always re-read the player ref — respawnPlayer() may have created
          // a new tank earlier this same frame.
          const curP = playerRef.current;
          if (curP && curP.spawnInvuln <= 0 && bulletHitsTank(b, curP)) {
            consumed = true;
            freeOwnerBullet(b);
            const newLives = livesRef.current - 1;
            livesRef.current = newLives;
            setLives(newLives);
            if (newLives <= 0) {
              setRunning(false);
              setOver("lose");
              submitBest(scoreRef.current);
            } else {
              respawnPlayer();
            }
          }
        }
        if (!consumed) liveBullets.push(b);
      }
      bulletsRef.current = liveBullets;

      // 5. Win check
      if (
        remainingSpawnsRef.current === 0 &&
        enemiesRef.current.length === 0 &&
        !over
      ) {
        setRunning(false);
        setOver("win");
        submitBest(scoreRef.current);
      }

      draw(canvasRef.current, mapRef.current, playerRef.current, enemiesRef.current, bulletsRef.current);
      return true;
    },
    [over, respawnPlayer, submitBest, tryFire],
  );

  // ──────────────── rAF ────────────────
  useEffect(() => {
    if (!running) {
      // still draw the current state so map is visible at start
      draw(canvasRef.current, mapRef.current, playerRef.current, enemiesRef.current, bulletsRef.current);
      return;
    }
    const loop = (now: number) => {
      step(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, step]);

  // ──────────────── keyboard ────────────────
  useEffect(() => {
    const dirFromKey = (k: string): Dir | null => {
      const lk = k.toLowerCase();
      if (lk === "arrowup"    || lk === "w") return "up";
      if (lk === "arrowdown"  || lk === "s") return "down";
      if (lk === "arrowleft"  || lk === "a") return "left";
      if (lk === "arrowright" || lk === "d") return "right";
      return null;
    };
    const onDown = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      if (d) {
        e.preventDefault();
        pressedRef.current[d] = true;
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (over) {
          handleStart();
          return;
        }
        if (!running) {
          handleStart();
          return;
        }
        pressedRef.current.fire = true;
      }
      if (e.key === "Enter" && (over || !running)) handleStart();
    };
    const onUp = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      if (d) pressedRef.current[d] = false;
      if (e.key === " ") pressedRef.current.fire = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [over, running, handleStart]);

  // ──────────────── initial map for the very first render ────────────────
  useEffect(() => {
    if (mapRef.current.length === 0) {
      mapRef.current = generateMap();
      playerRef.current = makePlayer();
    }
    draw(canvasRef.current, mapRef.current, playerRef.current, enemiesRef.current, bulletsRef.current);
  }, []);

  // Touch-friendly press handlers
  const pressDir = (d: Dir, on: boolean) => () => {
    pressedRef.current[d] = on;
  };
  const pressFire = (on: boolean) => () => {
    if (on) {
      if (over || !running) {
        handleStart();
        return;
      }
    }
    pressedRef.current.fire = on;
  };

  const isNewBest = over === "win" && score > 0 && score >= best;

  return (
    <GameShell game={game}>
      <div className="flex items-center justify-between gap-3 text-sm font-mono flex-wrap">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="text-white/45">{t("game.score")}: </span>
          <span className="text-white font-semibold">{score}</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="text-white/45">{t("game.best")}: </span>
          <span className="text-white font-semibold">{best}</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 flex items-center gap-2">
          <span aria-label="lives">
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <span
                key={i}
                className={i < lives ? "text-rose-300" : "text-white/15"}
                aria-hidden
              >
                ♥
              </span>
            ))}
          </span>
          <span className="text-white/30">·</span>
          <span>
            <span className="text-white/45">{t("tank.enemies")}: </span>
            <span className="text-white font-semibold">{enemiesLeft}</span>
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.55)] max-w-full touch-none"
          style={{ touchAction: "none" }}
        />

        {!running && !over && (
          <Overlay>
            <p className="text-sm text-white/70">{t("game.gameStartHint")}</p>
            <button onClick={handleStart} className={primaryBtn}>
              {t("game.start")}
            </button>
          </Overlay>
        )}
        {over === "lose" && (
          <Overlay>
            <div className="text-2xl">💥</div>
            <p className="text-lg font-semibold text-white">{t("tank.gameOver")}</p>
            <p className="text-sm text-white/65">{t("tank.gameOverHint")}</p>
            <p className="text-sm font-mono text-white/55">
              {t("game.score")}: <span className="text-white">{score}</span>
              {" · "}
              {t("game.best")}: <span className="text-white">{Math.max(best, score)}</span>
            </p>
            <button onClick={handleStart} className={primaryBtn}>
              {t("game.restart")}
            </button>
          </Overlay>
        )}
        {over === "win" && (
          <Overlay>
            <div className="text-2xl">🏆</div>
            <p className="text-lg font-semibold text-white">{t("tank.win")}</p>
            <p className="text-sm text-white/65">{t("tank.winHint")}</p>
            <p className="text-sm font-mono text-white/55">
              {t("game.score")}: <span className="text-white">{score}</span>
              {" · "}
              {t("game.best")}: <span className="text-white">{Math.max(best, score)}</span>
            </p>
            {isNewBest && (
              <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>
            )}
            <button onClick={handleNewMap} className={primaryBtn}>
              {t("tank.newMap")}
            </button>
          </Overlay>
        )}
      </div>

      {/* Mobile D-pad + Fire */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:hidden">
        <div className="grid grid-cols-3 gap-2 max-w-[200px]">
          <div />
          <DpadBtn label="▲" onDown={pressDir("up", true)} onUp={pressDir("up", false)} />
          <div />
          <DpadBtn label="◀" onDown={pressDir("left", true)} onUp={pressDir("left", false)} />
          <DpadBtn label="▼" onDown={pressDir("down", true)} onUp={pressDir("down", false)} />
          <DpadBtn label="▶" onDown={pressDir("right", true)} onUp={pressDir("right", false)} />
        </div>
        <div className="flex items-end justify-end">
          <button
            onTouchStart={(e) => { e.preventDefault(); pressFire(true)(); }}
            onTouchEnd={(e) => { e.preventDefault(); pressFire(false)(); }}
            onMouseDown={pressFire(true)}
            onMouseUp={pressFire(false)}
            onMouseLeave={pressFire(false)}
            className="h-16 w-16 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-black font-bold text-sm shadow-[0_8px_24px_rgba(244,63,94,0.4)] active:scale-95 transition-transform"
          >
            {t("tank.fire").toUpperCase()}
          </button>
        </div>
      </div>
    </GameShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers (kept outside the component so they don't recreate every render)
 * ────────────────────────────────────────────────────────────────────────── */

function tankCenter(t: Tank) {
  return { x: t.x + TANK_SIZE / 2, y: t.y + TANK_SIZE / 2 };
}

function makePlayer(): Tank {
  // Spawn at bottom-center
  const tx = Math.floor(COLS / 2) - 1; // 2x2 footprint
  const ty = ROWS - 2;
  return {
    id: nextId(),
    x: tx * TILE,
    y: ty * TILE,
    dir: "up",
    isPlayer: true,
    cooldown: 0,
    hasBullet: false,
    spawnInvuln: 1000,
    aiNextTurnAt: 0,
    aiNextFireAt: 0,
  };
}

function makeEnemy(map: Tile[], existing: Tank[], player: Tank | null): Tank | null {
  // Top row, three spawn columns (left, center, right)
  const cols = [0, Math.floor(COLS / 2) - 1, COLS - 2];
  const tryCols = cols.sort(() => Math.random() - 0.5);
  for (const tx of tryCols) {
    const ty = 0;
    const px = tx * TILE;
    const py = ty * TILE;
    if (areaPassable(map, px, py)) {
      if (existing.every((e) => Math.abs(e.x - px) > TILE || Math.abs(e.y - py) > TILE) &&
          (!player || Math.abs(player.x - px) > TANK_SIZE || Math.abs(player.y - py) > TANK_SIZE)) {
        return {
          id: nextId(),
          x: px,
          y: py,
          dir: "down",
          isPlayer: false,
          cooldown: 0,
          hasBullet: false,
          spawnInvuln: 800,
          aiNextTurnAt: 0,
          aiNextFireAt: performance.now() + 1500,
        };
      }
    }
  }
  return null;
}

function generateMap(): Tile[] {
  const m: Tile[] = new Array(COLS * ROWS).fill("empty");

  // Random scatter
  for (let i = 0; i < m.length; i++) {
    const r = Math.random();
    if (r < 0.32) m[i] = "brick";
    else if (r < 0.36) m[i] = "steel";
  }

  // Clear borders so tanks can move along edges
  for (let x = 0; x < COLS; x++) {
    m[idx(x, 0)] = "empty";
    m[idx(x, ROWS - 1)] = "empty";
  }
  for (let y = 0; y < ROWS; y++) {
    m[idx(0, y)] = "empty";
    m[idx(COLS - 1, y)] = "empty";
  }

  // Clear player spawn (2x2) at bottom-center plus a column above it
  const px = Math.floor(COLS / 2) - 1;
  const py = ROWS - 2;
  for (let x = px - 1; x <= px + 2; x++) {
    for (let y = py - 2; y <= py + 1; y++) {
      if (inBounds(x, y)) m[idx(x, y)] = "empty";
    }
  }

  // Clear enemy spawn areas
  for (const ex of [0, Math.floor(COLS / 2) - 1, COLS - 2]) {
    for (let x = ex; x < ex + 3 && x < COLS; x++) {
      for (let y = 0; y < 3; y++) {
        m[idx(x, y)] = "empty";
      }
    }
  }

  return m;
}

function idx(x: number, y: number) { return y * COLS + x; }
function inBounds(x: number, y: number) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

function areaPassable(map: Tile[], px: number, py: number): boolean {
  // A tank's 2x2 footprint passes if every covered tile is "empty".
  const left   = Math.floor(px / TILE);
  const top    = Math.floor(py / TILE);
  const right  = Math.floor((px + TANK_SIZE - 1) / TILE);
  const bottom = Math.floor((py + TANK_SIZE - 1) / TILE);
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      if (!inBounds(x, y)) return false;
      if (map[idx(x, y)] !== "empty") return false;
    }
  }
  return true;
}

function tryMove(t: Tank, distance: number) {
  // Move along one axis; if blocked, snap toward the closest tile lane to
  // make turning corners feel right.
  const v = DIR_VEC[t.dir];
  if (v.x !== 0) {
    // Snap Y to nearest tile lane
    const lane = Math.round(t.y / TILE) * TILE;
    const drift = (lane - t.y);
    if (Math.abs(drift) > 0.1) t.y += Math.sign(drift) * Math.min(distance, Math.abs(drift));
    const tryX = t.x + v.x * distance;
    if (areaPassable(mapStatic, tryX, t.y)) t.x = tryX;
  } else if (v.y !== 0) {
    const lane = Math.round(t.x / TILE) * TILE;
    const drift = (lane - t.x);
    if (Math.abs(drift) > 0.1) t.x += Math.sign(drift) * Math.min(distance, Math.abs(drift));
    const tryY = t.y + v.y * distance;
    if (areaPassable(mapStatic, t.x, tryY)) t.y = tryY;
  }
}

function isBlockedAhead(t: Tank): boolean {
  const v = DIR_VEC[t.dir];
  const tryX = t.x + v.x * 4;
  const tryY = t.y + v.y * 4;
  return !areaPassable(mapStatic, tryX, tryY);
}

function freeOwnerBullet(b: Bullet) {
  // Find owner and mark hasBullet = false so they can fire again.
  if (b.fromPlayer && _playerStatic) {
    _playerStatic.hasBullet = false;
  } else {
    const owner = _enemiesStatic.find((e) => e.id === b.ownerId);
    if (owner) owner.hasBullet = false;
  }
}

function checkBulletTerrain(b: Bullet): boolean {
  const tx = Math.floor((b.x + BULLET_W / 2) / TILE);
  const ty = Math.floor((b.y + BULLET_H / 2) / TILE);
  if (!inBounds(tx, ty)) return false;
  const tile = mapStatic[idx(tx, ty)];
  if (tile === "brick") {
    mapStatic[idx(tx, ty)] = "empty";
    return true;
  }
  if (tile === "steel") return true;
  return false;
}

function bulletHitsTank(b: Bullet, t: Tank): boolean {
  return (
    b.x + BULLET_W > t.x &&
    b.x < t.x + TANK_SIZE &&
    b.y + BULLET_H > t.y &&
    b.y < t.y + TANK_SIZE
  );
}

/* The collision helpers above need access to the *current* map/tanks. To avoid
 * threading refs through every function, we use module-level mirrors that the
 * component keeps in sync. They're set by draw() each frame and by step()
 * indirectly via mapRef. */
let mapStatic: Tile[] = [];
let _playerStatic: Tank | null = null;
let _enemiesStatic: Tank[] = [];

function draw(
  canvas: HTMLCanvasElement | null,
  map: Tile[],
  player: Tank | null,
  enemies: Tank[],
  bullets: Bullet[],
) {
  // Keep the module-level mirrors fresh (this runs every frame).
  mapStatic = map;
  _playerStatic = player;
  _enemiesStatic = enemies;

  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // bg
  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // tiles
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[idx(x, y)];
      if (t === "empty") continue;
      if (t === "brick") {
        drawBrick(ctx, x * TILE, y * TILE);
      } else if (t === "steel") {
        drawSteel(ctx, x * TILE, y * TILE);
      }
    }
  }

  // tanks
  for (const e of enemies) drawTank(ctx, e, "#f87171");
  if (player) drawTank(ctx, player, "#7cf2ff");

  // bullets
  for (const b of bullets) {
    ctx.fillStyle = b.fromPlayer ? "#fde68a" : "#fda4af";
    ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
  }
}

function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#9a3412";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 1;
  // staggered horizontal bricks
  for (let row = 0; row < 4; row++) {
    const yy = y + row * (TILE / 4);
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + TILE, yy);
    ctx.stroke();
  }
  for (let row = 0; row < 4; row++) {
    const yy = y + row * (TILE / 4);
    const offset = row % 2 === 0 ? TILE / 3 : (2 * TILE) / 3;
    ctx.beginPath();
    ctx.moveTo(x + offset, yy);
    ctx.lineTo(x + offset, yy + TILE / 4);
    ctx.stroke();
  }
}

function drawSteel(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const g = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  g.addColorStop(0, "#94a3b8");
  g.addColorStop(1, "#475569");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  ctx.strokeRect(x + TILE / 2 + 0.5, y + 0.5, 0, TILE - 1);
  ctx.beginPath();
  ctx.moveTo(x + TILE / 2, y);
  ctx.lineTo(x + TILE / 2, y + TILE);
  ctx.moveTo(x, y + TILE / 2);
  ctx.lineTo(x + TILE, y + TILE / 2);
  ctx.stroke();
}

function drawTank(ctx: CanvasRenderingContext2D, t: Tank, color: string) {
  const { x, y } = t;
  const s = TANK_SIZE;
  const blink = t.spawnInvuln > 0 && Math.floor(t.spawnInvuln / 100) % 2 === 0;
  if (blink) return;

  // body
  ctx.fillStyle = color;
  // tracks (slightly darker)
  ctx.fillRect(x, y + 4, 6, s - 8);
  ctx.fillRect(x + s - 6, y + 4, 6, s - 8);
  // hull
  ctx.fillRect(x + 6, y + 6, s - 12, s - 12);

  // barrel
  ctx.fillStyle = "#0a0d14";
  const cx = x + s / 2, cy = y + s / 2;
  const barrelW = 4, barrelL = s / 2;
  switch (t.dir) {
    case "up":    ctx.fillRect(cx - barrelW / 2, y, barrelW, barrelL); break;
    case "down":  ctx.fillRect(cx - barrelW / 2, cy, barrelW, barrelL); break;
    case "left":  ctx.fillRect(x, cy - barrelW / 2, barrelL, barrelW); break;
    case "right": ctx.fillRect(cx, cy - barrelW / 2, barrelL, barrelW); break;
  }

  // small "rivet" highlights so the tank doesn't look like a flat square
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x + 8, y + 8, 4, 4);
  ctx.fillRect(x + s - 12, y + 8, 4, 4);
  ctx.fillRect(x + 8, y + s - 12, 4, 4);
  ctx.fillRect(x + s - 12, y + s - 12, 4, 4);
}

/* ──────────────────────────────────────────────────────────────────────────
 * UI bits
 * ────────────────────────────────────────────────────────────────────────── */

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 rounded-2xl backdrop-blur-sm bg-black/55 flex flex-col items-center justify-center gap-3 px-6 text-center">
      {children}
    </div>
  );
}

const primaryBtn =
  "mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-white text-black px-5 text-sm font-medium hover:bg-white/90 transition-colors";

function DpadBtn({
  label,
  onDown,
  onUp,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onDown(); }}
      onTouchEnd={(e) => { e.preventDefault(); onUp(); }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      className="h-12 w-12 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white/80 active:scale-95 transition-transform text-lg"
      aria-label={label}
    >
      {label}
    </button>
  );
}
