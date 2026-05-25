import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllStorySlugs, getStoryBySlug } from "@/lib/stories";
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
  return <StoryView story={story} />;
}
