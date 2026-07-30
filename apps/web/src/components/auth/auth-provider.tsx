"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { useToast } from "@/components/ui/toast";
import { clearGuestAnchors, readGuestAnchors } from "@/lib/guest-anchors";
import { publicSupabaseConfig } from "@/lib/supabase/config";
import type { Database, Json } from "@/lib/supabase/database.types";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = Boolean(publicSupabaseConfig);
  const [supabase, setSupabase] = useState<
    SupabaseClient<Database> | null | undefined
  >(configured ? undefined : null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const mergedUserRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!configured) {
      return;
    }

    let active = true;
    void import("@/lib/supabase/browser")
      .then(({ getBrowserSupabaseClient }) => {
        if (active) setSupabase(getBrowserSupabaseClient());
      })
      .catch(() => {
        if (!active) return;
        setSupabase(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [configured]);

  const mergeGuestState = useCallback(
    async (userId: string) => {
      if (!supabase || mergedUserRef.current === userId) {
        return;
      }

      const anchors = readGuestAnchors(window.localStorage);
      if (anchors.length === 0) {
        mergedUserRef.current = userId;
        return;
      }

      const { error } = await supabase.rpc("merge_guest_anchors", {
        p_anchors: anchors as unknown as Json,
      });

      if (error) {
        toast({
          title: "Your fit memory is still on this device",
          description: "We could not sync it yet. Nothing was removed.",
        });
        return;
      }

      clearGuestAnchors(window.localStorage);
      mergedUserRef.current = userId;
      toast({
        title: "Fit memory synced",
        description: "Your guest reference pairs are now in your account.",
        tone: "success",
      });
    },
    [supabase, toast],
  );

  useEffect(() => {
    if (supabase === undefined) {
      return;
    }
    if (!supabase) {
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setLoading(false);
      if (data.user) {
        void mergeGuestState(data.user.id);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        queueMicrotask(() => void mergeGuestState(session.user.id));
      } else {
        mergedUserRef.current = null;
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [mergeGuestState, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({
      configured: Boolean(supabase),
      loading,
      signOut,
      user,
    }),
    [loading, signOut, supabase, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
