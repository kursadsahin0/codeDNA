"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { isSiteNavCurrent, siteNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const navLabels = { Product: t("Product", "Ürün"), Features: t("Features", "Özellikler"), Documentation: t("Documentation", "Belgeler"), Pricing: t("Pricing", "Fiyatlandırma") };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }
    const onScroll = () => {
      header.dataset.scrolled = window.scrollY > 4 ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-scrolled="false"
      className="sticky top-0 z-sticky border-b border-border bg-background data-[scrolled=true]:border-border-strong"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-md focus-ring">
          <Mark />
          <span className="text-sm font-semibold tracking-tight">CodeDNA</span>
        </Link>

        <nav aria-label="Product" className="ml-4 hidden items-center gap-1 md:flex">
          {siteNavigation.map((item) => (
            <SiteLink
              key={item.href}
              href={resolveHref(pathname, item.href)}
              current={isSiteNavCurrent(pathname, item.href)}
            >
              {navLabels[item.label as keyof typeof navLabels]}
            </SiteLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label={t("Switch language to Turkish", "Switch language to English")} onClick={() => setLocale(locale === "en" ? "tr" : "en")}>
            {locale === "en" ? "TR" : "EN"}
          </Button>
          <ThemeToggle />
          <Link
            href="/repositories#public-repository"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            {t("Get started", "Başlayın")}
          </Link>
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger asChild>
              <IconButton label="Open menu" className="md:hidden">
                <Menu />
              </IconButton>
            </DialogTrigger>
            <DialogContent variant="drawer" className="w-72 bg-background">
              <DialogTitle className="sr-only">Menu</DialogTitle>
              <DialogDescription className="sr-only">Product sections</DialogDescription>
              <div className="flex h-14 items-center gap-2 border-b border-border px-3">
                <Mark />
                <span className="text-sm font-semibold tracking-tight">CodeDNA</span>
                <DialogClose asChild>
                  <IconButton label="Close menu" className="ml-auto" size="sm">
                    <X />
                  </IconButton>
                </DialogClose>
              </div>
              <nav aria-label="Product" className="flex flex-col gap-1 px-2 py-3">
                {siteNavigation.map((item) => (
                  <SiteLink
                    key={item.href}
                    href={resolveHref(pathname, item.href)}
                    current={isSiteNavCurrent(pathname, item.href)}
                    onClick={() => setMenuOpen(false)}
                    className="h-9 px-2"
                  >
                    {navLabels[item.label as keyof typeof navLabels]}
                  </SiteLink>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-3">
                <Link
                  href="/repositories#public-repository"
                  onClick={() => setMenuOpen(false)}
                  className={cn(buttonVariants(), "w-full")}
                >
                  {t("Get started", "Başlayın")}
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

function resolveHref(pathname: string, href: string) {
  if (pathname === "/" && href.startsWith("/#")) {
    return href.slice(1);
  }
  return href;
}

function SiteLink({
  href,
  current,
  className,
  onClick,
  children,
}: {
  href: string;
  current: boolean;
  className?: string;
  onClick?: () => void;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-md px-2.5 text-sm focus-ring transition-control",
        current
          ? "bg-primary-subtle font-medium text-foreground"
          : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground active:bg-surface-active",
        className,
      )}
    >
      {children}
    </Link>
  );
}

