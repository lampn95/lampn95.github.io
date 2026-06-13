import type { Metadata } from "next";
import { PlayIndexView } from "@/components/PlayIndexView";

export const metadata: Metadata = {
  title: "Play",
  description:
    "Three tiny browser games — Bug Snake, Coffee Catcher, Tech Memory Match. Pure JS, no leaderboards, no ads.",
};

export default function PlayIndexPage() {
  return <PlayIndexView />;
}
