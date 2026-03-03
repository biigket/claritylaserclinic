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
  const initialized = useRef(false);
  const roleCache = useRef<{ userId: string; role: AppRole | null } | null>(null);

  const handleUser = useCallback(async (currentUser: User | null, forceRoleFetch = false) => {
    setUser(currentUser);

    if (currentUser) {
      // Use cached role if same user and not forced
      if (!forceRoleFetch && roleCache.current?.userId === currentUser.id) {
        setRole(roleCache.current.role);
      } else {
        try {
          const r = await fetchRole(currentUser.id);
          roleCache.current = { userId: currentUser.id, role: r };
          setRole(r);
        } catch (err) {
          console.warn("Failed to fetch role, keeping cached:", err);
          // Don't clear role on network errors — keep existing session
          if (roleCache.current?.userId === currentUser.id) {
            setRole(roleCache.current.role);
          }
        }
      }
    } else {
      setRole(null);
      roleCache.current = null;
    }

    if (!initialized.current) {
      initialized.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;

        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          roleCache.current = null;
          if (!initialized.current) {
            initialized.current = true;
            setLoading(false);
          }
          return;
        }

        // TOKEN_REFRESHED: don't re-fetch role, just update user
        if (event === "TOKEN_REFRESHED") {
          setUser(currentUser);
          if (!initialized.current) {
            initialized.current = true;
            setLoading(false);
          }
          return;
        }

        // SIGNED_IN, INITIAL_SESSION, USER_UPDATED, etc.
        await handleUser(currentUser, event === "SIGNED_IN");
      }
    );

    // 2. Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only handle if listener hasn't already initialized
      if (!initialized.current) {
        handleUser(session?.user ?? null, true);
      }
    });

    // 3. Fallback timeout
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [handleUser]);

  return {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isEditor: role === "editor",
  };
}
