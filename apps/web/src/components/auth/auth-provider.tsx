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
import type { User } from "@supabase/supabase-js";

import { useToast } from "@/components/ui/toast";
import { clearGuestAnchors, readGuestAnchors } from "@/lib/guest-anchors";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Json } from "@/lib/supabase/database.types";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const mergedUserRef = useRef<string | null>(null);
  const { toast } = useToast();

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
