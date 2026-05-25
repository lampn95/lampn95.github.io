"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { CoffeeButton } from "./CoffeeButton";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

const navStoriesKey: TranslationKey = "nav.stories";

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 text-black font-bold text-sm">
              L
            </span>
            <span className="font-semibold text-white">{siteConfig.name}</span>
          </div>
          <p className="mt-3 text-sm text-white/50 max-w-md">
            {t("footer.tagline")}
            <a
              href={siteConfig.socials.engineerpro}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-cyan-200"
            >
              EngineerPro
            </a>
            {t("footer.taglineTail")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-3 text-sm">
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-white/60 hover:text-white"
            >
              {siteConfig.email}
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/stories" className="text-white/60 hover:text-white">
              {t(navStoriesKey)}
            </Link>
            <span className="text-white/20">·</span>
            <a
              href={siteConfig.socials.engineerpro}
              target="_blank"
              rel="noreferrer"
              className="text-white/60 hover:text-white"
            >
              EngineerPro
            </a>
          </div>
          <CoffeeButton />
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-5 text-xs text-white/40 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Lam Pham. {t("footer.copyright")}</span>
          <span className="font-mono">v1.0</span>
        </div>
      </div>
    </footer>
  );
}
