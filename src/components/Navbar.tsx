"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { CoffeeButton } from "./CoffeeButton";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

const links: Array<{ href: string; key: TranslationKey }> = [
  { href: "/#about",       key: "nav.about" },
  { href: "/#experience",  key: "nav.experience" },
  { href: "/#projects",    key: "nav.projects" },
  { href: "/#engineerpro", key: "nav.engineerpro" },
  { href: "/#book",        key: "nav.book" },
  { href: "/#podcast",     key: "nav.podcast" },
  { href: "/stories",      key: "nav.stories" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape and prevent body scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled || open
          ? "backdrop-blur-md bg-black/50 border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 text-black font-bold text-sm shadow-[0_0_24px_rgba(124,242,255,0.35)]">
            L
          </span>
          <span className="font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
            lampham<span className="text-cyan-300">.</span>dev
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <CoffeeButton variant="ghost" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/[0.03] text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`lg:hidden overflow-hidden border-t border-white/10 transition-[max-height,opacity] duration-300 ${
          open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-5 sm:px-8 py-4 flex flex-col gap-1 bg-black/60 backdrop-blur-md">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {t(l.key)}
            </Link>
          ))}
          <div className="mt-2 pt-3 border-t border-white/10 sm:hidden">
            <CoffeeButton variant="ghost" className="w-full justify-center" />
          </div>
        </nav>
      </div>
    </header>
  );
}
