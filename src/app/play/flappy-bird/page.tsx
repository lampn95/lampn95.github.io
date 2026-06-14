import type { Metadata } from "next";
import { FlappyBirdGame } from "@/components/games/FlappyBirdGame";

export const metadata: Metadata = {
  title: "Flappy Bird",
  description:
    "A clean-room Flappy Bird tribute. Tap to flap, dodge the pipes. Original art and code.",
};

export default function FlappyBirdPage() {
  return <FlappyBirdGame />;
}
