import type { Metadata } from "next";
import type { ReactNode } from "react";

import { webEnvironment } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "Rober | Find your fit",
  description: "A fit-first denim marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-runtime-mode={webEnvironment.mode}>
      <body>{children}</body>
    </html>
  );
}
