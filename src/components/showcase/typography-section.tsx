import { ShowcaseSection } from "./showcase-section";

export const typographySection = {
  id: "typography",
  title: "Typography",
  keywords: "type font geist mono heading body code label",
};

const samples = [
  {
    role: "Page title",
    spec: "24 / 600 / tight",
    className: "text-2xl font-semibold tracking-tight text-foreground",
    text: "Overview",
  },
  {
    role: "Section title",
    spec: "16 / 600",
    className: "text-base font-semibold text-foreground",
    text: "Typography",
  },
  {
    role: "Body",
    spec: "14 / 400 / 1.5",
    className: "text-sm text-foreground",
    text: "Files, functions, modules, and dependencies.",
  },
  {
    role: "Secondary",
    spec: "14 / 400",
    className: "text-sm text-foreground-secondary",
    text: "Descriptions and supporting copy.",
  },
  {
    role: "Label",
    spec: "12 / 500",
    className: "text-xs font-medium text-foreground-secondary",
    text: "Display name",
  },
  {
    role: "Meta",
    spec: "12 / 400",
    className: "text-xs text-foreground-tertiary",
    text: "Stage 1 · Foundation",
  },
  {
    role: "Code",
    spec: "13 / 400 / mono",
    className: "font-mono text-[13px] text-foreground",
    text: "src/styles/tokens.css",
  },
] as const;

export function TypographySection() {
  return (
    <ShowcaseSection
      id={typographySection.id}
      title={typographySection.title}
      description="Geist Sans for the interface, Geist Mono for code and metadata. Body copy stays at 14px."
    >
      <div className="border-t border-border">
        {samples.map((sample) => (
          <div
            key={sample.role}
            className="grid gap-1 border-b border-border py-3 sm:grid-cols-[9rem_8rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
          >
            <p className="text-xs font-medium text-foreground-secondary">{sample.role}</p>
            <p className="font-mono text-[11px] text-foreground-tertiary">{sample.spec}</p>
            <p className={sample.className}>{sample.text}</p>
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}
