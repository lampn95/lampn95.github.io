import type { Metadata } from "next";
import { MarioGame } from "@/components/games/MarioGame";

export const metadata: Metadata = {
  title: "Super Mario Bros 1-1",
  description:
    "An MIT-licensed JS clone of Super Mario Bros. (NES) by Garrett Johnson — embedded as a tribute on lampn.dev.",
};

export default function MarioPage() {
  return <MarioGame />;
}
