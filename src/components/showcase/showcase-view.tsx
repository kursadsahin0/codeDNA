"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { ButtonSection, buttonSection } from "./button-section";
import { ColorSection, colorSection } from "./color-section";
import { FeedbackSection, feedbackSection } from "./feedback-section";
import { InputSection, inputSection } from "./input-section";
import { NavigationSection, navigationSection } from "./navigation-section";
import { OverlaySection, overlaySection } from "./overlay-section";
import { SelectionSection, selectionSection } from "./selection-section";
import { TypographySection, typographySection } from "./typography-section";

const sections = [
  { ...typographySection, Component: TypographySection },
  { ...colorSection, Component: ColorSection },
  { ...buttonSection, Component: ButtonSection },
  { ...inputSection, Component: InputSection },
  { ...selectionSection, Component: SelectionSection },
  { ...overlaySection, Component: OverlaySection },
  { ...feedbackSection, Component: FeedbackSection },
  { ...navigationSection, Component: NavigationSection },
];

export function ShowcaseView() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = sections.filter((section) => {
    if (!needle) return true;
    return `${section.title} ${section.keywords}`.toLowerCase().includes(needle);
  });

  return (
    <div>
      <PageHeader
        eyebrow="Design system"
        title="Components"
        description="Typography, tokens, and the shared controls. Search filters this page. Press / to focus the field."
        actions={
          <SearchInput
            label="Search components"
            hideLabel
            placeholder="Search components"
            value={query}
            onValueChange={setQuery}
            hotkey="/"
            className="md:w-72"
          />
        }
      />

      {needle.length === 0 ? (
        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="link text-sm">
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No matching components"
            description={`Nothing in the inventory matches "${query.trim()}".`}
            action={
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {visible.map((section) => (
            <section.Component key={section.id} />
          ))}
        </div>
      )}
    </div>
  );
}
