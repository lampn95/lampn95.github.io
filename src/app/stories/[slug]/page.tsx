import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllStorySlugs, getStoryBySlug } from "@/lib/stories";
import { siteConfig } from "@/lib/config";
import { StoryView } from "@/components/StoryView";

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

  // Server-rendered metadata uses the default language (EN); the client view
  // swaps the on-page title/excerpt on hydration. Social-card crawlers only
  // see the EN version — that's intentional for a single canonical preview.
  const url = `${siteConfig.url}/stories/${story.slug}/`;
  const title = story.title.en;
  const description = story.excerpt.en;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      publishedTime: story.date,
      tags: story.tags,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
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
  return <StoryView story={story} />;
}
