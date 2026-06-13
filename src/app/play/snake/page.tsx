import type { Metadata } from "next";
import { SnakeGame } from "@/components/games/SnakeGame";

export const metadata: Metadata = {
  title: "Bug Snake",
  description:
    "Classic snake — you're a deploy pipeline eating bugs. Hit a wall and the build fails.",
};

export default function SnakePage() {
  return <SnakeGame />;
}
