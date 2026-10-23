import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = { title: "Documentation", description: "How CodeDNA analyzes public GitHub repositories." };

export default function DocsPage() {
  return <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:px-8 md:py-10">
    <PageHeader eyebrow="Documentation" title="Analyze your repository" description="Paste a public GitHub repository URL to inspect the source structure and dependency relationships in your own codebase." actions={<Link href="/repositories#public-repository" className={buttonVariants()}>Analyze a repository</Link>} />
    <section className="flex flex-col gap-3"><SectionHeader title="What the analysis reads" description="The URL must point directly to a public GitHub repository. CodeDNA uses GitHub&apos;s API and fixed raw-content host; it does not fetch arbitrary URLs." /><ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground-secondary"><li>JavaScript and TypeScript source files on the default branch.</li><li>Up to 24 supported files, each capped at 256 KB.</li><li>The latest 10 commit summaries from the repository&apos;s default branch.</li><li>Static import and export relationships resolved within the downloaded file set.</li></ul></section>
    <section className="flex flex-col gap-3"><SectionHeader title="Where results appear" description="A successful analysis opens the same repository in the workspace." /><p className="text-sm leading-6 text-foreground-secondary">Overview, Architecture Map, Change Impact, Insights, and Commit History read the analysis from the current browser tab session. Results are not saved to a CodeDNA account or sent to persistent storage.</p></section>
    <section className="flex flex-col gap-3"><SectionHeader title="Analysis limits" description="Static analysis is useful for exploring source structure, but it does not describe every runtime behavior." /><ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground-secondary"><li>Import edges do not guarantee a runtime call or execution path.</li><li>Private repositories require GitHub authorization, which is currently paused.</li><li>Historical architecture snapshots and commit file diffs are not reconstructed.</li><li>Large repositories may be truncated to the bounded supported file set.</li></ul></section>
  </div>;
}
