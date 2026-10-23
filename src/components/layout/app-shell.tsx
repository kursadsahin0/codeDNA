import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { WorkspaceTopBar } from "../workspace/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only z-skip rounded-md bg-surface px-3 py-2 text-sm text-foreground focus-ring focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-background-subtle md:flex">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar />
        <main id="main" tabIndex={-1} className="flex-1 scroll-mt-12 outline-none">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
