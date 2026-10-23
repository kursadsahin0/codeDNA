import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { GitHubRepositoryManager } from "@/components/workspace/github-repository-manager";

export const metadata: Metadata = { title: "Repositories" };

export default function RepositoriesPage() {
  return <div className="space-y-5"><PageHeader eyebrow="Repository access" title="Repositories" description="Enter a public GitHub repository link to analyze and explore its actual source files and dependencies." /><GitHubRepositoryManager /></div>;
}
