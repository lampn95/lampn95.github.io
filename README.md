# lampham.dev — portfolio + stories

Portfolio + blog "kể chuyện" của Lam Pham.
Stack: **Next.js 16 (App Router) + Tailwind 4 + Framer Motion**, static-exported vào `./docs/` để deploy lên **GitHub Pages**.

---

## Bắt đầu

```bash
make install     # npm install
make dev         # chạy http://localhost:3000
```

## Build cho GitHub Pages

```bash
make github
```

Lệnh này sẽ:

1. Xoá `./docs/` cũ.
2. Chạy `next build` với `output: 'export'` → đổ HTML/JS/CSS tĩnh vào `./docs/`.
3. Tạo file `docs/.nojekyll` (để GitHub Pages không xử lý qua Jekyll → giữ nguyên thư mục `_next/`).

Sau khi build:

```bash
git add docs/ -A
git commit -m "Deploy site"
git push
```

Trên GitHub: **Settings → Pages → Source: "Deploy from a branch" → Branch: `main` / Folder: `/docs`**. Site sẽ xuất hiện tại `https://<username>.github.io/`.

> Nếu bạn deploy vào **project page** (repo không phải `<username>.github.io`), thêm `basePath: '/<repo-name>'` và `assetPrefix: '/<repo-name>/'` vào `next.config.ts`.

## Cấu trúc

```
src/
├── app/
│   ├── layout.tsx              # Layout chung (Navbar + Footer)
│   ├── page.tsx                # Trang chủ portfolio
│   ├── globals.css             # Tailwind + custom styles (aurora, glass, prose-story)
│   ├── coffee/page.tsx         # Trang QR banking (mời cà phê)
│   └── stories/
│       ├── page.tsx            # Danh sách story
│       └── [slug]/page.tsx     # Trang chi tiết story
├── components/                 # Hero, Experience, Projects, EngineerPro, Book, Podcasts, ...
└── lib/
    ├── config.ts               # Tên, email, social, link coffee
    ├── data.ts                 # Dữ liệu CV (experiences, skills, education)
    ├── stories.ts              # Nội dung bài viết (markdown)
    └── podcasts.ts             # Danh sách podcast episodes

.cursor/skills/
└── lampham-humble-story/       # Skill: editorial guidelines cho /stories/
    └── SKILL.md
```

## Viết story mới — đọc skill này TRƯỚC khi nhờ agent

**Quan trọng**: tất cả story trên site được viết theo một tone cụ thể (humble, mộc, không salesy, không brag số má). Khi nhờ AI viết bài mới hoặc rewrite từ Substack, **hãy bảo agent đọc skill** này trước:

```
.cursor/skills/lampham-humble-story/SKILL.md
```

Skill này encode đầy đủ:

- Voice + first-person Vietnamese ("mình")
- Hard rules (không brag công ty cụ thể, không số liệu không có nguồn, không sales pitch closing…)
- Cách crawl + rewrite content từ EngineerPro Substack
- Title / excerpt / body structure patterns
- Reference các story mẫu đã có trong repo

Nhờ agent kiểu: *"Crawl bài X từ Substack rồi viết lại theo `.cursor/skills/lampham-humble-story/SKILL.md`"* → agent sẽ tuân thủ tone.

Còn về mặt kỹ thuật, mỗi story là một object trong `src/lib/stories.ts`:

```ts
{
  slug: "ten-bai-viet",
  title: "Tiêu đề",
  excerpt: "Mô tả ngắn xuất hiện ở trang list.",
  date: "2026-05-24",
  readingTime: "5 min",
  tags: ["Career"],
  content: `
Nội dung Markdown ở đây.

## Heading

**bold**, *italic*, [link](https://...), code blocks, danh sách...
  `.trim(),
}
```

Chạy `make github` → bài tự xuất hiện ở `/stories/` với URL `/stories/ten-bai-viet/`.

## Nút "Buy me a coffee" (QR banking VN)

CTA cà phê (xuất hiện ở Navbar, Hero, Footer, cuối mỗi story, section CoffeeCTA) đều
trỏ tới trang nội bộ `/coffee/` — trang này nhúng QR PDF từ Drive thẳng trong iframe
+ fallback "Mở trên Drive". Cấu hình trong `src/lib/config.ts`:

```ts
coffeeHref: "/coffee/",                                          // CTA đích
coffeeDriveView: "https://drive.google.com/file/d/<ID>/view?usp=sharing",   // fallback
coffeeDriveEmbed: "https://drive.google.com/file/d/<ID>/preview",          // iframe src
```

Đổi QR mới: upload PDF/ảnh mới lên Drive (Anyone with the link), copy `<FILE_ID>` và
thay vào 2 link trên.

## Cập nhật thông tin cá nhân

- **Email, social, location, coffee link**: `src/lib/config.ts`
- **Experiences, skills, education**: `src/lib/data.ts`
- **Podcast episodes**: `src/lib/podcasts.ts`
- **Mentors EngineerPro**: `src/components/EngineerProSection.tsx` (mảng `mentors`)
- **Book card**: `src/components/Book.tsx`

## Editorial style for any AI-assisted writing

Trước khi nhờ AI viết / sửa bất kỳ copy nào trên site (story, excerpt, section description),
yêu cầu agent đọc `.cursor/skills/lampham-humble-story/SKILL.md`. File đó là source of
truth cho tone & voice. Khi tone bị drift (vd. trở lại salesy / brag-y), tham khảo
`issue/humble-copy-review.md` — đây là log các quyết định biên tập trước đó.

## Makefile targets

| Lệnh | Mô tả |
|------|-------|
| `make install` | Cài dependencies |
| `make dev` | Dev server tại http://localhost:3000 |
| `make github` | Build site tĩnh vào `./docs/` cho GitHub Pages |
| `make build` | Alias của `make github` |
| `make clean` | Xoá `docs/`, `.next/`, cache |
