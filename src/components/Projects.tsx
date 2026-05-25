"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/data";
import { SectionHeading } from "./SectionHeading";
import { useT } from "@/lib/i18n";

function GithubIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

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
