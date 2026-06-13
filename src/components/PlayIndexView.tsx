"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";
import { games } from "@/lib/games";
import { useLang, useT } from "@/lib/i18n";

export function PlayIndexView() {
  const t = useT();
  const { lang } = useLang();

  // Read each game's best score from localStorage *after* mount to avoid
  // hydration mismatch.
  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(games.map((g) => [g.slug, null])),
  );

  useEffect(() => {
    const next: Record<string, number | null> = {};
    for (const g of games) {
      try {
        const raw = localStorage.getItem(g.highScoreKey);
        next[g.slug] = raw != null ? Number(raw) : null;
      } catch {
        next[g.slug] = null;
      }
    }
    setScores(next);
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 pt-20 sm:pt-28 pb-24">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/80 font-mono inline-flex items-center gap-2">
          <Gamepad2 className="h-3.5 w-3.5" />
          {t("play.eyebrow")}
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
          {t("play.title")}
        </h1>
        <p className="mt-4 text-white/65 leading-relaxed max-w-xl">
          {t("play.description")}
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <motion.div
              key={g.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                href={`/play/${g.slug}`}
                className="group block glass rounded-2xl p-5 sm:p-6 h-full transition-colors"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${g.accent} text-3xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]`}
                >
                  {g.emoji}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors">
                  {g.title[lang]}
                </h2>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  {g.blurb[lang]}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/45">
                    {t("play.bestLocal")}:{" "}
                    <span className="font-mono text-white/70">
                      {scores[g.slug] != null
                        ? `${scores[g.slug]} ${g.highScoreLabel[lang]}`
                        : t("play.notPlayedYet")}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-cyan-300 group-hover:text-cyan-200 font-medium">
                    {t("play.cta")}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
