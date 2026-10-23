import { cn } from "@/lib/utils";
import { ShowcaseSection } from "./showcase-section";

export const colorSection = {
  id: "color",
  title: "Color",
  keywords:
    "token palette surface text primary secondary accent success warning danger info graph theme light dark",
};

type TokenSample = "fill" | "text" | "line";

type TokenRow = {
  token: string;
  usage: string;
  sample: TokenSample;
  className: string;
};

const groups: { title: string; rows: TokenRow[] }[] = [
  {
    title: "Surfaces",
    rows: [
      {
        token: "--background",
        usage: "Page background",
        sample: "fill",
        className: "bg-background",
      },
      {
        token: "--background-subtle",
        usage: "Sidebar and secondary surface",
        sample: "fill",
        className: "bg-background-subtle",
      },
      {
        token: "--surface",
        usage: "Controls and specimens",
        sample: "fill",
        className: "bg-surface",
      },
      {
        token: "--surface-raised",
        usage: "Menus, dialogs, and toasts",
        sample: "fill",
        className: "bg-surface-raised",
      },
      {
        token: "--surface-hover",
        usage: "Hover on neutral controls",
        sample: "fill",
        className: "bg-surface-hover",
      },
      {
        token: "--surface-active",
        usage: "Pressed neutral controls",
        sample: "fill",
        className: "bg-surface-active",
      },
      { token: "--border", usage: "Hairline rules", sample: "line", className: "border-border" },
      {
        token: "--border-strong",
        usage: "Control outlines",
        sample: "line",
        className: "border-border-strong",
      },
      { token: "--overlay", usage: "Dialog scrim", sample: "fill", className: "bg-overlay" },
    ],
  },
  {
    title: "Text",
    rows: [
      {
        token: "--foreground",
        usage: "Primary text",
        sample: "text",
        className: "text-foreground",
      },
      {
        token: "--foreground-secondary",
        usage: "Descriptions",
        sample: "text",
        className: "text-foreground-secondary",
      },
      {
        token: "--foreground-tertiary",
        usage: "Meta and placeholders",
        sample: "text",
        className: "text-foreground-tertiary",
      },
      {
        token: "--disabled",
        usage: "Disabled control text",
        sample: "text",
        className: "text-disabled",
      },
    ],
  },
  {
    title: "Actions",
    rows: [
      { token: "--primary", usage: "Main action fill", sample: "fill", className: "bg-primary" },
      {
        token: "--primary-hover",
        usage: "Main action hover",
        sample: "fill",
        className: "bg-primary-hover",
      },
      {
        token: "--primary-active",
        usage: "Main action pressed",
        sample: "fill",
        className: "bg-primary-active",
      },
      {
        token: "--primary-foreground",
        usage: "Text on the primary fill",
        sample: "fill",
        className: "bg-primary-foreground",
      },
      {
        token: "--primary-subtle",
        usage: "Selected navigation",
        sample: "fill",
        className: "bg-primary-subtle",
      },
      {
        token: "--secondary",
        usage: "Secondary action fill",
        sample: "fill",
        className: "bg-secondary",
      },
      { token: "--accent", usage: "Text links", sample: "text", className: "text-accent" },
      {
        token: "--accent-subtle",
        usage: "Accent badge background",
        sample: "fill",
        className: "bg-accent-subtle",
      },
    ],
  },
  {
    title: "Status",
    rows: [
      {
        token: "--success",
        usage: "Success fill and toast bar",
        sample: "fill",
        className: "bg-success",
      },
      {
        token: "--success-subtle-foreground",
        usage: "Success text",
        sample: "text",
        className: "text-success-subtle-foreground",
      },
      { token: "--warning", usage: "Warning fill", sample: "fill", className: "bg-warning" },
      {
        token: "--warning-subtle-foreground",
        usage: "Warning text",
        sample: "text",
        className: "text-warning-subtle-foreground",
      },
      {
        token: "--danger",
        usage: "Danger fill and invalid border",
        sample: "fill",
        className: "bg-danger",
      },
      {
        token: "--danger-subtle-foreground",
        usage: "Danger text",
        sample: "text",
        className: "text-danger-subtle-foreground",
      },
      { token: "--info", usage: "Information fill", sample: "fill", className: "bg-info" },
      {
        token: "--info-subtle-foreground",
        usage: "Information text",
        sample: "text",
        className: "text-info-subtle-foreground",
      },
    ],
  },
  {
    title: "Code map",
    rows: [
      { token: "--graph-file", usage: "Source file", sample: "fill", className: "bg-graph-file" },
      {
        token: "--graph-function",
        usage: "Function or method",
        sample: "fill",
        className: "bg-graph-function",
      },
      {
        token: "--graph-module",
        usage: "Module or package",
        sample: "fill",
        className: "bg-graph-module",
      },
      {
        token: "--graph-dependency",
        usage: "Import edge",
        sample: "fill",
        className: "bg-graph-dependency",
      },
      {
        token: "--graph-external",
        usage: "Outside the repository",
        sample: "fill",
        className: "bg-graph-external",
      },
      { token: "--graph-entry", usage: "Entry point", sample: "fill", className: "bg-graph-entry" },
    ],
  },
];

function TokenSwatch({ sample, className }: { sample: TokenSample; className: string }) {
  if (sample === "text") {
    return <span className={cn("text-sm font-medium", className)}>Text</span>;
  }

  if (sample === "line") {
    return <span className={cn("block h-0 w-8 border-t-2", className)} />;
  }

  return <span className={cn("block size-4 border border-border-strong", className)} />;
}

export function ColorSection() {
  return (
    <ShowcaseSection
      id={colorSection.id}
      title={colorSection.title}
      description="Solid status colors are fills. Subtle foreground colors are for text. Code map colors are reserved and are not rendered as a graph in this stage."
    >
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-sm font-medium text-foreground">{group.title}</h3>
            <div className="border-t border-border">
              {group.rows.map((row) => (
                <div
                  key={row.token}
                  className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 border-b border-border py-2 sm:grid-cols-[1.25rem_16rem_minmax(0,1fr)] sm:items-center"
                >
                  <TokenSwatch sample={row.sample} className={row.className} />
                  <code className="font-mono text-[12px] text-foreground">{row.token}</code>
                  <p className="col-start-2 text-sm text-foreground-secondary sm:col-start-auto">
                    {row.usage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}
