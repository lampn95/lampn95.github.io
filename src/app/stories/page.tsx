import type { Metadata } from "next";
import { StoriesListView } from "@/components/StoriesListView";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "A few notes on career, AI-assisted engineering, EngineerPro, and things I'm slowly learning. Available in English and Vietnamese.",
};

export default function StoriesIndexPage() {
  return <StoriesListView />;
}
