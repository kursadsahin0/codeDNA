"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { breadcrumbsFor } from "@/lib/navigation";

export function TopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-sticky flex h-12 items-center gap-2 border-b border-border bg-background px-3 md:px-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <IconButton label="Open navigation" className="md:hidden">
            <Menu />
          </IconButton>
        </DialogTrigger>
        <DialogContent variant="drawer">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <DialogDescription className="sr-only">Primary sections</DialogDescription>
          <Sidebar onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <Breadcrumbs items={breadcrumbsFor(pathname)} className="min-w-0 flex-1" />
      <ThemeToggle />
    </header>
  );
}
