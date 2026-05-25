// Flat key → {en, vi} dictionary. Add new strings here; both langs required.
// Story BODIES are intentionally not translated — those are personal voice.

export type Lang = "en" | "vi";

export const LANGS: Lang[] = ["en", "vi"];
export const DEFAULT_LANG: Lang = "en";

export const translations = {
  // ===== Nav =====
  "nav.about":       { en: "About",       vi: "Giới thiệu" },
  "nav.experience":  { en: "Experience",  vi: "Kinh nghiệm" },
  "nav.projects":    { en: "Projects",    vi: "Dự án" },
  "nav.engineerpro": { en: "EngineerPro", vi: "EngineerPro" },
  "nav.book":        { en: "Book",        vi: "Sách" },
  "nav.podcast":     { en: "Podcast",     vi: "Podcast" },
  "nav.stories":     { en: "Stories",     vi: "Stories" },

  // ===== Hero =====
  "hero.statusPill":  { en: "Open to interesting conversations",
                        vi: "Mở cho những cuộc trò chuyện thú vị" },
  "hero.greeting":    { en: "Hi, I'm",     vi: "Hi, mình là" },
  "hero.subtitle":    { en: "Just an engineer, learning every day.",
                        vi: "Một software engineer, đang học mỗi ngày." },
  "hero.cta.stories": { en: "Read stories", vi: "Đọc Stories" },
  "hero.cta.contact": { en: "Contact",      vi: "Liên hệ" },
  "hero.locationBadge": { en: "Hà Nội, Vietnam", vi: "Hà Nội, Việt Nam" },

  // ===== Coffee buttons =====
  "coffee.primary": { en: "Buy me a coffee",     vi: "Mời mình 1 ly cà phê" },
  "coffee.ghost":   { en: "Buy me a coffee",     vi: "Mời mình 1 ly cà phê" },
  "coffee.aria":    { en: "Buy the author a coffee", vi: "Mời tác giả một ly cà phê" },

  // ===== Experience =====
  "experience.eyebrow":     { en: "Work",
                              vi: "Work" },
  "experience.title":       { en: "A few places I've been by.",
                              vi: "Một vài nơi mình đã ghé qua." },
  "experience.description": { en: "Each chapter — a chance to learn something. About systems. About people. About myself.",
                              vi: "Mỗi chặng là một dịp để học thêm — về hệ thống, về con người, và về chính mình." },

  // ===== Projects =====
  "projects.eyebrow":     { en: "Selected Projects",
                            vi: "Selected Projects" },
  "projects.title":       { en: "Things I build on the side.",
                            vi: "Những thứ mình build ngoài giờ." },
  "projects.description": { en: "Each project is a chance to try an idea, a new stack, or test a belief about architecture. All paired with Claude (design + impl) and Codex (code review).",
                            vi: "Mỗi project là một dịp để thử một idea, một stack mới, hoặc kiểm chứng một niềm tin về kiến trúc. Tất cả đều paired với Claude (design + impl) và Codex (code review)." },
  "projects.openSource":  { en: "Open source on GitHub",
                            vi: "Mở source trên GitHub" },

  // ===== EngineerPro section =====
  "engineerpro.eyebrow":     { en: "EngineerPro", vi: "EngineerPro" },
  "engineerpro.title":       { en: "EngineerPro — learning the fundamentals with people who walked the path before.",
                               vi: "EngineerPro — học nền tảng cùng những người đã đi trước." },
  "engineerpro.description": { en: "I co-built EngineerPro with friends as a small mentor group for Vietnamese engineers. We try to pool what we learned from real work: DSA, backend, system design, and how to prep for interviews in a way that actually lasts.",
                               vi: "Mình cùng anh em xây EngineerPro như một nhóm mentor nhỏ cho kỹ sư Việt Nam. Tụi mình cố gắng gom lại những gì đã học từ công việc thật: DSA, backend, system design, và cách chuẩn bị phỏng vấn một cách bền vững." },
  "engineerpro.cardTitleA":  { en: "Solid fundamentals,", vi: "Học chắc nền tảng," },
  "engineerpro.cardTitleB":  { en: "for a longer run",     vi: "đi đường dài hơn" },
  "engineerpro.cardSubtitle":{ en: "Mentors stay close at each stage.",
                               vi: "Cùng mentor theo sát từng giai đoạn." },
  "engineerpro.copyLead":    { en: "We design clear paths through ",
                               vi: "Tụi mình thiết kế lộ trình rõ ràng từ " },
  "engineerpro.copyTail":    { en: ". Everyone starts from a different point, so the path stays flexible and grounded.",
                               vi: ". Mỗi bạn có xuất phát điểm khác nhau, nên lộ trình cũng cần đủ linh hoạt và thực tế." },
  "engineerpro.mini.mentor":     { en: "Mentor",        vi: "Mentor" },
  "engineerpro.mini.mentorSub":  { en: "people who shipped real products", vi: "đã làm sản phẩm thật" },
  "engineerpro.mini.path":       { en: "Roadmap",       vi: "Lộ trình" },
  "engineerpro.mini.pathSub":    { en: "clear, step by step", vi: "rõ từng bước" },
  "engineerpro.mini.community":  { en: "Community",     vi: "Cộng đồng" },
  "engineerpro.mini.communitySub":{ en: "learning together", vi: "học cùng nhau" },
  "engineerpro.mentors":         { en: "A few mentors", vi: "Một vài mentor" },
  "engineerpro.moreMentors":     { en: "… and a few more from Acronis, Microsoft, TikTok…",
                                   vi: "… và vài anh em khác từng làm ở Acronis, Microsoft, TikTok…" },
  "engineerpro.cta":             { en: "Explore EngineerPro", vi: "Khám phá EngineerPro" },

  // ===== Book section =====
  "book.eyebrow":     { en: "Note · Book",   vi: "Note · Book" },
  "book.title":       { en: "Co-authored a small book.",
                        vi: "Đồng tác giả một cuốn sách nhỏ." },
  "book.description": { en: "Co-wrote a free book on DSA coding interviews with Lê Quang Hoà, sponsored by EngineerPro.",
                        vi: "Cùng anh Lê Quang Hoà biên soạn một cuốn sách miễn phí về DSA coding interview, dưới sự bảo trợ của EngineerPro." },
  "book.cardTitle":   { en: "Coding DSA Interview — with solutions.",
                        vi: "Coding DSA Interview — kèm lời giải." },
  "book.copyLead":    { en: "A collection of common DSA problems asked in technical interviews, with Python 3 solutions, complexity analysis, and interview pitfalls. Learn by ",
                        vi: "Cuốn sách tổng hợp các bài DSA thường gặp trong phỏng vấn kỹ thuật, kèm lời giải Python 3, phân tích độ phức tạp, và các bẫy phỏng vấn. Học theo " },
  "book.pattern":     { en: "pattern", vi: "pattern" },
  "book.copyTail":    { en: ", not by memorising every problem. Completely free for the community.",
                        vi: ", không phải học vẹt từng bài. Hoàn toàn miễn phí cho cộng đồng." },
  "book.stat.problems":   { en: "problems", vi: "bài tập" },
  "book.stat.patterns":   { en: "patterns", vi: "patterns" },
  "book.stat.freeLabel":  { en: "Free", vi: "Free" },
  "book.stat.freeSub":    { en: "open to everyone", vi: "mở cho cộng đồng" },
  "book.cta":         { en: "Open the book", vi: "Mở sách" },
  "book.credit":      { en: "Co-authors: Phạm Ngọc Lâm · Lê Quang Hoà — 2026.",
                        vi: "Đồng tác giả: Phạm Ngọc Lâm · Lê Quang Hoà — 2026." },

  // ===== Podcast section =====
  "podcast.eyebrow":     { en: "Podcast · Notes by voice",
                           vi: "Podcast · Ghi chép bằng giọng nói" },
  "podcast.title":       { en: "Coffee with Lam.",
                           vi: "Coffee with Lam." },
  "podcast.descriptionPrefix": { en: "A podcast I record on the EngineerPro channel — sometimes I talk about technical-interview questions, sometimes about engineering culture, system design, monitoring, e2e encryption… ",
                                 vi: "Series podcast mình ghi lại trên kênh EngineerPro — lúc thì bình luận đề phỏng vấn kỹ thuật, lúc thì bàn về văn hoá engineering, system design, monitoring, e2e encryption… " },
  "podcast.descriptionTail": { en: "episodes on Spotify and Substack.",
                               vi: "episode trên Spotify và Substack." },
  "podcast.totalLabel":  { en: "Currently",  vi: "Hiện có" },
  "podcast.showMore":    { en: "Show {n} more episodes", vi: "Xem thêm {n} episode" },
  "podcast.collapse":    { en: "Collapse",                vi: "Thu gọn" },

  // ===== Skills section =====
  "skills.eyebrow":   { en: "Skills & Education", vi: "Skills & Education" },
  "skills.title":     { en: "Stack & foundations.", vi: "Stack & nền tảng." },

  // ===== Stories preview (on home) =====
  "storiesPreview.eyebrow":     { en: "Stories", vi: "Stories" },
  "storiesPreview.title":       { en: "A few notes.", vi: "Vài ghi chép." },
  "storiesPreview.description": { en: "Not tutorials. Not clickbait. Just things I'm slowly learning from work, from failure, and from a few honest conversations. (Stories are written in Vietnamese.)",
                                  vi: "Không phải tutorial. Không phải clickbait. Chỉ là những điều mình đang học dần từ công việc, thất bại, và vài cuộc trò chuyện tử tế." },
  "storiesPreview.readMore":    { en: "Read more", vi: "Đọc tiếp" },
  "storiesPreview.seeAll":      { en: "See all stories", vi: "Xem tất cả stories" },

  // ===== Stories list page =====
  "storiesList.eyebrow":     { en: "Stories", vi: "Stories" },
  "storiesList.title":       { en: "A few notes.", vi: "Vài ghi chép." },
  "storiesList.description": { en: "No tutorials. No clickbait. Just a few things I'm slowly learning from work, from stumbles, and from people met along the way. (Posts are written in Vietnamese.)",
                               vi: "Không tutorial. Không clickbait. Chỉ vài điều mình đang học dần từ công việc, những lần vấp, và những người đã gặp trên đường." },
  "storiesList.read":        { en: "Read", vi: "Đọc" },
  "storiesList.coffeeNote":  { en: "Liked a piece? Buy me a coffee — every bit keeps me writing.",
                               vi: "Thấy bài nào hay? Mời mình 1 ly cà phê nhé — mọi ủng hộ đều giúp mình viết tiếp." },
  "storiesList.viNote":      { en: "Vietnamese", vi: "Tiếng Việt" },

  // ===== Story detail page =====
  "storyDetail.allStories":  { en: "All stories", vi: "All stories" },
  "storyDetail.home":        { en: "Home →",      vi: "Home →" },
  "storyDetail.coffeeCard":  { en: "If this piece was useful — buy me a coffee.\nIt's what keeps me writing.",
                               vi: "Nếu bài viết hữu ích với bạn — mời mình một ly cà phê nhé.\nĐây là động lực để mình viết tiếp." },
  "storyDetail.viBanner":    { en: "This post is in Vietnamese. Toggle the language in the navbar for the rest of the site in English.",
                               vi: "" },

  // ===== Coffee CTA section (homepage bottom) =====
  "coffeeCta.title":       { en: "Content's free. Coffee isn't.",
                             vi: "Nội dung free, nhưng cà phê thì có giá." },
  "coffeeCta.description": { en: "If a story, a project, or an idea here helped you out — you can buy me a coffee via the Vietnamese banking QR. Every contribution means a lot.",
                             vi: "Nếu một story, một project, hay một ý ở đây giúp được bạn — bạn có thể mời mình một ly cà phê qua QR banking VN. Mọi đóng góp đều rất rất quý." },
  "coffeeCta.closing":     { en: "Thanks for stopping by.",
                             vi: "Cảm ơn bạn đã ghé qua." },

  // ===== Coffee dedicated page =====
  "coffeePage.back":         { en: "Back home",     vi: "Về trang chủ" },
  "coffeePage.title":        { en: "Buy me a coffee.", vi: "Mời mình một ly cà phê." },
  "coffeePage.description":  { en: "Thanks for stopping by. If a post, a podcast, or an idea here helped you out — scan the QR below to buy me a coffee. Every bit means a lot.",
                               vi: "Cảm ơn anh chị em đã ghé qua. Nếu một bài, một podcast, hay một ý ở đây giúp được bạn — bạn có thể quét mã QR bên dưới để mời mình một ly. Mọi đóng góp đều rất quý." },
  "coffeePage.scanHint":     { en: "Scan with any Vietnamese banking app (MoMo, Vietcombank, Techcombank…). If the preview above doesn't load, open the file directly:",
                               vi: "Quét bằng app ngân hàng VN (MoMo, Vietcombank, Techcombank…). Nếu khung trên không load được, mở trực tiếp file:" },
  "coffeePage.openDrive":    { en: "Open on Drive", vi: "Mở trên Drive" },
  "coffeePage.thanks":       { en: "Thank you so much.", vi: "Cảm ơn bạn rất nhiều." },
  "coffeePage.readStories":  { en: "Read stories →", vi: "Đọc stories →" },

  // ===== Footer =====
  "footer.tagline":     { en: "Backend engineer in Vietnam. I write a bit about systems, AI-assisted engineering, and a few lessons from working with teams. Co-built ",
                          vi: "Backend engineer ở Việt Nam. Viết một chút về hệ thống, AI-assisted engineering, và vài bài học khi làm việc với team. Cùng anh em xây " },
  "footer.taglineTail": { en: " with friends. Built with Next.js & a fair amount of cà phê sữa đá.",
                          vi: ". Built with Next.js & một lượng kha khá cà phê sữa đá." },
  "footer.copyright":   { en: "All rights reserved.", vi: "All rights reserved." },

  // ===== Language toggle aria =====
  "langToggle.aria":    { en: "Switch language",     vi: "Đổi ngôn ngữ" },
} as const;

export type TranslationKey = keyof typeof translations;

export function tr(lang: Lang, key: TranslationKey): string {
  return translations[key][lang];
}
