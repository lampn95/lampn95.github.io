import { Hero } from "@/components/Hero";
import { Experience } from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { EngineerProSection } from "@/components/EngineerProSection";
import { Book } from "@/components/Book";
import { Podcasts } from "@/components/Podcasts";
import { Skills } from "@/components/Skills";
import { StoriesPreview } from "@/components/StoriesPreview";
import { CoffeeCTA } from "@/components/CoffeeCTA";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/lib/config";
import { experiences, education } from "@/lib/data";

// JSON-LD Person schema — helps Google build a knowledge panel and lets
// rich-result tooling understand who this site is about.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  url: siteConfig.url,
  image: `${siteConfig.url}/avatar.jpg`,
  jobTitle: "Senior Software Engineer",
  worksFor: { "@type": "Organization", name: "NVIDIA" },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: education.school,
    address: education.location,
  },
  email: `mailto:${siteConfig.email}`,
  sameAs: [
    siteConfig.socials.github,
    siteConfig.socials.linkedin,
    siteConfig.socials.engineerpro,
    "https://engineerprovn.substack.com/",
    "https://open.spotify.com/show/3DmoIG8BRleRlFXNqcvHnV",
  ],
  knowsAbout: [
    "Backend engineering",
    "Distributed systems",
    "System design",
    "AI-assisted engineering",
    "Mentorship",
  ],
  // Reverse-chronological work history. Use `Role` so Google understands ordering.
  hasOccupation: experiences.map((exp) => ({
    "@type": "Role",
    roleName: exp.role,
    startDate: parseStartDate(exp.period),
    ...(parseEndDate(exp.period) ? { endDate: parseEndDate(exp.period) } : {}),
    affiliation: { "@type": "Organization", name: exp.company },
  })),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.title,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: ["en", "vi"],
  author: { "@id": `${siteConfig.url}#person` },
};

export default function Home() {
  return (
    <>
      <JsonLd data={{ ...personJsonLd, "@id": `${siteConfig.url}#person` }} />
      <JsonLd data={websiteJsonLd} />
      <Hero />
      <Experience />
      <Projects />
      <EngineerProSection />
      <Book />
      <Podcasts />
      <Skills />
      <StoriesPreview />
      <CoffeeCTA />
    </>
  );
}

// "Dec 2025 — Present" → "2025-12-01"; "Sep 2018 — Apr 2021" → "2018-09-01"
function parseStartDate(period: string): string | undefined {
  const m = period.match(/^(\w+)\s+(\d{4})/);
  if (!m) return undefined;
  return `${m[2]}-${monthNum(m[1])}-01`;
}

function parseEndDate(period: string): string | undefined {
  const m = period.match(/—\s*(\w+)\.?\s*(\d{4})/);
  if (!m) return undefined; // "Present"
  return `${m[2]}-${monthNum(m[1])}-01`;
}

function monthNum(name: string): string {
  const map: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  return map[name.slice(0, 3)] ?? "01";
}
