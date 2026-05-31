// Custom sitemap route handler. Replaces the built-in `sitemap.ts` convention so
// we can fully control formatting (indentation, xsi:schemaLocation, hreflang
// placement). Output is static — fine with `output: "export"`.

import { siteConfig } from "@/lib/config";
import { stories } from "@/lib/stories";

export const dynamic = "force-static";

// "2026-05-31T11:07:51+00:00" — match the canonical sitemap-protocol example
// (no milliseconds, explicit offset).
function fmtDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` +
    `+00:00`
  );
}

type Entry = {
  loc: string;
  lastmod: string;
  changefreq: "yearly" | "monthly" | "weekly" | "daily" | "hourly" | "always" | "never";
  priority: string;
  hreflangs?: Array<{ hreflang: string; href: string }>;
};

export async function GET(): Promise<Response> {
  const base = siteConfig.url;
  const now = fmtDate(new Date());

  const entries: Entry[] = [
    { loc: `${base}/`,         lastmod: now, changefreq: "monthly", priority: "1.00" },
    { loc: `${base}/stories/`, lastmod: now, changefreq: "monthly", priority: "0.80" },
    { loc: `${base}/coffee/`,  lastmod: now, changefreq: "yearly",  priority: "0.30" },
    ...stories.map<Entry>((s) => ({
      loc: `${base}/stories/${s.slug}/`,
      lastmod: fmtDate(new Date(s.date)),
      changefreq: "yearly",
      priority: "0.70",
      hreflangs: [
        { hreflang: "en", href: `${base}/stories/${s.slug}/` },
        { hreflang: "vi", href: `${base}/stories/${s.slug}/` },
      ],
    })),
  ];

  const body = renderSitemap(entries);

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function renderSitemap(entries: Entry[]): string {
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<urlset`);
  lines.push(`      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`);
  lines.push(`      xmlns:xhtml="http://www.w3.org/1999/xhtml"`);
  lines.push(`      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`);
  lines.push(`      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9`);
  lines.push(`            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`);
  lines.push(``);

  for (const e of entries) {
    lines.push(`<url>`);
    lines.push(`  <loc>${e.loc}</loc>`);
    if (e.hreflangs) {
      for (const h of e.hreflangs) {
        lines.push(`  <xhtml:link rel="alternate" hreflang="${h.hreflang}" href="${h.href}"/>`);
      }
    }
    lines.push(`  <lastmod>${e.lastmod}</lastmod>`);
    lines.push(`  <changefreq>${e.changefreq}</changefreq>`);
    lines.push(`  <priority>${e.priority}</priority>`);
    lines.push(`</url>`);
  }

  lines.push(``);
  lines.push(`</urlset>`);
  return lines.join("\n");
}
