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
  const hadSessionBefore = useRef(false);

  const applyUser = useCallback(async (currentUser: User | null, forceRoleFetch = false) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      roleCache.current = null;
      return;
    }

    hadSessionBefore.current = true;
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
        // Keep cached role on network error — don't kick user out
        if (roleCache.current?.userId === currentUser.id) {
          setRole(roleCache.current.role);
        }
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          hadSessionBefore.current = false;
          setUser(null);
          setRole(null);
          roleCache.current = null;
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          if (session?.user) {
            setUser(session.user);
            // Re-apply cached role to ensure state is consistent
            if (roleCache.current?.userId === session.user.id) {
              setRole(roleCache.current.role);
            }
          }
          return;
        }

        if (event === "SIGNED_IN") {
          await applyUser(session?.user ?? null, true);
          setLoading(false);
          return;
        }

        if (event === "INITIAL_SESSION" && !sessionChecked.current) {
          await applyUser(session?.user ?? null, true);
          sessionChecked.current = true;
          setLoading(false);
        }
      }
    );

    // Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted && !sessionChecked.current) {
        sessionChecked.current = true;
        setLoading(false);
      }
    }, 5000);

    // Proactive token refresh on window focus to prevent expiry
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && hadSessionBefore.current) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn("Session refresh on focus failed:", error);
            return;
          }
          if (session?.user && mounted) {
            setUser(session.user);
            if (roleCache.current?.userId === session.user.id) {
              setRole(roleCache.current.role);
            }
          }
        } catch (err) {
          console.warn("Visibility refresh error:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
