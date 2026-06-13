"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { GameShell, ScoreBar, useBestScore } from "./GameShell";

const W = 380;
const H = 520;
const GAME_MS = 60_000;
const MAX_LIVES = 3;
const MAX_ACTIVE_WORDS = 6;

// Pool of tech / stack tokens. Kept short-ish (≤12 chars) so they're typeable
// in a falling timeframe. The game converts everything to lowercase for matching
// but displays original case.
const POOL = [
  "react", "vue", "svelte", "next", "remix", "astro",
  "go", "rust", "python", "java", "kotlin", "swift", "ruby",
  "typescript", "node", "deno", "bun",
  "docker", "kubernetes", "redis", "kafka", "postgres", "mongodb", "sqlite",
  "github", "gitlab", "vercel", "cloudflare", "aws", "linux", "vim",
  "tailwind", "prisma", "graphql", "grpc", "json", "yaml",
];

type Falling = {
  id: number;
  word: string;       // lowercase
  display: string;    // original case (for showing)
  typed: number;      // how many chars matched so far
  x: number;
  y: number;
  vy: number;
};

let __nextId = 1;

export function TypeTheStackGame() {
  const game = games.find((g) => g.slug === "type-the-stack")!;
  const t = useT();
  const [best, submitBest] = useBestScore(game.highScoreKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<Falling[]>([]);
  const activeIdRef = useRef<number | null>(null); // currently locked word id
  const lastSpawnRef = useRef(0);
  const lastTickRef = useRef(0);
  const startTsRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const [activeWordDisplay, setActiveWordDisplay] = useState<{
    display: string;
    typed: number;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState<null | "lives" | "time">(null);

  const reset = useCallback(() => {
    wordsRef.current = [];
    activeIdRef.current = null;
    lastSpawnRef.current = 0;
    lastTickRef.current = 0;
    startTsRef.current = 0;
    __nextId = 1;
    setScore(0);
    setLives(MAX_LIVES);
    setTimeLeft(GAME_MS);
    setActiveWordDisplay(null);
    setOver(null);
  }, []);

  const handleStart = useCallback(() => {
    reset();
    setRunning(true);
  }, [reset]);

  // Score / submitBest in a ref so the rAF loop never reads stale values.
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  const endGame = useCallback(
    (reason: "lives" | "time") => {
      setRunning(false);
      setOver(reason);
      submitBest(scoreRef.current);
    },
    [submitBest],
  );

  const tick = useCallback(
    (now: number) => {
      if (!startTsRef.current) startTsRef.current = now;
      const elapsed = now - startTsRef.current;
      const remaining = Math.max(0, GAME_MS - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        endGame("time");
        return false;
      }

      const dt = lastTickRef.current ? Math.min(33, now - lastTickRef.current) : 16;
      lastTickRef.current = now;

      // Spawn cadence: 2000ms → 900ms over the run.
      const spawnEvery = 2000 - Math.min(1100, elapsed / 55);
      if (
        now - lastSpawnRef.current > spawnEvery &&
        wordsRef.current.length < MAX_ACTIVE_WORDS
      ) {
        wordsRef.current.push(spawnWord(wordsRef.current));
        lastSpawnRef.current = now;
      }

      // Move + check off-screen
      const fall = 0.05 + Math.min(0.06, elapsed / 600_000); // px / ms
      let livesLost = 0;
      wordsRef.current = wordsRef.current.filter((w) => {
        w.y += w.vy * fall * dt * 2;
        if (w.y > H - 30) {
          // Crossed bottom
          if (w.id === activeIdRef.current) activeIdRef.current = null;
          livesLost += 1;
          return false;
        }
        return true;
      });

      if (livesLost > 0) {
        const newLives = livesRef.current - livesLost;
        livesRef.current = newLives;
        setLives(newLives);
        if (newLives <= 0) {
          endGame("lives");
          return false;
        }
      }

      // Sync active-word display from the locked word
      const activeId = activeIdRef.current;
      if (activeId == null) {
        setActiveWordDisplay(null);
      } else {
        const w = wordsRef.current.find((x) => x.id === activeId);
        if (!w) {
          activeIdRef.current = null;
          setActiveWordDisplay(null);
        } else {
          setActiveWordDisplay((cur) =>
            cur && cur.display === w.display && cur.typed === w.typed
              ? cur
              : { display: w.display, typed: w.typed },
          );
        }
      }

      draw(canvasRef.current, wordsRef.current, activeIdRef.current);
      return true;
    },
    [endGame],
  );

  // rAF loop
  useEffect(() => {
    if (!running) {
      draw(canvasRef.current, wordsRef.current, activeIdRef.current);
      return;
    }
    const loop = (now: number) => {
      const cont = tick(now);
      if (cont !== false) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, tick]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === " " || k === "Enter") {
        if (over) {
          e.preventDefault();
          handleStart();
        } else if (!running) {
          e.preventDefault();
          handleStart();
        }
        return;
      }
      if (!running) return;
      // Only single printable letters
      if (k.length !== 1) return;
      const ch = k.toLowerCase();
      if (ch < "a" || ch > "z") return;

      e.preventDefault();
      const words = wordsRef.current;

      // If a word is locked: must match its next char, else unlock + treat as miss.
      const activeId = activeIdRef.current;
      if (activeId != null) {
        const w = words.find((x) => x.id === activeId);
        if (w && w.word[w.typed] === ch) {
          w.typed += 1;
          if (w.typed >= w.word.length) {
            // Completed!
            wordsRef.current = words.filter((x) => x.id !== w.id);
            activeIdRef.current = null;
            setScore((s) => {
              const next = s + 1;
              scoreRef.current = next;
              return next;
            });
          }
          return;
        }
        // Mistype on locked word: reset its progress and unlock.
        if (w) w.typed = 0;
        activeIdRef.current = null;
        return;
      }

      // No locked word: find a word whose first char matches.
      const candidate = words.find((x) => x.word[0] === ch);
      if (candidate) {
        candidate.typed = 1;
        activeIdRef.current = candidate.id;
        if (candidate.word.length === 1) {
          wordsRef.current = words.filter((x) => x.id !== candidate.id);
          activeIdRef.current = null;
          setScore((s) => {
            const next = s + 1;
            scoreRef.current = next;
            return next;
          });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, over, handleStart]);

  useEffect(() => {
    draw(canvasRef.current, wordsRef.current, activeIdRef.current);
  }, []);

  const isNewBest = over != null && score > 0 && score >= best;

  return (
    <GameShell game={game}>
      <ScoreBar
        score={score}
        best={best}
        scoreLabel={t("game.score")}
        bestLabel={t("game.best")}
        extra={
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-mono flex items-center gap-3">
            <span>
              <span className="text-white/45">{t("game.time")}: </span>
              <span
                className={
                  timeLeft <= 10_000
                    ? "text-rose-300 font-semibold"
                    : "text-white font-semibold"
                }
              >
                {Math.ceil(timeLeft / 1000)}s
              </span>
            </span>
            <span aria-label="lives">
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < lives ? "text-rose-300" : "text-white/15"
                  }
                  aria-hidden
                >
                  ♥
                </span>
              ))}
            </span>
          </div>
        }
      />

      <div className="relative mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.55)] max-w-full"
        />

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
            <div className="text-2xl">{over === "lives" ? "💥" : "⏰"}</div>
            <p className="text-lg font-semibold text-white">
              {over === "lives" ? t("type.gameOver") : t("type.timeUp")}
            </p>
            <p className="text-sm text-white/65">
              {over === "lives" ? t("type.gameOverHint") : t("type.timeUpHint")}
            </p>
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

      {/* Active typing line — gives instant visual feedback for what you're hitting */}
      <div className="mt-4 min-h-[1.5rem] text-center font-mono text-base">
        {activeWordDisplay ? (
          <>
            <span className="text-white/45 text-xs mr-2">{t("type.activeWord")}:</span>
            <span className="text-emerald-300">
              {activeWordDisplay.display.slice(0, activeWordDisplay.typed)}
            </span>
            <span className="text-white">
              {activeWordDisplay.display.slice(activeWordDisplay.typed)}
            </span>
          </>
        ) : (
          <span className="text-white/35 text-xs italic">
            {running ? t("type.nothingActive") : "\u00A0"}
          </span>
        )}
      </div>
    </GameShell>
  );
}

function spawnWord(active: Falling[]): Falling {
  // Avoid spawning a word that conflicts with an already-typed prefix of an
  // active word (so the player isn't stuck choosing between two words).
  const activeChars = new Set(
    active.filter((a) => a.typed > 0).map((a) => a.word[0]),
  );
  // Try up to 8 picks, otherwise fall back to any.
  let chosen = POOL[Math.floor(Math.random() * POOL.length)];
  for (let attempt = 0; attempt < 8; attempt++) {
    const w = POOL[Math.floor(Math.random() * POOL.length)];
    if (!activeChars.has(w[0]) && !active.some((a) => a.word === w)) {
      chosen = w;
      break;
    }
  }
  return {
    id: __nextId++,
    word: chosen,
    display: chosen,
    typed: 0,
    x: 20 + Math.random() * (W - 40 - chosen.length * 7),
    y: -10,
    vy: 0.7 + Math.random() * 0.4,
  };
}

function draw(
  canvas: HTMLCanvasElement | null,
  words: Falling[],
  activeId: number | null,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // bg
  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // floor line — visualises the "danger zone"
  const floorY = canvas.height - 24;
  ctx.fillStyle = "rgba(244,63,94,0.10)";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
  ctx.strokeStyle = "rgba(244,63,94,0.40)";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvas.width, floorY);
  ctx.stroke();
  ctx.setLineDash([]);

  // words
  ctx.font = "600 16px ui-monospace, SFMono-Regular, monospace";
  ctx.textBaseline = "middle";
  for (const w of words) {
    const isActive = w.id === activeId;
    const x = w.x;
    const y = w.y;

    // background pill
    ctx.font = "600 16px ui-monospace, SFMono-Regular, monospace";
    const m = ctx.measureText(w.display);
    const padX = 8;
    const padY = 5;
    ctx.fillStyle = isActive
      ? "rgba(124,242,255,0.15)"
      : "rgba(255,255,255,0.05)";
    roundRect(
      ctx,
      x - padX,
      y - 11 - padY,
      m.width + padX * 2,
      22 + padY * 2,
      6,
    );
    ctx.fill();
    if (isActive) {
      ctx.strokeStyle = "rgba(124,242,255,0.5)";
      ctx.lineWidth = 1;
      roundRect(
        ctx,
        x - padX,
        y - 11 - padY,
        m.width + padX * 2,
        22 + padY * 2,
        6,
      );
      ctx.stroke();
    }

    // text: typed prefix in emerald, rest in white
    const typedStr = w.display.slice(0, w.typed);
    const restStr = w.display.slice(w.typed);
    const typedW = ctx.measureText(typedStr).width;

    ctx.textAlign = "left";
    if (typedStr) {
      ctx.fillStyle = "#6ee7b7"; // emerald-300
      ctx.fillText(typedStr, x, y);
    }
    ctx.fillStyle = "#f3f4f6";
    ctx.fillText(restStr, x + typedW, y);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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
