import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Sparkles, Clock, BarChart3, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";

const PLAN_FEATURES = {
    free: {
        name: "Free",
        color: "text-muted-foreground",
        badgeClass: "bg-secondary text-secondary-foreground",
        features: [
            "5 presupuestos por mes",
            "Cotizador IA básico",
            "1 rubro configurado",
            "Vista pública de presupuestos",
        ],
    },
    premium: {
        name: "Premium",
        color: "text-nexabis-orange",
        badgeClass: "bg-gradient-nexabis text-white border-0",
        features: [
            "Presupuestos ilimitados",
            "Cotizador IA avanzado multi-rubro",
            "Todos los rubros disponibles",
            "Exportación PDF profesional",
            "Gestión de proyectos completa",
            "Soporte prioritario",
        ],
    },
    enterprise: {
        name: "Enterprise",
        color: "text-primary",
        badgeClass: "bg-primary text-primary-foreground",
        features: [
            "Todo lo de Premium",
            "API access",
            "Custom branding",
            "Onboarding personalizado",
        ],
    },
};

const MiSuscripcion = () => {
    const {
        tier,
        status,
        isPremium,
        isTrial,
        isExpired,
        isSuspended,
        trialDaysLeft,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        current,
        limit,
        remaining,
        loading,
    } = useSubscription();

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const planInfo = PLAN_FEATURES[tier] || PLAN_FEATURES.free;
    const usagePercent = limit && current !== null ? Math.round((current / limit) * 100) : 0;

    const getStatusBadge = () => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Activa</Badge>;
            case "trial":
                return <Badge className="bg-nexabis-orange/20 text-nexabis-orange border-nexabis-orange/30"><Clock className="w-3 h-3 mr-1" /> Prueba</Badge>;
            case "suspended":
                return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Suspendida</Badge>;
            case "cancelled":
                return <Badge variant="secondary">Cancelada</Badge>;
            case "pending_cancellation":
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Cancelando</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold gradient-text">Mi Suscripción</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tu plan y uso</p>
                </div>

                {/* Alerts */}
                {isExpired && (
                    <Card className="p-4 border-destructive/50 bg-destructive/10">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-destructive">Tu período de prueba ha expirado</p>
                                <p className="text-sm text-muted-foreground">Elige un plan para seguir creando presupuestos.</p>
                            </div>
                            <Button className="gradient-button shrink-0">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Mejorar Plan
                            </Button>
                        </div>
                    </Card>
                )}

                {isSuspended && (
                    <Card className="p-4 border-destructive/50 bg-destructive/10">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-destructive">Suscripción suspendida</p>
                                <p className="text-sm text-muted-foreground">Actualiza tu método de pago para reactivar tu cuenta.</p>
                            </div>
                        </div>
                    </Card>
                )}

                {cancelAtPeriodEnd && (
                    <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium text-yellow-400">Cancelación programada</p>
                                <p className="text-sm text-muted-foreground">
                                    Tu plan seguirá activo hasta {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("es-CL") : "el final del período"}.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Plan Card */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-muted-foreground" />
                                <h2 className="font-heading font-semibold text-lg">Plan Actual</h2>
                            </div>
                            {getStatusBadge()}
                        </div>

                        <div className="space-y-3">
                            <Badge className={`${planInfo.badgeClass} text-sm px-3 py-1`}>
                                {planInfo.name}
                            </Badge>

                            {isTrial && trialDaysLeft !== null && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Días restantes</span>
                                        <span className="font-medium text-nexabis-orange">{trialDaysLeft} días</span>
                                    </div>
                                    <Progress value={Math.max(0, ((14 - trialDaysLeft) / 14) * 100)} className="h-2" />
                                </div>
                            )}

                            {currentPeriodEnd && status === "active" && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Próximo cobro</span>
                                    <span className="font-medium">{new Date(currentPeriodEnd).toLocaleDateString("es-CL")}</span>
                                </div>
                            )}

                            <ul className="space-y-2 pt-2">
                                {planInfo.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPremium ? "text-nexabis-orange" : "text-muted-foreground"}`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>

                    {/* Usage Card */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-muted-foreground" />
                            <h2 className="font-heading font-semibold text-lg">Uso del Mes</h2>
                        </div>

                        {isPremium ? (
                            <div className="space-y-4">
                                <div className="text-center py-8">
                                    <Sparkles className="w-10 h-10 text-nexabis-orange mx-auto mb-3" />
                                    <p className="font-heading font-semibold text-lg">Uso Ilimitado</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Tu plan Premium incluye presupuestos y cotizaciones ilimitadas.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Presupuestos creados</span>
                                        <span className="font-medium">{current ?? 0} / {limit ?? 5}</span>
                                    </div>
                                    <Progress value={usagePercent} className="h-3" />
                                    {remaining !== null && remaining > 0 && (
                                        <p className="text-xs text-muted-foreground">{remaining} presupuesto{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}</p>
                                    )}
                                    {remaining !== null && remaining === 0 && (
                                        <p className="text-xs text-destructive font-medium">Has alcanzado tu límite mensual</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        ¿Necesitas más? Mejora a Premium para presupuestos ilimitados.
                                    </p>
                                    <Button className="w-full gradient-button">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Mejorar a Premium
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Upgrade CTA for free users */}
                {!isPremium && (
                    <Card className="p-6 bg-gradient-to-r from-coral/5 via-nexabis-orange/5 to-nexabis-yellow/5 border-nexabis-orange/20">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-heading font-bold text-lg gradient-text">Potencia tu negocio con Premium</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Presupuestos ilimitados, IA multi-rubro, exportación PDF profesional y soporte prioritario.
                                </p>
                            </div>
                            <Button size="lg" className="gradient-button gap-2 shrink-0">
                                <ExternalLink className="w-4 h-4" />
                                Ver Planes y Precios
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MiSuscripcion;
