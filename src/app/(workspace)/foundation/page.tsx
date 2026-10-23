import type { Metadata } from "next";
import { Overview } from "@/components/foundation/overview";

export const metadata: Metadata = {
  title: "Foundation",
  description:
    "CodeDNA interface foundation and the shared components behind its repository workspace.",
};

export default function FoundationPage() {
  return <Overview />;
}
