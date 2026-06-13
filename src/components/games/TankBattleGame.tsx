"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
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
const BULLET_HITBOX = 8;              // logical hitbox matches the sprite size

/* ──────────────────────────────────────────────────────────────────────────
 * All gameplay constants come from upstream appconfig.h / soundconfig.h /
 * player.cpp / enemy.cpp. Comments cite the original symbol/line.
 * ────────────────────────────────────────────────────────────────────────── */
const ENEMIES_PER_STAGE        = 20;    // enemies_to_kill_total_count
const MAX_ALIVE_ENEMIES        = 4;     // enemies_max_count_on_map
const NEW_ENEMY_COOLDOWN_MS    = 500;   // new_enemy_cooldown
const MAX_LIVES                = 3;     // (kept lower than upstream's 10
                                        // because +1 life is granted per stage)
const PLAYER_SPEED             = 0.006; // ≈0.096 px/ms — slightly above
                                        // tank_default_speed (0.08) for snappier
                                        // keyboard feel.
const BULLET_SPEED             = 0.26;  // ≈ bullet_default_speed (0.23)
const PLAYER_INVULN_MS         = 1200;  // ShortShieldEffect ≈ shield_time / 2
const PLAYER_RELOAD_MS         = 120;   // player_reload_time
const AI_TURN_MIN_MS           = 100;   // m_keep_direction_time = rand()%800+100
const AI_TURN_RANGE_MS         = 800;
const BONUS_SHOW_MS            = 10_000; // bonus_show_time
const BONUS_BLINK_MS           = 350;    // bonus_blink_time
const CLOCK_FREEZE_MS          = 8_000;  // tank_frozen_time
const SHOVEL_FORTIFY_MS        = 15_000; // protect_eagle_time
const SHIELD_TIME_MS           = 10_000; // tank_shield_time
const BONUS_DROP_PROB          = 0.12;   // generateEnemyIfPossible — 12% bonus

const TREAD_FRAME_MS = 60;            // tread animation period
const SPAWN_ANIM_MS = 900;            // ST_CREATE: 10 frames × 100 ms (animation_time)
const SPAWN_ANIM_FRAMES = 10;
// Star progression (Player::changeStarCountBy):
//   0 stars: base bullet, 1 in flight (NES feel; upstream lets you have 2)
//   1 star : 1.3× faster bullet, still 1 in flight
//   2 stars: ↑ + up to 2 bullets in flight at once ("double tap")
//   3 stars: ↑ + bullets break steel + plough through bushes
const MAX_STAR_LEVEL = 3;
const STAR_BULLET_SPEED_MUL = 1.3;

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
// Per upstream Enemy::updateBehavior — Tank D reloads fastest, A/B slowest.
// `rand() % MAX` gives a fresh delay every shot.
const ENEMY_RELOAD_MAX_MS: Record<EnemyType, number> = {
  A: 1000, B: 1000, C: 800, D: 400,
};

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
  /** NES Battle-City score per kill (Tank A 100, B 200, C 300, D 400). */
  score: number;
  /** Tank C fires 1.3× speed bullets (matches upstream Enemy::fire). */
  bulletSpeedMul: number;
};
const ENEMY_PROFILES: Record<EnemyType, EnemyProfile> = {
  A: { speedMul: 1.0, targetBias: 0.8, target: "player", fireOnlyInFront: false, atlasY: 0,   score: 100, bulletSpeedMul: 1   },
  B: { speedMul: 1.3, targetBias: 0.5, target: "eagle",  fireOnlyInFront: false, atlasY: 64,  score: 200, bulletSpeedMul: 1   },
  C: { speedMul: 1.0, targetBias: 0.5, target: "eagle",  fireOnlyInFront: false, atlasY: 128, score: 300, bulletSpeedMul: 1.3 },
  D: { speedMul: 1.0, targetBias: 0.5, target: "player", fireOnlyInFront: true,  atlasY: 192, score: 400, bulletSpeedMul: 1   },
};

/** Upstream Game::generateEnemyIfPossible distributes armor across stages.
 *  Early stages: almost always armor 1. Late stages: more 2/3/4-armor tanks. */
function pickArmorForStage(stage: number): number {
  let a: number, b: number, c: number;
  if (stage <= 17) {
    a = -0.040625 * stage + 0.940625;
    b = -0.028125 * stage + 0.978125;
    c = -0.014375 * stage + 0.994375;
  } else {
    a = -0.012778 * stage + 0.467222;
    b = -0.025000 * stage + 0.925000;
    c = -0.036111 * stage + 1.363889;
  }
  const p = Math.random();
  if (p < a) return 1;
  if (p < b) return 2;
  if (p < c) return 3;
  return 4;
}

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
  bonusGrenade: { x: 896, y: 0,   w: 32, h: 32 },
  bonusHelmet:  { x: 896, y: 32,  w: 32, h: 32 },
  bonusClock:   { x: 896, y: 64,  w: 32, h: 32 },
  bonusShovel:  { x: 896, y: 96,  w: 32, h: 32 },
  bonusTank:    { x: 896, y: 128, w: 32, h: 32 },
  bonusStar:    { x: 896, y: 160, w: 32, h: 32 },
  bonusGun:     { x: 896, y: 192, w: 32, h: 32 },
  bonusBoat:    { x: 896, y: 224, w: 32, h: 32 },
  boatPlayer:   { x: 944, y: 96,  w: 32, h: 32 },
  // ST_CREATE — 10 vertically stacked frames at (1008, frame*32, 32, 32)
  // shown while a tank is materialising onto the map.
  createX:      1008,
  createY0:     0,
  // ST_DESTROY_BULLET — small spark when a bullet hits brick/steel/boundary
  // (5 frames × 32×32, 40 ms each, vertically stacked).
  bulletFxX:    1108,
  bulletFxY0:   0,
  // ST_DESTROY_TANK — big explosion when a tank or the eagle is destroyed
  // (7 frames × 64×64, 70 ms each, vertically stacked).
  tankFxX:      1040,
  tankFxY0:     0,
} as const;
const BULLET_FX_FRAMES   = 5;
const BULLET_FX_MS       = 40;        // upstream ST_DESTROY_BULLET frame_duration
const BULLET_FX_DURATION = BULLET_FX_FRAMES * BULLET_FX_MS;
const TANK_FX_FRAMES     = 7;
const TANK_FX_MS         = 70;        // upstream ST_DESTROY_TANK frame_duration
const TANK_FX_DURATION   = TANK_FX_FRAMES * TANK_FX_MS;

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
  bulletCount: number;     // bullets currently in flight that this tank owns
  spawnInvuln: number;     // ms remaining
  shield: number;          // ms remaining (helmet bonus)
  starLevel: number;       // player only: 0..3 (see MAX_STAR_LEVEL)
  speedMul: number;
  aiNextTurnAt: number;
  aiNextFireAt: number;
  treadFrame: number;      // 0 / 1 — toggles while the tank is moving
  treadAcc: number;        // ms accumulator for tread frame switching
  creating: number;        // ms remaining of the create-flash (untouchable)
  hasBoat: boolean;        // 🚤 Boat bonus — lets this tank cross water,
                           // absorbs one hit and is then removed.
  armor: number;           // enemies: 1..4, 1 = 1-hit kill, higher = needs more
  bonusDrop: boolean;      // enemy is "bonus" → drops a random bonus on death
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  dir: Dir;
  ownerId: number;
  fromPlayer: boolean;
  power: 0 | 1;            // 1 = breaks steel (3-star player bullet)
  speedMul: number;        // 1.0 base, 1.3 for 1+ star player bullets
};

type BonusKind =
  | "grenade"   // 💣 destroys every alive enemy on the map
  | "helmet"    // 🪖 10-second invulnerability shield
  | "clock"     // ⏱ freezes enemies for 8 s
  | "shovel"    // 🛠 turns eagle's brick perimeter into steel for 15 s
  | "tank"      // 🛡 +1 life
  | "star"      // ⭐ progressive bullet upgrade (speed → double → break steel)
  | "gun"       // 🔫 instantly maxes the star meter (3 stars)
  | "boat";     // 🚤 lets the tank cross water tiles

type Bonus = {
  id: number;
  kind: BonusKind;
  x: number;
  y: number;
  bornAt: number;
};

const BONUS_KINDS: BonusKind[] = [
  "grenade", "helmet", "clock", "shovel", "tank", "star", "gun", "boat",
];

type Effect = {
  id: number;
  kind: "bullet" | "tank"; // small spark vs. big explosion
  x: number;               // top-left of the effect's render rect
  y: number;
  bornAt: number;          // performance.now() when spawned
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
  // Per-cell brick "state code" (0..9) matching upstream Brick::bulletHit().
  // 0 = whole brick, 1-4 = single half remaining, 5-8 = single quarter,
  // 9 = fully destroyed (also cleared from `map`). Indexed by idx(x, y).
  const brickStatesRef = useRef<Uint8Array>(new Uint8Array(STAGE_COLS * STAGE_ROWS));
  const eagleAliveRef = useRef(true);
  const playerRef = useRef<Tank | null>(null);
  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const bonusRef = useRef<Bonus | null>(null);
  const effectsRef = useRef<Effect[]>([]);
  // ⏱ enemies are frozen until this timestamp (Clock bonus)
  const freezeUntilRef = useRef(0);
  // 🛠 eagle perimeter is reinforced until this timestamp (Shovel bonus).
  // `shovelSavedRef` stores the original tile kind of each fortified cell so
  // we can restore it once the buff expires.
  const shovelUntilRef = useRef(0);
  const shovelSavedRef = useRef<{ i: number; original: TileKind }[]>([]);

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
  // Game mode chosen on the pre-game screen — Super Funny gives the player
  // 3 stars + a boat at every spawn (steel-piercing bullets, double tap,
  // can cross water from the get-go).
  const modeRef = useRef<"normal" | "super-funny">("normal");

  // UI state
  const [score, setScore]               = useState(0);
  const [lives, setLives]               = useState(MAX_LIVES);
  const [enemiesLeft, setEnemiesLeft]   = useState(ENEMIES_PER_STAGE);
  const [stageNum, setStageNum]         = useState(1);
  const [running, setRunning]           = useState(false);
  const [over, setOver]                 = useState<null | "win" | "lose-lives" | "lose-eagle" | "stage-clear">(null);
  const [muted, setMuted]               = useState(false);
  const [paused, setPaused]             = useState(false);
  const [mode, setMode]                 = useState<"normal" | "super-funny">("normal");
  // HUD-only mirrors of the player's progressive upgrades, sampled each frame
  // so the user can see what star count / boat status they currently have.
  const [playerStars, setPlayerStars]   = useState(0);
  const [playerHasBoat, setPlayerHasBoat] = useState(false);

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
      mapRef.current, brickStatesRef.current,
      eagleAliveRef.current,
      playerRef.current, enemiesRef.current,
      bulletsRef.current, bonusRef.current,
      effectsRef.current,
    );
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(sound.toggleMuted());
  }, []);

  // ──────────────── stage loading ────────────────
  const loadStage = useCallback((idx: number, opts?: { keepUpgrades?: boolean }) => {
    const prevStar = opts?.keepUpgrades ? playerRef.current?.starLevel ?? 0 : 0;
    const prevBoat = opts?.keepUpgrades ? playerRef.current?.hasBoat ?? false : false;
    const stage = STAGES[idx % STAGES.length];
    mapRef.current = parseStage(stage);
    brickStatesRef.current = new Uint8Array(STAGE_COLS * STAGE_ROWS);
    eagleAliveRef.current = true;
    bulletsRef.current = [];
    enemiesRef.current = [];
    bonusRef.current = null;
    effectsRef.current = [];
    freezeUntilRef.current = 0;
    shovelUntilRef.current = 0;
    shovelSavedRef.current = [];
    remainingSpawnsRef.current = ENEMIES_PER_STAGE;
    lastEnemySpawnRef.current = 0;
    const p = makePlayer();
    // Star upgrades AND boat persist across stages (upstream Player object
    // is recycled in moveToNextStage — only timed buffs like the helmet
    // shield are wiped). Boat is consumed on the next hit anyway.
    p.starLevel = prevStar;
    p.hasBoat   = prevBoat;
    // 🎉 Super Funny override: always spawn maxed out.
    if (modeRef.current === "super-funny") {
      p.starLevel = MAX_STAR_LEVEL;
      p.hasBoat   = true;
    }
    playerRef.current = p;
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
    setPlayerStars(0);
    setPlayerHasBoat(false);
    setOver(null);
  }, [loadStage]);

  const pauseStartRef = useRef<number | null>(null);

  const handleStart = useCallback((selectedMode?: "normal" | "super-funny") => {
    if (selectedMode) {
      modeRef.current = selectedMode;
      setMode(selectedMode);
    }
    reset();
    setRunning(true);
    setPaused(false);
    pauseStartRef.current = null;
    // Preload all sounds on first user gesture (autoplay policies).
    sound.preloadAll();
    sound.play(TANK_SOUNDS.stageStart.id, TANK_SOUNDS.stageStart.vol);
  }, [reset]);

  /** Shift game timestamps forward by the paused window so every timer
   *  resumes feeling untouched. Two flavours:
   *
   *  - "Future" timestamps (cooldowns, AI fire/turn waits, freeze/shovel
   *    expiry): shift ONLY if they were still in the future at pause time.
   *    Already-expired cooldowns must stay expired so a tank that was
   *    ready to fire pre-pause is still ready post-resume.
   *  - "Past" timestamps (bonus.bornAt, effect.bornAt, lastEnemySpawn):
   *    always shift, so the perceived age is preserved across the pause.
   */
  const shiftTimestamps = useCallback((delta: number, pauseStarted: number) => {
    if (delta <= 0) return;
    const future = (t: number) => (t > pauseStarted ? t + delta : t);

    const tanks: Tank[] = [];
    if (playerRef.current) tanks.push(playerRef.current);
    for (const e of enemiesRef.current) tanks.push(e);
    for (const t of tanks) {
      t.cooldown     = future(t.cooldown);
      t.aiNextTurnAt = future(t.aiNextTurnAt);
      t.aiNextFireAt = future(t.aiNextFireAt);
    }
    if (bonusRef.current) bonusRef.current.bornAt += delta;
    for (const fx of effectsRef.current) fx.bornAt += delta;
    if (lastEnemySpawnRef.current > 0) lastEnemySpawnRef.current += delta;
    freezeUntilRef.current = future(freezeUntilRef.current);
    shovelUntilRef.current = future(shovelUntilRef.current);
  }, []);

  const togglePause = useCallback(() => {
    if (!running || over) return;
    setPaused((p) => {
      const next = !p;
      if (next) {
        pauseStartRef.current = performance.now();
      } else if (pauseStartRef.current != null) {
        // Resuming — push every game timestamp forward by the paused window.
        const pauseStarted = pauseStartRef.current;
        shiftTimestamps(performance.now() - pauseStarted, pauseStarted);
        pauseStartRef.current = null;
      }
      return next;
    });
  }, [running, over, shiftTimestamps]);

  const handleNextStage = useCallback(() => {
    // +1 life per stage clear (upstream Player::moveToNextStage line 123).
    const bumped = livesRef.current + 1;
    livesRef.current = bumped;
    setLives(bumped);
    loadStage(stageIdxRef.current + 1, { keepUpgrades: true });
    setOver(null);
    setRunning(true);
    sound.play(TANK_SOUNDS.stageStart.id, TANK_SOUNDS.stageStart.vol);
  }, [loadStage]);

  // ──────────────── tank helpers ────────────────
  const tryFire = useCallback((tank: Tank, now: number) => {
    if (tank.cooldown > now) return;
    // Player can keep 2 bullets in flight at 2+ stars; everything else is 1.
    const limit = tank.isPlayer && tank.starLevel >= 2 ? 2 : 1;
    if (tank.bulletCount >= limit) return;
    // Enemies rely on aiNextFireAt for cadence — no extra reload here.
    tank.cooldown = now + (tank.isPlayer ? PLAYER_RELOAD_MS : 0);
    tank.bulletCount += 1;
    // Spawn the bullet so its CENTER sits on the barrel tip, then the visual
    // sprite (BULLET_RENDER) is drawn centered on that point too.
    const c = tankCenter(tank);
    const v = DIR_VEC[tank.dir];
    const enemyBulletMul = tank.type ? ENEMY_PROFILES[tank.type].bulletSpeedMul : 1;
    bulletsRef.current.push({
      id: nextId(),
      x: c.x - BULLET_HITBOX / 2 + v.x * (TANK_SIZE / 2 - 1),
      y: c.y - BULLET_HITBOX / 2 + v.y * (TANK_SIZE / 2 - 1),
      dir: tank.dir,
      ownerId: tank.id,
      fromPlayer: tank.isPlayer,
      power: tank.isPlayer && tank.starLevel >= 3 ? 1 : 0,
      speedMul: tank.isPlayer
        ? (tank.starLevel >= 1 ? STAR_BULLET_SPEED_MUL : 1)
        : enemyBulletMul,
    });
    if (tank.isPlayer) sound.play(TANK_SOUNDS.fire.id, TANK_SOUNDS.fire.vol);
  }, []);

  const respawnPlayer = useCallback(() => {
    // Upstream Player::hit non-3-star path calls changeStarCountBy(-3), which
    // clamps star_count to 0 — i.e. stars RESET on death. Boat is bound to
    // the destroyed tank instance so it's gone too.
    // 🎉 Super Funny mode keeps the player fully geared up on every respawn.
    const fresh = makePlayer();
    if (modeRef.current === "super-funny") {
      fresh.starLevel = MAX_STAR_LEVEL;
      fresh.hasBoat   = true;
    }
    playerRef.current = fresh;
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
        p.creating    = Math.max(0, p.creating    - dt);
        p.spawnInvuln = Math.max(0, p.spawnInvuln - dt);
        p.shield      = Math.max(0, p.shield      - dt);
        // No movement or fire while the spawn flash is playing.
        if (p.creating === 0) {
          let inputDir: Dir | null = null;
          const ord = pressedRef.current.order;
          for (let i = ord.length - 1; i >= 0; i--) {
            if (pressedRef.current.keys[ord[i]]) { inputDir = ord[i]; break; }
          }
          if (inputDir) {
            const before = { x: p.x, y: p.y };
            if (inputDir !== p.dir) {
              p.dir = inputDir;
              snapTankToLane(p, map, enemiesRef.current, eagleAliveRef.current, brickStatesRef.current);
            }
            tryMove(p, dt * PLAYER_SPEED * TILE, map, enemiesRef.current, eagleAliveRef.current, brickStatesRef.current);
            accumulateTread(p, dt, before);
          }
          if (pressedRef.current.fire) tryFire(p, now);
        }
      }

      // 2. Spawn enemies on a cadence — upstream generateEnemyIfPossible.
      //    Probability of Tank D scales with stage (0.00735*S + 0.09265);
      //    everything else is uniform over A/B/C.
      if (
        remainingSpawnsRef.current > 0 &&
        enemiesRef.current.length < MAX_ALIVE_ENEMIES &&
        now - lastEnemySpawnRef.current > NEW_ENEMY_COOLDOWN_MS
      ) {
        const stage = stageIdxRef.current + 1;
        const dProb = 0.00735 * stage + 0.09265;
        const type: EnemyType =
          Math.random() < dProb
            ? "D"
            : (["A", "B", "C"] as const)[Math.floor(Math.random() * 3)];
        const e = makeEnemy(map, enemiesRef.current, p, type, stage);
        if (e) {
          enemiesRef.current.push(e);
          remainingSpawnsRef.current -= 1;
          lastEnemySpawnRef.current = now;
        }
      }

      // 3. Bonus expiry — upstream bonus_show_time = 10 s. If the player
      //    doesn't grab it in time, it vanishes. (Upstream only drops bonuses
      //    from "bonus enemies" — no periodic spawner here.)
      if (bonusRef.current && now - bonusRef.current.bornAt > BONUS_SHOW_MS) {
        bonusRef.current = null;
      }

      // 4. Enemies (AI)
      const eagleCenter = { x: ((STAGE_COLS - 2) / 2) * TILE + TILE, y: (STAGE_ROWS - 2) * TILE + TILE };
      const frozen = now < freezeUntilRef.current;
      for (const e of enemiesRef.current) {
        e.creating    = Math.max(0, e.creating    - dt);
        e.spawnInvuln = Math.max(0, e.spawnInvuln - dt);
        // Frozen during the spawn flash — no AI, no fire, no collision.
        if (e.creating > 0) continue;
        // ⏱ Clock bonus: enemies stop moving and firing, but stay vulnerable.
        if (frozen) continue;
        const prof = ENEMY_PROFILES[e.type!];

        const targetPos =
          prof.target === "player" && p
            ? { x: p.x + TANK_SIZE / 2, y: p.y + TANK_SIZE / 2 }
            : eagleCenter;

        // Enemies see the player and every other enemy as obstacles.
        const enemyObstacles: Tank[] = [];
        if (p) enemyObstacles.push(p);
        for (const o of enemiesRef.current) if (o.id !== e.id) enemyObstacles.push(o);

        const blocked = isBlockedAhead(e, map, enemyObstacles, eagleAliveRef.current, brickStatesRef.current);
        if (now > e.aiNextTurnAt || blocked) {
          let dir: Dir;
          if (blocked) {
            // Deadlock breaker. Probe every non-current direction with a
            // 1-px reach (more permissive than the 3-px "look-ahead" used
            // for the blocked check itself) — escape is easier than entry.
            // If everything is still blocked at the 1-px probe (rare: tank
            // genuinely walled in on all four sides), fall back to a random
            // non-current direction so the AI doesn't freeze mid-corridor
            // when a neighbour is creeping toward it. The direction change
            // shifts the AI's next-frame evaluation away from the wedge.
            const originalDir = e.dir;
            const shuffle = <T,>(arr: T[]) => {
              for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
              }
              return arr;
            };
            const isHoriz = originalDir === "left" || originalDir === "right";
            const opposites: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
            const perps: Dir[] = shuffle(isHoriz ? ["up", "down"] : ["left", "right"]);
            const candidates: Dir[] = [...perps, opposites[originalDir]];
            let chose: Dir | null = null;
            for (const cand of candidates) {
              const v = DIR_VEC[cand];
              if (!tankBlocksAt(map, e.x + v.x, e.y + v.y, e, enemyObstacles, eagleAliveRef.current, brickStatesRef.current)) {
                chose = cand;
                break;
              }
            }
            dir = chose ?? candidates[Math.floor(Math.random() * candidates.length)];
          } else if (Math.random() < prof.targetBias) {
            const dx = targetPos.x - (e.x + TANK_SIZE / 2);
            const dy = targetPos.y - (e.y + TANK_SIZE / 2);
            const preferX =
              Math.abs(dx) > Math.abs(dy) ||
              (Math.abs(dx) === Math.abs(dy) && Math.random() < 0.5);
            if (preferX) dir = dx > 0 ? "right" : "left";
            else         dir = dy > 0 ? "down"  : "up";
          } else {
            dir = DIRS[Math.floor(Math.random() * DIRS.length)];
          }
          if (dir !== e.dir) {
            e.dir = dir;
            snapTankToLane(e, map, enemyObstacles, eagleAliveRef.current, brickStatesRef.current);
          }
          // Upstream m_keep_direction_time = rand()%800 + 100, applied AFTER
          // every direction choice. The bumped path stays slightly shorter so
          // the tank doesn't immediately re-steer into the same wall.
          e.aiNextTurnAt = now + (blocked ? 50 : AI_TURN_MIN_MS) + Math.random() * AI_TURN_RANGE_MS;
        }
        const before = { x: e.x, y: e.y };
        tryMove(e, dt * PLAYER_SPEED * TILE * e.speedMul, map, enemyObstacles, eagleAliveRef.current, brickStatesRef.current);
        accumulateTread(e, dt, before);

        // Firing — upstream Enemy::updateBehavior:
        //   every m_reload_time ms, attempt to fire and pick a new random
        //   reload window (per-type max). Tank D additionally requires the
        //   target to be straight ahead.
        if (now >= e.aiNextFireAt) {
          e.aiNextFireAt = now + Math.random() * ENEMY_RELOAD_MAX_MS[e.type!];
          let shouldFire = true;
          if (prof.fireOnlyInFront) {
            const dx = targetPos.x - (e.x + TANK_SIZE / 2);
            const dy = targetPos.y - (e.y + TANK_SIZE / 2);
            const vd = DIR_VEC[e.dir];
            const aligned = vd.x !== 0 ? Math.abs(dy) < TANK_SIZE : Math.abs(dx) < TANK_SIZE;
            const inFront = dx * vd.x + dy * vd.y > 0;
            shouldFire = inFront && aligned;
          }
          if (shouldFire) tryFire(e, now);
        }
      }

      // 5. Bullets — sweep the movement so a fast bullet can't skip a brick.
      const liveBullets: Bullet[] = [];
      for (const b of bulletsRef.current) {
        const v = DIR_VEC[b.dir];
        const distance = dt * BULLET_SPEED * b.speedMul;
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
            // Big explosion centered on the eagle's 2×2 footprint.
            const ex = (Math.floor(STAGE_COLS / 2) - 1) * TILE;
            const ey = (STAGE_ROWS - 2) * TILE;
            spawnTankFx(effectsRef.current, ex, ey);
            resolved = "eagle";
            break;
          }

          // Terrain — leading edge of the bullet, plus the perpendicular
          // extent so it can't slip through a one-tile-wide gap.
          const terrainHit = checkBulletTerrain(b, map, brickStatesRef.current);
          if (terrainHit) {
            if (terrainHit === "brick") sound.play(TANK_SOUNDS.brickHit.id, TANK_SOUNDS.brickHit.vol);
            else                        sound.play(TANK_SOUNDS.steelHit.id, TANK_SOUNDS.steelHit.vol);
            resolved = terrainHit;
            break;
          }
        }
        if (resolved) {
          // Bullet-destroy spark for every wall/edge hit (the eagle hit
          // already spawned its own big explosion above).
          if (resolved !== "eagle") spawnBulletFx(effectsRef.current, b);
          freeOwnerBullet(b);
          continue;
        }

        // Tanks
        let consumed = false;
        if (b.fromPlayer) {
          for (let i = 0; i < enemiesRef.current.length; i++) {
            const e = enemiesRef.current[i];
            if (e.creating > 0 || e.spawnInvuln > 0) continue;
            if (bulletHitsTank(b, e)) {
              consumed = true;
              freeOwnerBullet(b);
              // Armored enemies absorb hits until armor reaches 1. The
              // characteristic "creak" of plating shrugging off a bullet is
              // upstream's enemy_hit.ogg (soundconfig.h ENEMY_HIT) — distinct
              // from a brick break or a kill.
              if (e.armor > 1) {
                e.armor -= 1;
                sound.play(TANK_SOUNDS.enemyHit.id, TANK_SOUNDS.enemyHit.vol);
                spawnBulletFx(effectsRef.current, b);
                break;
              }
              // Armor 1 → destroyed for real.
              spawnTankFx(effectsRef.current, e.x, e.y);
              const earned = ENEMY_PROFILES[e.type!].score;
              const wasBonus = e.bonusDrop;
              const ex = e.x, ey = e.y;
              enemiesRef.current.splice(i, 1);
              setEnemiesLeft((x) => x - 1);
              setScore((s) => {
                const ns = s + earned;
                scoreRef.current = ns;
                return ns;
              });
              sound.play(TANK_SOUNDS.enemyDestroyed.id, TANK_SOUNDS.enemyDestroyed.vol);
              // 🎁 Bonus enemy → drop a random bonus on a nearby empty cell.
              //    (Matches the famous "flashing red enemy = bonus" rule.)
              if (wasBonus && !bonusRef.current) {
                const spot = pickEmptySpot(map) ?? {
                  x: Math.floor(ex / TILE),
                  y: Math.floor(ey / TILE),
                };
                bonusRef.current = {
                  id: nextId(),
                  kind: BONUS_KINDS[Math.floor(Math.random() * BONUS_KINDS.length)],
                  x: spot.x * TILE,
                  y: spot.y * TILE,
                  bornAt: now,
                };
                // Upstream Game::generateBonus line 571 — distinctive "ding"
                // when a fresh bonus drops onto the map.
                sound.play(TANK_SOUNDS.bonusAppeared.id, TANK_SOUNDS.bonusAppeared.vol);
              }
              break;
            }
          }
        } else {
          const curP = playerRef.current;
          if (curP && curP.creating === 0 && bulletHitsTank(b, curP)) {
            consumed = true;
            freeOwnerBullet(b);
            // Shield protects without losing a life.
            if (curP.shield > 0 || curP.spawnInvuln > 0) {
              // absorbed
            } else if (curP.hasBoat) {
              // 🚤 Boat absorbs ONE hit then disappears (upstream
              // Player::hit — boat is removed before life is subtracted).
              curP.hasBoat = false;
              spawnBulletFx(effectsRef.current, b);
              sound.play(TANK_SOUNDS.brickHit.id, TANK_SOUNDS.brickHit.vol);
            } else if (curP.starLevel >= MAX_STAR_LEVEL) {
              // ⭐⭐⭐ Maxed player takes a hit → DEMOTE 1 star instead of
              // dying. Upstream Player::hit lines 101-105.
              curP.starLevel -= 1;
              spawnBulletFx(effectsRef.current, b);
              sound.play(TANK_SOUNDS.playerHit.id, TANK_SOUNDS.playerHit.vol);
            } else {
              spawnTankFx(effectsRef.current, curP.x, curP.y);
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

      // 5b. Bullet-vs-bullet — opposing-side bullets that overlap mutually
      // annihilate (classic Battle City), so the player can deflect an
      // incoming shot by firing into it.
      const killedBulletIds = new Set<number>();
      for (let i = 0; i < liveBullets.length; i++) {
        const a = liveBullets[i];
        if (killedBulletIds.has(a.id)) continue;
        for (let j = i + 1; j < liveBullets.length; j++) {
          const b2 = liveBullets[j];
          if (killedBulletIds.has(b2.id)) continue;
          if (a.fromPlayer === b2.fromPlayer) continue;
          if (
            rectsOverlap(
              a.x,  a.y,  BULLET_HITBOX, BULLET_HITBOX,
              b2.x, b2.y, BULLET_HITBOX, BULLET_HITBOX,
            )
          ) {
            killedBulletIds.add(a.id);
            killedBulletIds.add(b2.id);
            freeOwnerBullet(a);
            freeOwnerBullet(b2);
            spawnBulletFx(effectsRef.current, a);
            sound.play(TANK_SOUNDS.bulletVsBullet.id, TANK_SOUNDS.bulletVsBullet.vol);
            break;
          }
        }
      }
      bulletsRef.current = killedBulletIds.size === 0
        ? liveBullets
        : liveBullets.filter((b) => !killedBulletIds.has(b.id));

      // 6. Bonus pickup by player — dispatch on bonus kind. Matches the
      //    eight upstream Battle-City bonuses (see game README).
      const cur = playerRef.current;
      if (cur && bonusRef.current) {
        const b = bonusRef.current;
        if (
          cur.x < b.x + TILE * 2 &&
          cur.x + TANK_SIZE > b.x &&
          cur.y < b.y + TILE * 2 &&
          cur.y + TANK_SIZE > b.y
        ) {
          // Every bonus pickup awards a flat 300 points up front (upstream
          // checkCollisionPlayerWithBonus line 357), then each kind has its
          // own effect & score on top.
          let pickupScore = 300;
          // The Tank bonus has its own sound; every other bonus shares the
          // standard "bonus_obtained" jingle.
          let pickupSound: { id: string; vol: number } = TANK_SOUNDS.bonusObtained;
          switch (b.kind) {
            case "helmet":
              cur.shield = SHIELD_TIME_MS;
              break;
            case "star":
              cur.starLevel = Math.min(MAX_STAR_LEVEL, cur.starLevel + 1);
              break;
            case "gun":
              // Instantly maxes the star meter ⇒ same as "three stars"
              // (upstream Game::checkCollisionPlayerWithBonus line 398
              // calls changeStarCountBy(3) which clamps to 3).
              cur.starLevel = MAX_STAR_LEVEL;
              break;
            case "tank": {
              const newLives = livesRef.current + 1;
              livesRef.current = newLives;
              setLives(newLives);
              pickupSound = TANK_SOUNDS.lifeUp;
              break;
            }
            case "clock":
              freezeUntilRef.current = now + CLOCK_FREEZE_MS;
              break;
            case "shovel":
              activateShovel(mapRef.current, brickStatesRef.current, shovelSavedRef.current);
              shovelUntilRef.current = now + SHOVEL_FORTIFY_MS;
              break;
            case "boat":
              cur.hasBoat = true;
              break;
            case "grenade": {
              // Wipe every alive enemy on the map. Each kill from a grenade
              // awards a flat 200 (upstream line 365) — not the per-type
              // bullet-kill score.
              const killed = enemiesRef.current.length;
              for (const e of enemiesRef.current) {
                spawnTankFx(effectsRef.current, e.x, e.y);
              }
              enemiesRef.current = [];
              pickupScore += killed * 200;
              if (killed > 0) {
                sound.play(TANK_SOUNDS.enemyDestroyed.id, TANK_SOUNDS.enemyDestroyed.vol);
                setEnemiesLeft((x) => x - killed);
              }
              break;
            }
          }
          bonusRef.current = null;
          sound.play(pickupSound.id, pickupSound.vol);
          setScore((s) => {
            const ns = s + pickupScore;
            scoreRef.current = ns;
            return ns;
          });
        }
      }

      // 6b. Shovel buff — in the LAST 25 % of its window upstream alternates
      //     the eagle perimeter between steel and brick (every bonus_blink_time
      //     = 350 ms) so the player gets a visual warning that the buff is
      //     about to expire. After expiry the cells revert to brick for good.
      if (shovelUntilRef.current > 0) {
        const elapsed = SHOVEL_FORTIFY_MS - (shovelUntilRef.current - now);
        if (now > shovelUntilRef.current) {
          restoreShovel(mapRef.current, brickStatesRef.current, shovelSavedRef.current);
          shovelSavedRef.current = [];
          shovelUntilRef.current = 0;
        } else if (elapsed > SHOVEL_FORTIFY_MS * 0.75) {
          // Toggle the saved cells between steel (protected) and brick
          // (warning). Each cell tracks its current visual via the actual
          // tile kind, so we just flip every BONUS_BLINK_MS.
          const showSteel = Math.floor(elapsed / BONUS_BLINK_MS) % 2 === 0;
          const desired: TileKind = showSteel ? "steel" : "brick";
          for (const c of shovelSavedRef.current) {
            if (mapRef.current[c.i] !== desired) {
              mapRef.current[c.i] = desired;
              brickStatesRef.current[c.i] = 0;
            }
          }
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

      // 8. Effects bookkeeping — prune sparks/explosions that have finished.
      if (effectsRef.current.length > 0) {
        effectsRef.current = effectsRef.current.filter((fx) => {
          const elapsed = now - fx.bornAt;
          return elapsed < (fx.kind === "bullet" ? BULLET_FX_DURATION : TANK_FX_DURATION);
        });
      }

      // 9. Sync player upgrades into HUD state (only when they actually
      //    change, so React doesn't re-render every frame).
      const cp = playerRef.current;
      if (cp) {
        if (cp.starLevel !== playerStars)  setPlayerStars(cp.starLevel);
        if (cp.hasBoat   !== playerHasBoat) setPlayerHasBoat(cp.hasBoat);
      }

      redraw();
      return true;
    },
    [over, playerStars, playerHasBoat, redraw, respawnPlayer, submitBest, tryFire],
  );

  // ──────────────── rAF ────────────────
  useEffect(() => {
    if (!running || paused) {
      redraw();
      return;
    }
    // Reset the dt baseline when resuming so the first frame after a long
    // pause doesn't dump 1+ seconds of physics in one tick.
    lastTickRef.current = 0;
    const loop = (now: number) => {
      step(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, paused, redraw, step]);

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
      // ⏸ Pause toggle.
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        e.preventDefault();
        if (running && !over) togglePause();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (paused) { togglePause(); return; }
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
  }, [over, running, paused, handleStart, handleNextStage, togglePause]);

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
      if (paused) { togglePause(); return; }
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
          {mode === "super-funny" && (
            <span className="ml-2 text-amber-300 font-medium text-[11px]" title="Super Funny mode">🎉</span>
          )}
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
            {lives <= MAX_LIVES
              ? Array.from({ length: MAX_LIVES }, (_, i) => (
                  <span key={i} className={i < lives ? "text-rose-300" : "text-white/15"} aria-hidden>♥</span>
                ))
              : <span className="text-rose-300 font-semibold">♥ ×{lives}</span>}
          </span>
          <span className="text-white/30">·</span>
          <span>
            <span className="text-white/45">{t("tank.enemies")}: </span>
            <span className="text-white font-semibold">{enemiesLeft}</span>
          </span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 flex items-center gap-2"
             title={`Star ${playerStars}/${MAX_STAR_LEVEL}`}>
          <span aria-label={`stars ${playerStars}`}>
            {Array.from({ length: MAX_STAR_LEVEL }, (_, i) => (
              <span key={i} className={i < playerStars ? "text-amber-300" : "text-white/15"} aria-hidden>★</span>
            ))}
          </span>
          {playerHasBoat && <span className="text-cyan-300" aria-label="boat">🚤</span>}
        </div>
        <button
          type="button"
          onClick={togglePause}
          disabled={!running || over != null}
          aria-label={paused ? "Resume" : "Pause"}
          title={paused ? "Resume (P)" : "Pause (P)"}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
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
            <p className="text-base font-semibold text-white">Choose mode</p>
            <p className="text-xs text-white/55 max-w-[260px]">
              Super Funny gives you 3 stars + a boat at every spawn — bullets break
              steel and plough through bushes from the very first shot.
            </p>
            <div className="flex flex-col gap-2 mt-2 w-full max-w-[220px]">
              <button
                onClick={() => handleStart("normal")}
                className={primaryBtn + " w-full justify-center"}
              >
                Normal
              </button>
              <button
                onClick={() => handleStart("super-funny")}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 text-black px-5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                🎉 Super Funny
              </button>
            </div>
          </Overlay>
        )}
        {running && paused && (
          <Overlay>
            <div className="text-3xl">⏸</div>
            <p className="text-lg font-semibold text-white">Paused</p>
            <p className="text-xs text-white/55">Press P (or space) to resume</p>
            <button onClick={togglePause} className={primaryBtn}>Resume</button>
          </Overlay>
        )}
        {over === "lose-lives" && (
          <Overlay>
            <div className="text-2xl">💥</div>
            <p className="text-lg font-semibold text-white">{t("tank.gameOver")}</p>
            <p className="text-sm text-white/65">{t("tank.gameOverHint")}</p>
            <FinalLine score={score} best={best} t={t} />
            {isNewBest && <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>}
            <button onClick={() => handleStart()} className={primaryBtn}>{t("game.restart")}</button>
          </Overlay>
        )}
        {over === "lose-eagle" && (
          <Overlay>
            <div className="text-2xl">🦅💔</div>
            <p className="text-lg font-semibold text-white">Base destroyed</p>
            <p className="text-sm text-white/65">The eagle fell. Try again.</p>
            <FinalLine score={score} best={best} t={t} />
            {isNewBest && <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>}
            <button onClick={() => handleStart()} className={primaryBtn}>{t("game.restart")}</button>
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
        💣 wipe · 🪖 10s shield · ⏱ 8s freeze · 🛠 15s steel walls · 🛡 +1 life · ⭐ upgrade · 🔫 max stars · 🚤 cross water (absorbs 1 hit)
      </p>
      <p className="mt-1 text-center text-[11px] text-white/30 font-mono">
        Flashing red tank drops a bonus · armored tanks need multiple hits · ⭐⭐⭐ bullets plow through bushes
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

/** The 8 cells forming the brick perimeter around the eagle. Used by the
 *  Shovel bonus to temporarily reinforce the base. */
function eaglePerimeterCells(): number[] {
  const ex = Math.floor(STAGE_COLS / 2) - 1; // 12 — eagle's left column
  const ey = STAGE_ROWS - 2;                 // 24 — eagle's top row
  return [
    idx(ex - 1, ey - 1), idx(ex, ey - 1), idx(ex + 1, ey - 1), idx(ex + 2, ey - 1), // top
    idx(ex - 1, ey),                                                                 // left-mid
    idx(ex + 2, ey),                                                                 // right-mid
    idx(ex - 1, ey + 1),                                                             // left-bot
    idx(ex + 2, ey + 1),                                                             // right-bot
  ];
}

function activateShovel(
  map: TileKind[], brickStates: Uint8Array,
  saved: { i: number; original: TileKind }[],
) {
  saved.length = 0;
  for (const k of eaglePerimeterCells()) {
    saved.push({ i: k, original: map[k] });
    map[k] = "steel";
    brickStates[k] = 0; // not a brick anymore, but keep the state slot tidy
  }
}

function restoreShovel(
  map: TileKind[], brickStates: Uint8Array,
  saved: { i: number; original: TileKind }[],
) {
  // Classic Battle-City: walls revert to BRICK regardless of what they were
  // before (so this also gives free walls in stages without a brick perimeter).
  for (const c of saved) {
    map[c.i] = "brick";
    brickStates[c.i] = 0; // fresh, undamaged brick
  }
}

/** Spawn the small 32×32 ST_DESTROY_BULLET spark, centered on the impact point. */
function spawnBulletFx(effects: Effect[], b: Bullet) {
  const v = DIR_VEC[b.dir];
  // Use the bullet's leading edge as the impact point.
  const cx = b.x + BULLET_HITBOX / 2 + v.x * BULLET_HITBOX / 2;
  const cy = b.y + BULLET_HITBOX / 2 + v.y * BULLET_HITBOX / 2;
  effects.push({
    id: nextId(),
    kind: "bullet",
    x: cx - 16,
    y: cy - 16,
    bornAt: performance.now(),
  });
}

/** Spawn the big 64×64 ST_DESTROY_TANK explosion, centered on a 2×2-tile entity
 *  whose top-left is (tx, ty). Works for tanks AND the eagle. */
function spawnTankFx(effects: Effect[], tx: number, ty: number) {
  effects.push({
    id: nextId(),
    kind: "tank",
    x: tx - 16, // (64 - 32) / 2 — center the 64×64 sprite on the 32×32 footprint
    y: ty - 16,
    bornAt: performance.now(),
  });
}
function idx(x: number, y: number) { return y * STAGE_COLS + x; }
function inBounds(x: number, y: number) { return x >= 0 && x < STAGE_COLS && y >= 0 && y < STAGE_ROWS; }

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Brick sub-tile destruction — verbatim port of upstream Brick::bulletHit
 * (objects/brick.cpp). Each brick has 9 possible states:
 *
 *   0  ░░░░  whole 16×16 brick (initial)
 *   1  ▀▀▀▀  top half remains    (bottom destroyed)
 *   2  ░░▐▌  right half remains  (left destroyed)
 *   3  ▄▄▄▄  bottom half remains (top destroyed)
 *   4  ▌▌░░  left half remains   (right destroyed)
 *   5  ░▝     top-right quarter
 *   6  ░▗     bottom-right quarter
 *   7  ▘░     top-left quarter
 *   8  ▖░     bottom-left quarter
 *   9        gone — cell becomes "empty"
 *
 * The atlas conveniently has each of these states pre-rendered at
 * (928, state*16). The collision sub-rect is computed by `brickSubRect`.
 * ────────────────────────────────────────────────────────────────────────── */
function nextBrickState(prevState: number, bulletDir: Dir): number {
  const bd = DIR_INDEX[bulletDir]; // 0=up, 1=right, 2=down, 3=left
  if (prevState === 0) {
    // First hit always knocks out the half the bullet came AT.
    return bd + 1;
  }
  if (prevState >= 1 && prevState <= 4) {
    // Quarter-remaining heuristic from upstream — gives nice cross-direction
    // chip patterns and falls back to "fully destroyed" on parallel hits.
    const ss = (prevState - 1) * (prevState - 1) + bd * bd;
    return ss % 2 === 1 ? Math.floor((ss + 19) / 4) : 9;
  }
  // Anything beyond a quarter goes to dust on the next hit.
  return 9;
}

function brickSubRect(state: number, cellPx: number, cellPy: number)
  : { x: number; y: number; w: number; h: number } | null
{
  const half = TILE / 2;
  switch (state) {
    case 0: return { x: cellPx,        y: cellPy,        w: TILE, h: TILE };
    case 1: return { x: cellPx,        y: cellPy,        w: TILE, h: half };          // top
    case 2: return { x: cellPx + half, y: cellPy,        w: half, h: TILE };          // right
    case 3: return { x: cellPx,        y: cellPy + half, w: TILE, h: half };          // bottom
    case 4: return { x: cellPx,        y: cellPy,        w: half, h: TILE };          // left
    case 5: return { x: cellPx + half, y: cellPy,        w: half, h: half };          // top-right
    case 6: return { x: cellPx + half, y: cellPy + half, w: half, h: half };          // bottom-right
    case 7: return { x: cellPx,        y: cellPy,        w: half, h: half };          // top-left
    case 8: return { x: cellPx,        y: cellPy + half, w: half, h: half };          // bottom-left
    default: return null; // 9 = destroyed
  }
}

/** True if a TANK_SIZE bounding box at (px,py) would overlap any solid
 *  obstacle — terrain, the eagle (while alive), or any other tank.
 *  Bricks are checked against their per-cell sub-rect (so tanks can squeeze
 *  through the half-cell gaps left after a bullet chips a brick). */
function tankBlocksAt(
  map: TileKind[], px: number, py: number,
  self: Tank | null, others: ReadonlyArray<Tank>, eagleAlive: boolean,
  brickStates?: Uint8Array,
): boolean {
  // Terrain — steel and water always block (full cell); bricks only block
  // within their remaining sub-rect. Tanks carrying the 🚤 Boat bonus
  // traverse water freely.
  const left   = Math.floor(px / TILE);
  const top    = Math.floor(py / TILE);
  const right  = Math.floor((px + TANK_SIZE - 1) / TILE);
  const bottom = Math.floor((py + TANK_SIZE - 1) / TILE);
  const blocksWater = !(self?.hasBoat);
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      if (!inBounds(x, y)) return true;
      const k = idx(x, y);
      const t = map[k];
      if (t === "steel") return true;
      if (t === "water" && blocksWater) return true;
      if (t === "brick") {
        const state = brickStates ? brickStates[k] : 0;
        const sub = brickSubRect(state, x * TILE, y * TILE);
        if (sub && rectsOverlap(px, py, TANK_SIZE, TANK_SIZE, sub.x, sub.y, sub.w, sub.h)) {
          return true;
        }
      }
    }
  }
  // Eagle (2×2 tile) — solid while alive. Once destroyed the game ends so
  // we no longer block movement through that footprint.
  if (eagleAlive) {
    const ex = (Math.floor(STAGE_COLS / 2) - 1) * TILE;
    const ey = (STAGE_ROWS - 2) * TILE;
    if (rectsOverlap(px, py, TANK_SIZE, TANK_SIZE, ex, ey, TANK_SIZE, TANK_SIZE)) {
      return true;
    }
  }
  // Other tanks — anything that isn't `self`. Tanks still in the spawn
  // flash don't yet occupy the map physically, so we skip them.
  for (const o of others) {
    if (self && o.id === self.id) continue;
    if (o.creating > 0) continue;
    if (rectsOverlap(px, py, TANK_SIZE, TANK_SIZE, o.x, o.y, TANK_SIZE, TANK_SIZE)) {
      return true;
    }
  }
  return false;
}

/** Advance the tank by `distance` pixels in its current direction, but stop
 *  exactly when it hits a wall, the eagle, or another tank. */
function tryMove(
  t: Tank, distance: number,
  map: TileKind[], others: ReadonlyArray<Tank>, eagleAlive: boolean,
  brickStates?: Uint8Array,
) {
  const v = DIR_VEC[t.dir];
  let remaining = distance;
  while (remaining > 0) {
    const step = remaining > 1 ? 1 : remaining;
    const nx = t.x + v.x * step;
    const ny = t.y + v.y * step;
    if (tankBlocksAt(map, nx, ny, t, others, eagleAlive, brickStates)) return;
    t.x = nx;
    t.y = ny;
    remaining -= step;
  }
}

/** Snap the perpendicular axis to a tile boundary when the tank starts
 *  moving in a new direction. We always try the *nearer* boundary first
 *  and fall back to the further one if the nearer one would push the tank
 *  into a wall, another tank, or the eagle. The snap matters because a
 *  mid-cell tank's bullet only samples one of the two columns the tank
 *  occupies, so it can slip past adjacent bricks. */
function snapTankToLane(
  t: Tank, map: TileKind[],
  others: ReadonlyArray<Tank>, eagleAlive: boolean,
  brickStates?: Uint8Array,
) {
  const v = DIR_VEC[t.dir];
  if (v.y !== 0) {
    const lo = Math.floor(t.x / TILE) * TILE;
    const hi = lo + TILE;
    const order = (t.x - lo) <= (hi - t.x) ? [lo, hi] : [hi, lo];
    for (const cand of order) {
      if (cand === t.x) return;
      if (!tankBlocksAt(map, cand, t.y, t, others, eagleAlive, brickStates)) {
        t.x = cand;
        return;
      }
    }
  } else if (v.x !== 0) {
    const lo = Math.floor(t.y / TILE) * TILE;
    const hi = lo + TILE;
    const order = (t.y - lo) <= (hi - t.y) ? [lo, hi] : [hi, lo];
    for (const cand of order) {
      if (cand === t.y) return;
      if (!tankBlocksAt(map, t.x, cand, t, others, eagleAlive, brickStates)) {
        t.y = cand;
        return;
      }
    }
  }
}

function isBlockedAhead(
  t: Tank, map: TileKind[], others: ReadonlyArray<Tank>, eagleAlive: boolean,
  brickStates?: Uint8Array,
): boolean {
  const v = DIR_VEC[t.dir];
  return tankBlocksAt(map, t.x + v.x * 3, t.y + v.y * 3, t, others, eagleAlive, brickStates);
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
    bulletCount: 0,
    spawnInvuln: PLAYER_INVULN_MS,
    shield: 0,
    starLevel: 0,
    speedMul: 1,
    aiNextTurnAt: 0,
    aiNextFireAt: 0,
    treadFrame: 0,
    treadAcc: 0,
    creating: SPAWN_ANIM_MS,
    hasBoat: false,
    armor: 1,
    bonusDrop: false,
  };
}

function makeEnemy(
  map: TileKind[], existing: Tank[], player: Tank | null,
  type: EnemyType, stageNumber: number,
): Tank | null {
  const cols = [0, Math.floor(STAGE_COLS / 2) - 1, STAGE_COLS - 2];
  const tryCols = cols.sort(() => Math.random() - 0.5);
  for (const tx of tryCols) {
    const ty = 0;
    const px = tx * TILE;
    const py = ty * TILE;
    if (!tankBlocksAt(map, px, py, null, [], true)) {
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
          bulletCount: 0,
          spawnInvuln: 0,
          shield: 0,
          starLevel: 0,
          speedMul: prof.speedMul,
          aiNextTurnAt: 0,
          aiNextFireAt: performance.now() + 1200 + Math.random() * 800,
          treadFrame: 0,
          treadAcc: 0,
          creating: SPAWN_ANIM_MS,
          hasBoat: false,
          armor: pickArmorForStage(stageNumber),
          // ~12% of upstream enemy spawns drop a bonus when killed.
          bonusDrop: Math.random() < 0.12,
        // spawnInvuln stays 0 — the creating phase already grants protection.
        };
      }
    }
  }
  return null;
}

/* Bullet helpers — kept as module-internal (work on whatever map/players are
 * current; we pass the map explicitly, but the owning tank's bulletCount
 * decrement is done via the module-level last-seen refs set during draw). */

function freeOwnerBullet(b: Bullet) {
  // The owner reference is recovered from the global last-known arrays via
  // the refs-on-component-level. Helpers below set them at the start of each
  // step() invocation (see __lastPlayer / __lastEnemies below).
  if (b.fromPlayer && __lastPlayer) {
    __lastPlayer.bulletCount = Math.max(0, __lastPlayer.bulletCount - 1);
  } else if (!b.fromPlayer) {
    const owner = __lastEnemies.find((e) => e.id === b.ownerId);
    if (owner) owner.bulletCount = Math.max(0, owner.bulletCount - 1);
  }
}

/** Iterate every cell the bullet's hitbox overlaps at its leading edge
 *  and apply destruction to each (matches upstream stage_environment.cpp
 *  lines 198-260: nested loops over (row_start..row_end, column_start..
 *  column_end) calling bulletHit on every brick they touch). Symmetric
 *  damage when a bullet straddles two columns — both bricks chip together
 *  through the 9-state machine. */
function checkBulletTerrain(
  b: Bullet, map: TileKind[], brickStates: Uint8Array,
): "brick" | "steel" | null {
  const v = DIR_VEC[b.dir];
  const tipX =
    v.x > 0 ? b.x + BULLET_HITBOX - 1
    : v.x < 0 ? b.x
    : b.x + BULLET_HITBOX / 2;
  const tipY =
    v.y > 0 ? b.y + BULLET_HITBOX - 1
    : v.y < 0 ? b.y
    : b.y + BULLET_HITBOX / 2;

  // Every candidate cell along the perpendicular extent of the bullet's
  // leading edge. For axis-aligned motion we touch up to 2 cells.
  const cells: { tx: number; ty: number }[] = [];
  if (v.y !== 0) {
    const ty = Math.floor(tipY / TILE);
    const txLo = Math.floor(b.x / TILE);
    const txHi = Math.floor((b.x + BULLET_HITBOX - 1) / TILE);
    cells.push({ tx: txLo, ty });
    if (txHi !== txLo) cells.push({ tx: txHi, ty });
  } else {
    const tx = Math.floor(tipX / TILE);
    const tyLo = Math.floor(b.y / TILE);
    const tyHi = Math.floor((b.y + BULLET_HITBOX - 1) / TILE);
    cells.push({ tx, ty: tyLo });
    if (tyHi !== tyLo) cells.push({ tx, ty: tyHi });
  }

  let result: "brick" | "steel" | null = null;
  for (const s of cells) {
    if (!inBounds(s.tx, s.ty)) continue;
    const k = idx(s.tx, s.ty);
    const tile = map[k];
    if (tile === "bush") {
      // 3-star bullets PLOW through bushes, destroying every one in their
      // path (upstream stage_environment.cpp:248). Non-3-star bullets just
      // pass through without affecting the bush.
      if (b.power > 0) map[k] = "empty";
      continue;
    }
    if (tile === "brick") {
      const sub = brickSubRect(brickStates[k], s.tx * TILE, s.ty * TILE);
      if (!sub) continue;
      if (!rectsOverlap(b.x, b.y, BULLET_HITBOX, BULLET_HITBOX, sub.x, sub.y, sub.w, sub.h)) {
        // Remaining brick half doesn't cover the bullet — sails through.
        continue;
      }
      if (b.power > 0) {
        // 3-star bullet shatters the whole brick in one shot.
        brickStates[k] = 0;
        map[k] = "empty";
      } else {
        const newState = nextBrickState(brickStates[k], b.dir);
        if (newState === 9) {
          brickStates[k] = 0;
          map[k] = "empty";
        } else {
          brickStates[k] = newState;
        }
      }
      if (result !== "steel") result = "brick";
      // Don't break — when the bullet straddles two brick cells, BOTH
      // should chip together (symmetric damage). The bullet still dies
      // this frame (handled by the non-null return).
    } else if (tile === "steel") {
      if (b.power > 0) map[k] = "empty";
      result = "steel";
    }
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
  brickStates: Uint8Array,
  eagleAlive: boolean,
  player: Tank | null,
  enemies: Tank[],
  bullets: Bullet[],
  bonus: Bonus | null,
  effects: Effect[],
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
      const k = idx(x, y);
      const tk = map[k];
      if (tk === "empty" || tk === "bush") continue;
      drawTile(ctx, atlas, tk, x * TILE, y * TILE, tk === "brick" ? brickStates[k] : 0);
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
      if (map[idx(x, y)] === "bush") drawTile(ctx, atlas, "bush", x * TILE, y * TILE, 0);
    }
  }

  // Sparks and explosions sit on top of everything else.
  if (effects.length > 0) {
    const now = performance.now();
    for (const fx of effects) drawEffect(ctx, atlas, fx, now);
  }
}

function drawEffect(
  ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null,
  fx: Effect, now: number,
) {
  const elapsed = now - fx.bornAt;
  if (fx.kind === "bullet") {
    const frame = Math.min(BULLET_FX_FRAMES - 1, Math.floor(elapsed / BULLET_FX_MS));
    if (atlas) {
      ctx.drawImage(
        atlas,
        SP.bulletFxX, SP.bulletFxY0 + frame * 32, 32, 32,
        fx.x, fx.y, 32, 32,
      );
    }
  } else {
    const frame = Math.min(TANK_FX_FRAMES - 1, Math.floor(elapsed / TANK_FX_MS));
    if (atlas) {
      ctx.drawImage(
        atlas,
        SP.tankFxX, SP.tankFxY0 + frame * 64, 64, 64,
        fx.x, fx.y, 64, 64,
      );
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

function drawTile(
  ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null,
  kind: TileKind, x: number, y: number, brickState: number = 0,
) {
  // Bricks have 9 sub-state sprites stacked vertically in the atlas at
  // (928, state*16). State 0 = whole brick. State 9 (destroyed) shouldn't
  // reach here because the map is set to "empty" in that case.
  if (kind === "brick") {
    if (atlas) {
      ctx.drawImage(atlas, SP.brick.x, SP.brick.y + brickState * 16, SP.brick.w, SP.brick.h, x, y, TILE, TILE);
    } else {
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(x, y, TILE, TILE);
    }
    return;
  }
  const src =
    kind === "steel" ? SP.steel
    : kind === "bush" ? SP.bush
    : kind === "ice" ? SP.ice
    : kind === "water" ? (Math.floor(Date.now() / 350) % 2 === 0 ? SP.water0 : SP.water1)
    : null;
  if (src && blit(ctx, atlas, src, x, y, TILE, TILE)) return;
  ctx.fillStyle =
    kind === "steel" ? "#94a3b8"
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

const BONUS_SP: Record<BonusKind, { x: number; y: number; w: number; h: number }> = {
  grenade: SP.bonusGrenade,
  helmet:  SP.bonusHelmet,
  clock:   SP.bonusClock,
  shovel:  SP.bonusShovel,
  tank:    SP.bonusTank,
  star:    SP.bonusStar,
  gun:     SP.bonusGun,
  boat:    SP.bonusBoat,
};
const BONUS_EMOJI: Record<BonusKind, string> = {
  grenade: "💣", helmet: "🪖", clock: "⏱", shovel: "🛠",
  tank:    "🛡", star:   "⭐", gun:   "🔫", boat:   "🚤",
};

function drawBonus(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | null, b: Bonus) {
  // Upstream bonus_blink_time = 350 ms: 50 % visible / 50 % invisible toggle.
  if ((Date.now() % (BONUS_BLINK_MS * 2)) < BONUS_BLINK_MS) return;
  const src = BONUS_SP[b.kind];
  if (blit(ctx, atlas, src, b.x, b.y, TANK_SIZE, TANK_SIZE)) return;
  // Fallback when the atlas hasn't loaded yet
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(b.x, b.y, TANK_SIZE, TANK_SIZE);
  ctx.font = `${TILE * 1.4}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(BONUS_EMOJI[b.kind], b.x + TANK_SIZE / 2, b.y + TANK_SIZE / 2 + 1);
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
  // ST_CREATE spawn-flash animation: 10 vertically-stacked 32×32 frames
  // played over SPAWN_ANIM_MS while the tank materialises onto the map.
  if (t.creating > 0) {
    const progress = 1 - t.creating / SPAWN_ANIM_MS;
    const frame = Math.min(SPAWN_ANIM_FRAMES - 1, Math.floor(progress * SPAWN_ANIM_FRAMES));
    if (atlas) {
      ctx.drawImage(
        atlas,
        SP.createX, SP.createY0 + frame * 32, 32, 32,
        t.x, t.y, TANK_SIZE, TANK_SIZE,
      );
    } else {
      ctx.fillStyle = "rgba(253, 230, 138, 0.6)";
      ctx.fillRect(t.x, t.y, TANK_SIZE, TANK_SIZE);
    }
    return;
  }

  // Brief invulnerability flicker right after the create-flash ends.
  if (t.spawnInvuln > 0 && Math.floor(t.spawnInvuln / 100) % 2 === 0) return;

  // 🚤 Boat overlay sits *underneath* the tank hull, so we blit it first.
  if (t.isPlayer && t.hasBoat && atlas) {
    ctx.drawImage(atlas, SP.boatPlayer.x, SP.boatPlayer.y, SP.boatPlayer.w, SP.boatPlayer.h, t.x, t.y, TANK_SIZE, TANK_SIZE);
  }

  // Sprite addressing follows upstream enemy_alive_state.cpp lines 51-54:
  //   bonus enemy:   tiledOffset(direction - 4, frame)        → x=0..127 area
  //   armored enemy: tiledOffset(direction + (armor-1)*4, frame) — each
  //                  armor level lives in its own 128-px-wide column band.
  // The atlas has the colour-flash variants baked into frames 0/1 of each
  // sprite, so we get the classic "armoured tanks flash colours" effect
  // for free as soon as the tread animation ticks.
  const dirIdx = DIR_INDEX[t.dir];
  let sx: number, sy: number;
  if (t.isPlayer) {
    // Atlas only has 3 visible-armor rows for the player tank (y=64, 128,
    // 192). Going past y=192 lands in an empty atlas region, which made
    // the 3-star tank disappear after a Gun pickup. Cap the row index.
    sx = SP_PLAYER_X + dirIdx * 32;
    const armorRow = Math.min(2, t.starLevel); // 0..2 → y=64,128,192
    sy = SP_PLAYER_Y + armorRow * 64 + t.treadFrame * 32;
  } else {
    const colOffset = t.bonusDrop ? -4 : (t.armor - 1) * 4;
    sx = SP_ENEMY_X + (dirIdx + colOffset) * 32;
    sy = ENEMY_PROFILES[t.type!].atlasY + t.treadFrame * 32;
  }

  if (atlas) {
    ctx.drawImage(atlas, sx, sy, 32, 32, t.x, t.y, TANK_SIZE, TANK_SIZE);
  } else {
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
