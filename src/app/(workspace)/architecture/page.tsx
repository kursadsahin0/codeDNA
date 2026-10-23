import type { Metadata } from "next";
import { ArchitectureExplorer } from "@/components/graph/architecture-explorer";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Architecture Map" };
export default function ArchitecturePage() {
  return <div className="space-y-5"><PageHeader eyebrow="Repository analysis" title="Architecture Map" description="Explore folders, files, symbols, and dependency direction in a selected analysis. Select a node to inspect its direct relationships." /><ArchitectureExplorer /></div>;
}
