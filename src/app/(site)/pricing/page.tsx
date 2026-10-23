import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Intended CodeDNA workspace split. Billing is not connected and prices are not listed.",
};

const columns = [
  {
    name: "Workspace",
    status: "Available as a fixture",
    summary: "Analyze a public GitHub repository from its link and explore the resulting source map.",
    points: [
      "JavaScript and TypeScript source analysis",
      "Interactive dependency map",
      "Static change impact and structural insights",
      "Recent public commit summaries",
    ],
    action: { href: "/repositories#public-repository", label: "Analyze a repository" },
  },
  {
    name: "Team",
    status: "Not in this build",
    summary: "Shared reading of the same map across an engineering team.",
    points: [
      "A shared view of one map",
      "Comments on a file or an edge",
      "A review of a proposed change",
    ],
    action: null,
  },
  {
    name: "Organization",
    status: "Not connected",
    summary: "Private repository access and saved workspaces are not currently available.",
    points: ["GitHub access", "Analysis of a repository you choose", "Saved workspaces"],
    action: null,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        eyebrow="Pricing"
        title="What this build includes"
        description="Billing is not connected, so this page does not list prices or start a checkout. The split below is the intended product boundary."
      />

      <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.name}
            className="flex flex-col gap-4 bg-surface p-4"
            aria-labelledby={`${column.name}-tier`}
          >
            <div>
              <h2
                id={`${column.name}-tier`}
                className="text-base font-semibold tracking-tight text-foreground"
              >
                {column.name}
              </h2>
              <p className="mt-1 font-mono text-[11px] tracking-[0.08em] text-foreground-tertiary uppercase">
                {column.status}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground-secondary">{column.summary}</p>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm text-foreground">
              {column.points.map((point) => (
                <li key={point} className="border-t border-border pt-1.5">
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              {column.action ? (
                <Link href={column.action.href} className={buttonVariants()}>
                  {column.action.label}
                </Link>
              ) : (
                <button type="button" className={buttonVariants({ variant: "secondary" })} disabled>
                  {column.status}
                </button>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
