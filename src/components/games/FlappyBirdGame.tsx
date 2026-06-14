"use client";

/**
 * Flappy Bird — a clean-room tribute.
 *
 * 100% original code & art. The mechanics (tap to flap, gravity, scroll
 * through gaps between pipes, +1 per pipe cleared) are inspired by the
 * classic, and the physics here are ported from the open-source
 * aaarafat/JS-Flappy-Bird (https://github.com/aaarafat/JS-Flappy-Bird):
 * a gentle gravity, a fixed upward thrust on flap, a constant scroll speed,
 * and a single fixed gap height. No sprites, sounds, or assets are copied —
 * the bird, pipes, ground and clouds are all drawn on the fly.
 *
 * Runs on a fixed 60 Hz timestep so the feel is identical on 60/120 Hz
 * displays.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { GameShell, ScoreBar, useBestScore } from "./GameShell";

// ---------------------------- Tunables ----------------------------

const VIEW_W = 400;
const VIEW_H = 600;
const GROUND_H = 96;
const GROUND_Y = VIEW_H - GROUND_H; // top of the ground band

const BIRD_X = 116;                 // bird is pinned horizontally
const BIRD_R = 13;                  // collision radius
const BIRD_DRAW_W = 34;
const BIRD_DRAW_H = 26;

const GRAVITY = 0.46;               // px / frame² @ 60Hz
const FLAP_V = -7.8;                // instant upward velocity on flap
const MAX_FALL = 11.5;

const PIPE_W = 66;
const PIPE_GAP = 168;               // vertical opening between pipes
const PIPE_SPEED = 2.5;             // px / frame @ 60Hz
const PIPE_SPACING = 240;           // horizontal distance between pipes
const GAP_MARGIN = 56;              // keep gaps away from ceiling / ground

const STEP_MS = 1000 / 60;

type Phase = "ready" | "play" | "over";

type Pipe = {
  x: number;
  gapY: number;   // y of the top of the opening
  scored: boolean;
};

type Bird = {
  y: number;
  vy: number;
  rot: number;    // degrees, for the tilt
};

// ---------------------------- Component ----------------------------

export function FlappyBirdGame() {
  const game = games.find((g) => g.slug === "flappy-bird")!;
  const t = useT();
  const [best, submitBest] = useBestScore(game.highScoreKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Mutable sim state in refs so the rAF loop never tears.
  const birdRef = useRef<Bird>(makeBird());
  const pipesRef = useRef<Pipe[]>([]);
  const phaseRef = useRef<Phase>("ready");
  const scoreRef = useRef(0);
  const groundXRef = useRef(0);
  const framesRef = useRef(0);
  const lastFrameRef = useRef(0);
  const accRef = useRef(0);
  const diePlayedRef = useRef(false);

  // Audio is synthesized on the fly via Web Audio — no asset files.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [muted, setMuted] = useState(false);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // ---------------------------- Audio ----------------------------

  // Lazily create / resume the AudioContext inside a user gesture so browser
  // autoplay policies don't block the first sound.
  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!audioCtxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current?.state === "suspended") {
      void audioCtxRef.current.resume();
    }
  }, []);

  const playSfx = useCallback(
    (name: "flap" | "score" | "hit" | "die") => {
      if (mutedRef.current) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;

      const blip = (
        freq: number,
        t0: number,
        dur: number,
        type: OscillatorType,
        vol: number,
        freqEnd?: number,
      ) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, now + t0);
        if (freqEnd) {
          o.frequency.exponentialRampToValueAtTime(freqEnd, now + t0 + dur);
        }
        g.gain.setValueAtTime(0.0001, now + t0);
        g.gain.exponentialRampToValueAtTime(vol, now + t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + t0);
        o.stop(now + t0 + dur + 0.03);
      };

      switch (name) {
        case "flap":
          blip(420, 0, 0.12, "square", 0.09, 720);
          break;
        case "score":
          blip(660, 0, 0.1, "square", 0.11);
          blip(990, 0.085, 0.13, "square", 0.11);
          break;
        case "hit":
          blip(190, 0, 0.18, "sawtooth", 0.16, 90);
          break;
        case "die":
          blip(380, 0, 0.5, "triangle", 0.13, 70);
          break;
      }
    },
    [],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      mutedRef.current = !m;
      return !m;
    });
  }, []);

  // ---------------------------- Reset ----------------------------

  const reset = useCallback(() => {
    birdRef.current = makeBird();
    pipesRef.current = [];
    scoreRef.current = 0;
    framesRef.current = 0;
    diePlayedRef.current = false;
    setScore(0);
    setPhaseBoth("ready");
  }, [setPhaseBoth]);

  // ---------------------------- Flap / tap ----------------------------

  const flap = useCallback(() => {
    birdRef.current.vy = FLAP_V;
    playSfx("flap");
  }, [playSfx]);

  // One handler for every "tap" (pointer, space, up, W). Behaviour depends
  // on the current phase — start, flap, or go back to the ready screen.
  const handleTap = useCallback(() => {
    ensureAudio();
    switch (phaseRef.current) {
      case "ready":
        setPhaseBoth("play");
        flap();
        break;
      case "play":
        flap();
        break;
      case "over":
        reset();
        break;
    }
  }, [ensureAudio, flap, reset, setPhaseBoth]);

  // ---------------------------- Sim step ----------------------------

  const step = useCallback(() => {
    framesRef.current++;
    const bird = birdRef.current;
    const phaseNow = phaseRef.current;

    // Ground scrolls on the ready + play screens (frozen once you crash).
    if (phaseNow !== "over") {
      groundXRef.current = (groundXRef.current - PIPE_SPEED) % 24;
    }

    if (phaseNow === "ready") {
      // Gentle idle bob.
      bird.y = VIEW_H * 0.42 + Math.sin(framesRef.current / 12) * 6;
      bird.rot = 0;
      return;
    }

    if (phaseNow === "over") {
      // Let the bird fall onto the ground after a crash.
      if (bird.y + BIRD_R < GROUND_Y) {
        bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY);
        bird.y += bird.vy;
        bird.rot = Math.min(90, bird.rot + 6);
      } else {
        bird.y = GROUND_Y - BIRD_R;
        bird.rot = 90;
        if (!diePlayedRef.current) {
          diePlayedRef.current = true;
          playSfx("die");
        }
      }
      return;
    }

    // ----- phase === "play" -----

    // Bird physics.
    bird.vy = Math.min(MAX_FALL, bird.vy + GRAVITY);
    bird.y += bird.vy;

    // Tilt: nose up while rising, dive while falling.
    const targetRot = bird.vy < 0 ? -22 : Math.min(90, bird.vy * 7);
    bird.rot += (targetRot - bird.rot) * 0.18;

    // Ceiling clamp (classic doesn't kill on the roof).
    if (bird.y - BIRD_R < 0) {
      bird.y = BIRD_R;
      bird.vy = 0;
    }

    // Spawn pipes: keep one roughly every PIPE_SPACING px.
    const pipes = pipesRef.current;
    const last = pipes[pipes.length - 1];
    if (!last || last.x <= VIEW_W - PIPE_SPACING) {
      pipes.push(makePipe());
    }

    // Move pipes + score + cull.
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= PIPE_SPEED;
      if (!p.scored && p.x + PIPE_W < BIRD_X - BIRD_R) {
        p.scored = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        playSfx("score");
      }
      if (p.x + PIPE_W < -10) pipes.splice(i, 1);
    }

    // Collisions.
    const die = () => {
      setPhaseBoth("over");
      submitBest(scoreRef.current);
      playSfx("hit");
    };

    // Ground.
    if (bird.y + BIRD_R >= GROUND_Y) {
      bird.y = GROUND_Y - BIRD_R;
      die();
      return;
    }

    // Pipes — treat the bird as a circle vs. the two rects.
    for (const p of pipes) {
      const withinX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
      if (!withinX) continue;
      const hitTop = bird.y - BIRD_R < p.gapY;
      const hitBot = bird.y + BIRD_R > p.gapY + PIPE_GAP;
      if (hitTop || hitBot) {
        die();
        return;
      }
    }
  }, [setPhaseBoth, submitBest, playSfx]);

  // ---------------------------- Draw ----------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawSky(ctx);
    drawClouds(ctx, framesRef.current);
    for (const p of pipesRef.current) drawPipe(ctx, p);
    drawGround(ctx, groundXRef.current);
    drawBird(ctx, birdRef.current, framesRef.current, phaseRef.current);

    // Live score while playing (the React overlays cover the rest).
    if (phaseRef.current === "play") {
      drawBigScore(ctx, scoreRef.current);
    }
  }, []);

  // ---------------------------- Loop ----------------------------

  useEffect(() => {
    const tick = (now: number) => {
      const last = lastFrameRef.current || now;
      const dt = Math.min(50, now - last);
      lastFrameRef.current = now;
      accRef.current += dt;
      // Fixed 60 Hz steps so physics is frame-rate independent.
      let guard = 0;
      while (accRef.current >= STEP_MS && guard < 6) {
        step();
        accRef.current -= STEP_MS;
        guard++;
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = 0;
      accRef.current = 0;
    };
  }, [step, draw]);

  // ---------------------------- Input ----------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "arrowup" || k === "w") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTap]);

  // Bird shouldn't sky-rocket while the tab is hidden — flick back to ready
  // so a mid-air pause doesn't end in an instant crash on return.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && phaseRef.current === "play") {
        setPhaseBoth("over");
        submitBest(scoreRef.current);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [setPhaseBoth, submitBest]);

  // ---------------------------- UI ----------------------------

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    handleTap();
  };

  return (
    <GameShell game={game}>
      <ScoreBar
        score={score}
        best={best}
        scoreLabel={t("game.score")}
        bestLabel={t("game.best")}
        extra={
          <button
            type="button"
            onClick={() => {
              ensureAudio();
              toggleMute();
            }}
            aria-label={muted ? "Unmute" : "Mute"}
            title={muted ? "Unmute" : "Mute"}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        }
      />

      <div className="relative mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onPointerDown={onPointerDown}
          className="rounded-2xl border border-white/10 bg-[#4ec0ca] shadow-[0_20px_60px_rgba(0,0,0,0.55)] max-w-full touch-none cursor-pointer"
          style={{ touchAction: "none" }}
        />

        {/* Backdrop is click-through so canvas taps still register; only the
            button captures the pointer. */}
        {phase === "ready" && (
          <Overlay>
            <div className="text-3xl">🐤</div>
            <p className="text-lg font-semibold text-white">{game.title.en}</p>
            <p className="text-xs text-white/70 max-w-[16rem]">
              {t("game.gameStartHint")}
            </p>
            <button onClick={handleTap} className={primaryBtn}>
              {t("game.start")}
            </button>
            <p className="text-[11px] text-white/45 font-mono">
              Tap / click · Space · ↑ · W
            </p>
          </Overlay>
        )}
        {phase === "over" && (
          <Overlay>
            <div className="text-3xl">💥</div>
            <p className="text-lg font-semibold text-white">{t("game.over")}</p>
            <p className="text-sm font-mono text-white/60">
              {t("game.score")}: <span className="text-white">{score}</span>
              {" · "}
              {t("game.best")}:{" "}
              <span className="text-white">{Math.max(best, score)}</span>
            </p>
            {score > best && score > 0 && (
              <p className="text-xs font-medium text-amber-300">
                {t("game.newBest")}
              </p>
            )}
            <button onClick={handleTap} className={primaryBtn}>
              {t("game.restart")}
            </button>
          </Overlay>
        )}
      </div>

      {/* Big tap target for mobile — mirrors a screen tap. */}
      <div className="mt-6 flex justify-center sm:hidden">
        <button
          onPointerDown={onPointerDown}
          className="h-14 w-48 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-white/85 text-sm font-medium active:scale-95 transition-all select-none"
          aria-label="Flap"
        >
          FLAP
        </button>
      </div>

      <p className="mt-6 text-center text-[11px] text-white/40 font-mono px-4 max-w-[640px] mx-auto">
        Clean-room tribute — original art &amp; code. Physics ported from{" "}
        <a
          href="https://github.com/aaarafat/JS-Flappy-Bird"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-300 hover:underline"
        >
          aaarafat/JS-Flappy-Bird
        </a>
        .
      </p>
    </GameShell>
  );
}

// ---------------------------- Factories ----------------------------

function makeBird(): Bird {
  return { y: VIEW_H * 0.42, vy: 0, rot: 0 };
}

function makePipe(): Pipe {
  const min = GAP_MARGIN;
  const max = GROUND_Y - PIPE_GAP - GAP_MARGIN;
  const gapY = min + Math.random() * (max - min);
  return { x: VIEW_W + 20, gapY, scored: false };
}

// ---------------------------- Render helpers ----------------------------

function drawSky(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, "#4ec0ca");
  sky.addColorStop(0.7, "#5fd0d8");
  sky.addColorStop(1, "#9be7d8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawClouds(ctx: CanvasRenderingContext2D, frames: number) {
  const off = (frames * 0.3) % (VIEW_W + 120);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 180 - off) % (VIEW_W + 120) + VIEW_W + 120) % (VIEW_W + 120) - 60;
    const cy = 90 + (i % 2) * 70;
    puff(ctx, cx, cy, 26);
  }
}

function puff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r, y + 6, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x - r, y + 6, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipe(ctx: CanvasRenderingContext2D, p: Pipe) {
  const topH = p.gapY;
  const botY = p.gapY + PIPE_GAP;
  const botH = GROUND_Y - botY;
  const lip = 16;

  const body = "#5bbf3a";
  const bodyDark = "#3f9a25";
  const edge = "#2f6f1b";

  // Top pipe.
  pipeBody(ctx, p.x, 0, PIPE_W, topH, body, bodyDark, edge);
  pipeLip(ctx, p.x - 3, topH - lip, PIPE_W + 6, lip, body, bodyDark, edge);

  // Bottom pipe.
  pipeBody(ctx, p.x, botY, PIPE_W, botH, body, bodyDark, edge);
  pipeLip(ctx, p.x - 3, botY, PIPE_W + 6, lip, body, bodyDark, edge);
}

function pipeBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  body: string, dark: string, edge: string,
) {
  if (h <= 0) return;
  ctx.fillStyle = body;
  ctx.fillRect(x, y, w, h);
  // shading
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + 4, y, 6, h);
  ctx.fillStyle = dark;
  ctx.fillRect(x + w - 12, y, 8, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y, w - 2, h);
}

function pipeLip(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  body: string, dark: string, edge: string,
) {
  ctx.fillStyle = body;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(x + 4, y, 6, h);
  ctx.fillStyle = dark;
  ctx.fillRect(x + w - 12, y, 8, h);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function drawGround(ctx: CanvasRenderingContext2D, scrollX: number) {
  // Dirt base.
  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, GROUND_Y, VIEW_W, GROUND_H);
  // Grass strip.
  ctx.fillStyle = "#73c043";
  ctx.fillRect(0, GROUND_Y, VIEW_W, 14);
  ctx.fillStyle = "#5fa835";
  ctx.fillRect(0, GROUND_Y + 12, VIEW_W, 4);
  // Diagonal dirt stripes that scroll.
  ctx.fillStyle = "#cabd72";
  for (let x = scrollX - 24; x < VIEW_W + 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 18);
    ctx.lineTo(x + 12, GROUND_Y + 18);
    ctx.lineTo(x, GROUND_H + GROUND_Y);
    ctx.lineTo(x - 12, GROUND_H + GROUND_Y);
    ctx.fill();
  }
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: Bird,
  frames: number,
  phase: Phase,
) {
  ctx.save();
  ctx.translate(BIRD_X, bird.y);
  ctx.rotate((bird.rot * Math.PI) / 180);

  const w = BIRD_DRAW_W;
  const h = BIRD_DRAW_H;

  // Wing flap cycle (faster while playing).
  const wingPhase = phase === "play" ? frames / 4 : frames / 9;
  const wingY = Math.sin(wingPhase) * 4;

  // Body.
  ctx.fillStyle = "#ffd64a";
  roundRect(ctx, -w / 2, -h / 2, w, h, 9);
  ctx.fill();
  // Belly highlight.
  ctx.fillStyle = "#fff0a8";
  roundRect(ctx, -w / 2 + 3, -h / 2 + 8, w - 10, h - 12, 7);
  ctx.fill();

  // Wing.
  ctx.fillStyle = "#f5b324";
  roundRect(ctx, -w / 2 + 2, -2 + wingY, 15, 9, 4);
  ctx.fill();

  // Eye.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(w / 2 - 8, -h / 2 + 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(w / 2 - 6, -h / 2 + 8, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Beak.
  ctx.fillStyle = "#fb923c";
  ctx.beginPath();
  ctx.moveTo(w / 2 - 2, -2);
  ctx.lineTo(w / 2 + 9, 1);
  ctx.lineTo(w / 2 - 2, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBigScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.save();
  ctx.font = "bold 44px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.fillStyle = "#ffffff";
  const s = String(score);
  ctx.strokeText(s, VIEW_W / 2, 64);
  ctx.fillText(s, VIEW_W / 2, 64);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ---------------------------- UI bits ----------------------------

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-[2px] bg-black/40 flex flex-col items-center justify-center gap-3 px-6 text-center [&_button]:pointer-events-auto">
      {children}
    </div>
  );
}

const primaryBtn =
  "mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-white text-black px-5 text-sm font-medium hover:bg-white/90 transition-colors";
