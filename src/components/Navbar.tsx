"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoffeeButton } from "./CoffeeButton";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/#engineerpro", label: "EngineerPro" },
  { href: "/#book", label: "Book" },
  { href: "/#podcast", label: "Podcast" },
  { href: "/stories", label: "Stories" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-black/40 border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-amber-300 text-black font-bold text-sm shadow-[0_0_24px_rgba(124,242,255,0.35)]">
            L
          </span>
          <span className="font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
            lampham<span className="text-cyan-300">.</span>dev
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CoffeeButton variant="ghost" />
        </div>
      </div>
    </header>
  );
}
