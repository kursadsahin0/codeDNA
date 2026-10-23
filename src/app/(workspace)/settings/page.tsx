import type { Metadata } from "next";
import { SessionSettings } from "@/components/workspace/session-settings";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Appearance for this browser, and the analysis kept in this tab."
      />
      <section className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
        <div>
          <h2 className="text-sm font-medium">Appearance</h2>
          <p className="mt-1 text-xs text-foreground-secondary">
            Switch between light and dark themes. The choice is saved on this browser.
          </p>
        </div>
        <ThemeToggle />
      </section>
      <SessionSettings />
    </div>
  );
}
