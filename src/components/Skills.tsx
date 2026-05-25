"use client";

import { motion } from "framer-motion";
import { skills, education } from "@/lib/data";
import { SectionHeading } from "./SectionHeading";
import { GraduationCap } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Skills() {
  const t = useT();
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        eyebrow={t("skills.eyebrow")}
        title={t("skills.title")}
      />

      <div className="grid gap-5 md:grid-cols-3">
        {Object.entries(skills).map(([group, items], i) => (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-2xl p-5"
          >
            <div className="text-xs uppercase font-mono tracking-wider text-cyan-300/80">
              {group}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((s) => (
                <span
                  key={s}
                  className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="mt-6 glass rounded-2xl p-5 flex items-start gap-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20 border border-white/10">
          <GraduationCap className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">
            {education.school}
          </div>
          <div className="text-sm text-white/60 mt-0.5">
            {education.degree} · {education.location}
          </div>
          <div className="text-xs text-white/45 mt-1 font-mono">
            {education.period}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/5 px-2.5 py-0.5 text-xs text-amber-200">
            {education.note}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
