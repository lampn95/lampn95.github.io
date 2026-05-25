import type { Metadata } from "next";
import { CoffeePageView } from "@/components/CoffeePageView";

export const metadata: Metadata = {
  title: "Buy me a coffee",
  description:
    "Vietnamese banking QR — scan it with your banking app to buy the author a coffee. Every contribution means a lot.",
};

export default function CoffeePage() {
  return <CoffeePageView />;
}
