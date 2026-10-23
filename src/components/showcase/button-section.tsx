"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Specimen } from "./specimen";
import { ShowcaseSection } from "./showcase-section";

export const buttonSection = {
  id: "buttons",
  title: "Buttons",
  keywords: "button iconbutton action loading disabled focus hover",
};

export function ButtonSection() {
  const [loading, setLoading] = useState(false);

  function previewLoading() {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 800);
  }

  return (
    <ShowcaseSection
      id={buttonSection.id}
      title={buttonSection.title}
      description="One radius, one focus outline, and a shared disabled treatment. Hover and active specimens force the token so the state is visible without a pointer."
    >
      <div className="flex flex-col gap-4">
        <Specimen label="Variants" className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Specimen>
        <Specimen label="Primary states" className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button className="bg-primary-hover">Hover</Button>
          <Button className="bg-primary-active">Active</Button>
          <span className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground outline-2 outline-offset-2 outline-ring">
            Focus
          </span>
          <Button disabled>Disabled</Button>
          <Button loading={loading} onClick={previewLoading}>
            Preview loading
          </Button>
        </Specimen>
        <Specimen label="Sizes and icons" className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <IconButton label="Add" variant="outline">
            <Plus />
          </IconButton>
          <IconButton label="Add primary" variant="primary">
            <Plus />
          </IconButton>
          <Button asChild variant="outline">
            <Link href="/">Overview</Link>
          </Button>
        </Specimen>
      </div>
    </ShowcaseSection>
  );
}
