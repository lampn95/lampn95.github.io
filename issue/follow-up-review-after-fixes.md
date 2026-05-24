# Follow-up review after fixes

Status: reviewed after the coffee page, metadata copy, story copy, and static export fixes.

## Fixed from previous pass

- Static export is no longer stale. `docs/stories/` now contains:
  - `from-aizu-to-nvidia`
  - `co-founder-engineerpro`
  - `gap-lai-hoc-tro-trong-phong-van`
  - `pass-coding-fail-behavior`
- Old `docs/stories/ai-augmented-engineering/` is gone.
- `/coffee/` exists in both source and `docs/`.
- `npm run lint` passes.

## 1. Story social metadata still falls back to homepage OG/Twitter copy

Paths:

- `src/app/stories/[slug]/page.tsx:16`
- `src/app/stories/[slug]/page.tsx:24`
- generated evidence: `docs/stories/pass-coding-fail-behavior/__next._head.txt`

Current source:

```ts
return {
  title: story.title,
  description: story.excerpt,
};
```

Generated story head still has story-specific `<title>` and description, but `og:title`, `og:description`, `twitter:title`, and `twitter:description` remain the homepage values.

Why it matters: sharing a story link will preview as "Lam Pham" with the homepage description instead of the article title/excerpt.

Suggested fix: import `siteConfig` and return story-specific `openGraph` / `twitter` metadata from `generateMetadata`.

## 2. Document language is still English while most content is Vietnamese

Path: `src/app/layout.tsx:44`

Current:

```tsx
lang="en"
```

Why it matters: accessibility, browser translation, and SEO language hints are off for Vietnamese-first pages.

Suggested fix: change to `lang="vi"` or `lang="vi-VN"`.

## 3. Mobile nav still hides all main navigation links

Path: `src/components/Navbar.tsx:45`

Current:

```tsx
<nav className="hidden md:flex ...">
```

On mobile, the header shows logo + coffee CTA only. Users cannot jump to Work, Projects, EngineerPro, Book, Podcast, or Stories from nav.

Suggested fix: add a compact mobile menu button, or at least expose `Stories` plus a menu/overflow button. Coffee should not be the only visible action on mobile.

## 4. README coffee instructions are stale after the `/coffee/` refactor

Paths:

- `README.md:81`
- `README.md:83`
- `README.md:87`

Current README still says to edit `coffeeLink`, but config now uses:

```ts
coffeeHref
coffeeDriveView
coffeeDriveEmbed
```

Why it matters: future edits will follow outdated instructions and likely break the coffee page.

Suggested fix: update README to describe `/coffee/`, `coffeeHref`, `coffeeDriveView`, and `coffeeDriveEmbed`. Also mention that CTAs should normally point to the internal `/coffee/` route.

## 5. First story slug still does not match the current title

Path: `src/lib/stories.ts:13`

Current:

```ts
slug: "from-aizu-to-nvidia",
title: "Vài ghi chép về văn hoá Big Tech — và cách mình học để không bị cuốn đi",
```

Why it matters: the URL suggests a personal journey from Aizu to NVIDIA, while the article is now about Big Tech culture. This creates a small trust/clickbait mismatch.

Suggested fix: rename slug to something like `van-hoa-big-tech` and rebuild `docs/`, or restore the Aizu-to-NVIDIA narrative.

## 6. Mentorship story is still a little proof-of-outcome / course-coded

Path: `src/lib/stories.ts:151`

Lines that still feel more promotional than humble:

- `src/lib/stories.ts:154`: "học trò cũ pass System Design ngay trước mặt"
- `src/lib/stories.ts:159`: "vui, vừa tự hào..."
- `src/lib/stories.ts:187`: "kỹ năng thực chiến"
- `src/lib/stories.ts:199`: quote says "em pass rồi. Em vừa nhận offer"
- `src/lib/stories.ts:209`: "Một tố chất mà công ty nào cũng đang tìm"
- `src/lib/stories.ts:213`: "khoá học ... bệ phóng"

Suggested fix: keep the emotion, lower the proof language. Example direction: "một bạn từng học cùng tụi mình" instead of "học trò"; focus on "bạn ấy bình tĩnh và rõ ràng hơn" instead of "pass/offer/bệ phóng".

## 7. Behavioral story is improved, but still has a few broad claims

Path: `src/lib/stories.ts:217`

Remaining lines to soften:

- `src/lib/stories.ts:220`: "lỡ offer" still sounds outcome/sales oriented.
- `src/lib/stories.ts:235`: "80-90% thời gian" is an exact ratio without source.
- `src/lib/stories.ts:246`: "đa phần ứng viên" is broad.
- `src/lib/stories.ts:254`: "hiếm ai pass..." is still strong.
- `src/lib/stories.ts:278`: "hầu hết các bạn..." is broad.

Suggested fix: keep the topic, but use softer observational language: "mình gặp khá nhiều", "thường", "nhiều bạn", "không ít case". Remove exact ratios unless sourced.

## 8. Coffee CTA still appears very frequently

Paths:

- `src/components/CoffeeButton.tsx`
- `src/components/CoffeeCTA.tsx`
- `src/app/stories/page.tsx:66`
- `src/app/stories/[slug]/page.tsx:93`
- `src/app/coffee/page.tsx`

Why it matters: the `/coffee/` page is much better now, but coffee still appears in Navbar, Hero, Footer, final homepage CTA, stories index, and every story detail. For a humble portfolio, that can still feel a bit donation-heavy.

Suggested fix: consider removing coffee from Navbar on mobile, or keeping only footer + end-of-story. Another option: make Navbar coffee icon-only with a tooltip/aria-label.
