"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Game } from "@/lib/games";
import { useLang, useT } from "@/lib/i18n";

/**
 * Shared chrome for every game page: aurora bg, back link, title, controls
 * hint, and a slot for the actual game canvas/board.
 */
export function GameShell({
  game,
  children,
}: {
  game: Game;
  children: React.ReactNode;
}) {
  const t = useT();
  const { lang } = useLang();

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-16 sm:pt-20 pb-20">
        <Link
          href="/play"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("game.back")}
        </Link>

        <div className="mt-6 flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]`}
          >
            {game.emoji}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              {game.title[lang]}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-white/55 leading-relaxed">
              {game.controls[lang]}
            </p>
          </div>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

/**
 * Persist a high score in localStorage.
 *
 *   const [best, submit] = useBestScore("lampham-snake-best");
 *   submit(currentScore);            // saves only if higher
 *   const isNewBest = score > best;  // before calling submit
 */
export function useBestScore(
  key: string,
): readonly [number, (n: number) => void] {
  const [best, setBest] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setBest(Number(raw) || 0);
    } catch {
      /* ignore */
    }
  }, [key]);

  const submit = (n: number) => {
    setBest((prev) => {
      if (n <= prev) return prev;
      try {
        localStorage.setItem(key, String(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  };

  return [best, submit] as const;
}

/** Shared score / best / extra header for canvas games. */
export function ScoreBar({
  score,
  best,
  scoreLabel,
  bestLabel,
  extra,
}: {
  score: number;
  best: number;
  scoreLabel: string;
  bestLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm font-mono flex-wrap">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
        <span className="text-white/45">{scoreLabel}: </span>
        <span className="text-white font-semibold">{score}</span>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
        <span className="text-white/45">{bestLabel}: </span>
        <span className="text-white font-semibold">{best}</span>
      </div>
      {extra}
    </div>
  );
}
