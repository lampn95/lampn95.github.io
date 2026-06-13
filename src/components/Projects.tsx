"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/data";
import { SectionHeading } from "./SectionHeading";
import { GithubIcon } from "./SocialIcons";
import { useT } from "@/lib/i18n";

export function Projects() {
  const t = useT();
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="projects"
        eyebrow={t("projects.eyebrow")}
        title={t("projects.title")}
        description={t("projects.description")}
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => {
          const card = (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group glass rounded-2xl p-5 sm:p-6 flex flex-col h-full"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300/80">
                  {p.period}
                </div>
                {p.github && (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/55 group-hover:text-white group-hover:border-white/25 group-hover:bg-white/10 transition-colors"
                    aria-hidden
                  >
                    <GithubIcon className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors">
                {p.name}
              </h3>
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

              {p.github && (
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-mono text-white/45 group-hover:text-cyan-200 transition-colors">
                  <span className="truncate">
                    {p.github.replace("https://", "")}
                  </span>
                  <ArrowUpRight className="h-3 w-3 shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </motion.div>
          );

          if (!p.github) {
            return <article key={p.name}>{card}</article>;
          }

          return (
            <a
              key={p.name}
              href={p.github}
              target="_blank"
              rel="noopener noreferrer"
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 rounded-2xl"
              aria-label={`${p.name} — ${t("projects.openSource")}`}
            >
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}
