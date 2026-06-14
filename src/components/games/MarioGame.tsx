"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, RotateCw } from "lucide-react";
import { asset } from "@/lib/config";
import { games } from "@/lib/games";
import { GameShell } from "./GameShell";

/**
 * Embeds the MIT-licensed JS port of Super Mario Bros 1-1 by Garrett Johnson
 * (https://github.com/reruns/mario) into a Next.js page. The game is a
 * vanilla-JS canvas app that calls `document.createElement` and a bunch of
 * globals — wiring it directly into React's lifecycle would be a hassle, so
 * we serve the original index.html from /public/mario/ and iframe it. The
 * iframe size matches the upstream's 762×720 render target.
 */
export function MarioGame() {
  const game = games.find((g) => g.slug === "mario")!;
  const wrapRef  = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (wrapRef.current) {
        await wrapRef.current.requestFullscreen();
      }
    } catch { /* iOS / Safari can reject — fail silently */ }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => setIsFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Refocus the iframe so keys land in the game window. Called after every
  // HUD button click (clicking a button moves focus to it) and on the very
  // first load so the player doesn't have to click the canvas before keys
  // work.
  const refocusGame = useCallback(() => {
    try { iframeRef.current?.contentWindow?.focus(); } catch { /* same-origin only */ }
  }, []);

  const restart = useCallback(() => {
    // Quickest way to restart this vanilla-JS game: reload the iframe.
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
    // The onLoad handler below will refocus once the new document is ready.
  }, []);

  // The upstream input handler doesn't call preventDefault on arrow keys.
  // While the iframe has focus that's fine (the iframe document captures
  // them), but the moment focus drifts to my HUD button or the Next.js
  // shell, the next ↑/↓ scrolls the page. Swallow those keys in the
  // wrapper while the game is active.
  useEffect(() => {
    const swallow = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        // Don't preventDefault if the active element is in our HUD buttons
        // — let the user tab around the controls if they want.
        const ae = document.activeElement as HTMLElement | null;
        if (ae && ae.tagName === "BUTTON") return;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", swallow);
    return () => window.removeEventListener("keydown", swallow);
  }, []);

  return (
    <GameShell game={game}>
      <div
        ref={wrapRef}
        className={
          isFullscreen
            ? "fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-3 p-4 overflow-auto"
            : ""
        }
      >
        <div className="flex items-center justify-between gap-2 text-sm font-mono flex-wrap">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="text-white/45">Move: </span>
            <span className="text-white">← → ↑ ↓</span>
            <span className="text-white/30 mx-2">·</span>
            <span className="text-white/45">Jump: </span>
            <span className="text-white">X</span>
            <span className="text-white/30 mx-2">·</span>
            <span className="text-white/45">Run: </span>
            <span className="text-white">Z</span>
          </div>
          <button
            type="button"
            onClick={() => { restart(); /* iframe onLoad refocuses */ }}
            aria-label="Restart"
            title="Restart"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={async () => { await toggleFullscreen(); refocusGame(); }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>

        {/* Sized box around the iframe — aspect-ratio + viewport-based caps
            keep the 762:720 canvas snug in both normal and fullscreen modes
            without relying on hand-calculated heights. */}
        <div
          className="relative mt-4 mx-auto rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden"
          style={
            isFullscreen
              ? {
                  width: "min(calc(100vw - 32px), calc((100vh - 100px) * 762 / 720))",
                  aspectRatio: "762 / 720",
                }
              : {
                  width: "100%",
                  maxWidth: "762px",
                  aspectRatio: "762 / 720",
                }
          }
          onClick={refocusGame}
        >
          <iframe
            ref={iframeRef}
            src={asset("/mario/index.html")}
            title="Super Mario Bros 1-1"
            className="block w-full h-full bg-black"
            allow="autoplay; fullscreen"
            tabIndex={0}
            onLoad={refocusGame}
          />
        </div>

        <p className="mt-4 text-center text-[11px] text-white/40 font-mono px-4 max-w-[640px] mx-auto">
          MIT clone by{" "}
          <a
            href="https://github.com/reruns/mario"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 hover:underline"
          >
            Garrett Johnson
          </a>
          {" "}— graphics & sounds © Nintendo. Click the canvas if keys don&apos;t respond.
        </p>
      </div>
    </GameShell>
  );
}
