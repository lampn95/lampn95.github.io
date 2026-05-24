"use client";

import { motion } from "framer-motion";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const BOOK_URL = "https://engineerpro-team.github.io/coding-book/";

export function Book() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="book"
        eyebrow="Note · Book"
        title="Đồng tác giả một cuốn sách nhỏ."
        description="Cùng anh Lê Quang Hoà biên soạn một cuốn sách miễn phí về DSA coding interview, dưới sự bảo trợ của EngineerPro."
      />

      <motion.a
        href={BOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="group relative block overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.10] via-indigo-500/[0.06] to-fuchsia-500/[0.08] p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div className="relative shrink-0">
            <div className="float-slow relative h-28 w-20 sm:h-32 sm:w-24 rounded-md bg-gradient-to-br from-violet-400 via-fuchsia-400 to-indigo-400 shadow-[0_12px_40px_rgba(168,85,247,0.35)] flex flex-col justify-between p-2.5">
              <div className="text-[9px] font-mono uppercase tracking-wider text-black/70">
                EngineerPro
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-black leading-tight">
                  Coding DSA<br />Interview<br />Patterns
                </div>
                <div className="mt-1.5 text-[8px] font-mono text-black/60">2026</div>
              </div>
            </div>
            <div className="absolute -right-1 top-0 h-28 sm:h-32 w-1 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-r" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-violet-300/5 px-2.5 py-0.5 text-xs text-violet-200">
              <BookOpen className="h-3 w-3" />
              engineerpro-team.github.io/coding-book
            </div>

            <h3 className="mt-3 text-xl sm:text-2xl font-semibold text-white leading-snug">
              Coding DSA Interview — kèm lời giải.
            </h3>

            <p className="mt-3 text-sm text-white/65 leading-relaxed">
              Cuốn sách tổng hợp các bài DSA thường gặp trong phỏng vấn kỹ thuật, kèm lời
              giải Python 3, phân tích độ phức tạp, và các bẫy phỏng vấn. Học theo{" "}
              <span className="text-white">pattern</span>, không phải học vẹt từng bài.
              Hoàn toàn miễn phí cho cộng đồng.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3 max-w-md">
              <Stat number="288" label="bài tập" />
              <Stat number="44" label="patterns" />
              <Stat number="Free" label="mở cho cộng đồng" />
            </div>

            <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-violet-200 group-hover:text-white transition-colors">
              Mở sách <ArrowUpRight className="h-4 w-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="mt-4 text-xs text-white/45 italic">
              Đồng tác giả: Phạm Ngọc Lâm · Lê Quang Hoà — 2026.
            </div>
          </div>
        </div>
      </motion.a>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-lg sm:text-xl font-semibold text-white">{number}</div>
      <div className="text-[10px] sm:text-xs text-white/55 mt-0.5">{label}</div>
    </div>
  );
}
