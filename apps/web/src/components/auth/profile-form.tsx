"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function ProfileForm({
  initialDisplayName,
  userId,
}: {
  initialDisplayName: string;
  userId: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("id", userId);
    setSaving(false);

    toast(
      error
        ? {
            title: "Profile was not saved",
            description: "Your current details are unchanged. Try again.",
          }
        : {
            title: "Profile saved",
            description: "Your fit account is up to date.",
            tone: "success",
          },
    );
  }

  return (
    <form onSubmit={saveProfile} className="border-y border-border py-8">
      <label
        htmlFor="display-name"
        className="block font-sans text-sm font-bold"
      >
        Display name
      </label>
      <input
        id="display-name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        maxLength={80}
        autoComplete="name"
        className="mt-3 h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" className="mt-5" disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
