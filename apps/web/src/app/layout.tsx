import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { PageTransition } from "@/components/motion/page-transition";
import { Providers } from "@/components/providers";
import { webEnvironment } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rober | Know your size in every brand",
    template: "%s | Rober",
  },
  description:
    "Fit translation for denim, grounded in the pair you already trust.",
  applicationName: "Rober",
  category: "shopping",
  formatDetection: { telephone: false },
  twitter: {
    card: "summary_large_image",
    title: "Rober | Know your size in every brand",
    description:
      "Start with jeans that already fit. Rober tells you which size to buy next.",
  },
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
