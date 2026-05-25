"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, GraduationCap, Users, Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { SectionHeading } from "./SectionHeading";
import { useT } from "@/lib/i18n";

const mentors = [
  { name: "Đông Trương", role: "Sr SWE @ Shopee" },
  { name: "Harry Lê Quang Hoà", role: "Lead SWE @ TikTok" },
  { name: "Thân Việt Đức", role: "SWE @ Uber" },
  { name: "Lê Chương", role: "Sr SWE @ Google" },
  { name: "Trần Khánh Hiệp", role: "SWE @ Spotify" },
  { name: "Anh Việt", role: "ex-Staff SWE @ Shopee" },
];

export function EngineerProSection() {
  const t = useT();
  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="engineerpro"
        eyebrow={t("engineerpro.eyebrow")}
        title={t("engineerpro.title")}
        description={t("engineerpro.description")}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.08] via-fuchsia-500/[0.05] to-amber-400/[0.06] p-6 sm:p-10"
      >
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/5 px-3 py-1 text-xs text-cyan-200">
              <Sparkles className="h-3 w-3" />
              engineerprogurus.com
            </div>

            <h3 className="mt-4 text-2xl sm:text-3xl font-semibold text-white leading-tight">
              {t("engineerpro.cardTitleA")}{" "}
              <span className="gradient-text">{t("engineerpro.cardTitleB")}</span>
              <br />
              <span className="text-white/70 text-xl sm:text-2xl">
                {t("engineerpro.cardSubtitle")}
              </span>
            </h3>

            <p className="mt-4 text-white/65 leading-relaxed">
              {t("engineerpro.copyLead")}
              <strong className="text-white">Frontend</strong>,{" "}
              <strong className="text-white">Backend Java / Golang</strong>,{" "}
              <strong className="text-white">DSA</strong>,{" "}
              <strong className="text-white">CS Fundamentals</strong>,{" "}
              <strong className="text-white">System Design Interview Lv1 & Lv2</strong>
              {t("engineerpro.copyTail")}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <Mini icon={<Users className="h-4 w-4" />} title={t("engineerpro.mini.mentor")} sub={t("engineerpro.mini.mentorSub")} />
              <Mini icon={<GraduationCap className="h-4 w-4" />} title={t("engineerpro.mini.path")} sub={t("engineerpro.mini.pathSub")} />
              <Mini icon={<Sparkles className="h-4 w-4" />} title={t("engineerpro.mini.community")} sub={t("engineerpro.mini.communitySub")} />
            </div>

            <a
              href={siteConfig.socials.engineerpro}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 h-11 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              {t("engineerpro.cta")}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/40 font-mono">
              {t("engineerpro.mentors")}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {mentors.map((m, i) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur"
                >
                  <div className="text-sm text-white font-medium leading-tight">{m.name}</div>
                  <div className="text-xs text-white/50 mt-0.5">{m.role}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 text-xs text-white/40 italic">
              {t("engineerpro.moreMentors")}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Mini({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-cyan-300">{icon}</div>
      <div className="mt-1 text-sm text-white font-medium">{title}</div>
      <div className="text-xs text-white/50">{sub}</div>
    </div>
  );
}
