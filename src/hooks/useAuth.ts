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

  const applyUser = useCallback(async (currentUser: User | null, forceRoleFetch = false) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      roleCache.current = null;
      setLoading(false);
      return;
    }

    setUser(currentUser);

    if (!forceRoleFetch && roleCache.current?.userId === currentUser.id) {
      setRole(roleCache.current.role);
      setLoading(false);
      return;
    }

    try {
      const nextRole = await fetchRole(currentUser.id);
      roleCache.current = { userId: currentUser.id, role: nextRole };
      setRole(nextRole);
    } catch (err) {
      console.warn("Failed to fetch role:", err);
      if (roleCache.current?.userId === currentUser.id) {
        setRole(roleCache.current.role);
      } else {
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "INITIAL_SESSION") {
        initialized.current = true;
        await applyUser(session?.user ?? null, true);
        return;
      }

      if (event === "SIGNED_IN") {
        await applyUser(session?.user ?? null, true);
        return;
      }

      if (event === "SIGNED_OUT") {
        initialized.current = true;
        setUser(null);
        setRole(null);
        roleCache.current = null;
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        await applyUser(session.user, false);
      }
    });

    // IMPORTANT: hydrate session explicitly (listener is set first)
    const hydrateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.warn("getSession error:", error);
        }

        if (!initialized.current) {
          initialized.current = true;
          await applyUser(session?.user ?? null, true);
        }
      } catch (err) {
        if (!mounted) return;
        console.warn("hydrateSession error:", err);
        if (!initialized.current) {
          initialized.current = true;
          setLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyUser]);

  return {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isEditor: role === "editor",
  };
}
