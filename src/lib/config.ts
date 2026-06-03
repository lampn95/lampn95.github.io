// Mirrors `basePath` in next.config.ts. Site now lives on a personal page
// (https://lampn95.github.io/), so basePath is empty in both dev and prod.
// next/image does NOT auto-prefix basePath when `images.unoptimized: true`,
// so for static assets we still go through the `asset()` helper for safety
// in case basePath comes back later.
export const basePath = "";

/** Resolve a public/ asset path to a URL that works under the configured basePath. */
export function asset(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${basePath}${path}`;
}

export const siteConfig = {
  name: "Lam Pham",
  title: "Lam Pham",
  description:
    "Backend engineer in Vietnam. I write about systems, AI-assisted engineering, and a few lessons from building with teams.",
  url: "https://lampn95.github.io",
  email: "lampham.aizu@gmail.com",
  phone: "+84 35-291-1223",
  location: "Vietnam",
  socials: {
    github: "https://github.com/lampn95",
    linkedin: "https://www.linkedin.com/in/lampham",
    engineerpro: "https://engineerprogurus.com/",
  },
  // Internal route — every Coffee CTA opens here, where the QR can be embedded inline.
  // Avoids Drive's mobile viewer feeling clunky as the primary touchpoint.
  coffeeHref: "/coffee/",
  // Underlying Drive PDF (QR banking VN). Used by /coffee/ for the embedded preview
  // + a fallback "open on Drive" link.
  coffeeDriveView:
    "https://drive.google.com/file/d/1l6qznwNGmMRjz4UAsDOwx8DEexUOSqyG/view?usp=sharing",
  coffeeDriveEmbed:
    "https://drive.google.com/file/d/1l6qznwNGmMRjz4UAsDOwx8DEexUOSqyG/preview",
  // Google Analytics 4 Measurement ID. Leave empty to disable analytics.
  googleAnalyticsId: "G-4SXWM514YY",
} as const;
