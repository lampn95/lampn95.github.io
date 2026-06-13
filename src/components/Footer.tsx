"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { CoffeeButton } from "./CoffeeButton";
import { GithubIcon, LinkedInIcon } from "./SocialIcons";
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
          <div className="flex items-center gap-2">
            <SocialIconLink
              href={siteConfig.socials.github}
              label="GitHub"
              icon={<GithubIcon className="h-4 w-4" />}
            />
            <SocialIconLink
              href={siteConfig.socials.linkedin}
              label="LinkedIn"
              icon={<LinkedInIcon className="h-4 w-4" />}
            />
            <SocialIconLink
              href={`mailto:${siteConfig.email}`}
              label="Email"
              external={false}
              icon={<Mail className="h-4 w-4" />}
            />
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

function SocialIconLink({
  href,
  label,
  icon,
  external = true,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.07] transition-colors"
    >
      {icon}
    </a>
  );
}
