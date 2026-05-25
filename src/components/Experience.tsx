"use client";

import { motion } from "framer-motion";
import { experiences } from "@/lib/data";
import { SectionHeading } from "./SectionHeading";
import { CompanyLogo } from "./CompanyLogos";
import { useT } from "@/lib/i18n";

export function Experience() {
  const t = useT();
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="experience"
        eyebrow={t("experience.eyebrow")}
        title={t("experience.title")}
        description={t("experience.description")}
      />

      <ol className="relative border-l border-white/10 ml-2 space-y-5 sm:space-y-6">
        {experiences.map((exp, i) => (
          <motion.li
            key={`${exp.company}-${exp.period}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="pl-6 sm:pl-8"
          >
            <span
              className={`absolute -left-[7px] mt-2 inline-flex h-3 w-3 rounded-full bg-gradient-to-br ${exp.accent} shadow-[0_0_12px_rgba(124,242,255,0.4)]`}
            />
            <div className="glass rounded-2xl px-5 py-4 sm:px-6 sm:py-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <CompanyLogo company={exp.company} />
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {exp.role}
                  </h3>
                  <span className="text-white/30">·</span>
                  <span
                    className={`text-base sm:text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r ${exp.accent}`}
                  >
                    {exp.company}
                  </span>
                </div>
              </div>
              <div className="text-xs font-mono text-white/45">
                {exp.location} · {exp.period}
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
