import {
  Activity,
  Boxes,
  GitBranch,
  GitCommitHorizontal,
  Layers,
  LayoutDashboard,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export const mainNavigation: NavItem[] = [
  { href: "/workspace", label: "Overview", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: Boxes },
  { href: "/architecture", label: "Architecture Map", icon: GitBranch },
  { href: "/impact", label: "Change Impact", icon: Activity },
  { href: "/history", label: "Commit History", icon: GitCommitHorizontal },
  { href: "/insights", label: "Insights", icon: Layers },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export const siteNavigation = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/docs", label: "Documentation" },
  { href: "/pricing", label: "Pricing" },
] as const;

const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  "/foundation": [{ label: "Product", href: "/" }, { label: "Foundation" }],
  "/showcase": [{ label: "Product", href: "/" }, { label: "Components" }],
  "/workspace": [{ label: "Workspace" }],
  "/repositories": [{ label: "Workspace", href: "/workspace" }, { label: "Repositories" }],
  "/architecture": [{ label: "Workspace", href: "/workspace" }, { label: "Architecture Map" }],
  "/impact": [{ label: "Workspace", href: "/workspace" }, { label: "Change Impact" }],
  "/history": [{ label: "Workspace", href: "/workspace" }, { label: "Commit History" }],
  "/insights": [{ label: "Workspace", href: "/workspace" }, { label: "Insights" }],
  "/settings": [{ label: "Workspace", href: "/workspace" }, { label: "Settings" }],
};

export function breadcrumbsFor(pathname: string): BreadcrumbItem[] {
  return routeBreadcrumbs[pathname] ?? [{ label: "Product", href: "/" }, { label: "Not found" }];
}

export function isSiteNavCurrent(pathname: string, href: string): boolean {
  if (href === "/#product") {
    return pathname === "/";
  }
  if (href.startsWith("/#")) {
    return false;
  }
  return pathname === href;
}
