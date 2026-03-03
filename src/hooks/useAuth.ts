import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const rolesTable = () => supabase.from("user_roles") as any;
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
  const { data } = await rolesTable()
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
  const sessionChecked = useRef(false);

  const applyUser = useCallback(async (currentUser: User | null, forceRoleFetch = false) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      roleCache.current = null;
      return;
    }

    setUser(currentUser);

    // Use cached role if same user and not forced
    if (!forceRoleFetch && roleCache.current?.userId === currentUser.id) {
      setRole(roleCache.current.role);
    } else {
      try {
        const r = await fetchRole(currentUser.id);
        roleCache.current = { userId: currentUser.id, role: r };
        setRole(r);
      } catch (err) {
        console.warn("Failed to fetch role:", err);
        if (roleCache.current?.userId === currentUser.id) {
          setRole(roleCache.current.role);
        }
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Restore session from storage FIRST — this is the source of truth on refresh
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          await applyUser(session.user, true);
        }
      } catch (err) {
        console.warn("getSession error:", err);
      } finally {
        if (mounted) {
          sessionChecked.current = true;
          setLoading(false);
        }
      }
    };

    initSession();

    // 2. Listen for subsequent auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          roleCache.current = null;
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          // Just update user object, keep cached role
          if (session?.user) setUser(session.user);
          return;
        }

        if (event === "SIGNED_IN") {
          await applyUser(session?.user ?? null, true);
          setLoading(false);
          return;
        }

        // INITIAL_SESSION — only handle if getSession hasn't resolved yet
        if (event === "INITIAL_SESSION" && !sessionChecked.current) {
          await applyUser(session?.user ?? null, true);
          sessionChecked.current = true;
          setLoading(false);
        }
      }
    );

    // 3. Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted && !sessionChecked.current) {
        sessionChecked.current = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
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
