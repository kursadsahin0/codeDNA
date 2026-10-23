import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";

export const metadata: Metadata = {
  description:
    "Explore dependencies, trace change impact, and understand how your codebase evolves in one workspace.",
};

export default function HomePage() {
  return <HomeView />;
}
