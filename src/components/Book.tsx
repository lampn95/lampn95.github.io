"use client";

import { motion } from "framer-motion";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { useLang, useT } from "@/lib/i18n";
import { books, type Book as BookEntry, type BookStat } from "@/lib/books";

export function Book() {
  const t = useT();
  const { lang } = useLang();

  return (
    <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20">
      <SectionHeading
        id="book"
        eyebrow={t("book.eyebrow")}
        title={t("book.title")}
        description={t("book.description")}
      />

      <div className="grid gap-5">
        {books.map((book, i) => (
          <BookCard key={book.slug} book={book} lang={lang} index={i} />
        ))}
      </div>
    </section>
  );
}

function BookCard({
  book,
  lang,
  index,
}: {
  book: BookEntry;
  lang: "en" | "vi";
  index: number;
}) {
  const c = book.card;
  return (
    <motion.a
      href={book.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className={`group relative block overflow-hidden rounded-3xl border ${c.wrapperBorder} bg-gradient-to-br ${c.wrapperGradient} p-6 sm:p-8`}
    >
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start gap-6">
        <BookCover book={book} />

        <div className="min-w-0 flex-1">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border ${c.badgeBorder} ${c.badgeBg} px-2.5 py-0.5 text-xs ${c.badgeText}`}
          >
            <BookOpen className="h-3 w-3" />
            {book.domainBadge}
          </div>

          <h3 className="mt-3 text-xl sm:text-2xl font-semibold text-white leading-snug">
            {book.title[lang]}
          </h3>

          <p className="mt-3 text-sm text-white/65 leading-relaxed">
            {book.copy.lead[lang]}
            <span className="text-white">{book.copy.highlight[lang]}</span>
            {book.copy.tail[lang]}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 max-w-md">
            {book.stats.map((s) => (
              <Stat key={s.number} stat={s} lang={lang} />
            ))}
          </div>

          <div
            className={`mt-5 inline-flex items-center gap-1.5 text-sm ${c.ctaText} group-hover:text-white transition-colors`}
          >
            {book.cta[lang]}
            <ArrowUpRight className="h-4 w-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div className="mt-4 text-xs text-white/45 italic">
            {book.credit[lang]}
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function BookCover({ book }: { book: BookEntry }) {
  const { cover } = book;
  return (
    <div className="relative shrink-0">
      <div
        className={`float-slow relative h-28 w-20 sm:h-32 sm:w-24 rounded-md bg-gradient-to-br ${cover.frontGradient} ${cover.shadow} flex flex-col justify-between p-2.5`}
      >
        <div className="text-[9px] font-mono uppercase tracking-wider text-black/70">
          {cover.spineLabel}
        </div>
        <div>
          <div className="text-[10px] sm:text-xs font-bold text-black leading-tight">
            {cover.titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < cover.titleLines.length - 1 && <br />}
              </span>
            ))}
          </div>
          <div className="mt-1.5 text-[8px] font-mono text-black/60">{cover.year}</div>
        </div>
      </div>
      <div
        className={`absolute -right-1 top-0 h-28 sm:h-32 w-1 bg-gradient-to-b ${cover.spineGradient} rounded-r`}
      />
    </div>
  );
}

function Stat({ stat, lang }: { stat: BookStat; lang: "en" | "vi" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-lg sm:text-xl font-semibold text-white">{stat.number}</div>
      <div className="text-[10px] sm:text-xs text-white/55 mt-0.5">
        {stat.label[lang]}
      </div>
    </div>
  );
}
