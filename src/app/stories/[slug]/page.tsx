import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { getAllStorySlugs, getStoryBySlug } from "@/lib/stories";
import { CoffeeButton } from "@/components/CoffeeButton";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllStorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: story.title,
    description: story.excerpt,
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) notFound();

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />

      <article className="relative mx-auto max-w-2xl px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All stories
        </Link>

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {new Date(story.date).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              {story.readingTime}
            </span>
            <span>·</span>
            <span className="flex flex-wrap gap-1.5">
              {story.tags.map((t) => (
                <span key={t} className="text-cyan-300/80">
                  #{t}
                </span>
              ))}
            </span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
            {story.title}
          </h1>
          <p className="mt-4 text-lg text-white/65 leading-relaxed italic">
            {story.excerpt}
          </p>
        </div>

        <hr className="my-10 border-white/10" />

        <div className="prose-story">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{story.content}</ReactMarkdown>
        </div>

        <hr className="my-12 border-white/10" />

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-6 text-center">
          <p className="text-sm text-white/70 leading-relaxed">
            Nếu bài viết hữu ích với bạn — mời mình một ly cà phê nhé.
            <br />
            Đây là động lực để mình viết tiếp.
          </p>
          <div className="mt-4 flex justify-center">
            <CoffeeButton size="lg" />
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between text-sm">
          <Link
            href="/stories"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All stories
          </Link>
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            Home →
          </Link>
        </div>
      </article>
    </div>
  );
}
