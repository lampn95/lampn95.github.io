import type { Metadata } from "next";
import { TankBattleGame } from "@/components/games/TankBattleGame";

export const metadata: Metadata = {
  title: "Tank Battle",
  description:
    "A small tribute to Battle City (Tank 1990). Random map each round. Bust five enemy tanks to win.",
};

export default function TankBattlePage() {
  return <TankBattleGame />;
}
