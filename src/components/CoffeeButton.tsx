import Link from "next/link";
import { Coffee } from "lucide-react";
import { siteConfig } from "@/lib/config";

type Props = {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function CoffeeButton({ variant = "primary", size = "md", className = "" }: Props) {
  const sizeCls =
    size === "lg"
      ? "h-12 px-5 text-base"
      : size === "sm"
      ? "h-8 px-3 text-xs"
      : "h-10 px-4 text-sm";

  const base =
    "group relative inline-flex items-center gap-2 rounded-full font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-300 active:scale-[0.97] " +
    sizeCls;

  if (variant === "ghost") {
    return (
      <Link
        href={siteConfig.coffeeHref}
        className={`${base} text-white/90 border border-amber-300/30 bg-amber-300/5 hover:bg-amber-300/15 hover:border-amber-300/60 hover:text-white ${className}`}
        aria-label="Mời tác giả một ly cà phê"
      >
        <Coffee className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        <span>Buy me a coffee</span>
      </Link>
    );
  }

  return (
    <Link
      href={siteConfig.coffeeHref}
      className={`${base} text-black font-semibold bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 shadow-[0_8px_30px_rgba(255,184,107,0.35)] hover:shadow-[0_8px_40px_rgba(255,184,107,0.55)] hover:-translate-y-0.5 ${className}`}
      aria-label="Mời tác giả một ly cà phê"
    >
      <Coffee className="h-4 w-4 group-hover:rotate-12 transition-transform" />
      <span>Mời mình 1 ly cà phê</span>
      <span aria-hidden className="absolute inset-0 rounded-full overflow-hidden">
        <span className="absolute inset-0 shimmer rounded-full" />
      </span>
    </Link>
  );
}
