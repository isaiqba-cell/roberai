import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { PageTransition } from "@/components/motion/page-transition";
import { Providers } from "@/components/providers";
import { webEnvironment } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rober | Find your fit",
    template: "%s | Rober",
  },
  description: "A fit-first denim marketplace.",
};

export default function RootLayout({
  children,
  panel,
}: Readonly<{ children: ReactNode; panel?: ReactNode }>) {
  return (
    <html
      lang="en"
      data-runtime-mode={webEnvironment.mode}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <SiteShell>
            <PageTransition>{children}</PageTransition>
            {panel}
          </SiteShell>
        </Providers>
      </body>
    </html>
  );
}
