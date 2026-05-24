"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/data";
import { SectionHeading } from "./SectionHeading";

export function Projects() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="projects"
        eyebrow="Selected Projects"
        title="Những thứ mình build ngoài giờ."
        description="Mỗi project là một dịp để thử một idea, một stack mới, hoặc kiểm chứng một niềm tin về kiến trúc. Mình cũng dùng Claude và Codex như bạn pair để viết, review, rồi học lại từ chính phần sai."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.article
            key={p.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="group glass rounded-2xl p-5 sm:p-6 flex flex-col"
          >
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300/80">
              {p.period}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">{p.name}</h3>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">{p.summary}</p>

            <ul className="mt-4 space-y-1.5 text-xs text-white/55 leading-relaxed flex-1">
              {p.bullets.map((b, j) => (
                <li key={j} className="pl-3 relative">
                  <span className="absolute left-0 top-1.5 h-1 w-1 rounded-full bg-cyan-300/60" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
