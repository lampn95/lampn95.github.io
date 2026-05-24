"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Headphones, ArrowUpRight, Clock, ChevronDown } from "lucide-react";
import {
  PODCAST_HOME,
  PODCAST_SPOTIFY,
  PODCAST_SPOTIFY_EMBED,
  podcasts,
} from "@/lib/podcasts";
import { SectionHeading } from "./SectionHeading";

const INITIAL = 5;

export function Podcasts() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? podcasts : podcasts.slice(0, INITIAL);

  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="podcast"
        eyebrow="Podcast · Ghi chép bằng giọng nói"
        title="Coffee with Lam."
        description={
          `Series podcast mình ghi lại trên kênh EngineerPro — lúc thì bình luận đề phỏng vấn kỹ thuật, lúc thì bàn về văn hoá engineering, system design, monitoring, e2e encryption… Hiện có ${podcasts.length} episode trên Spotify và Substack.`
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-black/30 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      >
        <iframe
          title="EngineerPro Podcast — Spotify"
          src={PODCAST_SPOTIFY_EMBED}
          width="100%"
          height={232}
          frameBorder={0}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="block"
        />
      </motion.div>

      <div className="grid gap-3">
        <AnimatePresence initial={false}>
          {visible.map((p, i) => (
            <motion.a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, delay: Math.min(i, INITIAL) * 0.04 }}
              className="group glass rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-colors"
            >
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/90 via-orange-400/80 to-rose-400/70 text-black shadow-[0_8px_28px_rgba(255,184,107,0.25)] group-hover:shadow-[0_8px_36px_rgba(255,184,107,0.45)] group-hover:-translate-y-0.5 transition-all">
                <Play className="h-5 w-5 ml-0.5 fill-current" />
                <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-white/45">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 border border-amber-300/20 px-2 py-0.5 text-amber-200/90">
                    {p.series}
                  </span>
                  <span>{formatDate(p.date)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {p.duration}
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm sm:text-base font-semibold text-white leading-snug group-hover:text-amber-200 transition-colors truncate">
                  {p.title}
                </h3>
              </div>

              <ArrowUpRight className="hidden sm:block h-5 w-5 shrink-0 text-white/30 group-hover:text-amber-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        {podcasts.length > INITIAL && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-4 h-10 text-sm text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {expanded
              ? "Thu gọn"
              : `Xem thêm ${podcasts.length - INITIAL} episode`}
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={PODCAST_SPOTIFY}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] text-black px-5 h-10 text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(29,185,84,0.45)] transition-all"
          >
            <SpotifyIcon className="h-4 w-4" />
            Spotify
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={PODCAST_HOME}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/[0.06] text-white px-5 h-10 text-sm font-medium hover:bg-amber-300/[0.12] hover:border-amber-300/60 transition-all"
          >
            <Headphones className="h-4 w-4 text-amber-300" />
            Substack
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function SpotifyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.42-1.02.6-1.56.299z" />
    </svg>
  );
}

function formatDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
