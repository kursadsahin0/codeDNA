"use client";

import { Avatar } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Specimen } from "./specimen";
import { ShowcaseSection } from "./showcase-section";

const portrait = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="oklch(0.45 0.14 255)"/></svg>`,
)}`;

export const navigationSection = {
  id: "navigation",
  title: "Navigation",
  keywords: "page header section header breadcrumb avatar theme toggle",
};

const people = [
  { name: "Ada Lovelace", size: "sm" },
  { name: "Grace Hopper", size: "md" },
  { name: "Margaret Hamilton", size: "lg" },
] as const;

export function NavigationSection() {
  return (
    <ShowcaseSection
      id={navigationSection.id}
      title={navigationSection.title}
      description="This page title is PageHeader. Each block title is SectionHeader. The trail in the top bar is the live Breadcrumbs component."
    >
      <div className="flex flex-col gap-4">
        <Specimen label="Breadcrumb example">
          <Breadcrumbs
            label="Breadcrumb example"
            items={[
              { label: "Product", href: "/" },
              { label: "Components", href: "/showcase" },
              { label: "Navigation" },
            ]}
          />
        </Specimen>
        <Specimen label="Avatar and theme" className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
            {people.map((person) => (
              <li key={person.name} className="flex items-center gap-3">
                <Avatar name={person.name} size={person.size} labelled={false} />
                <div>
                  <p className="text-sm text-foreground">{person.name}</p>
                  <p className="text-xs text-foreground-tertiary capitalize">{person.size}</p>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <Avatar name="CodeDNA" src={portrait} labelled={false} />
              <div>
                <p className="text-sm text-foreground">Image</p>
                <p className="text-xs text-foreground-tertiary">Falls back to initials</p>
              </div>
            </li>
          </ul>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <p className="text-sm text-foreground-secondary">
              The header control uses the same component. Theme follows the system until changed.
            </p>
          </div>
        </Specimen>
      </div>
    </ShowcaseSection>
  );
}
