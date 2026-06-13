"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { STAGES, STAGE_COLS, STAGE_ROWS } from "@/lib/tankStages";
import { TANK_SOUNDS, registerTankSounds, sound } from "@/lib/sound";
import { GameShell, useBestScore } from "./GameShell";

/* ──────────────────────────────────────────────────────────────────────────
 * A bigger Battle City tribute. Ported from the design (not the C++) of
 * https://github.com/krystiankaluzny/Tanks (MIT). Stage layouts borrowed
 * verbatim; everything else (rendering, AI loop, input) is fresh.
 * ────────────────────────────────────────────────────────────────────────── */

const TILE = 13;                     // canvas pixels per stage cell
const W = STAGE_COLS * TILE;         // 338
const H = STAGE_ROWS * TILE;         // 338
const TANK_SIZE = TILE * 2;          // 2×2 cells, classic

const BULLET_W = 4;
const BULLET_H = 8;
const ENEMIES_PER_STAGE = 5;
const MAX_ALIVE_ENEMIES = 3;
const MAX_LIVES = 3;
const PLAYER_SPEED = 0.075;          // tiles/ms — feel "right"
const PLAYER_INVULN_MS = 1200;
const BULLET_SPEED = 0.35;           // px/ms (player base)
const BONUS_INTERVAL_MS = 18_000;    // drop a bonus roughly every 18s

type TileKind = "empty" | "brick" | "steel" | "bush" | "water" | "ice";
type Dir = "up" | "down" | "left" | "right";
const DIRS: Dir[] = ["up", "down", "left", "right"];

const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
};

/* Enemy types A/B/C/D ported from the C++ repo's behaviour table. */
type EnemyType = "A" | "B" | "C" | "D";
const ENEMY_TYPE_SCRIPT: EnemyType[] = ["A", "A", "B", "C", "D"];

type EnemyProfile = {
  speedMul: number;
  /** P(steer toward target) every direction-change. */
  targetBias: number;
  /** What the enemy steers toward. */
  target: "player" | "eagle";
  /** Only fire when target is directly in front (else fire on a timer). */
  fireOnlyInFront: boolean;
  color: string;
};
const ENEMY_PROFILES: Record<EnemyType, EnemyProfile> = {
  A: { speedMul: 1.0, targetBias: 0.8, target: "player", fireOnlyInFront: false, color: "#f87171" }, // rose
  B: { speedMul: 1.3, targetBias: 0.5, target: "eagle",  fireOnlyInFront: false, color: "#fb923c" }, // amber
  C: { speedMul: 1.0, targetBias: 0.5, target: "eagle",  fireOnlyInFront: false, color: "#a78bfa" }, // violet
  D: { speedMul: 1.0, targetBias: 0.5, target: "player", fireOnlyInFront: true,  color: "#22d3ee" }, // cyan
};

type Tank = {
  id: number;
  x: number;
  y: number;
  dir: Dir;
  isPlayer: boolean;
  type?: EnemyType;        // enemies only
  cooldown: number;        // ms (absolute timestamp) until next fire allowed
  hasBullet: boolean;
  spawnInvuln: number;     // ms remaining
  shield: number;          // ms remaining (helmet bonus)
  starLevel: number;       // player only: 0 / 1 (1 = bullets break steel and 1 brick per hit deeper)
  speedMul: number;
  aiNextTurnAt: number;
  aiNextFireAt: number;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  dir: Dir;
  ownerId: number;
  fromPlayer: boolean;
  power: 0 | 1;            // player star upgrade
};

type Bonus = {
  id: number;
  kind: "helmet" | "star";
  x: number;
  y: number;
  bornAt: number;
};

let __id = 1;
const nextId = () => __id++;

export function TankBattleGame() {
  const game = games.find((g) => g.slug === "tank-battle")!;
  const t = useT();
  const [best, submitBest] = useBestScore(game.highScoreKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state (mutable, lives in refs so rAF doesn't tear)
  const mapRef = useRef<TileKind[]>([]);
  const eagleAliveRef = useRef(true);
  const playerRef = useRef<Tank | null>(null);
  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const bonusRef = useRef<Bonus | null>(null);
  const lastBonusAtRef = useRef(0);

  const pressedRef = useRef<{ [k in Dir]?: boolean } & { fire?: boolean }>({});
  const remainingSpawnsRef = useRef(ENEMIES_PER_STAGE);
  const stageIdxRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Score / lives mirrored in refs for stale-closure safety.
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);

  // UI state
  const [score, setScore]               = useState(0);
  const [lives, setLives]               = useState(MAX_LIVES);
  const [enemiesLeft, setEnemiesLeft]   = useState(ENEMIES_PER_STAGE);
  const [stageNum, setStageNum]         = useState(1);
  const [running, setRunning]           = useState(false);
  const [over, setOver]                 = useState<null | "win" | "lose-lives" | "lose-eagle" | "stage-clear">(null);
  const [muted, setMuted]               = useState(false);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // Sound: register the audio pool once and hydrate the initial muted flag.
  useEffect(() => {
    registerTankSounds();
    setMuted(sound.isMuted());
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(sound.toggleMuted());
  }, []);

  // ──────────────── stage loading ────────────────
  const loadStage = useCallback((idx: number) => {
    const stage = STAGES[idx % STAGES.length];
    mapRef.current = parseStage(stage);
    eagleAliveRef.current = true;
    bulletsRef.current = [];
    enemiesRef.current = [];
    bonusRef.current = null;
    lastBonusAtRef.current = 0;
    remainingSpawnsRef.current = ENEMIES_PER_STAGE;
    lastEnemySpawnRef.current = 0;
    playerRef.current = makePlayer();
    stageIdxRef.current = idx;
    setStageNum(idx + 1);
    setEnemiesLeft(ENEMIES_PER_STAGE);
  }, []);

  const reset = useCallback(() => {
    loadStage(0);
    setScore(0);
    setLives(MAX_LIVES);
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    setOver(null);
  }, [loadStage]);

  const handleStart = useCallback(() => {
    reset();
    setRunning(true);
    // Preload all sounds on first user gesture (autoplay policies).
    sound.preloadAll();
    sound.play(TANK_SOUNDS.stageStart.id, TANK_SOUNDS.stageStart.vol);
  }, [reset]);

  const handleNextStage = useCallback(() => {
    loadStage(stageIdxRef.current + 1);
    setOver(null);
    setRunning(true);
    sound.play(TANK_SOUNDS.stageStart.id, TANK_SOUNDS.stageStart.vol);
  }, [loadStage]);

  // ──────────────── tank helpers ────────────────
  const tryFire = useCallback((tank: Tank, now: number) => {
    if (tank.cooldown > now) return;
    if (tank.hasBullet) return;
    tank.cooldown = now + (tank.isPlayer ? 280 : 380);
    tank.hasBullet = true;
    const c = tankCenter(tank);
    const v = DIR_VEC[tank.dir];
    bulletsRef.current.push({
      id: nextId(),
      x: c.x - BULLET_W / 2 + v.x * (TANK_SIZE / 2 - 2),
      y: c.y - BULLET_H / 2 + v.y * (TANK_SIZE / 2 - 2),
      dir: tank.dir,
      ownerId: tank.id,
      fromPlayer: tank.isPlayer,
      power: tank.isPlayer && tank.starLevel > 0 ? 1 : 0,
    });
    if (tank.isPlayer) sound.play(TANK_SOUNDS.fire.id, TANK_SOUNDS.fire.vol);
  }, []);

  const respawnPlayer = useCallback(() => {
    const keep = playerRef.current;
    const p = makePlayer();
    if (keep) p.starLevel = keep.starLevel; // preserve star across deaths
    playerRef.current = p;
  }, []);

  // ──────────────── step ────────────────
  const step = useCallback(
    (now: number) => {
      const dt = lastTickRef.current ? Math.min(33, now - lastTickRef.current) : 16;
      lastTickRef.current = now;

      const map = mapRef.current;

      // 1. Player input
      const p = playerRef.current;
      if (p) {
        p.spawnInvuln = Math.max(0, p.spawnInvuln - dt);
        p.shield = Math.max(0, p.shield - dt);
        let inputDir: Dir | null = null;
        if (pressedRef.current.up) inputDir = "up";
        else if (pressedRef.current.down) inputDir = "down";
        else if (pressedRef.current.left) inputDir = "left";
        else if (pressedRef.current.right) inputDir = "right";

        if (inputDir) {
          p.dir = inputDir;
          tryMove(p, dt * PLAYER_SPEED * TILE, map);
        }
        if (pressedRef.current.fire) tryFire(p, now);
      }

      // 2. Spawn enemies on a cadence
      if (
        remainingSpawnsRef.current > 0 &&
        enemiesRef.current.length < MAX_ALIVE_ENEMIES &&
        now - lastEnemySpawnRef.current > 1500
      ) {
        const idx = ENEMIES_PER_STAGE - remainingSpawnsRef.current;
        const type = ENEMY_TYPE_SCRIPT[idx % ENEMY_TYPE_SCRIPT.length];
        const e = makeEnemy(map, enemiesRef.current, p, type);
        if (e) {
          enemiesRef.current.push(e);
          remainingSpawnsRef.current -= 1;
          lastEnemySpawnRef.current = now;
        }
      }

      // 3. Drop a bonus occasionally on an empty cell
      if (now - lastBonusAtRef.current > BONUS_INTERVAL_MS && bonusRef.current == null) {
        const spot = pickEmptySpot(map);
        if (spot) {
          bonusRef.current = {
            id: nextId(),
            kind: Math.random() < 0.5 ? "helmet" : "star",
            x: spot.x * TILE,
            y: spot.y * TILE,
            bornAt: now,
          };
          lastBonusAtRef.current = now;
        }
      }

      // 4. Enemies (AI)
      const eagleCenter = { x: ((STAGE_COLS - 2) / 2) * TILE + TILE, y: (STAGE_ROWS - 2) * TILE + TILE };
      for (const e of enemiesRef.current) {
        e.spawnInvuln = Math.max(0, e.spawnInvuln - dt);
        const prof = ENEMY_PROFILES[e.type!];

        const targetPos =
          prof.target === "player" && p
            ? { x: p.x + TANK_SIZE / 2, y: p.y + TANK_SIZE / 2 }
            : eagleCenter;

        if (now > e.aiNextTurnAt || isBlockedAhead(e, map)) {
          let dir: Dir;
          if (Math.random() < prof.targetBias) {
            const dx = targetPos.x - (e.x + TANK_SIZE / 2);
            const dy = targetPos.y - (e.y + TANK_SIZE / 2);
            // Prefer the dominant axis; tie-break randomly.
            const preferX =
              Math.abs(dx) > Math.abs(dy) ||
              (Math.abs(dx) === Math.abs(dy) && Math.random() < 0.5);
            if (preferX) dir = dx > 0 ? "right" : "left";
            else dir = dy > 0 ? "down" : "up";
          } else {
            dir = DIRS[Math.floor(Math.random() * DIRS.length)];
          }
          e.dir = dir;
          e.aiNextTurnAt = now + 700 + Math.random() * 1500;
        }
        tryMove(e, dt * PLAYER_SPEED * TILE * e.speedMul, map);

        // Firing
        let canFire = false;
        if (prof.fireOnlyInFront) {
          const dx = targetPos.x - (e.x + TANK_SIZE / 2);
          const dy = targetPos.y - (e.y + TANK_SIZE / 2);
          const vd = DIR_VEC[e.dir];
          const dot = dx * vd.x + dy * vd.y;
          canFire = dot > 0 && Math.abs(vd.x !== 0 ? dy : dx) < TILE;
        } else {
          canFire = now > e.aiNextFireAt;
        }
        if (canFire) {
          tryFire(e, now);
          e.aiNextFireAt = now + 900 + Math.random() * 1400;
        }
      }

      // 5. Bullets
      const liveBullets: Bullet[] = [];
      for (const b of bulletsRef.current) {
        const v = DIR_VEC[b.dir];
        const speed = dt * BULLET_SPEED;
        b.x += v.x * speed;
        b.y += v.y * speed;

        // Out of bounds
        if (b.x < -BULLET_W || b.x > W || b.y < -BULLET_H || b.y > H) {
          freeOwnerBullet(b);
          continue;
        }

        // Eagle check — instant lose
        if (bulletHitsEagle(b)) {
          eagleAliveRef.current = false;
          setRunning(false);
          setOver("lose-eagle");
          submitBest(scoreRef.current);
          freeOwnerBullet(b);
          sound.play(TANK_SOUNDS.eagleDestroyed.id, TANK_SOUNDS.eagleDestroyed.vol);
          continue;
        }

        // Terrain
        const terrainHit = checkBulletTerrain(b, map);
        if (terrainHit) {
          freeOwnerBullet(b);
          if (terrainHit === "brick") sound.play(TANK_SOUNDS.brickHit.id, TANK_SOUNDS.brickHit.vol);
          else                        sound.play(TANK_SOUNDS.steelHit.id, TANK_SOUNDS.steelHit.vol);
          continue;
        }

        // Tanks
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
              sound.play(TANK_SOUNDS.enemyDestroyed.id, TANK_SOUNDS.enemyDestroyed.vol);
              break;
            }
          }
        } else {
          const curP = playerRef.current;
          if (curP && bulletHitsTank(b, curP)) {
            consumed = true;
            freeOwnerBullet(b);
            // Shield protects without losing a life.
            if (curP.shield > 0 || curP.spawnInvuln > 0) {
              // absorbed
            } else {
              sound.play(TANK_SOUNDS.playerDestroyed.id, TANK_SOUNDS.playerDestroyed.vol);
              const newLives = livesRef.current - 1;
              livesRef.current = newLives;
              setLives(newLives);
              if (newLives <= 0) {
                setRunning(false);
                setOver("lose-lives");
                submitBest(scoreRef.current);
              } else {
                respawnPlayer();
              }
            }
          }
        }
        if (!consumed) liveBullets.push(b);
      }
      bulletsRef.current = liveBullets;

      // 6. Bonus pickup by player
      const cur = playerRef.current;
      if (cur && bonusRef.current) {
        const b = bonusRef.current;
        if (
          cur.x < b.x + TILE * 2 &&
          cur.x + TANK_SIZE > b.x &&
          cur.y < b.y + TILE * 2 &&
          cur.y + TANK_SIZE > b.y
        ) {
          if (b.kind === "helmet") {
            cur.shield = 10_000;
          } else if (b.kind === "star") {
            cur.starLevel = Math.min(1, cur.starLevel + 1);
          }
          bonusRef.current = null;
          sound.play(TANK_SOUNDS.bonusObtained.id, TANK_SOUNDS.bonusObtained.vol);
          // Small score bump for picking up
          setScore((s) => {
            const ns = s + 1;
            scoreRef.current = ns;
            return ns;
          });
        }
      }

      // 7. Stage clear check
      if (
        remainingSpawnsRef.current === 0 &&
        enemiesRef.current.length === 0 &&
        !over
      ) {
        setRunning(false);
        setOver("stage-clear");
        submitBest(scoreRef.current);
      }

      draw(
        canvasRef.current,
        map,
        eagleAliveRef.current,
        playerRef.current,
        enemiesRef.current,
        bulletsRef.current,
        bonusRef.current,
      );
      return true;
    },
    [over, respawnPlayer, submitBest, tryFire],
  );

  // ──────────────── rAF ────────────────
  useEffect(() => {
    if (!running) {
      draw(canvasRef.current, mapRef.current, eagleAliveRef.current, playerRef.current, enemiesRef.current, bulletsRef.current, bonusRef.current);
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
        if (over === "stage-clear") {
          handleNextStage();
          return;
        }
        if (over || !running) {
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
  }, [over, running, handleStart, handleNextStage]);

  // ──────────────── initial draw ────────────────
  useEffect(() => {
    if (mapRef.current.length === 0) {
      mapRef.current = parseStage(STAGES[0]);
      playerRef.current = makePlayer();
    }
    draw(canvasRef.current, mapRef.current, eagleAliveRef.current, playerRef.current, enemiesRef.current, bulletsRef.current, bonusRef.current);
  }, []);

  const pressDir = (d: Dir, on: boolean) => () => { pressedRef.current[d] = on; };
  const pressFire = (on: boolean) => () => {
    if (on) {
      if (over === "stage-clear") { handleNextStage(); return; }
      if (over || !running) { handleStart(); return; }
    }
    pressedRef.current.fire = on;
  };

  const isNewBest = over != null && score > 0 && score >= best;

  return (
    <GameShell game={game}>
      <div className="flex items-center justify-between gap-2 text-sm font-mono flex-wrap">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="text-white/45">Stage: </span>
          <span className="text-white font-semibold">{stageNum}</span>
        </div>
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
              <span key={i} className={i < lives ? "text-rose-300" : "text-white/15"} aria-hidden>♥</span>
            ))}
          </span>
          <span className="text-white/30">·</span>
          <span>
            <span className="text-white/45">{t("tank.enemies")}: </span>
            <span className="text-white font-semibold">{enemiesLeft}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.55)] max-w-full touch-none"
          style={{ touchAction: "none", imageRendering: "pixelated" }}
        />

        {!running && !over && (
          <Overlay>
            <p className="text-sm text-white/70">{t("game.gameStartHint")}</p>
            <button onClick={handleStart} className={primaryBtn}>{t("game.start")}</button>
          </Overlay>
        )}
        {over === "lose-lives" && (
          <Overlay>
            <div className="text-2xl">💥</div>
            <p className="text-lg font-semibold text-white">{t("tank.gameOver")}</p>
            <p className="text-sm text-white/65">{t("tank.gameOverHint")}</p>
            <FinalLine score={score} best={best} t={t} />
            {isNewBest && <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>}
            <button onClick={handleStart} className={primaryBtn}>{t("game.restart")}</button>
          </Overlay>
        )}
        {over === "lose-eagle" && (
          <Overlay>
            <div className="text-2xl">🦅💔</div>
            <p className="text-lg font-semibold text-white">Base destroyed</p>
            <p className="text-sm text-white/65">The eagle fell. Try again.</p>
            <FinalLine score={score} best={best} t={t} />
            {isNewBest && <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>}
            <button onClick={handleStart} className={primaryBtn}>{t("game.restart")}</button>
          </Overlay>
        )}
        {over === "stage-clear" && (
          <Overlay>
            <div className="text-2xl">🏆</div>
            <p className="text-lg font-semibold text-white">{t("tank.win")} {stageNum}</p>
            <p className="text-sm text-white/65">{t("tank.winHint")}</p>
            <FinalLine score={score} best={best} t={t} />
            {isNewBest && <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>}
            <button onClick={handleNextStage} className={primaryBtn}>{t("tank.newMap")}</button>
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

      <p className="mt-4 text-center text-[11px] text-white/40 font-mono">
        🪖 helmet = 10s shield · ⭐ star = bullets break steel · 🦅 protect the eagle
      </p>
    </GameShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Map parsing
 * ────────────────────────────────────────────────────────────────────────── */

function parseStage(s: string): TileKind[] {
  const rows = s.split("\n");
  const out: TileKind[] = new Array(STAGE_COLS * STAGE_ROWS).fill("empty");
  for (let y = 0; y < STAGE_ROWS; y++) {
    const row = rows[y] ?? "";
    for (let x = 0; x < STAGE_COLS; x++) {
      const ch = row[x] ?? ".";
      out[y * STAGE_COLS + x] =
        ch === "#" ? "brick" :
        ch === "@" ? "steel" :
        ch === "%" ? "bush"  :
        ch === "~" ? "water" :
        ch === "-" ? "ice"   : "empty";
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Geometry helpers
 *
 * NOTE: a few helpers below need access to the *current* map / tank list to
 * decide collisions. To keep their signatures clean we pass the map in
 * explicitly. The previous file used module-level mirrors — refactored
 * out so the game is self-contained.
 * ────────────────────────────────────────────────────────────────────────── */

function tankCenter(t: Tank) { return { x: t.x + TANK_SIZE / 2, y: t.y + TANK_SIZE / 2 }; }
function idx(x: number, y: number) { return y * STAGE_COLS + x; }
function inBounds(x: number, y: number) { return x >= 0 && x < STAGE_COLS && y >= 0 && y < STAGE_ROWS; }

function tankBlocksAt(map: TileKind[], px: number, py: number): boolean {
  const left   = Math.floor(px / TILE);
  const top    = Math.floor(py / TILE);
  const right  = Math.floor((px + TANK_SIZE - 1) / TILE);
  const bottom = Math.floor((py + TANK_SIZE - 1) / TILE);
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      if (!inBounds(x, y)) return true;
      const t = map[idx(x, y)];
      if (t === "brick" || t === "steel" || t === "water") return true;
    }
  }
  return false;
}

function tryMove(t: Tank, distance: number, map: TileKind[]) {
  const v = DIR_VEC[t.dir];
  if (v.x !== 0) {
    // Snap Y to nearest cell lane to ease cornering.
    const lane = Math.round(t.y / TILE) * TILE;
    const drift = lane - t.y;
    if (Math.abs(drift) > 0.1) t.y += Math.sign(drift) * Math.min(distance, Math.abs(drift));
    const tryX = t.x + v.x * distance;
    if (!tankBlocksAt(map, tryX, t.y)) t.x = tryX;
  } else if (v.y !== 0) {
    const lane = Math.round(t.x / TILE) * TILE;
    const drift = lane - t.x;
    if (Math.abs(drift) > 0.1) t.x += Math.sign(drift) * Math.min(distance, Math.abs(drift));
    const tryY = t.y + v.y * distance;
    if (!tankBlocksAt(map, t.x, tryY)) t.y = tryY;
  }
}

function isBlockedAhead(t: Tank, map: TileKind[]): boolean {
  const v = DIR_VEC[t.dir];
  return tankBlocksAt(map, t.x + v.x * 3, t.y + v.y * 3);
}

function pickEmptySpot(map: TileKind[]): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = Math.floor(Math.random() * (STAGE_COLS - 2));
    const y = Math.floor(Math.random() * (STAGE_ROWS - 4)) + 1;
    if (map[idx(x, y)] === "empty" && map[idx(x + 1, y)] === "empty") {
      return { x, y };
    }
  }
  return null;
}

function makePlayer(): Tank {
  // Bottom-center, 2 tiles wide; spawn just to the left of eagle path.
  const tx = Math.floor(STAGE_COLS / 2) - 3; // tank's left edge in cells
  const ty = STAGE_ROWS - 2;
  return {
    id: nextId(),
    x: tx * TILE,
    y: ty * TILE,
    dir: "up",
    isPlayer: true,
    cooldown: 0,
    hasBullet: false,
    spawnInvuln: PLAYER_INVULN_MS,
    shield: 0,
    starLevel: 0,
    speedMul: 1,
    aiNextTurnAt: 0,
    aiNextFireAt: 0,
  };
}

function makeEnemy(map: TileKind[], existing: Tank[], player: Tank | null, type: EnemyType): Tank | null {
  const cols = [0, Math.floor(STAGE_COLS / 2) - 1, STAGE_COLS - 2];
  const tryCols = cols.sort(() => Math.random() - 0.5);
  for (const tx of tryCols) {
    const ty = 0;
    const px = tx * TILE;
    const py = ty * TILE;
    if (!tankBlocksAt(map, px, py)) {
      const tooClose =
        existing.some((e) => Math.abs(e.x - px) < TANK_SIZE && Math.abs(e.y - py) < TANK_SIZE) ||
        (player && Math.abs(player.x - px) < TANK_SIZE && Math.abs(player.y - py) < TANK_SIZE);
      if (!tooClose) {
        const prof = ENEMY_PROFILES[type];
        return {
          id: nextId(),
          x: px,
          y: py,
          dir: "down",
          isPlayer: false,
          type,
          cooldown: 0,
          hasBullet: false,
          spawnInvuln: 700,
          shield: 0,
          starLevel: 0,
          speedMul: prof.speedMul,
          aiNextTurnAt: 0,
          aiNextFireAt: performance.now() + 1200 + Math.random() * 800,
        };
      }
    }
  }
  return null;
}

/* Bullet helpers — kept as module-internal (work on whatever map/players are
 * current; we pass the map explicitly, but the player/enemy "hasBullet" flag
 * release is done via the closure-captured arrays in step()). */

function freeOwnerBullet(b: Bullet) {
  // The owner reference is recovered from the global last-known arrays via
  // the refs-on-component-level. Helpers below set them at the start of each
  // step() invocation (see __lastPlayer / __lastEnemies below).
  if (b.fromPlayer && __lastPlayer) __lastPlayer.hasBullet = false;
  else if (!b.fromPlayer) {
    const owner = __lastEnemies.find((e) => e.id === b.ownerId);
    if (owner) owner.hasBullet = false;
  }
}

function checkBulletTerrain(b: Bullet, map: TileKind[]): "brick" | "steel" | null {
  const tx = Math.floor((b.x + BULLET_W / 2) / TILE);
  const ty = Math.floor((b.y + BULLET_H / 2) / TILE);
  if (!inBounds(tx, ty)) return null;
  const tile = map[idx(tx, ty)];
  if (tile === "brick") {
    map[idx(tx, ty)] = "empty";
    return "brick";
  }
  if (tile === "steel") {
    // A star-powered bullet shatters steel; otherwise it ricochets (= dies).
    if (b.power > 0) map[idx(tx, ty)] = "empty";
    return "steel";
  }
  return null;
}

function bulletHitsTank(b: Bullet, t: Tank): boolean {
  return (
    b.x + BULLET_W > t.x &&
    b.x < t.x + TANK_SIZE &&
    b.y + BULLET_H > t.y &&
    b.y < t.y + TANK_SIZE
  );
}

function bulletHitsEagle(b: Bullet): boolean {
  // Eagle occupies the 2x2 cell at columns 12-13, rows 24-25.
  const ex = (Math.floor(STAGE_COLS / 2) - 1) * TILE;
  const ey = (STAGE_ROWS - 2) * TILE;
  return (
    b.x + BULLET_W > ex &&
    b.x < ex + TILE * 2 &&
    b.y + BULLET_H > ey &&
    b.y < ey + TILE * 2
  );
}

let __lastPlayer: Tank | null = null;
let __lastEnemies: Tank[] = [];

/* ──────────────────────────────────────────────────────────────────────────
 * Drawing
 * ────────────────────────────────────────────────────────────────────────── */

function draw(
  canvas: HTMLCanvasElement | null,
  map: TileKind[],
  eagleAlive: boolean,
  player: Tank | null,
  enemies: Tank[],
  bullets: Bullet[],
  bonus: Bonus | null,
) {
  __lastPlayer = player;
  __lastEnemies = enemies;

  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // bg
  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // tiles (skip bushes — drawn after tanks so they cover them)
  for (let y = 0; y < STAGE_ROWS; y++) {
    for (let x = 0; x < STAGE_COLS; x++) {
      const t = map[idx(x, y)];
      if (t === "empty" || t === "bush") continue;
      const px = x * TILE, py = y * TILE;
      if      (t === "brick") drawBrick(ctx, px, py);
      else if (t === "steel") drawSteel(ctx, px, py);
      else if (t === "water") drawWater(ctx, px, py);
      else if (t === "ice")   drawIce(ctx, px, py);
    }
  }

  // Eagle
  drawEagle(
    ctx,
    (Math.floor(STAGE_COLS / 2) - 1) * TILE,
    (STAGE_ROWS - 2) * TILE,
    eagleAlive,
  );

  // Bonus
  if (bonus) drawBonus(ctx, bonus);

  // Tanks
  for (const e of enemies) drawTank(ctx, e, ENEMY_PROFILES[e.type!].color);
  if (player) drawTank(ctx, player, "#7cf2ff");

  // Bullets
  for (const b of bullets) {
    ctx.fillStyle = b.fromPlayer ? "#fde68a" : "#fda4af";
    ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
  }

  // Bushes (above tanks, so they conceal)
  for (let y = 0; y < STAGE_ROWS; y++) {
    for (let x = 0; x < STAGE_COLS; x++) {
      if (map[idx(x, y)] === "bush") drawBush(ctx, x * TILE, y * TILE);
    }
  }
}

function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#9a3412";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1;
  // 2 horizontal mortar lines per cell
  for (let row = 0; row < 2; row++) {
    const yy = y + row * (TILE / 2) + (TILE / 4);
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + TILE, yy); ctx.stroke();
  }
  // staggered vertical
  ctx.beginPath();
  ctx.moveTo(x + TILE / 2, y); ctx.lineTo(x + TILE / 2, y + TILE / 4);
  ctx.moveTo(x,            y + TILE / 2); ctx.lineTo(x,            y + 3 * TILE / 4);
  ctx.moveTo(x + TILE / 2, y + 3 * TILE / 4); ctx.lineTo(x + TILE / 2, y + TILE);
  ctx.stroke();
}

function drawSteel(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const g = ctx.createLinearGradient(x, y, x + TILE, y + TILE);
  g.addColorStop(0, "#94a3b8"); g.addColorStop(1, "#475569");
  ctx.fillStyle = g; ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#1d4ed8"; ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (let i = 0; i < 3; i++) {
    const yy = y + 2 + i * 4;
    ctx.fillRect(x + 2, yy, 4, 1);
    ctx.fillRect(x + 8, yy + 2, 3, 1);
  }
}

function drawIce(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#e0f2fe"; ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#166534";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(x + 1, y + 1, 4, 4);
  ctx.fillRect(x + 7, y + 1, 4, 4);
  ctx.fillRect(x + 1, y + 7, 4, 4);
  ctx.fillRect(x + 7, y + 7, 4, 4);
}

function drawEagle(ctx: CanvasRenderingContext2D, x: number, y: number, alive: boolean) {
  const size = TILE * 2;
  ctx.fillStyle = alive ? "#fde68a" : "#52525b";
  ctx.fillRect(x, y, size, size);
  // Eagle silhouette
  ctx.fillStyle = alive ? "#7c2d12" : "#27272a";
  // small wings / body — abstract
  ctx.fillRect(x + 4, y + 6, size - 8, 4);
  ctx.fillRect(x + size / 2 - 2, y + 4, 4, size - 8);
  // tail
  ctx.fillRect(x + 8, y + size - 6, size - 16, 3);
  if (!alive) {
    // crack lines
    ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y); ctx.lineTo(x, y + size);
    ctx.stroke();
  }
}

function drawBonus(ctx: CanvasRenderingContext2D, b: Bonus) {
  const w = TILE * 2;
  // Blink: invisible 100ms out of every 500ms
  if ((Date.now() % 500) < 100) return;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(b.x, b.y, w, w);
  ctx.font = `${TILE * 1.4}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.kind === "helmet" ? "🪖" : "⭐", b.x + w / 2, b.y + w / 2 + 1);
}

function drawTank(ctx: CanvasRenderingContext2D, t: Tank, color: string) {
  const { x, y } = t;
  const s = TANK_SIZE;
  // spawn flicker
  if (t.spawnInvuln > 0 && Math.floor(t.spawnInvuln / 100) % 2 === 0) return;

  // shield ring (player helmet bonus)
  if (t.isPlayer && t.shield > 0) {
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, s + 2, s + 2);
  }

  // tracks (slightly darker)
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 3, 4, s - 6);
  ctx.fillRect(x + s - 4, y + 3, 4, s - 6);
  // hull
  ctx.fillRect(x + 4, y + 4, s - 8, s - 8);

  // barrel
  ctx.fillStyle = "#0a0d14";
  const cx = x + s / 2, cy = y + s / 2;
  const bw = 3, bl = s / 2;
  switch (t.dir) {
    case "up":    ctx.fillRect(cx - bw / 2, y, bw, bl); break;
    case "down":  ctx.fillRect(cx - bw / 2, cy, bw, bl); break;
    case "left":  ctx.fillRect(x, cy - bw / 2, bl, bw); break;
    case "right": ctx.fillRect(cx, cy - bw / 2, bl, bw); break;
  }

  // rivets
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x + 6, y + 6, 2, 2);
  ctx.fillRect(x + s - 8, y + 6, 2, 2);
  ctx.fillRect(x + 6, y + s - 8, 2, 2);
  ctx.fillRect(x + s - 8, y + s - 8, 2, 2);

  // star marker
  if (t.isPlayer && t.starLevel > 0) {
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + s / 2 - 1, y + s / 2 - 1, 3, 3);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tiny UI bits
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

function FinalLine({
  score,
  best,
  t,
}: {
  score: number;
  best: number;
  t: (k: import("@/lib/translations").TranslationKey) => string;
}) {
  return (
    <p className="text-sm font-mono text-white/55">
      {t("game.score")}: <span className="text-white">{score}</span>
      {" · "}
      {t("game.best")}: <span className="text-white">{Math.max(best, score)}</span>
    </p>
  );
}

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
