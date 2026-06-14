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

  const restart = useCallback(() => {
    // Quickest way to restart this kind of vanilla-JS game: reload the iframe.
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
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
            onClick={restart}
            aria-label="Restart"
            title="Restart"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative mt-4 flex justify-center">
          {/* The iframe loads the upstream's index.html verbatim. Aspect-ratio
             keeps the 762:720 (~1.058) canvas shape under any width. */}
          <iframe
            ref={iframeRef}
            src={asset("/mario/index.html")}
            title="Super Mario Bros 1-1"
            className={
              "rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)] " +
              (isFullscreen ? "" : "w-full max-w-[min(95vmin,762px)]")
            }
            style={
              isFullscreen
                ? {
                    width: "min(95vmin, calc(100vw - 32px))",
                    height: "calc(min(95vmin, calc(100vw - 32px)) * 720 / 762)",
                    maxHeight: "calc(100vh - 140px)",
                  }
                : {
                    aspectRatio: "762 / 720",
                    height: "auto",
                  }
            }
            allow="autoplay; fullscreen"
            tabIndex={0}
            onLoad={(e) => {
              // Focus the iframe so the keyboard events land in the game
              // window straight away — without this the player has to click
              // the canvas first.
              try { e.currentTarget.contentWindow?.focus(); } catch { /* cross-origin (n/a here) */ }
            }}
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
