import Link from "next/link";
import type { Metadata } from "next";
import { stories } from "@/lib/stories";
import { BookOpen, ArrowRight } from "lucide-react";
import { CoffeeButton } from "@/components/CoffeeButton";

export const metadata: Metadata = {
  title: "Stories",
  description: "Vài ghi chép về career, AI engineering, EngineerPro, và những điều mình đang học dần trong nghề.",
};

export default function StoriesIndexPage() {
  const sorted = [...stories].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-5 sm:px-8 pt-20 sm:pt-28 pb-24">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/80 font-mono">
          Stories
        </div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
          Vài ghi chép.
        </h1>
        <p className="mt-4 text-white/65 leading-relaxed max-w-xl">
          Không tutorial. Không clickbait. Chỉ vài điều mình đang học dần từ công việc,
          những lần vấp, và những người đã gặp trên đường.
        </p>

        <div className="mt-12 space-y-5">
          {sorted.map((s) => (
            <Link
              key={s.slug}
              href={`/stories/${s.slug}`}
              className="group block glass rounded-2xl p-5 sm:p-6 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                <BookOpen className="h-3 w-3" />
                <span>{new Date(s.date).toLocaleDateString("vi-VN")}</span>
                <span>·</span>
                <span>{s.readingTime}</span>
                <span>·</span>
                <span className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="text-cyan-300/80">
                      #{t}
                    </span>
                  ))}
                </span>
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                {s.title}
              </h2>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{s.excerpt}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-cyan-300 group-hover:text-cyan-200">
                Đọc <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-6 text-center">
          <p className="text-sm text-white/70">
            Thấy bài nào hay? Mời mình 1 ly cà phê nhé — mọi ủng hộ đều giúp mình viết tiếp.
          </p>
          <div className="mt-4 flex justify-center">
            <CoffeeButton />
          </div>
        </div>
      </div>
    </div>
  );
}
