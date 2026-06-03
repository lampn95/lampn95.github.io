import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js) loader for Next.js App Router.
 *
 * - `strategy="afterInteractive"` defers loading until the page is usable, so
 *   GA never blocks LCP / FID.
 * - The inline init script is given an id so Next renders exactly one copy
 *   per page (avoids double-counting on route transitions).
 * - In dev mode we no-op so local hits don't pollute the analytics property.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  if (!id) return null;
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
