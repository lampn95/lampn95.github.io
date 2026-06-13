import type { Metadata } from "next";
import { CoffeeCatcherGame } from "@/components/games/CoffeeCatcherGame";

export const metadata: Metadata = {
  title: "Coffee Catcher",
  description:
    "Sixty seconds. Catch cà phê sữa đá, dodge bugs. A tiny browser game.",
};

export default function CoffeeCatcherPage() {
  return <CoffeeCatcherGame />;
}
