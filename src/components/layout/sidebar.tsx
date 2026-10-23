"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/brand/mark";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { mainNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { RepositoryPicker } from "@/components/workspace/repository-picker";
import { useLocale } from "@/providers/locale-provider";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const labels: Record<string, string> = { Overview: t("Overview", "Genel Bakış"), Repositories: t("Repositories", "Depolar"), "Architecture Map": t("Architecture Map", "Mimari Harita"), "Change Impact": t("Change Impact", "Değişiklik Etkisi"), "Commit History": t("Commit History", "Commit Geçmişi"), Insights: t("Insights", "Öngörüler"), Settings: t("Settings", "Ayarlar") };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 rounded-md focus-ring"
        >
          <Mark />
          <span className="truncate text-sm font-semibold tracking-tight">CodeDNA</span>
        </Link>
        {onNavigate ? (
          <IconButton label="Close navigation" className="ml-auto" onClick={onNavigate}>
            <X />
          </IconButton>
        ) : null}
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-1">
          {mainNavigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/workspace" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md px-2 text-sm text-foreground-secondary focus-ring transition-control hover:bg-surface-hover hover:text-foreground",
                    active && "bg-primary-subtle font-medium text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {labels[item.label] ?? item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="shrink-0 border-t border-border p-3">
        <RepositoryPicker compact />
        <div className="mt-3 flex items-center gap-2 rounded-md px-1 py-1">
          <Avatar name="Jordan Lee" size="sm" />
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-foreground">Jordan Lee</p><p className="truncate text-[11px] text-foreground-tertiary">Engineering</p></div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
