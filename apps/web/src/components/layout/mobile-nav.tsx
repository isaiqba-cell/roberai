"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Heart, Menu, Ruler, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const mobileLinks = [
  { href: "/matches", label: "Matches", icon: Ruler },
  { href: "/saved", label: "Saved", icon: Heart },
];

export function MobileNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          aria-label="Open navigation"
          title="Open navigation"
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/55 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(88vw,360px)] border-l border-border bg-card p-6 text-card-foreground shadow-2xl focus:outline-none">
          <Dialog.Title className="font-serif text-3xl">Navigate</Dialog.Title>
          <Dialog.Description className="mt-2 font-sans text-sm text-muted-foreground">
            Your fit profile, matches, and saved pairs.
          </Dialog.Description>
          <nav aria-label="Mobile navigation" className="mt-10 grid gap-2">
            {mobileLinks.map(({ href, icon: Icon, label }) => (
              <Dialog.Close asChild key={href}>
                <Link
                  href={href}
                  className="flex min-h-12 items-center gap-3 rounded-md px-3 font-sans font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <Dialog.Close asChild>
            <Button
              aria-label="Close navigation"
              title="Close navigation"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
