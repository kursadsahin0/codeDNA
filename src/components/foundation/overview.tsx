import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";

const included = [
  "Light and dark themes, including the system preference",
  "Color, type, radius, shadow, and motion tokens",
  "Shared interface components",
  "Application shell with keyboard-accessible navigation",
  "Public GitHub repository analysis and an interactive dependency graph",
  "Static change impact, structural insights, and recent commit summaries",
];

const excluded = [
  "GitHub account linking and private repository access",
  "Cross-device accounts or saved workspaces",
  "Runtime execution, complete call graphs, and reconstructed historical snapshots",
];

const principles = [
  {
    title: "Tokens, not one-off values",
    body: "Color, type, radius, shadow, and motion durations live in src/styles/tokens.css. Components do not set their own hex colors.",
  },
  {
    title: "Editor density",
    body: "Page titles stay at 24px. Regions are separated by rules and 4px spacing, not by oversized headings.",
  },
  {
    title: "Motion marks a change",
    body: "Hovers change color in 120ms. Menus and dialogs fade in 160ms. prefers-reduced-motion removes both.",
  },
  {
    title: "State is labeled",
    body: "Success, warning, danger, and information always include text. Focus uses a 2px outline, not color alone.",
  },
  {
    title: "Unbuilt work stays unbuilt",
    body: "Search filters the component inventory. It does not query a repository, and this page does not invent usage numbers.",
  },
];

const inventory = [
  ["Typography", "/showcase#typography"],
  ["Color", "/showcase#color"],
  ["Button", "/showcase#buttons"],
  ["IconButton", "/showcase#buttons"],
  ["Input", "/showcase#inputs"],
  ["SearchInput", "/showcase#inputs"],
  ["DropdownMenu", "/showcase#selection"],
  ["Tabs", "/showcase#selection"],
  ["Dialog", "/showcase#overlays"],
  ["Tooltip", "/showcase#overlays"],
  ["Toast", "/showcase#overlays"],
  ["Badge", "/showcase#feedback"],
  ["Skeleton", "/showcase#feedback"],
  ["EmptyState", "/showcase#feedback"],
  ["ErrorState", "/showcase#feedback"],
  ["PageHeader", "/showcase#navigation"],
  ["SectionHeader", "/showcase#navigation"],
  ["Breadcrumbs", "/showcase#navigation"],
  ["Avatar", "/showcase#navigation"],
  ["ThemeToggle", "/showcase#navigation"],
] as const;

export function Overview() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Stage 1"
        title="Foundation"
        description="Shared tokens, components, and the application shell behind CodeDNA’s repository workspace. Public repository analysis is available without an account; account linking and private repository access are paused."
        actions={
          <>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Product home
            </Link>
            <Link href="/showcase" className={buttonVariants()}>
              View components
            </Link>
          </>
        }
      />

      <section aria-labelledby="scope-title">
        <SectionHeader
          id="scope-title"
          title="Scope"
          description="What the current product supports, and where its analysis has clear limits."
        />
        <div className="mt-4 grid border border-border sm:grid-cols-2">
          <div className="px-4 py-4 sm:border-r sm:border-border">
            <h3 className="text-sm font-medium text-foreground">Included</h3>
            <ul className="mt-3 space-y-2">
              {included.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground-secondary">
                  <span aria-hidden="true" className="text-foreground-tertiary">
                    –
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border px-4 py-4 sm:border-t-0">
            <h3 className="text-sm font-medium text-foreground">Not in this stage</h3>
            <ul className="mt-3 space-y-2">
              {excluded.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground-secondary">
                  <span aria-hidden="true" className="text-foreground-tertiary">
                    –
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="principles-title">
        <SectionHeader id="principles-title" title="Interface principles" />
        <ol className="mt-4 border-t border-border">
          {principles.map((principle, index) => (
            <li
              key={principle.title}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3"
            >
              <span className="font-mono text-xs text-foreground-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{principle.title}</p>
                <p className="mt-1 text-sm text-foreground-secondary">{principle.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="inventory-title">
        <SectionHeader
          id="inventory-title"
          title="Inventory"
          description="Each name opens the specimen in the component page."
        />
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {inventory.map(([label, href]) => (
            <li key={label}>
              <Link href={href} className="link text-sm">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
