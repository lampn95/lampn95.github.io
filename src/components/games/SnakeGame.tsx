"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { GameShell, ScoreBar, useBestScore } from "./GameShell";

const GRID = 20;          // 20 x 20 cells
const CELL = 22;          // pixel size of each cell (canvas = 440px)
const TICK_MS_START = 140;
const TICK_MS_FLOOR = 60; // speed cap

type Vec = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

const DIR_VEC: Record<Dir, Vec> = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function SnakeGame() {
  const game = games.find((g) => g.slug === "snake")!;
  const t = useT();
  const [best, submitBest] = useBestScore(game.highScoreKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable game state — kept in refs so the render loop doesn't tear.
  const snakeRef = useRef<Vec[]>([]);
  const dirRef   = useRef<Dir>("right");
  const queuedDirRef = useRef<Dir | null>(null);
  const bugRef   = useRef<Vec>({ x: 10, y: 10 });
  const tickRef  = useRef(TICK_MS_START);
  const lastStepRef = useRef(0);
  const rafRef   = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const reset = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = "right";
    queuedDirRef.current = null;
    bugRef.current = spawnBug(snakeRef.current);
    tickRef.current = TICK_MS_START;
    lastStepRef.current = 0;
    setScore(0);
    setOver(false);
  }, []);

  // Draw a single frame.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, GRID * CELL);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(GRID * CELL, i * CELL);
      ctx.stroke();
    }

    // Bug (emoji)
    ctx.font = `${CELL - 4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "🐛",
      bugRef.current.x * CELL + CELL / 2,
      bugRef.current.y * CELL + CELL / 2,
    );

    // Snake
    const snake = snakeRef.current;
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const t = i / Math.max(1, snake.length - 1);
      // Head gradient: cyan → green tail
      const r = Math.round(124 + (110 - 124) * t);
      const g = Math.round(242 + (242 - 242) * t);
      const b = Math.round(255 + (110 - 255) * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const pad = i === 0 ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
      );
    }
  }, []);

  // One simulation step (called from rAF).
  const step = useCallback(() => {
    // Apply queued direction (one direction-change per step max).
    if (queuedDirRef.current) {
      const queued = queuedDirRef.current;
      if (queued !== OPPOSITE[dirRef.current]) {
        dirRef.current = queued;
      }
      queuedDirRef.current = null;
    }

    const v = DIR_VEC[dirRef.current];
    const head = snakeRef.current[0];
    const next: Vec = { x: head.x + v.x, y: head.y + v.y };

    // Wall collision = game over.
    if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
      setRunning(false);
      setOver(true);
      submitBest(score);
      return;
    }
    // Self collision (skip tail — it'll move away).
    for (let i = 0; i < snakeRef.current.length - 1; i++) {
      const seg = snakeRef.current[i];
      if (seg.x === next.x && seg.y === next.y) {
        setRunning(false);
        setOver(true);
        submitBest(score);
        return;
      }
    }

    const ateBug = next.x === bugRef.current.x && next.y === bugRef.current.y;
    snakeRef.current.unshift(next);
    if (ateBug) {
      // Don't pop tail — snake grows.
      bugRef.current = spawnBug(snakeRef.current);
      setScore((s) => s + 1);
      // Speed up gradually
      tickRef.current = Math.max(TICK_MS_FLOOR, tickRef.current - 3);
    } else {
      snakeRef.current.pop();
    }
  }, [score, submitBest]);

  // Animation loop
  useEffect(() => {
    if (!running) {
      // Still draw once so canvas isn't blank when paused / before start.
      draw();
      return;
    }
    const tick = (now: number) => {
      if (!lastStepRef.current) lastStepRef.current = now;
      if (now - lastStepRef.current >= tickRef.current) {
        step();
        lastStepRef.current = now;
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, step, draw]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      let d: Dir | null = null;
      if (k === "arrowup"    || k === "w") d = "up";
      if (k === "arrowdown"  || k === "s") d = "down";
      if (k === "arrowleft"  || k === "a") d = "left";
      if (k === "arrowright" || k === "d") d = "right";
      if (d) {
        e.preventDefault();
        if (!running && !over) {
          reset();
          setRunning(true);
        }
        queuedDirRef.current = d;
      }
      if (k === " " || k === "enter") {
        e.preventDefault();
        if (over) {
          reset();
          setRunning(true);
        } else {
          setRunning((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, over, reset]);

  // Touch swipe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0, startY = 0, hasStart = false;
    const onStart = (e: TouchEvent) => {
      const t0 = e.touches[0];
      startX = t0.clientX;
      startY = t0.clientY;
      hasStart = true;
    };
    const onEnd = (e: TouchEvent) => {
      if (!hasStart) return;
      hasStart = false;
      const t0 = e.changedTouches[0];
      const dx = t0.clientX - startX;
      const dy = t0.clientY - startY;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 20) return; // ignore tiny gestures
      let d: Dir;
      if (ax > ay) d = dx > 0 ? "right" : "left";
      else d = dy > 0 ? "down" : "up";
      if (!running && !over) {
        reset();
        setRunning(true);
      }
      queuedDirRef.current = d;
    };
    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [running, over, reset]);

  // Initial reset so canvas isn't blank.
  useEffect(() => {
    reset();
    draw();
  }, [reset, draw]);

  const handleStart = () => {
    reset();
    setRunning(true);
  };

  const isNewBest = over && score > 0 && score >= best;

  return (
    <GameShell game={game}>
      <ScoreBar
        score={score}
        best={best}
        scoreLabel={t("game.score")}
        bestLabel={t("game.best")}
      />

      <div className="relative mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={GRID * CELL}
          height={GRID * CELL}
          className="rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.55)] max-w-full touch-none"
          style={{ touchAction: "none" }}
        />

        {/* Overlays */}
        {!running && !over && (
          <Overlay>
            <p className="text-sm text-white/70">{t("game.gameStartHint")}</p>
            <button onClick={handleStart} className={primaryBtn}>
              {t("game.start")}
            </button>
          </Overlay>
        )}
        {over && (
          <Overlay>
            <div className="text-2xl">💥</div>
            <p className="text-lg font-semibold text-white">{t("snake.gameOver")}</p>
            <p className="text-sm text-white/65">{t("snake.gameOverHint")}</p>
            <p className="text-sm font-mono text-white/55">
              {t("game.score")}: <span className="text-white">{score}</span>
              {" · "}
              {t("game.best")}: <span className="text-white">{Math.max(best, score)}</span>
            </p>
            {isNewBest && (
              <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>
            )}
            <button onClick={handleStart} className={primaryBtn}>
              {t("game.restart")}
            </button>
          </Overlay>
        )}
      </div>

      <Dpad
        onPress={(d) => {
          if (!running && !over) {
            reset();
            setRunning(true);
          }
          queuedDirRef.current = d;
        }}
      />
    </GameShell>
  );
}

function spawnBug(snake: Vec[]): Vec {
  while (true) {
    const x = Math.floor(Math.random() * GRID);
    const y = Math.floor(Math.random() * GRID);
    if (snake.every((s) => s.x !== x || s.y !== y)) return { x, y };
  }
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 rounded-2xl backdrop-blur-sm bg-black/55 flex flex-col items-center justify-center gap-3 px-6 text-center">
      {children}
    </div>
  );
}

const primaryBtn =
  "mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-white text-black px-5 text-sm font-medium hover:bg-white/90 transition-colors";

function Dpad({ onPress }: { onPress: (d: Dir) => void }) {
  const btn =
    "h-12 w-12 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all text-lg";
  return (
    <div className="mt-6 grid grid-cols-3 gap-2 max-w-[200px] mx-auto sm:hidden">
      <div />
      <button className={btn} onClick={() => onPress("up")} aria-label="Up">▲</button>
      <div />
      <button className={btn} onClick={() => onPress("left")} aria-label="Left">◀</button>
      <button className={btn} onClick={() => onPress("down")} aria-label="Down">▼</button>
      <button className={btn} onClick={() => onPress("right")} aria-label="Right">▶</button>
    </div>
  );
}
