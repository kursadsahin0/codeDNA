import type { Metadata } from "next";
import { ShowcaseView } from "@/components/showcase/showcase-view";

export const metadata: Metadata = {
  title: "Components",
  description: "Typography, color tokens, and shared interface components for CodeDNA.",
};

export default function ShowcasePage() {
  return <ShowcaseView />;
}
