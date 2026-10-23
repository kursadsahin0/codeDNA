import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";

type ShowcaseSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ShowcaseSection({ id, title, description, children }: ShowcaseSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16">
      <SectionHeader id={`${id}-title`} title={title} description={description} className="mb-4" />
      {children}
    </section>
  );
}
