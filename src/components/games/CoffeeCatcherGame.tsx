"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { games } from "@/lib/games";
import { useT } from "@/lib/i18n";
import { GameShell, useBestScore, ScoreBar } from "./GameShell";

const W = 380;        // canvas width
const H = 520;        // canvas height
const BASKET_W = 70;
const BASKET_H = 18;
const BASKET_Y = H - 50;
const GAME_MS = 60_000;

type Falling = {
  x: number;
  y: number;
  vy: number;
  kind: "coffee" | "boba" | "premium" | "bug" | "warn";
};

const KINDS: Array<{
  kind: Falling["kind"];
  emoji: string;
  weight: number; // spawn probability
  points: number;
}> = [
  { kind: "coffee",  emoji: "☕", weight: 60, points: 1 },
  { kind: "boba",    emoji: "🥤", weight: 18, points: 1 },
  { kind: "premium", emoji: "🌟", weight: 4,  points: 5 },
  { kind: "bug",     emoji: "🐛", weight: 13, points: -2 },
  { kind: "warn",    emoji: "⚠️", weight: 5,  points: -1 },
];

const EMOJI_OF: Record<Falling["kind"], string> = Object.fromEntries(
  KINDS.map((k) => [k.kind, k.emoji]),
) as Record<Falling["kind"], string>;

const POINTS_OF: Record<Falling["kind"], number> = Object.fromEntries(
  KINDS.map((k) => [k.kind, k.points]),
) as Record<Falling["kind"], number>;

export function CoffeeCatcherGame() {
  const game = games.find((g) => g.slug === "coffee-catcher")!;
  const t = useT();
  const [best, submitBest] = useBestScore(game.highScoreKey);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const basketXRef = useRef(W / 2 - BASKET_W / 2);
  const itemsRef = useRef<Falling[]>([]);
  const lastSpawnRef = useRef(0);
  const lastTickRef = useRef(0);
  const startTsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pressedRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);

  const reset = useCallback(() => {
    basketXRef.current = W / 2 - BASKET_W / 2;
    itemsRef.current = [];
    lastSpawnRef.current = 0;
    lastTickRef.current = 0;
    startTsRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_MS);
    setOver(false);
  }, []);

  // One frame.
  const tick = useCallback((now: number) => {
    if (!startTsRef.current) startTsRef.current = now;
    const elapsed = now - startTsRef.current;
    const remaining = Math.max(0, GAME_MS - elapsed);
    setTimeLeft(remaining);

    if (remaining <= 0) {
      setRunning(false);
      setOver(true);
      submitBest(score);
      return false;
    }

    const dt = lastTickRef.current ? Math.min(33, now - lastTickRef.current) : 16;
    lastTickRef.current = now;

    // Basket movement from held keys
    const speed = 0.32; // px / ms
    if (pressedRef.current.left)  basketXRef.current -= speed * dt;
    if (pressedRef.current.right) basketXRef.current += speed * dt;
    basketXRef.current = Math.max(0, Math.min(W - BASKET_W, basketXRef.current));

    // Spawn
    const spawnEvery = 600 - Math.min(300, elapsed / 200); // gradually faster
    if (now - lastSpawnRef.current > spawnEvery) {
      itemsRef.current.push(spawnItem());
      lastSpawnRef.current = now;
    }

    // Update falling items
    const baseFall = 0.18 + Math.min(0.18, elapsed / 200_000);
    for (const it of itemsRef.current) {
      it.y += it.vy * dt * baseFall * 2; // tune
    }

    // Collide with basket / floor
    const bx = basketXRef.current;
    let scoreDelta = 0;
    const next: Falling[] = [];
    for (const it of itemsRef.current) {
      if (it.y >= BASKET_Y - 6 && it.y <= BASKET_Y + BASKET_H + 6) {
        if (it.x >= bx - 10 && it.x <= bx + BASKET_W + 10) {
          scoreDelta += POINTS_OF[it.kind];
          continue;
        }
      }
      if (it.y > H + 20) continue; // off-screen, drop it
      next.push(it);
    }
    itemsRef.current = next;
    if (scoreDelta !== 0) {
      // Functional update so we don't capture a stale `score`.
      setScore((s) => Math.max(0, s + scoreDelta));
    }

    // Draw
    draw(canvasRef.current, itemsRef.current, basketXRef.current);

    return true;
  }, [score, submitBest]);

  // rAF loop
  useEffect(() => {
    if (!running) {
      draw(canvasRef.current, itemsRef.current, basketXRef.current);
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
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") {
        pressedRef.current.left = true;
        e.preventDefault();
      }
      if (k === "arrowright" || k === "d") {
        pressedRef.current.right = true;
        e.preventDefault();
      }
      if (k === " " || k === "enter") {
        if (over) handleStart();
        else if (!running) handleStart();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") pressedRef.current.left = false;
      if (k === "arrowright" || k === "d") pressedRef.current.right = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, over]);

  // Touch / pointer: drag = move basket directly under finger.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const x = (clientX - rect.left) * scale - BASKET_W / 2;
      basketXRef.current = Math.max(0, Math.min(W - BASKET_W, x));
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) move(e.touches[0].clientX);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (!running && !over) handleStart();
      if (e.touches[0]) move(e.touches[0].clientX);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, over]);

  // Initial frame
  useEffect(() => {
    draw(canvasRef.current, itemsRef.current, basketXRef.current);
  }, []);

  function handleStart() {
    reset();
    setRunning(true);
  }

  const isNewBest = over && score > 0 && score >= best;
  const secsLeft = Math.ceil(timeLeft / 1000);

  return (
    <GameShell game={game}>
      <ScoreBar
        score={score}
        best={best}
        scoreLabel={t("game.score")}
        bestLabel={t("game.best")}
        extra={
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-mono">
            <span className="text-white/45">{t("game.time")}: </span>
            <span
              className={
                secsLeft <= 10 ? "text-rose-300 font-semibold" : "text-white font-semibold"
              }
            >
              {secsLeft}s
            </span>
          </div>
        }
      />

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
        {over && (
          <Overlay>
            <div className="text-2xl">⏰</div>
            <p className="text-lg font-semibold text-white">{t("coffee.timeUp")}</p>
            <p className="text-sm text-white/65">{t("coffee.timeUpHint")}</p>
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

      <p className="mt-4 text-center text-xs text-white/40 font-mono">
        ☕ +1 · 🥤 +1 · 🌟 +5 · 🐛 −2 · ⚠️ −1
      </p>
    </GameShell>
  );
}

function draw(canvas: HTMLCanvasElement | null, items: Falling[], basketX: number) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // bg
  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // soft column light hints
  ctx.fillStyle = "rgba(255,184,107,0.04)";
  ctx.fillRect(basketX - 4, 0, BASKET_W + 8, canvas.height);

  // items
  ctx.font = "24px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const it of items) {
    ctx.fillText(EMOJI_OF[it.kind], it.x, it.y);
  }

  // basket
  const g = ctx.createLinearGradient(basketX, BASKET_Y, basketX + BASKET_W, BASKET_Y);
  g.addColorStop(0, "#fcd34d");
  g.addColorStop(1, "#fb923c");
  ctx.fillStyle = g;
  roundRect(ctx, basketX, BASKET_Y, BASKET_W, BASKET_H, 9);
  ctx.fill();
  // basket emoji inside
  ctx.font = "16px serif";
  ctx.fillStyle = "#000";
  ctx.fillText("🧺", basketX + BASKET_W / 2, BASKET_Y + BASKET_H / 2 + 1);
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

function spawnItem(): Falling {
  const total = KINDS.reduce((s, k) => s + k.weight, 0);
  let pick = Math.random() * total;
  let chosen = KINDS[0];
  for (const k of KINDS) {
    pick -= k.weight;
    if (pick <= 0) {
      chosen = k;
      break;
    }
  }
  return {
    x: 20 + Math.random() * (W - 40),
    y: -20,
    vy: 0.18 + Math.random() * 0.1,
    kind: chosen.kind,
  };
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
