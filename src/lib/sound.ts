// Lightweight sound manager for the game canvas.
//
// - Lazy-preloads each sound the first time it's requested
// - Keeps a small pool per sound so the same FX can re-trigger before the
//   previous instance has finished playing (e.g. rapid-fire shots)
// - Mute state persists in localStorage; honors browser autoplay policy
//   by silently swallowing rejected play() promises before user gesture
//
// Asset paths go through `asset()` so the game also works under a basePath
// (vd. /lampham/) if the deploy ever moves back to a project page.

import { asset } from "./config";

type PoolEntry = { el: HTMLAudioElement; lastPlayed: number };

const POOL_SIZE = 3;
const MIN_REPLAY_MS = 30; // throttle absurdly-fast retriggers (rate limiter)

class SoundManager {
  private pools: Record<string, PoolEntry[]> = {};
  private srcs: Record<string, string> = {};
  private muted = false;
  private hydrated = false;

  /** Register a sound under `key` with its asset-relative `src` (e.g. "/sounds/tank/x.ogg"). */
  register(key: string, src: string) {
    this.srcs[key] = src;
  }

  /** Force-preload one sound (creates the audio pool). Safe to call repeatedly. */
  preload(key: string) {
    if (typeof window === "undefined") return;
    if (this.pools[key]) return;
    const src = this.srcs[key];
    if (!src) return;
    this.pools[key] = Array.from({ length: POOL_SIZE }, () => {
      const el = new Audio(asset(src));
      el.preload = "auto";
      return { el, lastPlayed: 0 };
    });
  }

  /** Preload everything that's been registered (call after first user gesture). */
  preloadAll() {
    for (const k of Object.keys(this.srcs)) this.preload(k);
  }

  play(key: string, volume = 1) {
    if (this.muted) return;
    if (typeof window === "undefined") return;
    if (!this.pools[key]) this.preload(key);
    const pool = this.pools[key];
    if (!pool) return;
    const now = performance.now();
    // pick the oldest free instance (paused or already ended) — if none free,
    // reuse the one that was triggered longest ago.
    let chosen = pool[0];
    for (const entry of pool) {
      if (entry.el.paused || entry.el.ended) { chosen = entry; break; }
      if (entry.lastPlayed < chosen.lastPlayed) chosen = entry;
    }
    if (now - chosen.lastPlayed < MIN_REPLAY_MS) return;
    chosen.lastPlayed = now;
    chosen.el.currentTime = 0;
    chosen.el.volume = clamp(volume, 0, 1);
    chosen.el.play().catch(() => { /* autoplay blocked or interrupted — silent */ });
  }

  isMuted(): boolean {
    this.hydrate();
    return this.muted;
  }
  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem("lampham-mute", m ? "1" : "0"); } catch { /* ignore */ }
  }
  toggleMuted(): boolean {
    this.setMuted(!this.isMuted());
    return this.muted;
  }

  /** Read mute preference from localStorage on first access. */
  private hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      this.muted = localStorage.getItem("lampham-mute") === "1";
    } catch { /* ignore */ }
  }
}

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

/** Singleton. */
export const sound = new SoundManager();

/* ──────────────────────────────────────────────────────────────────────────
 * Sound IDs used by Tank Battle. Centralised so other games can reuse them.
 * Sound files credit upstream MIT project — see public/sounds/tank/NOTICE.txt
 * ────────────────────────────────────────────────────────────────────────── */
export const TANK_SOUNDS = {
  fire:           { id: "tank.fire",           src: "/sounds/tank/player_fired.ogg",       vol: 0.4 },
  brickHit:       { id: "tank.brick",          src: "/sounds/tank/bullet_hit_brick.ogg",   vol: 0.5 },
  steelHit:       { id: "tank.steel",          src: "/sounds/tank/bullet_hit_stone.ogg",   vol: 0.5 },
  enemyDestroyed: { id: "tank.enemyDestroyed", src: "/sounds/tank/enemy_destroyed.ogg",    vol: 0.7 },
  playerDestroyed:{ id: "tank.playerDestroyed",src: "/sounds/tank/player_destroyed.ogg",   vol: 0.7 },
  eagleDestroyed: { id: "tank.eagle",          src: "/sounds/tank/eagle_destroyed.ogg",    vol: 0.9 },
  bonusObtained:  { id: "tank.bonus",          src: "/sounds/tank/bonus_obtained.ogg",     vol: 0.7 },
  stageStart:     { id: "tank.stageStart",     src: "/sounds/tank/stage_start_up.ogg",     vol: 0.6 },
  bulletVsBullet: { id: "tank.bvb",            src: "/sounds/tank/bullet_hit_bullet.ogg",  vol: 0.5 },
} as const;

let __tankRegistered = false;
export function registerTankSounds() {
  if (__tankRegistered) return;
  __tankRegistered = true;
  for (const s of Object.values(TANK_SOUNDS)) sound.register(s.id, s.src);
}
