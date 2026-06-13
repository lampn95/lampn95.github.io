import type { Metadata } from "next";
import { MemoryMatchGame } from "@/components/games/MemoryMatchGame";

export const metadata: Metadata = {
  title: "Tech Memory Match",
  description:
    "Flip cards, find pairs of tech logos — React, Vue, Go, Rust… Fewer moves wins.",
};

export default function MemoryMatchPage() {
  return <MemoryMatchGame />;
}
