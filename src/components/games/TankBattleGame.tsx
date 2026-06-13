"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { asset } from "@/lib/config";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { STAGES, STAGE_COLS, STAGE_ROWS } from "@/lib/tankStages";
import { TANK_SOUNDS, registerTankSounds, sound } from "@/lib/sound";
import { GameShell, useBestScore } from "./GameShell";

/* ──────────────────────────────────────────────────────────────────────────
 * A Battle City tribute that re-uses the upstream Tanks MIT assets and
 * mirrors its sprite layout (4-direction × 2-tread frames) so it actually
 * *looks* like the original. Stage layouts borrowed verbatim; AI loop and
 * input are fresh.
 *   https://github.com/krystiankaluzny/Tanks (MIT, © Krystian Kałużny)
 * ────────────────────────────────────────────────────────────────────────── */

// Render at the asset's native tile size for crisp pixel art.
const TILE = 16;
const W = STAGE_COLS * TILE;          // 416
const H = STAGE_ROWS * TILE;          // 416
const TANK_SIZE = TILE * 2;           // 2×2 cells

const BULLET_RENDER = 8;              // visual size (square sprite)
const BULLET_HITBOX = 6;              // logical hitbox (slightly tighter than sprite)
const ENEMIES_PER_STAGE = 5;
const MAX_ALIVE_ENEMIES = 3;
const MAX_LIVES = 3;
const PLAYER_SPEED = 0.072;           // tiles/ms — Battle-City feel
const PLAYER_INVULN_MS = 1200;
const BULLET_SPEED = 0.36;            // px/ms (player base)
const BONUS_INTERVAL_MS = 18_000;
const TREAD_FRAME_MS = 60;            // tread animation period

type TileKind = "empty" | "brick" | "steel" | "bush" | "water" | "ice";
type Dir = "up" | "right" | "down" | "left";
// Atlas direction order matches the upstream Direction enum (UP/RIGHT/DOWN/LEFT)
// because the C++ renderer indexes the sprite sheet by that order.
const DIRS: Dir[] = ["up", "right", "down", "left"];
const DIR_INDEX: Record<Dir, number> = { up: 0, right: 1, down: 2, left: 3 };

const DIR_VEC: Record<Dir, { x: number; y: number }> = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
};

/* Enemy types A/B/C/D ported from the C++ repo's behaviour + sprite tables. */
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
  /** Y origin of this tank's sprite block inside atlas.png (4 dirs × 2 treads at 32 px each). */
  atlasY: number;
};
const ENEMY_PROFILES: Record<EnemyType, EnemyProfile> = {
  A: { speedMul: 1.0, targetBias: 0.8, target: "player", fireOnlyInFront: false, atlasY: 0   },
  B: { speedMul: 1.3, targetBias: 0.5, target: "eagle",  fireOnlyInFront: false, atlasY: 64  },
  C: { speedMul: 1.0, targetBias: 0.5, target: "eagle",  fireOnlyInFront: false, atlasY: 128 },
  D: { speedMul: 1.0, targetBias: 0.5, target: "player", fireOnlyInFront: true,  atlasY: 192 },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Sprite atlas coordinates (from upstream src/spriteconfig.cpp).
 *
 * Layout: each tank block is 4 columns (directions, 32 px each) × 2 rows
 * (tread-animation frames, 32 px each). Single-cell tiles (brick/steel/…)
 * are 16×16. Animated water uses 2 vertically-stacked frames.
 * ────────────────────────────────────────────────────────────────────────── */
const ATLAS_SRC = "/images/tank/atlas.png";

const SP_PLAYER_X = 640;   // PLAYER_1 base column
const SP_PLAYER_Y = 64;    // armor=1 frame baseline = (frame + 2*armor) * 32
const SP_ENEMY_X  = 128;   // shared X origin for ST_TANK_*

const SP = {
  brick:        { x: 928, y: 0,   w: 16, h: 16 },
  steel:        { x: 928, y: 144, w: 16, h: 16 },
  water0:       { x: 928, y: 160, w: 16, h: 16 },
  water1:       { x: 928, y: 176, w: 16, h: 16 },
  bush:         { x: 928, y: 192, w: 16, h: 16 },
  ice:          { x: 928, y: 208, w: 16, h: 16 },
  eagle:        { x: 944, y: 0,   w: 32, h: 32 },
  eagleDead:    { x: 944, y: 32,  w: 32, h: 32 }, // flag (sprite repurposed for "destroyed")
  shield0:      { x: 976, y: 0,   w: 32, h: 32 },
  shield1:      { x: 976, y: 32,  w: 32, h: 32 },
  bonusHelmet:  { x: 896, y: 32,  w: 32, h: 32 },
  bonusStar:    { x: 896, y: 160, w: 32, h: 32 },
} as const;

// Bullet sprite is 8×8, four direction tiles laid out horizontally at (944, 128).
const BULLET_SX0 = 944;
const BULLET_SY  = 128;
const BULLET_TILE = 8;

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
  treadFrame: number;      // 0 / 1 — toggles while the tank is moving
  treadAcc: number;        // ms accumulator for tread frame switching
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
  const atlasRef  = useRef<HTMLImageElement | null>(null);

  // Game state (mutable, lives in refs so rAF doesn't tear)
  const mapRef = useRef<TileKind[]>([]);
  const eagleAliveRef = useRef(true);
  const playerRef = useRef<Tank | null>(null);
  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const bonusRef = useRef<Bonus | null>(null);
  const lastBonusAtRef = useRef(0);

  // pressedRef.order tracks the press sequence so the LAST direction pressed wins
  // (classic Battle City: holding ↑ then pressing → instantly steers right).
  const pressedRef = useRef<{ keys: Partial<Record<Dir, boolean>>; order: Dir[]; fire?: boolean }>({ keys: {}, order: [] });
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

  // Sound + atlas: register audio once, preload the sprite atlas, hydrate mute.
  useEffect(() => {
    registerTankSounds();
    setMuted(sound.isMuted());
    if (typeof window !== "undefined") {
      const img = new Image();
      img.onload  = () => { atlasRef.current = img; redraw(); };
      img.onerror = () => { atlasRef.current = null; }; // graceful fallback to vector shapes
      img.src = asset(ATLAS_SRC);
    }
    // We intentionally do not depend on `redraw` here — it's stable in a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redraw = useCallback(() => {
    draw(
      canvasRef.current, atlasRef.current,
      mapRef.current, eagleAliveRef.current,
      playerRef.current, enemiesRef.current,
      bulletsRef.current, bonusRef.current,
    );
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
    // Spawn the bullet so its CENTER sits on the barrel tip, then the visual
    // sprite (BULLET_RENDER) is drawn centered on that point too.
    const c = tankCenter(tank);
    const v = DIR_VEC[tank.dir];
    bulletsRef.current.push({
      id: nextId(),
      x: c.x - BULLET_HITBOX / 2 + v.x * (TANK_SIZE / 2 - 1),
      y: c.y - BULLET_HITBOX / 2 + v.y * (TANK_SIZE / 2 - 1),
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

      // 1. Player input — most-recent direction wins, so holding ↑ then
      //    pressing → instantly steers right without releasing first.
      const p = playerRef.current;
      if (p) {
        p.spawnInvuln = Math.max(0, p.spawnInvuln - dt);
        p.shield = Math.max(0, p.shield - dt);
        let inputDir: Dir | null = null;
        const ord = pressedRef.current.order;
        for (let i = ord.length - 1; i >= 0; i--) {
          if (pressedRef.current.keys[ord[i]]) { inputDir = ord[i]; break; }
        }
        if (inputDir) {
          const before = { x: p.x, y: p.y };
          p.dir = inputDir;
          tryMove(p, dt * PLAYER_SPEED * TILE, map);
          accumulateTread(p, dt, before);
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
        const before = { x: e.x, y: e.y };
        tryMove(e, dt * PLAYER_SPEED * TILE * e.speedMul, map);
        accumulateTread(e, dt, before);

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

      // 5. Bullets — sweep the movement so a fast bullet can't skip a brick.
      const liveBullets: Bullet[] = [];
      for (const b of bulletsRef.current) {
        const v = DIR_VEC[b.dir];
        const distance = dt * BULLET_SPEED;
        // Sub-step by half-a-tile so we never overshoot a thin brick.
        const stepLen = TILE / 2;
        const steps = Math.max(1, Math.ceil(distance / stepLen));
        const step = distance / steps;
        let resolved: "boundary" | "brick" | "steel" | "eagle" | "tank" | null = null;
        for (let s = 0; s < steps && !resolved; s++) {
          b.x += v.x * step;
          b.y += v.y * step;

          // Map boundary — explode at the edge instead of flying off-screen.
          if (b.x < 0 || b.x + BULLET_HITBOX > W || b.y < 0 || b.y + BULLET_HITBOX > H) {
            resolved = "boundary";
            break;
          }

          // Eagle check — instant lose
          if (bulletHitsEagle(b)) {
            eagleAliveRef.current = false;
            setRunning(false);
            setOver("lose-eagle");
            submitBest(scoreRef.current);
            sound.play(TANK_SOUNDS.eagleDestroyed.id, TANK_SOUNDS.eagleDestroyed.vol);
            resolved = "eagle";
            break;
          }

          // Terrain — leading edge of the bullet, plus the perpendicular
          // extent so it can't slip through a one-tile-wide gap.
          const terrainHit = checkBulletTerrain(b, map);
          if (terrainHit) {
            if (terrainHit === "brick") sound.play(TANK_SOUNDS.brickHit.id, TANK_SOUNDS.brickHit.vol);
            else                        sound.play(TANK_SOUNDS.steelHit.id, TANK_SOUNDS.steelHit.vol);
            resolved = terrainHit;
            break;
          }
        }
        if (resolved) {
          freeOwnerBullet(b);
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

      redraw();
      return true;
    },
    [over, redraw, respawnPlayer, submitBest, tryFire],
  );

  // ──────────────── rAF ────────────────
  useEffect(() => {
    if (!running) {
      redraw();
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
        // Only push onto the press-order stack on the *initial* key-down,
        // not on auto-repeat events, so movement stays smooth.
        if (!pressedRef.current.keys[d]) {
          pressedRef.current.keys[d] = true;
          pressedRef.current.order.push(d);
        }
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
      if (d) {
        pressedRef.current.keys[d] = false;
        pressedRef.current.order = pressedRef.current.order.filter((x) => x !== d);
      }
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
    redraw();
  }, [redraw]);

  const pressDir = (d: Dir, on: boolean) => () => {
    const prev = pressedRef.current.keys[d];
    pressedRef.current.keys[d] = on;
    if (on && !prev) pressedRef.current.order.push(d);
    if (!on)         pressedRef.current.order = pressedRef.current.order.filter((x) => x !== d);
  };
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

/** Advance the 2-frame tread animation only when the tank actually moved.
 *  Calling code passes the position the tank had before tryMove(). */
function accumulateTread(t: Tank, dt: number, before: { x: number; y: number }) {
  if (t.x === before.x && t.y === before.y) return;
  t.treadAcc += dt;
  if (t.treadAcc >= TREAD_FRAME_MS) {
    t.treadAcc = 0;
    t.treadFrame = t.treadFrame === 0 ? 1 : 0;
  }
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
  // Classic Battle City player-1 spawn: 4 cells left of the eagle, bottom row.
  const tx = Math.floor(STAGE_COLS / 2) - 5; // cell col 8 → x=128 at TILE=16
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
    treadFrame: 0,
    treadAcc: 0,
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
          treadFrame: 0,
          treadAcc: 0,
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

/** Check the cell(s) the bullet's *leading edge* occupies, not its center —
 *  this matches the original behaviour where a bullet stops the moment its tip
 *  touches a wall. For axis-aligned motion we also sample the perpendicular
 *  extent so a bullet can never slip diagonally past a one-tile gap. */
function checkBulletTerrain(b: Bullet, map: TileKind[]): "brick" | "steel" | null {
  const v = DIR_VEC[b.dir];
  // Leading-edge coordinates along the motion axis.
  const tipX =
    v.x > 0 ? b.x + BULLET_HITBOX - 1
    : v.x < 0 ? b.x
    : b.x + BULLET_HITBOX / 2;
  const tipY =
    v.y > 0 ? b.y + BULLET_HITBOX - 1
    : v.y < 0 ? b.y
    : b.y + BULLET_HITBOX / 2;

  // Sample the two tiles the bullet's perpendicular extent might touch.
  const samples: { tx: number; ty: number }[] = v.y !== 0
    ? [
        { tx: Math.floor(b.x / TILE),                       ty: Math.floor(tipY / TILE) },
        { tx: Math.floor((b.x + BULLET_HITBOX - 1) / TILE), ty: Math.floor(tipY / TILE) },
      ]
    : [
        { tx: Math.floor(tipX / TILE), ty: Math.floor(b.y / TILE) },
        { tx: Math.floor(tipX / TILE), ty: Math.floor((b.y + BULLET_HITBOX - 1) / TILE) },
      ];

  let result: "brick" | "steel" | null = null;
  const cellsToErase: { i: number; kind: TileKind }[] = [];
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    // Deduplicate (both samples may land in the same cell when not on a boundary).
    if (i === 1 && samples[0].tx === s.tx && samples[0].ty === s.ty) break;
    if (!inBounds(s.tx, s.ty)) continue;
    const k = idx(s.tx, s.ty);
    const tile = map[k];
    if (tile === "brick") { cellsToErase.push({ i: k, kind: "brick" }); result = result === "steel" ? "steel" : "brick"; }
    else if (tile === "steel") { cellsToErase.push({ i: k, kind: "steel" }); result = "steel"; }
  }
  if (!result) return null;
  // Apply damage. Bricks always shatter; steel only if the bullet is starred.
  for (const c of cellsToErase) {
    if (c.kind === "brick") map[c.i] = "empty";
    else if (c.kind === "steel" && b.power > 0) map[c.i] = "empty";
  }
  return result;
}

function bulletHitsTank(b: Bullet, t: Tank): boolean {
  return (
    b.x + BULLET_HITBOX > t.x &&
    b.x < t.x + TANK_SIZE &&
    b.y + BULLET_HITBOX > t.y &&
    b.y < t.y + TANK_SIZE
  );
}

function bulletHitsEagle(b: Bullet): boolean {
  // Eagle occupies the 2x2 cell at columns 12-13, rows 24-25.
  const ex = (Math.floor(STAGE_COLS / 2) - 1) * TILE;
  const ey = (STAGE_ROWS - 2) * TILE;
  return (
    b.x + BULLET_HITBOX > ex &&
    b.x < ex + TILE * 2 &&
    b.y + BULLET_HITBOX > ey &&
    b.y < ey + TILE * 2
  );
}

let __lastPlayer: Tank | null = null;
let __lastEnemies: Tank[] = [];

/* ──────────────────────────────────────────────────────────────────────────
 * Drawing — sprite-atlas based. Falls back to vector shapes if the atlas
 * isn't loaded yet (e.g. first frame after mount).
 * ────────────────────────────────────────────────────────────────────────── */

function draw(
  canvas: HTMLCanvasElement | null,
  atlas: HTMLImageElement | null,
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

  // Pixel-perfect blits: turn off image smoothing on every frame because some
  // browsers reset it after a canvas resize.
  ctx.imageSmoothingEnabled = false;

  // Background
  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tiles — bushes are drawn LAST so they conceal tanks underneath.
  for (let y = 0; y < STAGE_ROWS; y++) {
    for (let x = 0; x < STAGE_COLS; x++) {
      const tk = map[idx(x, y)];
      if (tk === "empty" || tk === "bush") continue;
      drawTile(ctx, atlas, tk, x * TILE, y * TILE);
    }
  }

  // Eagle (2×2 tile sprite, centered above the base alley)
  drawEagle(
    ctx, atlas,
    (Math.floor(STAGE_COLS / 2) - 1) * TILE,
    (STAGE_ROWS - 2) * TILE,
    eagleAlive,
  );

  // Bonus (blinking 2×2)
  if (bonus) drawBonus(ctx, atlas, bonus);

  // Tanks
  for (const e of enemies)  drawTank(ctx, atlas, e);
  if (player)               drawTank(ctx, atlas, player);

  // Bullets — sprite is 8×8, drawn centered on the (slightly smaller) hitbox.
  for (const b of bullets) drawBullet(ctx, atlas, b);

  // Bushes overlay
  for (let y = 0; y < STAGE_ROWS; y++) {
    for (let x = 0; x < STAGE_COLS; x++) {
      if (map[idx(x, y)] === "bush") drawTile(ctx, atlas, "bush", x * TILE, y * TILE);
    }
  }
}

function blit(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement | null,
  src: { x: number; y: number; w: number; h: number },
  dx: number, dy: number, dw: number, dh: number,
) {
  if (!atlas) return false;
  ctx.drawImage(atlas, src.x, src.y, src.w, src.h, dx, dy, dw, dh);
  return true;
}

function drawTile(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, kind: TileKind, x: number, y: number) {
  const src =
    kind === "brick" ? SP.brick
    : kind === "steel" ? SP.steel
    : kind === "bush" ? SP.bush
    : kind === "ice" ? SP.ice
    : kind === "water" ? (Math.floor(Date.now() / 350) % 2 === 0 ? SP.water0 : SP.water1)
    : null;
  if (src && blit(ctx, atlas, src, x, y, TILE, TILE)) return;
  // Fallback (atlas not loaded yet)
  ctx.fillStyle =
    kind === "brick" ? "#9a3412"
    : kind === "steel" ? "#94a3b8"
    : kind === "water" ? "#1d4ed8"
    : kind === "bush"  ? "#166534"
    : kind === "ice"   ? "#e0f2fe"
    : "#0a0d14";
  ctx.fillRect(x, y, TILE, TILE);
}

function drawEagle(
  ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null,
  x: number, y: number, alive: boolean,
) {
  if (blit(ctx, atlas, alive ? SP.eagle : SP.eagleDead, x, y, TANK_SIZE, TANK_SIZE)) return;
  // Fallback
  ctx.fillStyle = alive ? "#fde68a" : "#52525b";
  ctx.fillRect(x, y, TANK_SIZE, TANK_SIZE);
}

function drawBonus(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, b: Bonus) {
  // Blink: invisible 100ms out of every 500ms
  if ((Date.now() % 500) < 100) return;
  const src = b.kind === "helmet" ? SP.bonusHelmet : SP.bonusStar;
  if (blit(ctx, atlas, src, b.x, b.y, TANK_SIZE, TANK_SIZE)) return;
  // Fallback
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(b.x, b.y, TANK_SIZE, TANK_SIZE);
  ctx.font = `${TILE * 1.4}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.kind === "helmet" ? "🪖" : "⭐", b.x + TANK_SIZE / 2, b.y + TANK_SIZE / 2 + 1);
}

function drawBullet(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, b: Bullet) {
  const dx = b.x + (BULLET_HITBOX - BULLET_RENDER) / 2;
  const dy = b.y + (BULLET_HITBOX - BULLET_RENDER) / 2;
  const dirIdx = DIR_INDEX[b.dir];
  if (atlas) {
    ctx.drawImage(
      atlas,
      BULLET_SX0 + dirIdx * BULLET_TILE, BULLET_SY, BULLET_TILE, BULLET_TILE,
      dx, dy, BULLET_RENDER, BULLET_RENDER,
    );
    return;
  }
  ctx.fillStyle = b.fromPlayer ? "#fde68a" : "#fda4af";
  ctx.fillRect(b.x, b.y, BULLET_HITBOX, BULLET_HITBOX);
}

function drawTank(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, t: Tank) {
  // Spawn flicker
  if (t.spawnInvuln > 0 && Math.floor(t.spawnInvuln / 100) % 2 === 0) return;

  const dirIdx = DIR_INDEX[t.dir];
  // Each tank type's sprite block: 4 columns × 2 rows of 32×32 frames.
  const sx = (t.isPlayer ? SP_PLAYER_X : SP_ENEMY_X) + dirIdx * 32;
  const sy = (t.isPlayer ? SP_PLAYER_Y : ENEMY_PROFILES[t.type!].atlasY) + t.treadFrame * 32;

  if (atlas) {
    ctx.drawImage(atlas, sx, sy, 32, 32, t.x, t.y, TANK_SIZE, TANK_SIZE);
  } else {
    // Fallback vector tank
    ctx.fillStyle = t.isPlayer ? "#7cf2ff" : "#f87171";
    ctx.fillRect(t.x, t.y, TANK_SIZE, TANK_SIZE);
  }

  // Shield ring (helmet bonus) — overlay on top of the sprite
  if (t.isPlayer && t.shield > 0 && atlas) {
    const shieldSrc = Math.floor(Date.now() / 45) % 2 === 0 ? SP.shield0 : SP.shield1;
    ctx.drawImage(atlas, shieldSrc.x, shieldSrc.y, shieldSrc.w, shieldSrc.h, t.x, t.y, TANK_SIZE, TANK_SIZE);
  } else if (t.isPlayer && t.shield > 0) {
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.strokeRect(t.x - 1, t.y - 1, TANK_SIZE + 2, TANK_SIZE + 2);
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
