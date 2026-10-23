import type { Metadata } from "next";
import { ChangeImpactExplorer } from "@/components/workspace/change-impact-explorer";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Change Impact" };
export default function ImpactPage() {
  return <div className="space-y-5"><PageHeader eyebrow="Static dependency analysis" title="Change Impact" description="Select a changed file or symbol to trace potential effects through its repository dependency graph." /><ChangeImpactExplorer /></div>;
}
