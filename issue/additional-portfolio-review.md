# Additional portfolio review notes

Goal: second-pass review after the newer story edits. These are mostly for Claude to fix in source, then rebuild `docs/`.

Update after fixes: see `issue/follow-up-review-after-fixes.md` for the current review. In particular, issue #1 below is now fixed; the follow-up file lists the remaining open items.

## 1. Static export is stale versus current stories

Paths:

- `src/lib/stories.ts`
- `docs/stories/`

Current source stories include:

- `from-aizu-to-nvidia`
- `co-founder-engineerpro`
- `gap-lai-hoc-tro-trong-phong-van`
- `pass-coding-fail-behavior`

But the built `docs/` still contains the older `ai-augmented-engineering` page and does not include generated pages for the two newer story slugs.

Why it matters: GitHub Pages deploys from `docs/`, so the live site can show stale stories even when source is correct.

Suggested fix:

```sh
make github
```

Use `make github` instead of only `npm run build` because it removes old `docs/` first, preventing stale story pages from lingering.

## 2. Story Open Graph metadata falls back to homepage copy

Path: `src/app/stories/[slug]/page.tsx:23`

Current behavior: `generateMetadata` returns only `title` and `description`. The root layout still supplies homepage `openGraph` and `twitter` metadata, so built story pages can have:

- browser title: story-specific
- `og:title`: `Lam Pham — Senior Software Engineer`
- `og:description`: homepage description

Why it matters: sharing a story link will likely preview as the homepage, not the article.

Suggested fix: return story-specific `openGraph` and `twitter` fields in `generateMetadata`, including canonical URL:

```ts
return {
  title: story.title,
  description: story.excerpt,
  openGraph: {
    title: story.title,
    description: story.excerpt,
    type: "article",
    url: `${siteConfig.url}/stories/${story.slug}/`,
  },
  twitter: {
    card: "summary_large_image",
    title: story.title,
    description: story.excerpt,
  },
};
```

## 3. First story slug no longer matches the story topic

Path: `src/lib/stories.ts:13`

Current:

```ts
slug: "from-aizu-to-nvidia",
title: "Vài ghi chép về văn hoá Big Tech — và cách mình học để không bị cuốn đi",
```

Why it matters: the URL promises a personal Aizu-to-NVIDIA journey, but the article is now about Big Tech culture. That mismatch can feel confusing and slightly clickbaity.

Suggested fix: either rename the slug to match the topic, for example `van-hoa-big-tech`, or rewrite the title/content back toward the Aizu-to-NVIDIA story.

## 4. Mobile navbar hides the main navigation

Path: `src/components/Navbar.tsx:43`

Current:

```tsx
<nav className="hidden md:flex ...">
```

On mobile, visitors only see the logo and coffee button. There is no way to reach Work, Projects, EngineerPro, Book, Podcast, or Stories from the nav.

Why it matters: a portfolio will get a lot of mobile traffic, and the current first interaction nudges people toward coffee instead of exploring the work/story.

Suggested fix: add a small menu button on mobile that opens links, or expose a compact "Stories" / "Work" pair plus coffee in an overflow menu.

## 5. Document language is set to English while most content is Vietnamese

Path: `src/app/layout.tsx:39`

Current:

```tsx
<html lang="en">
```

Why it matters: screen readers, browser translation, and SEO language detection are better when the document language matches the content.

Suggested fix: use `lang="vi"` or `lang="vi-VN"` unless the site is intentionally English-first.

## 6. "Shadow học trò" story feels more promotional than humble

Path: `src/lib/stories.ts:151`

Potentially sales-coded lines:

- `src/lib/stories.ts:154`: "học trò cũ pass System Design ngay trước mặt"
- `src/lib/stories.ts:159`: "vừa vui, vừa tự hào..."
- `src/lib/stories.ts:187`: "kỹ năng thực chiến"
- `src/lib/stories.ts:199`: "em pass rồi. Em vừa nhận offer"
- `src/lib/stories.ts:209`: "Một tố chất mà công ty nào cũng đang tìm"
- `src/lib/stories.ts:213`: "khoá học ... có thể trở thành bệ phóng"

Why it matters: the story has a nice mentoring moment, but some phrasing makes it read like proof-of-outcome marketing for a course.

Suggested fix: keep the emotional core, reduce outcome language. Frame the win as "bạn ấy bình tĩnh hơn, rõ ràng hơn" rather than "pass/offer/bệ phóng". Replace "học trò" with "một bạn từng học cùng tụi mình" if that feels less hierarchical.

## 7. Behavioral story uses broad claims and unsupported numbers

Path: `src/lib/stories.ts:217`

Potentially too absolute:

- `src/lib/stories.ts:225`: "đa số các bạn không trượt vì code..."
- `src/lib/stories.ts:227`: "10-15 năm kinh nghiệm..."
- `src/lib/stories.ts:235`: "80-90% thời gian..."
- `src/lib/stories.ts:254`: "trong 10 bạn... chỉ 1-2 bạn pass..."
- `src/lib/stories.ts:278`: "hầu hết các bạn..."

Why it matters: this pushes the tone toward authority/marketing instead of humble reflection.

Suggested fix: soften to personal observation:

- "Mình gặp khá nhiều case..."
- "Không ít bạn..."
- "Theo cảm giác của mình..."
- Remove exact ratios unless there is a source.

## 8. The site has no personal visual asset

Paths:

- `src/components/Hero.tsx`
- `public/`

Current: the first viewport is text plus aurora/grid treatment. `public/` only has default SVG assets.

Why it matters: for a portfolio that is about "show bản thân + story", one quiet personal visual can make the page feel more human without becoming flashy.

Suggested fix: add one restrained personal image or simple portrait/avatar in the hero/about area. Keep it modest: small, real, not a dramatic hero photo. If no photo is wanted, consider a small desk/work-notes image or a hand-drawn mark that feels personal.

## 9. CTA language is mixed and coffee-heavy

Paths:

- `src/components/CoffeeButton.tsx:34`
- `src/components/CoffeeCTA.tsx`
- `src/app/stories/page.tsx:68`
- `src/app/stories/[slug]/page.tsx:88`

Why it matters: coffee CTAs appear many times. Combined with "Buy me a coffee" in English and several Vietnamese variants, it can feel a bit noisy for a humble portfolio.

Suggested fix: keep one primary coffee CTA near the end, make Navbar coffee icon-only or lower-emphasis, and standardize language to Vietnamese if the site is Vietnamese-first.
