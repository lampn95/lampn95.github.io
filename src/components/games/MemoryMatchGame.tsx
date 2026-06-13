"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { games } from "@/lib/games";
import { useLang, useT } from "@/lib/i18n";
import { GameShell } from "./GameShell";

type Pair = {
  id: string;
  emoji: string;
  label: { en: string; vi: string };
};

const PAIRS: Pair[] = [
  { id: "fe",      emoji: "⚛️", label: { en: "React",     vi: "React" } },
  { id: "vue",     emoji: "💚", label: { en: "Vue",       vi: "Vue" } },
  { id: "go",      emoji: "🐹", label: { en: "Go",        vi: "Go" } },
  { id: "rust",    emoji: "🦀", label: { en: "Rust",      vi: "Rust" } },
  { id: "ts",      emoji: "🟦", label: { en: "TypeScript",vi: "TypeScript" } },
  { id: "py",      emoji: "🐍", label: { en: "Python",    vi: "Python" } },
  { id: "k8s",     emoji: "☸️", label: { en: "Kubernetes",vi: "Kubernetes" } },
  { id: "docker",  emoji: "🐳", label: { en: "Docker",    vi: "Docker" } },
];

type Card = {
  uid: number;     // unique within a single deal
  pairId: string;
  state: "down" | "up" | "matched";
};

export function MemoryMatchGame() {
  const game = games.find((g) => g.slug === "memory-match")!;
  const t = useT();
  const { lang } = useLang();
  // Memory Match: "best" = FEWEST moves, so it uses a custom inline storage
  // rather than the shared useBestScore() hook (which is for higher-is-better).
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(game.highScoreKey);
      if (raw != null) setBest(Number(raw));
    } catch {
      /* ignore */
    }
  }, [game.highScoreKey]);
  const submitBest = (moves: number) => {
    setBest((prev) => {
      if (prev != null && moves >= prev) return prev;
      try {
        localStorage.setItem(game.highScoreKey, String(moves));
      } catch {
        /* ignore */
      }
      return moves;
    });
  };

  const [cards, setCards] = useState<Card[]>(() => shuffle());
  const [openA, setOpenA] = useState<number | null>(null);
  const [openB, setOpenB] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const allMatched = useMemo(
    () => cards.every((c) => c.state === "matched"),
    [cards],
  );

  // When the player has flipped two cards, resolve after a short delay.
  useEffect(() => {
    if (openA == null || openB == null) return;
    setLocked(true);
    setMoves((m) => m + 1);

    const a = cards.find((c) => c.uid === openA);
    const b = cards.find((c) => c.uid === openB);
    if (!a || !b) {
      setLocked(false);
      return;
    }

    if (a.pairId === b.pairId) {
      // Match — keep up, leave for the win check below.
      const timer = setTimeout(() => {
        setCards((cur) =>
          cur.map((c) =>
            c.uid === a.uid || c.uid === b.uid ? { ...c, state: "matched" } : c,
          ),
        );
        setOpenA(null);
        setOpenB(null);
        setLocked(false);
      }, 360);
      return () => clearTimeout(timer);
    } else {
      // Mismatch — flip back.
      const timer = setTimeout(() => {
        setCards((cur) =>
          cur.map((c) =>
            c.uid === a.uid || c.uid === b.uid ? { ...c, state: "down" } : c,
          ),
        );
        setOpenA(null);
        setOpenB(null);
        setLocked(false);
      }, 700);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openA, openB]);

  // Win → submit moves as best (lower = better).
  useEffect(() => {
    if (allMatched && moves > 0) submitBest(moves);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  const flip = useCallback(
    (uid: number) => {
      if (locked) return;
      const card = cards.find((c) => c.uid === uid);
      if (!card || card.state !== "down") return;
      setCards((cur) =>
        cur.map((c) => (c.uid === uid ? { ...c, state: "up" } : c)),
      );
      if (openA == null) setOpenA(uid);
      else if (openB == null) setOpenB(uid);
    },
    [cards, locked, openA, openB],
  );

  const restart = () => {
    setCards(shuffle());
    setOpenA(null);
    setOpenB(null);
    setMoves(0);
    setLocked(false);
  };

  const isNewBest = allMatched && best != null && moves <= best;

  return (
    <GameShell game={game}>
      <div className="flex items-center justify-between gap-3 text-sm font-mono flex-wrap">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="text-white/45">{t("game.score")}: </span>
          <span className="text-white font-semibold">{moves}</span>
          <span className="text-white/45"> moves</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="text-white/45">{t("game.best")}: </span>
          <span className="text-white font-semibold">
            {best != null ? `${best} moves` : "—"}
          </span>
        </div>
        <button
          onClick={restart}
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 h-9 text-sm text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          {t("game.restart")}
        </button>
      </div>

      <div className="relative mt-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
          {cards.map((c) => (
            <CardTile
              key={c.uid}
              card={c}
              onClick={() => flip(c.uid)}
              labelLang={lang}
            />
          ))}
        </div>

        {allMatched && (
          <div className="absolute inset-0 rounded-2xl backdrop-blur-sm bg-black/55 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-2xl">🎉</div>
            <p className="text-lg font-semibold text-white">{t("memory.win")}</p>
            <p className="text-sm text-white/65">
              {t("memory.winHint", { n: moves })}
            </p>
            <p className="text-sm font-mono text-white/55">
              {t("game.best")}:{" "}
              <span className="text-white">
                {best != null ? Math.min(best, moves) : moves} moves
              </span>
            </p>
            {isNewBest && (
              <p className="text-sm text-amber-300 font-medium">{t("game.newBest")}</p>
            )}
            <button
              onClick={restart}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-white text-black px-5 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              {t("game.restart")}
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}

function CardTile({
  card,
  onClick,
  labelLang,
}: {
  card: Card;
  onClick: () => void;
  labelLang: "en" | "vi";
}) {
  const pair = PAIRS.find((p) => p.id === card.pairId)!;
  const isUp = card.state !== "down";
  const isMatched = card.state === "matched";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isUp}
      aria-label={isUp ? pair.label[labelLang] : "Hidden card"}
      className="relative aspect-square w-full select-none"
      style={{ perspective: "800px" }}
    >
      <span
        className="absolute inset-0 transition-transform duration-300"
        style={{
          transformStyle: "preserve-3d",
          transform: isUp ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back face */}
        <span
          className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 flex items-center justify-center text-white/30 text-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          ?
        </span>
        {/* Front face */}
        <span
          className={`absolute inset-0 rounded-xl border ${
            isMatched
              ? "border-emerald-400/40 bg-emerald-400/[0.08]"
              : "border-white/15 bg-white/[0.05]"
          } flex flex-col items-center justify-center gap-1`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-3xl sm:text-4xl">{pair.emoji}</span>
          <span className="text-[10px] sm:text-xs font-medium text-white/75">
            {pair.label[labelLang]}
          </span>
        </span>
      </span>
    </button>
  );
}

function shuffle(): Card[] {
  // 8 pairs → 16 cards. Each card needs a uid.
  const deck = PAIRS.flatMap<Card>((p, i) => [
    { uid: i * 2,     pairId: p.id, state: "down" },
    { uid: i * 2 + 1, pairId: p.id, state: "down" },
  ]);
  // Fisher–Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
