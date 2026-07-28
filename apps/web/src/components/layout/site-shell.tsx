import type { ReactNode } from "react";
import { Heart, Ruler } from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { CatalogStatusBadge } from "@/components/layout/catalog-status-badge";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const navLinks = [
  { href: "/matches", label: "Matches", icon: Ruler },
  { href: "/saved", label: "Saved", icon: Heart },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-3 font-sans text-sm font-bold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-shell items-center justify-between px-5 lg:px-8">
          <Link
            href="/"
            aria-label="Rober home"
            className="font-serif text-[2rem] font-bold leading-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Rober
          </Link>
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 md:flex"
          >
            {navLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex h-11 items-center gap-2 rounded-md px-4 font-sans text-sm font-semibold text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="hidden md:block">
              <AccountMenu />
            </div>
            <MobileNav />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100vh-16rem)]"
      >
        {children}
      </main>
      <footer className="mt-20 border-t border-border">
        <div className="mx-auto grid max-w-shell gap-8 px-5 py-10 font-sans text-sm text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-end lg:px-8">
          <div>
            <p className="font-serif text-xl font-semibold text-foreground">
              Rober
            </p>
            <p className="mt-2 max-w-md leading-6">
              Fit translation for denim, grounded in the pair you already trust.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <CatalogStatusBadge />
            <Link className="hover:text-foreground" href="/playground">
              Playground
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
