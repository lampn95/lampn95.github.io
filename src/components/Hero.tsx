"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { CoffeeButton } from "./CoffeeButton";
import { siteConfig } from "@/lib/config";

export function Hero() {
  return (
    <section id="about" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute inset-0 bg-grid opacity-60" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-20 sm:pt-28 pb-24">
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
          Open to interesting conversations
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
          Hi, mình là{" "}
          <span className="gradient-text">Lam Pham</span>.
          <br />
          <span className="text-white/70 text-3xl sm:text-5xl md:text-6xl">
            Một software engineer, đang học mỗi ngày.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="mt-7 max-w-2xl text-base sm:text-lg text-white/65 leading-relaxed"
        >
          Hiện tại mình làm backend ở <span className="text-white">NVIDIA</span>,
          trước đây có dịp đi qua <span className="text-white">TikTok</span>,{" "}
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
          {" "}— một chỗ nhỏ để tụi mình chia sẻ lại những gì đã học, với các bạn đang trên
          đường vào ngành.
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
            Đọc Stories
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <CoffeeButton size="lg" />
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 h-11 text-sm text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-colors"
          >
            Liên hệ
          </a>
        </motion.div>

      </div>
    </section>
  );
}
