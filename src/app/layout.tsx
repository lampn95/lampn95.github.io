import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LanguageProvider } from "@/lib/i18n";
import { siteConfig } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Absolute URL for the OG/Twitter image — social platforms can't resolve relative paths.
const ogImageUrl = `${siteConfig.url}/avatar.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: `${siteConfig.name} — portfolio`,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  keywords: [
    "Lam Pham",
    "Phạm Ngọc Lâm",
    "lampham",
    "backend engineer",
    "software engineer",
    "Vietnam",
    "NVIDIA",
    "TikTok",
    "Grab",
    "Shopee",
    "EngineerPro",
    "system design",
    "DSA",
    "Big Tech interview",
    "AI-assisted engineering",
  ],
  alternates: {
    canonical: siteConfig.url,
    languages: {
      en: siteConfig.url,
      vi: siteConfig.url,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
    siteName: `${siteConfig.name} — portfolio`,
    locale: "en_US",
    alternateLocale: ["vi_VN"],
    images: [
      {
        url: ogImageUrl,
        width: 473,
        height: 480,
        alt: `${siteConfig.name} — avatar`,
      },
    ],
  },
  twitter: {
    // Square avatar reads better as `summary` (small thumb) than `summary_large_image`.
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [ogImageUrl],
    creator: "@lampham",
  },
  icons: {
    icon: ogImageUrl,
    apple: ogImageUrl,
  },
  category: "technology",
  verification: {
    google: "jcy8CqdSO0Nc0lM5y0K4IQ30CQd0ajy7CIOzt8dMlBQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
