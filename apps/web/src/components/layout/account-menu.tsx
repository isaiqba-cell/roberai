"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  CircleUserRound,
  LogIn,
  LogOut,
  Ruler,
  SwatchBook,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

export function AccountMenu() {
  const { loading, signOut, user } = useAuth();

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
          <DropdownMenu.Label className="max-w-56 truncate px-3 py-2 font-sans text-xs font-bold uppercase text-muted-foreground">
            {loading ? "Checking account" : (user?.email ?? "Guest mode")}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <Link
              href={user ? "/account" : "/auth"}
              className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm outline-none focus:bg-muted"
            >
              {user ? (
                <Ruler aria-hidden="true" className="size-4" />
              ) : (
                <LogIn aria-hidden="true" className="size-4" />
              )}
              {user ? "Fit profile" : "Sign in"}
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
          {user ? (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={(event) => {
                  event.preventDefault();
                  void signOut();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 font-sans text-sm outline-none focus:bg-muted"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Sign out
              </DropdownMenu.Item>
            </>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
