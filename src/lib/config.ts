// Mirrors `basePath` in next.config.ts. Inlined into the bundle at build time
// via the standard NODE_ENV replacement, so client + server stay in sync.
// next/image does NOT auto-prefix basePath when `images.unoptimized: true`,
// so for static assets we prefix manually via the `asset()` helper below.
export const basePath =
  process.env.NODE_ENV === "production" ? "/lampham" : "";

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
  url: "https://lampn95.github.io/lampham",
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
} as const;
