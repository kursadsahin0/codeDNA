import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { RepositoryEvolutionTimeline } from "@/components/workspace/repository-evolution-timeline";

export const metadata: Metadata = { title: "Repository Evolution" };

export default function HistoryPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Repository Evolution" title="Trace how your codebase changes" description="Explore commit activity, compare revisions, and inspect saved architecture snapshots over time." />
      <RepositoryEvolutionTimeline />
    </div>
  );
}
