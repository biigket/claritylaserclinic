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
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error) {
    console.warn("fetchRole error:", error.message);
    return null;
  }

  return (data?.role as AppRole) ?? null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<{
    user: User | null;
    role: AppRole | null;
    loading: boolean;
  }>({ user: null, role: null, loading: true });

  const roleCache = useRef<{ userId: string; role: AppRole | null } | null>(null);

  const resolveUser = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      roleCache.current = null;
      setState({ user: null, role: null, loading: false });
      return;
    }

    // Use cached role immediately while we verify
    if (roleCache.current?.userId === currentUser.id) {
      setState({ user: currentUser, role: roleCache.current.role, loading: false });
      return;
    }

    // Set user immediately but keep loading until role is fetched
    setState(prev => ({ ...prev, user: currentUser, loading: true }));

    try {
      const role = await fetchRole(currentUser.id);
      roleCache.current = { userId: currentUser.id, role };
      setState({ user: currentUser, role, loading: false });
    } catch {
      setState({ user: currentUser, role: null, loading: false });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        resolved = true;
        roleCache.current = null;
        setState({ user: null, role: null, loading: false });
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        resolved = true;
        await resolveUser(session?.user ?? null);
        return;
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        // Keep cached role, just update user object
        const cachedRole = roleCache.current?.userId === session.user.id
          ? roleCache.current.role
          : null;
        setState({ user: session.user, role: cachedRole, loading: false });
      }
    });

    // Fallback: if INITIAL_SESSION doesn't fire within 2s, hydrate manually
    const fallbackTimer = setTimeout(async () => {
      if (!mounted || resolved) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || resolved) return;
        resolved = true;
        await resolveUser(session?.user ?? null);
      } catch {
        if (mounted && !resolved) {
          resolved = true;
          setState({ user: null, role: null, loading: false });
        }
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [resolveUser]);

  return {
    user: state.user,
    role: state.role,
    loading: state.loading,
    isAdmin: state.role === "admin",
    isEditor: state.role === "editor",
  };
}
