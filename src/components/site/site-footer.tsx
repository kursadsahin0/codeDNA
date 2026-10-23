import Link from "next/link";
import { Mark } from "@/components/brand/mark";

const product = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/repositories#public-repository", label: "Analyze a repository" },
  { href: "/docs", label: "Documentation" },
  { href: "/pricing", label: "Pricing" },
] as const;

const foundation = [
  { href: "/foundation", label: "Foundation" },
  { href: "/showcase", label: "Components" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-md focus-ring">
            <Mark />
            <span className="text-sm font-semibold tracking-tight">CodeDNA</span>
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-5 text-foreground-secondary">
            Analyze a public GitHub repository link and explore its architecture in your browser.
          </p>
        </div>
        <FooterList title="Product" links={product} />
        <FooterList title="Interface" links={foundation} />
      </div>
    </footer>
  );
}

function FooterList({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-medium text-foreground">{title}</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-sm text-sm text-foreground-secondary focus-ring transition-control hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
