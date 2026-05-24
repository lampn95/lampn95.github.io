import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
// Include the basePath because the site is deployed under /lampham/ on GitHub Pages.
const ogImageUrl = `${siteConfig.url}/avatar.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
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
  },
  icons: {
    icon: ogImageUrl,
    apple: ogImageUrl,
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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
