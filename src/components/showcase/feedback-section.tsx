"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Specimen } from "./specimen";
import { ShowcaseSection } from "./showcase-section";

export const feedbackSection = {
  id: "feedback",
  title: "Feedback",
  keywords: "badge skeleton empty error status loading",
};

export function FeedbackSection() {
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(true);
  const [failed, setFailed] = useState(true);

  return (
    <ShowcaseSection
      id={feedbackSection.id}
      title={feedbackSection.title}
      description="Status colors are paired with a label. These examples change local state only."
    >
      <div className="flex flex-col gap-4">
        <Specimen label="Badges" className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </Specimen>
        <div className="grid gap-4 lg:grid-cols-3">
          <Specimen label="Skeleton">
            {loading ? (
              <div className="space-y-2" aria-hidden="true">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ) : (
              <p className="text-sm text-foreground">Content rendered after the placeholder.</p>
            )}
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => setLoading((value) => !value)}
            >
              {loading ? "Show content" : "Show placeholder"}
            </Button>
          </Specimen>
          <Specimen label="Empty">
            {empty ? (
              <EmptyState
                heading="h3"
                title="No files in this example"
                description="Adding one only updates this specimen."
                action={
                  <Button variant="secondary" onClick={() => setEmpty(false)}>
                    Add example
                  </Button>
                }
              />
            ) : (
              <div>
                <p className="font-mono text-[13px] text-foreground">example.ts</p>
                <Button className="mt-4" variant="secondary" onClick={() => setEmpty(true)}>
                  Clear example
                </Button>
              </div>
            )}
          </Specimen>
          <Specimen label="Error">
            {failed ? (
              <ErrorState
                heading="h3"
                title="Example failed"
                description="Retry does not call a service."
                action={
                  <Button variant="secondary" onClick={() => setFailed(false)}>
                    Retry
                  </Button>
                }
              />
            ) : (
              <div>
                <p className="text-sm text-foreground">Recovered in this example.</p>
                <Button className="mt-4" variant="secondary" onClick={() => setFailed(true)}>
                  Show error again
                </Button>
              </div>
            )}
          </Specimen>
        </div>
      </div>
    </ShowcaseSection>
  );
}
