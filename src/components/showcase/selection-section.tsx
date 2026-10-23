"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Specimen } from "./specimen";
import { ShowcaseSection } from "./showcase-section";

const views = [
  { id: "list", label: "List" },
  { id: "tree", label: "Tree" },
] as const;

type ViewId = (typeof views)[number]["id"];

export const selectionSection = {
  id: "selection",
  title: "Selection",
  keywords: "dropdown menu tabs select keyboard",
};

export function SelectionSection() {
  const [view, setView] = useState<ViewId>("list");
  const [removed, setRemoved] = useState(false);
  const current = views.find((item) => item.id === view) ?? views[0];

  return (
    <ShowcaseSection
      id={selectionSection.id}
      title={selectionSection.title}
      description="Menus and tabs keep keyboard focus visible. Arrow keys move through both."
    >
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Specimen label="Menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">View: {current.label}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Arrangement</DropdownMenuLabel>
              {views.map((item) => (
                <DropdownMenuItem key={item.id} onSelect={() => setView(item.id)}>
                  {item.label}
                  {view === item.id ? (
                    <Check className="ml-auto size-4" aria-hidden="true" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onSelect={() => setRemoved(true)}>
                Remove example
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="mt-3 text-sm text-foreground-secondary">
            {removed
              ? "The example was marked locally. Nothing was deleted."
              : `Showing the ${current.label.toLowerCase()} arrangement.`}
          </p>
          {removed ? (
            <Button className="mt-3" variant="secondary" onClick={() => setRemoved(false)}>
              Restore example
            </Button>
          ) : null}
        </Specimen>
        <Specimen label="Tabs">
          <Tabs defaultValue="tokens">
            <TabsList aria-label="Foundation notes">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="motion">Motion</TabsTrigger>
              <TabsTrigger value="density">Density</TabsTrigger>
            </TabsList>
            <TabsContent value="tokens">
              Values live in{" "}
              <code className="font-mono text-[13px] text-foreground">src/styles/tokens.css</code>.
              Changing a variable updates both themes.
            </TabsContent>
            <TabsContent value="motion">
              Hover is 120ms, overlays are 160ms, and toasts settle in 200ms. The easing is
              cubic-bezier(0.2, 0, 0, 1). There is no spring or overshoot.
            </TabsContent>
            <TabsContent value="density">
              Controls use a 6px radius. Badges use 4px. Avatars are circular. Page titles are 24px
              and body text is 14px.
            </TabsContent>
          </Tabs>
        </Specimen>
      </div>
    </ShowcaseSection>
  );
}
