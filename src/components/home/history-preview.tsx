"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { harborCommits, nodeById } from "@/lib/demo/harbor";
import { easeStandard, motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function HistoryPreview() {
  const [selectedId, setSelectedId] = useState(harborCommits[0]?.id ?? "");
  const selected = harborCommits.find((commit) => commit.id === selectedId) ?? harborCommits[0];

  if (!selected) {
    return null;
  }

  return (
    <div className="grid overflow-hidden rounded-md border border-border bg-surface md:grid-cols-[18rem_minmax(0,1fr)]">
      <ol className="border-b border-border md:border-r md:border-b-0" aria-label="Sample commits">
        {harborCommits.map((commit) => {
          const current = commit.id === selected.id;
          return (
            <li key={commit.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                aria-current={current ? "true" : undefined}
                onClick={() => setSelectedId(commit.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left focus-ring transition-control",
                  current ? "bg-primary-subtle" : "hover:bg-surface-hover",
                )}
              >
                <span className="font-mono text-[11px] text-foreground-tertiary">
                  {commit.hash}
                </span>
                <span className="text-sm text-foreground">{commit.subject}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <motion.div
        key={selected.id}
        initial={{ opacity: 0.72 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionDuration.fast, ease: easeStandard }}
        className="p-4"
      >
        <p className="font-mono text-xs text-foreground-tertiary">{selected.hash}</p>
        <h3 className="mt-1 text-sm font-medium text-foreground">{selected.subject}</h3>
        <p className="mt-2 text-sm text-foreground-secondary">Files named in this sample commit.</p>
        <ul className="mt-3 flex flex-col gap-1">
          {selected.files.map((id) => {
            const node = nodeById(id);
            return (
              <li key={id}>
                <Link href={`/demo?file=${node.id}`} className="link font-mono text-xs">
                  {node.path}
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
