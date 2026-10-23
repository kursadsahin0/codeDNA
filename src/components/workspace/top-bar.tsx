"use client";

import { Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SearchInput } from "@/components/ui/search-input";
import { RepositoryPicker } from "./repository-picker";
import { useLocale } from "@/providers/locale-provider";

const titles: Record<string, string> = {
  "/workspace": "Overview", "/repositories": "Repositories", "/architecture": "Architecture Map",
  "/impact": "Change Impact", "/history": "Commit History", "/insights": "Insights", "/settings": "Settings",
};

export function WorkspaceTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { locale, setLocale, t } = useLocale();
  const title = titles[pathname] ?? "Workspace";
  const translated: Record<string, string> = { Overview: t("Overview", "Genel Bakış"), Repositories: t("Repositories", "Depolar"), "Architecture Map": t("Architecture Map", "Mimari Harita"), "Change Impact": t("Change Impact", "Değişiklik Etkisi"), "Commit History": t("Commit History", "Commit Geçmişi"), Insights: t("Insights", "Öngörüler"), Settings: t("Settings", "Ayarlar"), Workspace: t("Workspace", "Çalışma Alanı") };
  const pageTitle = translated[title] ?? title;
  const breadcrumbs = [{ label: t("Workspace", "Çalışma Alanı"), href: "/workspace" }, { label: pageTitle }];

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex min-h-12 items-center gap-2 px-3 md:px-5">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><IconButton label="Open navigation" className="md:hidden"><Menu /></IconButton></DialogTrigger>
          <DialogContent variant="drawer" className="p-0"><DialogTitle className="sr-only">Navigation</DialogTitle><DialogDescription className="sr-only">Workspace sections</DialogDescription><Sidebar onNavigate={() => setOpen(false)} /></DialogContent>
        </Dialog>
        <Breadcrumbs items={breadcrumbs} className="min-w-0 flex-1" />
        <div className="hidden items-center gap-3 lg:flex"><RepositoryPicker /><span className="h-5 w-px bg-border" /><h1 className="max-w-40 truncate text-sm font-medium text-foreground">{pageTitle}</h1></div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="rounded-md px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-hover focus-ring" onClick={() => setLocale(locale === "en" ? "tr" : "en")} aria-label={t("Switch language to Turkish", "Switch language to English")}>{locale === "en" ? "TR" : "EN"}</button>
          {searchOpen ? <SearchInput label="Search workspace" hideLabel value={search} placeholder="Search repositories" hotkey="/" className="w-44" onValueChange={(value) => { setSearch(value); router.replace(`/repositories?q=${encodeURIComponent(value)}`); }} /> : <IconButton label="Search repositories" onClick={() => setSearchOpen(true)}><Search /></IconButton>}
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-border/70 px-4 py-2 lg:hidden"><RepositoryPicker compact /><h1 className="max-w-36 truncate text-xs font-medium text-foreground">{pageTitle}</h1></div>
    </header>
  );
}
