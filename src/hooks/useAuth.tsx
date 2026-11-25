import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "usuario" | null;

// Caché y deduplicación en memoria por userId: evita que múltiples instancias de useAuth
// (ProtectedRoute, DashboardLayout, useSubscription, Tareas) + eventos INITIAL_SESSION/TOKEN_REFRESHED
// disparen 4-8 consultas repetidas a `user_roles` por cada carga de pantalla.
let roleCache: { userId: string | null; role: UserRole; promise: Promise<UserRole> | null } = {
  userId: null,
  role: null,
  promise: null,
};

function fetchUserRole(userId: string): Promise<UserRole> {
  if (roleCache.userId === userId) {
    if (roleCache.role !== null) return Promise.resolve(roleCache.role);
    if (roleCache.promise) return roleCache.promise;
  }

  const p: Promise<UserRole> = Promise.resolve(
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single(),
  )
    .then(({ data, error }) => {
      const resolved: UserRole = error ? "usuario" : ((data?.role as UserRole) || "usuario");
      if (roleCache.userId === userId) {
        roleCache.role = resolved;
        roleCache.promise = null;
      }
      return resolved;
    })
    .catch((err) => {
      console.error("Error loading role:", err);
      if (roleCache.userId === userId) {
        roleCache.role = "usuario";
        roleCache.promise = null;
      }
      return "usuario" as UserRole;
    });

  roleCache = { userId, role: null, promise: p };
  return p;
}

const ROLE_KEY = "nx_role_cache";
function readStoredRole(userId: string): UserRole {
  try {
    const c = JSON.parse(localStorage.getItem(ROLE_KEY) || "null");
    return c && c.userId === userId && (c.role === "admin" || c.role === "usuario") ? c.role : null;
  } catch {
    return null;
  }
}
function storeRole(userId: string, role: UserRole) {
  try {
    localStorage.setItem(ROLE_KEY, JSON.stringify({ userId, role }));
  } catch {
    /* sin storage */
  }
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const applySession = (nextUser: User | null) => {
      if (!alive) return;
      // Preserva referencia de `user` cuando solo se renovó el token (evita cascada de refetches en hooks hijos)
      setUser((prev) =>
        prev && nextUser && prev.id === nextUser.id && prev.email === nextUser.email
          ? prev
          : nextUser,
      );
      if (nextUser) {
        // Rol guardado de la visita anterior: la pantalla se muestra al instante y se confirma en segundo plano
        // (antes ProtectedRoute esperaba la consulta a user_roles, que con la base fría tardaba varios segundos).
        const stored = readStoredRole(nextUser.id);
        if (stored) {
          setRole(stored);
          setLoading(false);
        }
        fetchUserRole(nextUser.id).then((resolved) => {
          if (!alive) return;
          storeRole(nextUser.id, resolved);
          setRole(resolved);
          setLoading(false);
        });
      } else {
        roleCache = { userId: null, role: null, promise: null };
        setRole(null);
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        roleCache = { userId: null, role: null, promise: null };
        try {
          localStorage.removeItem(ROLE_KEY);
          localStorage.removeItem("nexabis_roadmap_cache_v1");
        } catch {
          /* sin storage */
        }
      }
      applySession(session?.user ?? null);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = role === "admin";

  return { user, role, isAdmin, loading };
};
