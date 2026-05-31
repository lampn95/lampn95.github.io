import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { stories } from "@/lib/stories";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${base}/stories/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/coffee/`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const storyRoutes: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${base}/stories/${s.slug}/`,
    lastModified: new Date(s.date).toISOString(),
    changeFrequency: "yearly",
    priority: 0.7,
    // Tell crawlers each story exists in two languages on the same URL.
    alternates: {
      languages: {
        en: `${base}/stories/${s.slug}/`,
        vi: `${base}/stories/${s.slug}/`,
      },
    },
  }));

  return [...staticRoutes, ...storyRoutes];
}
