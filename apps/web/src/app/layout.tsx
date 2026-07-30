import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { PageTransition } from "@/components/motion/page-transition";
import { Providers } from "@/components/providers";
import { webEnvironment } from "@/lib/env";

import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rober | Know your size in every brand",
    template: "%s | Rober",
  },
  description:
    "Fit translation for denim, grounded in the pair you already trust.",
  applicationName: "Rober",
  category: "shopping",
  formatDetection: { telephone: false },
  openGraph: {
    siteName: "Rober",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rober | Know your size in every brand",
    description:
      "Start with jeans that already fit. Rober tells you which size to buy next.",
  },
};

export default async function RootLayout({
  children,
  panel,
}: Readonly<{ children: ReactNode; panel?: ReactNode }>) {
  // Strict nonce-based CSP requires a fresh server render for each request.
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      data-runtime-mode={webEnvironment.mode}
      suppressHydrationWarning
    >
      <body>
        <Providers {...(nonce ? { nonce } : {})}>
          <SiteShell>
            <PageTransition>{children}</PageTransition>
            {panel}
          </SiteShell>
        </Providers>
      </body>
    </html>
  );
}
