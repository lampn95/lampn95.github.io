import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllStorySlugs, getStoryBySlug } from "@/lib/stories";
import { siteConfig } from "@/lib/config";
import { StoryView } from "@/components/StoryView";
import { JsonLd } from "@/components/JsonLd";

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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: story.title.en,
    description: story.excerpt.en,
    image: `${siteConfig.url}/avatar.jpg`,
    datePublished: story.date,
    dateModified: story.date,
    author: {
      "@type": "Person",
      "@id": `${siteConfig.url}#person`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/stories/${story.slug}/`,
    },
    keywords: story.tags.join(", "),
    inLanguage: ["en", "vi"],
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <StoryView story={story} />
    </>
  );
}
