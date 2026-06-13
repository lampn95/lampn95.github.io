import type { Metadata } from "next";
import { TypeTheStackGame } from "@/components/games/TypeTheStackGame";

export const metadata: Metadata = {
  title: "Type the Stack",
  description:
    "Tech names fall from above. Type them before they hit the floor. 60 seconds, three lives.",
};

export default function TypeTheStackPage() {
  return <TypeTheStackGame />;
}
