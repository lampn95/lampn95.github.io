import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { stories } from "@/lib/stories";

export const dynamic = "force-static";

// Drop milliseconds from ISO timestamps. Some sitemap validators (and search
// engines' XSD-strict checks) prefer the simpler "YYYY-MM-DDTHH:MM:SSZ" form.
function isoNoMs(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = isoNoMs(new Date());
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
    lastModified: isoNoMs(new Date(s.date)),
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
