"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import type { Tables } from "../supabase/schema";
import { supabase } from "../supabase/client";

// Export syncUserWithSupabase
export async function syncUserWithSupabase(privyUser: any) {
  // Implementation for syncing user data with Supabase
  const { id, email, name } = privyUser;

  const { error } = await supabase
    .from("users")
    .upsert({ privy_id: id, email, name }, { onConflict: "privy_id" });

  if (error) {
    console.error("Error syncing user with Supabase:", error);
    throw error;
  }
}

// Export getCurrentUser
export async function getCurrentUser(privyId: string) {
  // Implementation for fetching the current user from Supabase
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("privy_id", privyId)
    .single();

  if (error) {
    console.error("Error fetching current user from Supabase:", error);
    throw error;
  }

  return data;
}

export function usePrivyWithSupabase() {
  const { user: privyUser, authenticated, loading: privyLoading, ready } = usePrivy();
  const [supabaseUser, setSupabaseUser] = useState<Tables<"users"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function syncAndFetchUser() {
      if (authenticated && privyUser && ready) {
        try {
          // First sync the user data from Privy to Supabase
          await syncUserWithSupabase(privyUser);

          // Then fetch the latest user data from Supabase
          const user = await getCurrentUser(privyUser.id);
          setSupabaseUser(user);
        } catch (error) {
          console.error("Error syncing/fetching Supabase user:", error);
        } finally {
          setLoading(false);
        }
      } else if (!privyLoading && ready) {
        setLoading(false);
      }
    }

    syncAndFetchUser();
  }, [authenticated, privyUser, privyLoading, ready]);

  // Set up real-time subscription for user data changes
  useEffect(() => {
    if (!privyUser?.id) return;

    const userSubscription = supabase
      .channel(`user-${privyUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users", filter: `privy_id=eq.${privyUser.id}` },
        async (payload) => {
          // Update the user data when it changes
          const user = await getCurrentUser(privyUser.id);
          setSupabaseUser(user);
        },
      )
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
    };
  }, [privyUser?.id]);

  return {
    privyUser,
    supabaseUser,
    loading: loading || privyLoading || !ready,
    authenticated,
  };
}
