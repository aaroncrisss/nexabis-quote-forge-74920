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

export const useSubscription = () => {
    const { user } = useAuth();
    const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);

    const loadSubscription = useCallback(async () => {
        if (!user) {
            setState({ ...DEFAULT_STATE, loading: false });
            return;
        }

        try {
            // Load profile subscription fields
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("subscription_tier, subscription_status, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end, rubro, max_presupuestos_mes")
                .eq("id", user.id)
                .single();

            if (profileError) {
                console.error("Error loading subscription:", profileError);
                setState({ ...DEFAULT_STATE, loading: false });
                return;
            }

            // Check if can create via RPC
            const { data: canCreateResult, error: rpcError } = await supabase
                .rpc("can_create_presupuesto", { user_uuid: user.id });

            let canCreate = true;
            let remaining: number | null = null;
            let current: number | null = null;
            let limit: number | null = null;
            let blockReason: string | null = null;

            if (!rpcError && canCreateResult) {
                const result = canCreateResult as any;
                canCreate = result.allowed ?? true;
                remaining = result.remaining ?? null;
                current = result.current ?? null;
                limit = result.limit ?? null;
                blockReason = result.allowed ? null : result.reason;
            }

            setState({
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
            });
        } catch (err) {
            console.error("Error in useSubscription:", err);
            setState({ ...DEFAULT_STATE, loading: false });
        }
    }, [user]);

    useEffect(() => {
        loadSubscription();
    }, [loadSubscription]);

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

    return {
        ...state,
        isPremium,
        isTrial,
        isExpired,
        isSuspended,
        isCancelled,
        trialDaysLeft,
        getBlockMessage,
        refresh: loadSubscription,
    };
};
