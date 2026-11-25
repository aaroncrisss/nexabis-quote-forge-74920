import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionTier = "free" | "premium" | "enterprise";
export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled" | "pending_cancellation";

interface SubscriptionState {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    rubro: string;
    maxPresupuestosMes: number;
    // Computed
    canCreate: boolean;
    remaining: number | null;
    current: number | null;
    limit: number | null;
    blockReason: string | null;
    loading: boolean;
}

const DEFAULT_STATE: SubscriptionState = {
    tier: "free",
    status: "trial",
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    rubro: "tecnologia",
    maxPresupuestosMes: 5,
    canCreate: true,
    remaining: null,
    current: null,
    limit: null,
    blockReason: null,
    loading: true,
};

// Caché compartida en memoria (60 s) + deduplicación de promesas entre DashboardLayout y páginas hijas.
const SUB_CACHE_TTL_MS = 60_000;
let subCache: {
    userId: string | null;
    state: SubscriptionState | null;
    ts: number;
    promise: Promise<SubscriptionState> | null;
} = { userId: null, state: null, ts: 0, promise: null };

async function fetchSubscriptionForUser(userId: string, force = false): Promise<SubscriptionState> {
    if (!force && subCache.userId === userId) {
        if (subCache.state && Date.now() - subCache.ts < SUB_CACHE_TTL_MS) {
            return subCache.state;
        }
        if (subCache.promise) return subCache.promise;
    }

    const p = (async (): Promise<SubscriptionState> => {
        try {
            const [profileRes, rpcRes] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("subscription_tier, subscription_status, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end, rubro, max_presupuestos_mes")
                    .eq("id", userId)
                    .single(),
                supabase.rpc("can_create_presupuesto", { user_uuid: userId }),
            ]);

            if (profileRes.error) {
                console.error("Error loading subscription:", profileRes.error);
                return { ...DEFAULT_STATE, loading: false };
            }

            const profile = profileRes.data;
            let canCreate = true;
            let remaining: number | null = null;
            let current: number | null = null;
            let limit: number | null = null;
            let blockReason: string | null = null;

            if (!rpcRes.error && rpcRes.data) {
                const result = rpcRes.data as any;
                canCreate = result.allowed ?? true;
                remaining = result.remaining ?? null;
                current = result.current ?? null;
                limit = result.limit ?? null;
                blockReason = result.allowed ? null : result.reason;
            }

            const nextState: SubscriptionState = {
                tier: (profile?.subscription_tier as SubscriptionTier) || "free",
                status: (profile?.subscription_status as SubscriptionStatus) || "trial",
                trialEndsAt: profile?.trial_ends_at || null,
                currentPeriodEnd: profile?.subscription_current_period_end || null,
                cancelAtPeriodEnd: profile?.subscription_cancel_at_period_end || false,
                rubro: profile?.rubro || "tecnologia",
                maxPresupuestosMes: profile?.max_presupuestos_mes || 5,
                canCreate,
                remaining,
                current,
                limit,
                blockReason,
                loading: false,
            };
            if (subCache.userId === userId) {
                subCache.state = nextState;
                subCache.ts = Date.now();
                subCache.promise = null;
            }
            return nextState;
        } catch (err) {
            console.error("Error in useSubscription:", err);
            if (subCache.userId === userId) subCache.promise = null;
            return { ...DEFAULT_STATE, loading: false };
        }
    })();

    subCache = { userId, state: force ? null : subCache.state, ts: force ? 0 : subCache.ts, promise: p };
    return p;
}

export const useSubscription = () => {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [state, setState] = useState<SubscriptionState>(() => {
        if (userId && subCache.userId === userId && subCache.state && Date.now() - subCache.ts < SUB_CACHE_TTL_MS) {
            return subCache.state;
        }
        return DEFAULT_STATE;
    });

    const loadSubscription = useCallback(async (force = false) => {
        if (!userId) {
            subCache = { userId: null, state: null, ts: 0, promise: null };
            setState({ ...DEFAULT_STATE, loading: false });
            return;
        }
        const next = await fetchSubscriptionForUser(userId, force);
        setState(next);
    }, [userId]);

    useEffect(() => {
        let alive = true;
        if (!userId) {
            setState({ ...DEFAULT_STATE, loading: false });
            return;
        }
        fetchSubscriptionForUser(userId, false).then((next) => {
            if (alive) setState(next);
        });
        return () => {
            alive = false;
        };
    }, [userId]);

    const isPremium = state.tier === "premium" || state.tier === "enterprise";
    const isTrial = state.status === "trial";
    const isExpired = state.status === "trial" && state.trialEndsAt !== null && new Date(state.trialEndsAt) < new Date();
    const isSuspended = state.status === "suspended";
    const isCancelled = state.status === "cancelled";

    const trialDaysLeft = isTrial && state.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(state.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const getBlockMessage = (): string => {
        switch (state.blockReason) {
            case "subscription_suspended":
                return "Tu suscripción está suspendida. Actualiza tu método de pago para continuar.";
            case "subscription_cancelled":
                return "Tu suscripción ha sido cancelada. Reactiva tu plan para continuar.";
            case "trial_expired":
                return "Tu período de prueba ha expirado. Elige un plan para continuar creando presupuestos.";
            case "monthly_limit_reached":
                return `Has alcanzado el límite de ${state.limit} presupuestos este mes. Mejora a Premium para presupuestos ilimitados.`;
            case "no_profile":
                return "No se encontró tu perfil. Contacta soporte.";
            default:
                return "No puedes crear presupuestos en este momento.";
        }
    };

    const refresh = useCallback(() => loadSubscription(true), [loadSubscription]);

    return {
        ...state,
        isPremium,
        isTrial,
        isExpired,
        isSuspended,
        isCancelled,
        trialDaysLeft,
        getBlockMessage,
        refresh,
    };
};
