import type { Metadata } from "next";
import { OverviewDashboard } from "@/components/workspace/overview";

export const metadata: Metadata = { title: "Overview", description: "Overview of the selected public repository analysis." };

export default function WorkspaceOverview() {
  return <OverviewDashboard />;
}
