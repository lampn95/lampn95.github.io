import type { LocalizedText } from "./stories";

export type Game = {
  slug: string;             // URL part: /play/<slug>/
  emoji: string;            // for the card thumb
  title: LocalizedText;
  blurb: LocalizedText;     // 1-2 lines on the index card
  controls: LocalizedText;  // hint shown above the canvas
  highScoreKey: string;     // localStorage key
  highScoreLabel: LocalizedText; // "Best score" / "Bugs squashed" / etc.
  accent: string;           // tailwind gradient for the card thumb
};

export const games: Game[] = [
  {
    slug: "snake",
    emoji: "🐛",
    title: { en: "Bug Snake",                       vi: "Bug Snake" },
    blurb: {
      en: "Classic snake — but you're a deploy pipeline eating bugs. Hit a wall and the build fails.",
      vi: "Rắn cổ điển — bạn là một deploy pipeline ăn bug. Đụng tường thì build fail.",
    },
    controls: {
      en: "Arrow keys or WASD · swipe / D-pad on mobile",
      vi: "Phím mũi tên hoặc WASD · vuốt / D-pad trên mobile",
    },
    highScoreKey: "lampham-snake-best",
    highScoreLabel: { en: "Bugs squashed", vi: "Bug đã fix" },
    accent: "from-emerald-400 via-lime-400 to-green-400",
  },
  {
    slug: "coffee-catcher",
    emoji: "☕",
    title: { en: "Coffee Catcher",                  vi: "Coffee Catcher" },
    blurb: {
      en: "Sixty seconds. Catch cà phê sữa đá, dodge bugs. Tap or use arrow keys.",
      vi: "60 giây. Bắt cà phê sữa đá, né bug. Bấm hoặc dùng phím mũi tên.",
    },
    controls: {
      en: "Arrow keys · drag / tap left or right on mobile",
      vi: "Phím mũi tên · kéo / bấm trái phải trên mobile",
    },
    highScoreKey: "lampham-coffee-best",
    highScoreLabel: { en: "Coffees caught",         vi: "Cà phê đã bắt" },
    accent: "from-amber-300 via-orange-300 to-rose-300",
  },
  {
    slug: "memory-match",
    emoji: "🧩",
    title: { en: "Tech Memory Match",               vi: "Tech Memory Match" },
    blurb: {
      en: "Flip cards, find pairs of tech logos. Fewer moves wins.",
      vi: "Lật thẻ, tìm cặp logo công nghệ. Càng ít moves càng tốt.",
    },
    controls: {
      en: "Click / tap to flip cards",
      vi: "Click / chạm để lật thẻ",
    },
    highScoreKey: "lampham-memory-best",
    highScoreLabel: { en: "moves",                  vi: "moves" },
    accent: "from-violet-400 via-fuchsia-400 to-cyan-400",
  },
  {
    slug: "type-the-stack",
    emoji: "⌨️",
    title: { en: "Type the Stack",                  vi: "Type the Stack" },
    blurb: {
      en: "Tech names fall from above. Type them before they hit the floor. 60 seconds, three lives.",
      vi: "Tên công nghệ rơi xuống. Gõ trước khi chạm đáy. 60 giây, ba mạng.",
    },
    controls: {
      en: "Type letters · only words starting with that letter activate",
      vi: "Gõ chữ · chỉ word bắt đầu bằng chữ đó được active",
    },
    highScoreKey: "lampham-type-best",
    highScoreLabel: { en: "stacks typed",           vi: "stacks đã gõ" },
    accent: "from-blue-400 via-indigo-400 to-purple-400",
  },
];

export function getGameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}
