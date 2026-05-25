"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { CoffeeButton } from "./CoffeeButton";
import { asset, siteConfig } from "@/lib/config";
import { useLang, useT } from "@/lib/i18n";

export function Hero() {
  const t = useT();
  const { lang } = useLang();

  // Description has inline links / spans that change per language.
  const description =
    lang === "en" ? (
      <>
        I&apos;m a Senior Software Engineer at{" "}
        <span className="text-white">NVIDIA</span>. Previously I had the chance
        to work at <span className="text-white">TikTok</span>,{" "}
        <span className="text-white">Grab</span>,{" "}
        <span className="text-white">Shopee</span>. With a few friends I
        co-founded{" "}
        <a
          href={siteConfig.socials.engineerpro}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4 decoration-cyan-300/40"
        >
          EngineerPro
        </a>
        {" "}— a small place where we share what we&apos;ve learned with folks
        on their way into the industry.
      </>
    ) : (
      <>
        Hiện tại mình làm Senior Software Engineer ở{" "}
        <span className="text-white">NVIDIA</span>, trước đây có dịp đi qua{" "}
        <span className="text-white">TikTok</span>,{" "}
        <span className="text-white">Grab</span>,{" "}
        <span className="text-white">Shopee</span>. Cùng anh em đồng sáng lập{" "}
        <a
          href={siteConfig.socials.engineerpro}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4 decoration-cyan-300/40"
        >
          EngineerPro
        </a>
        {" "}— một chỗ nhỏ để tụi mình chia sẻ lại những gì đã học, với các bạn
        đang trên đường vào ngành.
      </>
    );

  return (
    <section id="about" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute inset-0 bg-grid opacity-60" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-20 sm:pt-28 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
          {/* Text column */}
          <div className="order-last lg:order-first">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {t("hero.statusPill")}
              <span className="mx-1 text-white/30">·</span>
              <MapPin className="h-3 w-3" />
              <span>{siteConfig.location}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
              className="mt-6 text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white leading-[1.05]"
            >
              {t("hero.greeting")}{" "}
              <span className="gradient-text">Lam Pham</span>.
              <br />
              <span className="text-white/70 text-3xl sm:text-5xl md:text-6xl">
                {t("hero.subtitle")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="mt-7 max-w-2xl text-base sm:text-lg text-white/65 leading-relaxed"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/stories"
                className="group inline-flex items-center gap-2 rounded-full bg-white text-black px-5 h-11 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                {t("hero.cta.stories")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <CoffeeButton size="lg" />
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 h-11 text-sm text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-colors"
              >
                {t("hero.cta.contact")}
              </a>
            </motion.div>
          </div>

          {/* Avatar column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="order-first lg:order-last relative mx-auto lg:mx-0"
          >
            <div className="relative h-56 w-56 sm:h-72 sm:w-72 lg:h-[360px] lg:w-[360px]">
              {/* Outer glow */}
              <div
                aria-hidden
                className="absolute -inset-6 sm:-inset-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/30 via-fuchsia-400/20 to-amber-300/25 blur-2xl"
              />
              {/* Gradient ring */}
              <div
                aria-hidden
                className="absolute -inset-[2px] rounded-[1.75rem] bg-gradient-to-br from-cyan-400/60 via-fuchsia-400/40 to-amber-300/60 opacity-80"
              />
              {/* Photo */}
              <div className="float-slow relative h-full w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                {/* Plain <img>: next/image skips basePath prefix when `images.unoptimized: true`. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset("/avatar.jpg")}
                  alt="Lam Pham"
                  width={480}
                  height={480}
                  className="h-full w-full object-cover"
                />
                {/* Subtle bottom-to-transparent shade to keep contrast if text ever overlaps */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent"
                />
              </div>
              {/* Floating mini-badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs text-white/80 backdrop-blur shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-300" />
                <span className="font-medium">{t("hero.locationBadge")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
