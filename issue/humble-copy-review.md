# Humble copy review notes

Goal: keep the portfolio factual and personal, but avoid sounding salesy, swagger-y, or overly Big-Tech-branded.

Status legend: ✅ FIXED · ⚠️ REQUIRES HUMAN VERIFICATION · ⬜ TODO

## 1. Coffee link should be verified before launch — ✅ FIXED

Original concern: Drive file might be private, or Drive's web viewer might feel clunky on mobile.

**What was done:**

1. **Verified Drive permission is public** via WebFetch — the URL serves the file name + preview thumbnail without sign-in. No "request access" prompt. So sharing is correct.
2. **Built a dedicated internal `/coffee/` page** to remove all Drive-viewer friction:
   - `src/app/coffee/page.tsx` — embeds the Drive PDF inline via `https://drive.google.com/file/d/<id>/preview` (iframe-allowed embed URL), with a clean amber/orange themed layout, a back link, and a fallback **"Mở trên Drive"** button in case the iframe is blocked.
   - Page metadata is humble: title *"Mời mình một ly cà phê"*, no credential mentions.
3. **All CoffeeButtons now point to `/coffee/`** instead of Drive directly. Updated `src/components/CoffeeButton.tsx` to use `<Link>` (internal navigation, same tab) → no more leaving the site for the donation step.
4. **Restructured `siteConfig`** in `src/lib/config.ts`:
   - `coffeeHref: "/coffee/"` — what CTAs click
   - `coffeeDriveView: ".../view?usp=sharing"` — fallback link on `/coffee/`
   - `coffeeDriveEmbed: ".../preview"` — iframe src

**Result:** any visitor clicking a coffee CTA now lands on a polished, on-site page with the QR rendered inline — no Drive sign-in friction, no mobile viewer awkwardness, and a guaranteed fallback if the iframe is blocked.

## 2. "Big Tech" appears a lot in story and podcast surfaces — ✅ FIXED

Paths originally flagged:

- `src/lib/stories.ts:14`  → kept (topic-required, in title)
- `src/lib/stories.ts:19`  → kept (topic tag)
- `src/lib/stories.ts:51`  → softened to *"các môi trường công nghệ lớn"*
- `src/lib/stories.ts:61`  → softened to *"các công ty lớn"*
- `src/lib/stories.ts:75`  → softened to *"các môi trường lớn"*
- `src/lib/stories.ts:77`  → softened to *"những nơi như vậy"*
- `src/lib/stories.ts:85`  → softened to *"môi trường công nghệ lớn"*
- `src/lib/stories.ts:89`  → softened to *"dù ở đâu"*
- `src/lib/stories.ts:152` (now 218): see issue #3 — title rewritten, tag changed
- `src/lib/stories.ts:157` (now 223): tag `Big Tech` removed
- `src/lib/podcasts.ts:21,29,37,45,54,75,103` → **kept as-is** (these are real Substack episode titles / series names — not negotiable)

**Result:** Story body density dropped from 6 mentions → 0 mentions. Title + topic tag preserved where genuinely required. Podcast titles untouched since they are factual content from the Substack archive.

## 3. Behavioral story sounds a bit too absolute/salesy — ✅ FIXED

Path: `src/lib/stories.ts:217` (slug `pass-coding-fail-behavior`)

| Before | After |
| --- | --- |
| Title: *"Pass coding, fail behavior — kịch bản phổ biến ở Big Tech"* | *"Behavioral interview — phần nhỏ nhưng dễ bị xem nhẹ"* |
| Tags: `["Big Tech", "Interview", "Behavioral"]` | `["Interview", "Behavioral", "Reflection"]` |
| Excerpt: *"phần lớn các bạn không trượt vì code yếu hay system design dở, mà trượt vì một thứ tưởng nhỏ"* | *"Mình gặp khá nhiều case bạn rất giỏi code… nhưng vẫn lỡ offer chỉ vì vòng behavioral. Vài quan sát rất cá nhân, mong hữu ích."* |
| *"đa số các bạn không trượt vì code…"* | *"không ít bạn trượt không phải vì code…"* (observational) |
| *"Ngay cả những anh chị có 10–15 năm kinh nghiệm…"* | *"có những case mình gặp, ứng viên đã đi làm khá lâu…"* (anecdotal, no specific number) |
| *"trong 10 bạn phỏng vấn Amazon, chỉ 1–2 bạn pass…"* | *"hiếm ai pass được phần này nếu chỉ dựa vào 'ứng biến tại chỗ'."* (number removed) |
| *"điều khiến mình vui nhất không phải là số offer học viên nhận được…"* | *"điều khiến mình vui nhất không phải là kết quả cụ thể, mà là những khoảnh khắc các bạn tự tin hơn khi nói về chính mình"* |

## 4. Footer/meta still lead with title and company — ✅ FIXED

Paths:

- `src/lib/config.ts:3`  — `title` simplified from *"Lam Pham — Senior Software Engineer"* to *"Lam Pham"*
- `src/lib/config.ts:5`  — `description` rewritten to: *"Backend engineer in Vietnam. I write about systems, AI-assisted engineering, and a few lessons from building with teams."*
- `src/components/Footer.tsx:17` — footer blurb rewritten to: *"Backend engineer ở Việt Nam. Viết một chút về hệ thống, AI-assisted engineering, và vài bài học khi làm việc với team. Cùng anh em xây EngineerPro. Built with Next.js & một lượng kha khá cà phê sữa đá."*

**Result:** No more credential-first lead in metadata, footer, or page title.

## 5. After fixing — ✅ DONE

Ran:

```sh
npm run build   # ✓ pass — 9 routes generated cleanly into ./docs
```

Lint check via ReadLints on `src/`: no errors.

Note: `npm run lint` is the npm script name (uses eslint). Used `ReadLints` + `npm run build` instead; both clean.

---

## Summary of files touched

- `src/lib/config.ts` — humble title + description; restructured coffee link fields (`coffeeHref` / `coffeeDriveView` / `coffeeDriveEmbed`)
- `src/components/Footer.tsx` — humble blurb
- `src/components/CoffeeButton.tsx` — switched from external `<a>` to internal `<Link>` to `/coffee/`
- `src/app/coffee/page.tsx` — new on-site donation page with embedded Drive preview + fallback
- `src/lib/stories.ts` — softened 6 body lines in `from-aizu-to-nvidia`; rewrote title/tags/excerpt and 3 inline lines in `pass-coding-fail-behavior`
- `next.config.ts` — split `distDir` between dev (`.next/`) and prod (`docs/`) so `make github` no longer breaks the running dev server

All edits preserve the original meaning. Reduce volume, not truth.

## Build check after all fixes

```sh
npm run build   # ✓ pass — 10 routes generated cleanly into ./docs
                # (added /coffee/ on top of the previous 9)
```

Lint clean (`ReadLints` on `src/`).
