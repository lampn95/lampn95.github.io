"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { stories } from "@/lib/stories";
import { CoffeeButton } from "@/components/CoffeeButton";
import { useLang, useT } from "@/lib/i18n";

export function StoriesListView() {
  const t = useT();
  const { lang } = useLang();
  const dateLocale = lang === "en" ? "en-US" : "vi-VN";

  const sorted = [...stories].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-20 sm:pt-28 pb-24">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/80 font-mono">
          {t("storiesList.eyebrow")}
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
          {t("storiesList.title")}
        </h1>
        <p className="mt-4 text-white/65 leading-relaxed max-w-xl">
          {t("storiesList.description")}
        </p>

        <div className="mt-12 space-y-5">
          {sorted.map((s) => (
            <Link
              key={s.slug}
              href={`/stories/${s.slug}`}
              className="group block glass rounded-2xl p-5 sm:p-6 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                <BookOpen className="h-3 w-3" />
                <span>{new Date(s.date).toLocaleDateString(dateLocale)}</span>
                <span>·</span>
                <span>{s.readingTime}</span>
                <span>·</span>
                <span className="flex flex-wrap gap-1.5">
                  {s.tags.map((tag) => (
                    <span key={tag} className="text-cyan-300/80">
                      #{tag}
                    </span>
                  ))}
                </span>
                {lang === "en" && (
                  <span className="ml-auto rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
                    {t("storiesList.viNote")}
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                {s.title}
              </h2>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{s.excerpt}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-cyan-300 group-hover:text-cyan-200">
                {t("storiesList.read")}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-6 text-center">
          <p className="text-sm text-white/70">{t("storiesList.coffeeNote")}</p>
          <div className="mt-4 flex justify-center">
            <CoffeeButton />
          </div>
        </div>
      </div>
    </div>
  );
}
