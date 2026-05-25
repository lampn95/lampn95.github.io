"use client";

import Link from "next/link";
import { ArrowLeft, Coffee, ExternalLink, Heart } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { useT } from "@/lib/i18n";

export function CoffeePageView() {
  const t = useT();

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-16 sm:pt-20 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("coffeePage.back")}
        </Link>

        <div className="mt-8 text-center">
          <div className="float-slow inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-black shadow-[0_8px_40px_rgba(255,184,107,0.45)]">
            <Coffee className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            {t("coffeePage.title")}
          </h1>
          <p className="mt-3 text-white/65 leading-relaxed max-w-xl mx-auto">
            {t("coffeePage.description")}
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-500/[0.06] via-orange-400/[0.04] to-rose-400/[0.05] p-3 sm:p-5">
          <div className="overflow-hidden rounded-2xl bg-white/[0.02] border border-white/10">
            <iframe
              title="QR banking VN — Buy me a coffee"
              src={siteConfig.coffeeDriveEmbed}
              className="block w-full"
              style={{ height: "min(78vh, 680px)" }}
              allow="autoplay"
              loading="lazy"
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2">
            <p className="text-xs text-white/55 leading-relaxed">
              {t("coffeePage.scanHint")}
            </p>
            <a
              href={siteConfig.coffeeDriveView}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/[0.08] px-4 h-9 text-xs font-medium text-white hover:bg-amber-300/[0.18] hover:border-amber-300/60 transition-colors"
            >
              {t("coffeePage.openDrive")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-white/55">
          <p className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-300" />
            {t("coffeePage.thanks")}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-between text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("coffeePage.back")}
          </Link>
          <Link
            href="/stories/"
            className="text-white/60 hover:text-white transition-colors"
          >
            {t("coffeePage.readStories")}
          </Link>
        </div>
      </div>
    </div>
  );
}
