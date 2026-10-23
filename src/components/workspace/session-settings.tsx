"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePublicRepositoryAnalysis } from "@/components/workspace/use-public-analysis";
import { clearPublicRepositoryAnalysis } from "@/lib/public-repository-store";

export function SessionSettings() {
  const analysis = usePublicRepositoryAnalysis();
  const [cleared, setCleared] = useState(false);

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="text-sm font-medium">This browser tab</h2>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-foreground-secondary">
        A public analysis stays in session storage for this tab. It is not an account, and it is not
        synced to a server. The sample covers JavaScript and TypeScript files, at most 24 of them,
        plus the 10 newest commit summaries on the default branch.
      </p>
      {analysis ? (
        <p className="mt-3 font-mono text-xs text-foreground">
          Stored analysis: {analysis.repository.name} · {analysis.analyzedFileCount} files
        </p>
      ) : (
        <p className="mt-3 text-xs text-foreground-tertiary">No analysis is stored in this tab.</p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Button
          variant="outline"
          disabled={!analysis}
          onClick={() => {
            if (clearPublicRepositoryAnalysis()) setCleared(true);
          }}
        >
          Clear stored analysis
        </Button>
        {cleared && !analysis ? (
          <p className="text-xs text-foreground-secondary">The stored analysis was removed.</p>
        ) : null}
      </div>
    </section>
  );
}
