import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "editor";

interface AuthState {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
}

async function fetchRole(userId: string): Promise<AppRole | null> {
  const { data } = await (supabase.from("user_roles") as any)
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .single();
  return (data?.role as AppRole) ?? null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const roleCache = useRef<{ userId: string; role: AppRole | null } | null>(null);
  const initialized = useRef(false);
  const fetchingRole = useRef(false);

  const resolveRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      roleCache.current = null;
      setLoading(false);
      return;
    }

    setUser(currentUser);

    // Use cached role if same user
    if (roleCache.current?.userId === currentUser.id) {
      setRole(roleCache.current.role);
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (fetchingRole.current) return;
    fetchingRole.current = true;

    try {
      const r = await fetchRole(currentUser.id);
      roleCache.current = { userId: currentUser.id, role: r };
      setRole(r);
    } catch (err) {
      console.warn("Failed to fetch role:", err);
      if (roleCache.current?.userId === currentUser.id) {
        setRole(roleCache.current.role);
      }
    } finally {
      fetchingRole.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION") {
          initialized.current = true;
          await resolveRole(session?.user ?? null);
          return;
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          roleCache.current = null;
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN") {
          await resolveRole(session?.user ?? null);
          return;
        }

        if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
          // Keep cached role, no need to re-fetch
          if (roleCache.current?.userId === session.user.id) {
            setRole(roleCache.current.role);
          }
        }
      }
    );

    // Fallback: if INITIAL_SESSION never fires within 3s
    const timeout = setTimeout(() => {
      if (mounted && !initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [resolveRole]);

  return {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isEditor: role === "editor",
  };
}
