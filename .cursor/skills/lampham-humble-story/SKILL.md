---
name: lampham-humble-story
description: Write Vietnamese first-person blog posts for Lam Pham's portfolio at /stories/ in a humble, reflective tone — no salesy claims, no company brags, no unsupported numbers. Use when the user asks to add a new story, rewrite an existing one, or crawl a post from EngineerPro's Substack and adapt it for the portfolio.
---

# Lam Pham — Humble story writing

These are the editorial guidelines for any new or rewritten post under `/stories/` on `lampham.github.io`. Stories should read like personal reflection — not a course pitch, not a LinkedIn flex.

## Where stories live

- File: `src/lib/stories.ts`
- Each story is one object in the `stories: Story[]` array
- Schema:

```ts
{
  slug: "kebab-case-slug",
  title: "...",
  excerpt: "1-2 sentence hook for the /stories/ list",
  date: "YYYY-MM-DD",
  readingTime: "X min",
  tags: ["..."],
  content: `markdown here`.trim(),
}
```

- The `/stories/` index sorts by `date` descending. Insert new items into the array in chronological position to keep the file readable.
- Each story gets a static URL `/stories/<slug>/` via `generateStaticParams` in `src/app/stories/[slug]/page.tsx`.

## Voice

- **First person Vietnamese**: always *"mình"*. Never *"tôi"*, *"I"*, or *"Lam Pham"*.
- **Conversational, mộc**: write like talking to a friend at a coffee shop.
- **Reflective, not instructional**: share observations, not directives.

## Hard rules — these break the humble tone

1. **No specific company brags** in body copy. Do not name *"NVIDIA"*, *"TikTok"*, *"Grab"*, *"Shopee"* as places where *you* worked or solved something. Use *"một công ty công nghệ lớn"* or *"một môi trường lớn"* instead. Exception: when the topic genuinely requires the name (e.g. *"17 Leadership Principles của Amazon"*) — then use it sparingly, once or twice.
2. **No unsupported numbers**. Avoid *"50k QPS"*, *"200M users"*, *"1500+ mentee"*, *"trong 10 bạn thì 1-2 bạn pass"*, *"99% success rate"*. If a number must appear, frame it as observation: *"theo quan sát của mình…"* and prefer a range over a pinpoint.
3. **No mentor-credential lists**. Don't write *"Đông (Shopee Senior), Harry (TikTok Lead), Chương (Google)…"* — say *"anh em"* or *"mấy người bạn"*.
4. **No absolute generalisations**. Soften:
   - *"đa số các bạn…"* → *"không ít bạn…"* or *"mình gặp khá nhiều case…"*
   - *"phần lớn không trượt vì…"* → *"có nhiều case mình thấy…"*
   - *"Big Tech sẽ nói với bạn…"* → *"các môi trường công nghệ lớn hay nói…"*
5. **Vary "Big Tech" mentions** to lower density:
   - At most 1–2 *"Big Tech"* mentions per story (usually only in the title/tag if the topic requires)
   - Other mentions: *"công ty công nghệ lớn"*, *"môi trường công nghệ lớn"*, *"các công ty lớn"*, *"phỏng vấn kỹ thuật"*, *"môi trường sản phẩm lớn"*
6. **No salesy closings**. End with reflection, not calls-to-action like *"đăng ký khoá học"*, *"join cộng đồng"*, *"đừng ngần ngại nhắn tin để được tư vấn"*. If contact is invited, frame humbly: *"không phải để bán khoá học, chỉ để chỉ đường"*.
7. **No success-metric vanity**: avoid *"số offer học viên nhận được"*, *"số mentee chinh phục Big Tech"*. Substitute with *"khoảnh khắc các bạn tự tin hơn"*, *"việc các bạn trưởng thành trong tư duy"*.

## Sourcing from EngineerPro Substack

When the user asks to crawl + rewrite an EngineerPro post:

1. Fetch via `WebFetch` on the article URL, or the Substack archive API for indexes:
   - All posts: `https://engineerprovn.substack.com/api/v1/archive?sort=new&offset=N&limit=30`
   - Podcasts only: append `&type=podcast`
   - Filter to real audio: keep only entries with `podcast_upload_id` set
2. Keep the **insight**, drop the **branding**:
   - Strip the *"Diễn giả: Anh Lâm Phạm – Mentor tại EngineerPro, Senior Software Engineer tại TikTok…"* signature footers.
   - Strip role mentions like *"Engineering Manager tại một ngân hàng ở Hà Nội"* (may not match current role anyway).
   - Convert *"tôi"* → *"mình"* throughout.
   - Soften absolute claims per the Hard rules above.
3. Title: avoid translating Substack ALL-CAPS clickbait literally. Prefer something quiet (see patterns below).

## Title patterns that fit the tone

- *"Vài ghi chép về [chủ đề] — và [insight]"*
- *"Một lần [trải nghiệm cụ thể]"*
- *"Vì sao mình [hành động]"*
- *"[Chủ đề] — phần [adjective] nhưng [counter-adjective]"*

Avoid ALL-CAPS, *"BÍ KÍP"*, *"TUYỆT CHIÊU"*, *"CHIẾN LƯỢC"*, anything that screams course-landing-page.

## Excerpt patterns

- 1–2 sentences, conversational.
- Should make a tired reader stop scrolling — by being human, not by promising results.
- Good examples currently in the repo:
  - *"Không phải bí kíp đậu phỏng vấn. Chỉ là một vài quan sát rất cá nhân…"*
  - *"Mình gặp khá nhiều case bạn rất giỏi code, system design ổn, nhưng vẫn lỡ offer chỉ vì vòng behavioral. Vài quan sát rất cá nhân, mong hữu ích."*

## Body structure

- Lead with a small, concrete moment — not a thesis statement.
- 2–5 `## H2` sections is usually right.
- Use `> blockquote` for self-talk, dialog, or hypothetical user voice.
- Closing section is reflection, not exhortation.
- Optional kicker: a quiet one-liner that lands (e.g. *"gọi điện về cho mẹ"*).

## After writing

1. Add the story object to `src/lib/stories.ts` at the correct chronological position.
2. Run `npm run build` to verify the static export (`/stories/<slug>/index.html` is generated).
3. Open the dev server (`make dev` → `http://localhost:3000/stories/`) and visually confirm the new story appears at the top.
4. If the change is editorial (not just a new post), update `issue/humble-copy-review.md` with a short note about what changed and why.

## Files this skill touches

- `src/lib/stories.ts` — story content (the main file)
- `src/lib/podcasts.ts` — only if the story is paired with a real podcast episode
- `issue/humble-copy-review.md` — editorial decision log

This skill does **not** touch:

- `src/lib/data.ts` (CV / experience — separate concern)
- `src/lib/config.ts` (site identity)
- Any component file (UI layout)

## Reference examples (already in the repo, follow their tone)

- `slug: "from-aizu-to-nvidia"` — culture observations, no body Big-Tech mentions, no specific company brags
- `slug: "co-founder-engineerpro"` — explanation of motivation without sales pitch
- `slug: "gap-lai-hoc-tro-trong-phong-van"` — narrative around a single moment
- `slug: "pass-coding-fail-behavior"` — observation-framed (*"mình gặp khá nhiều case…"*), no unsupported numbers, calm title
