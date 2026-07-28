"use client";

import { useState, type FormEvent } from "react";
import { Chrome, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { safeAuthRedirect } from "@/lib/auth/redirect";
import type { AuthProviderSettings } from "@/lib/supabase/auth-settings";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type AuthNotice = { tone: "success" | "error"; message: string } | null;

export function AuthPanel({ providers }: { providers: AuthProviderSettings }) {
  const searchParams = useSearchParams();
  const { configured, loading: authLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [notice, setNotice] = useState<AuthNotice>(
    searchParams.get("status") === "link-expired"
      ? {
          tone: "error",
          message: "That sign-in link expired. Request a fresh one.",
        }
      : null,
  );
  const next = safeAuthRedirect(searchParams.get("next"));

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    setLoading("email");
    setNotice(null);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo.toString(),
        shouldCreateUser: true,
      },
    });
    setLoading(null);
    setNotice(
      error
        ? {
            tone: "error",
            message:
              "We could not send the link. Check the address and try again.",
          }
        : {
            tone: "success",
            message:
              "Check your inbox. Your private sign-in link is on its way.",
          },
    );
  }

  async function signInWithGoogle() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    setLoading("google");
    setNotice(null);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });

    if (error) {
      setLoading(null);
      setNotice({
        tone: "error",
        message:
          "Google sign-in is unavailable right now. Try an email link instead.",
      });
    }
  }

  if (authLoading) {
    return (
      <div
        className="h-64 animate-pulse border-y border-border bg-muted"
        aria-label="Checking account"
      />
    );
  }

  if (user) {
    return (
      <div className="border-y border-border py-8">
        <p className="font-sans text-sm leading-6 text-muted-foreground">
          Signed in as {user.email ?? "your Rober account"}.
        </p>
        <Button asChild className="mt-6">
          <Link href={next}>Continue to your fit profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-y border-border py-8">
      <form onSubmit={sendMagicLink} className="space-y-4">
        <label
          htmlFor="auth-email"
          className="block font-sans text-sm font-bold"
        >
          Email address
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={!configured || !providers.email || Boolean(loading)}
          className="h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={!configured || !providers.email || Boolean(loading)}
        >
          <Mail aria-hidden="true" />
          {loading === "email" ? "Sending link..." : "Email me a sign-in link"}
        </Button>
      </form>

      {providers.google ? (
        <>
          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="font-sans text-xs uppercase text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!configured || Boolean(loading)}
            onClick={() => void signInWithGoogle()}
          >
            <Chrome aria-hidden="true" />
            {loading === "google"
              ? "Opening Google..."
              : "Continue with Google"}
          </Button>
        </>
      ) : null}

      {!configured ? (
        <p
          role="status"
          className="mt-5 font-sans text-sm leading-6 text-muted-foreground"
        >
          Account sync is not configured in this environment. Guest fit memory
          still works.
        </p>
      ) : null}
      {configured && !providers.email ? (
        <p
          role="status"
          className="mt-5 font-sans text-sm leading-6 text-muted-foreground"
        >
          Account sign-in is temporarily unavailable. Your guest fit memory
          remains on this device.
        </p>
      ) : null}
      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mt-5 font-sans text-sm leading-6 ${
            notice.tone === "error" ? "text-destructive" : "text-fit-high"
          }`}
        >
          {notice.message}
        </p>
      ) : null}
    </div>
  );
}
