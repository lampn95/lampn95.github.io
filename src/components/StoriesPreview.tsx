"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { stories } from "@/lib/stories";
import { SectionHeading } from "./SectionHeading";

export function StoriesPreview() {
  const featured = stories.slice(0, 3);

  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        eyebrow="Stories"
        title="Vài ghi chép."
        description="Không phải tutorial. Không phải clickbait. Chỉ là những điều mình đang học dần từ công việc, thất bại, và vài cuộc trò chuyện tử tế."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {featured.map((s, i) => (
          <motion.article
            key={s.slug}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group glass rounded-2xl p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-white/40">
              <BookOpen className="h-3 w-3" />
              <span>{new Date(s.date).toLocaleDateString("vi-VN")}</span>
              <span>·</span>
              <span>{s.readingTime}</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-white leading-snug group-hover:text-cyan-300 transition-colors">
              <Link href={`/stories/${s.slug}`}>{s.title}</Link>
            </h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed flex-1">
              {s.excerpt}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/55"
                >
                  {t}
                </span>
              ))}
            </div>
            <Link
              href={`/stories/${s.slug}`}
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-cyan-300 group-hover:text-cyan-200"
            >
              Đọc tiếp <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.article>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/stories"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 h-11 text-sm text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-colors"
        >
          Xem tất cả stories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
