"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, CircleUserRound, Ruler, SwatchBook } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AccountMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="gap-2 px-3">
          <CircleUserRound aria-hidden="true" />
          <span>Account</span>
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-card border border-border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          <DropdownMenu.Label className="px-3 py-2 font-sans text-xs font-bold uppercase text-muted-foreground">
            Guest mode
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <Link
              href="/"
              className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm outline-none focus:bg-muted"
            >
              <Ruler aria-hidden="true" className="size-4" />
              Fit profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link
              href="/playground"
              className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm outline-none focus:bg-muted"
            >
              <SwatchBook aria-hidden="true" className="size-4" />
              Design playground
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
