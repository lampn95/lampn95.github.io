import { Hero } from "@/components/Hero";
import { Experience } from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { EngineerProSection } from "@/components/EngineerProSection";
import { Book } from "@/components/Book";
import { Podcasts } from "@/components/Podcasts";
import { Skills } from "@/components/Skills";
import { StoriesPreview } from "@/components/StoriesPreview";
import { CoffeeCTA } from "@/components/CoffeeCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Experience />
      <Projects />
      <EngineerProSection />
      <Book />
      <Podcasts />
      <Skills />
      <StoriesPreview />
      <CoffeeCTA />
    </>
  );
}
