import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import {
  X,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings,
  Sun,
  Mic,
  Clock,
  Volume2,
  Key,
} from "lucide-react";
import {
  EVOLUTION_API_CONFIG,
  checkWhatsAppConnection,
  sendWhatsAppEventViaN8n,
  sendDailySummaryWhatsApp,
  EvolutionInstanceStatus,
} from "@/lib/whatsapp";

const Configuracion = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [waStatus, setWaStatus] = useState<EvolutionInstanceStatus | null>(null);
  const [checkingWa, setCheckingWa] = useState(false);
  const [sendingTestWa, setSendingTestWa] = useState(false);
  const [sendingDailyBriefing, setSendingDailyBriefing] = useState(false);
  const [testWaPhone, setTestWaPhone] = useState("+56986343217");
  const [sttConfig, setSttConfig] = useState({
    audioEngine: "groq",
    groqApiKey: "",
    openaiApiKey: "",
    webhookUrl: "",
  });
  const [savingStt, setSavingStt] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    email_empresa: "",
    nombre_empresa: "",
    direccion: "",
    telefono: "",
    rut: "",
    plantilla_tyc: "",
    moneda_predeterminada: "CLP",
    logo_url: "",
  });

  useEffect(() => {
    loadProfile();
    verifyWhatsApp();
    loadSttConfig();
  }, []);

  const loadSttConfig = async () => {
    try {
      const { data } = await supabaseCRM
        .from("crm_config")
        .select("valor")
        .eq("clave", "stt_config")
        .maybeSingle();
      if (data?.valor) {
        setSttConfig({
          audioEngine: data.valor.audioEngine || "groq",
          groqApiKey: data.valor.groqApiKey || "",
          openaiApiKey: data.valor.openaiApiKey || "",
          webhookUrl: data.valor.webhookUrl || "",
        });
      }
    } catch (e) {
      console.warn("Error cargando stt_config:", e);
    }
  };

  const handleSaveSttConfig = async () => {
    setSavingStt(true);
    try {
      const { error } = await supabaseCRM.from("crm_config").upsert({
        clave: "stt_config",
        valor: sttConfig,
        updated_by: "cristobal_abarca",
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Motor de audio y transcripción guardado correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar configuración de audio");
    } finally {
      setSavingStt(false);
    }
  };

  const verifyWhatsApp = async () => {
    setCheckingWa(true);
    const st = await checkWhatsAppConnection();
    setWaStatus(st);
    setCheckingWa(false);
  };

  const handleSendTestWhatsApp = async () => {
    setSendingTestWa(true);
    const res = await sendWhatsAppEventViaN8n({
      tipo_evento: "test_conexion",
      telefono_destino: testWaPhone,
      mensaje:
        `✅ *Prueba de Conexión — Nexabis Quote Forge + Roadmap*\n\n` +
        `• *Instancia Evolution API:* ${EVOLUTION_API_CONFIG.instanceName}\n` +
        `• *Vía:* n8n + Evolution API\n` +
        `• *Estado:* Operativo en tiempo real`,
    });
    setSendingTestWa(false);
    if (res.ok) {
      toast.success(`Mensaje de prueba enviado por WhatsApp (${res.via})`);
    } else {
      toast.error(res.error || "No se pudo enviar el mensaje de prueba");
    }
  };

  const handleSendDailySummaryNow = async () => {
    setSendingDailyBriefing(true);
    try {
      const { data: tasksData, error } = await supabaseCRM
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const res = await sendDailySummaryWhatsApp({
        tasks: tasksData || [],
        userName: profile.nombre || "Cris",
        targetPhone: testWaPhone || "+56986343217",
      });

      if (res.ok) {
        toast.success("☀️ Resumen operativo diario enviado a WhatsApp (+56986343217)");
      } else {
        toast.error(res.error || "No se pudo enviar el resumen diario");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al generar el resumen diario");
    } finally {
      setSendingDailyBriefing(false);
    }
  };

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (data) {
      setProfile(data as any);
      if ((data as any).telefono) setTestWaPhone((data as any).telefono);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      if (profile.logo_url) {
        const oldPath = profile.logo_url.split("/logos/")[1];
        if (oldPath) {
          await supabase.storage.from("logos").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(fileName);

      setProfile({ ...profile, logo_url: publicUrl });
      toast.success("Logo subido exitosamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (profile.logo_url) {
        const oldPath = profile.logo_url.split("/logos/")[1];
        if (oldPath) {
          await supabase.storage.from("logos").remove([oldPath]);
        }
      }

      setProfile({ ...profile, logo_url: "" });
      toast.success("Logo eliminado");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Contraseña actualizada exitosamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);

      if (error) throw error;
      toast.success("Configuración guardada");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Configuración
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personaliza tu perfil de empresa, términos y conexión activa de WhatsApp Evolution API
            </p>
          </div>
        </div>

        {/* Evolution API + n8n WhatsApp Integration Card */}
        <Card className="p-4 space-y-4 bg-card/60 border-emerald-500/30 transition-all duration-200 hover:border-emerald-500/50 hover:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-heading font-semibold flex flex-wrap items-center gap-2">
                  WhatsApp Evolution API & n8n
                  {waStatus?.connected ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[10px] h-5">
                      <CheckCircle2 className="w-3 h-3" /> Conectado ({waStatus.state})
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-amber-400 border-amber-500/30 gap-1 text-[10px] h-5"
                    >
                      <AlertCircle className="w-3 h-3" /> {waStatus?.state || "Verificando..."}
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Notificaciones en tiempo real para Presupuestos, Tareas, P0, Rompelíneas y
                  Briefing Diario
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={verifyWhatsApp}
                disabled={checkingWa}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${checkingWa ? "animate-spin" : ""}`} />
                Verificar
              </Button>
              <a href={EVOLUTION_API_CONFIG.managerUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Manager
                </Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-background/60 p-3 rounded-lg border border-border">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Instancia Evolution API
              </span>
              <span className="font-mono font-semibold text-foreground">
                {EVOLUTION_API_CONFIG.instanceName} ({EVOLUTION_API_CONFIG.instanceId.slice(0, 8)}…)
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Número Briefing Diario Activo
              </span>
              <span className="font-mono font-bold text-emerald-400">+56986343217</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Servidor Evolution API
              </span>
              <span className="font-mono text-foreground">{EVOLUTION_API_CONFIG.baseUrl}</span>
            </div>
            <div className="sm:col-span-3 pt-1 border-t border-border/50">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Envío seguro
              </span>
              <span className="text-foreground">
                Los mensajes salen desde la función del servidor <span className="font-mono">whatsapp-send</span> (n8n con respaldo directo). La apikey ya no está en el navegador.
              </span>
            </div>
          </div>

          {/* Daily Briefing & Bidirectional Bot Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">
                  ☀️ Resumen Automático 08:30 AM
                </p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  Todos los días a las <strong>08:30 AM</strong> recibes automáticamente en{" "}
                  <span className="font-mono text-emerald-400">+56986343217</span> tu resumen
                  separado en <strong>🏢 Trabajo Nexabis</strong>, <strong>💼 Trabajo Normal</strong>{" "}
                  y <strong>☀️ Diarias & Personales</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/15 text-primary shrink-0 mt-0.5">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">
                  🎙️ Creación por Texto o Audio de WhatsApp
                </p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  Envía un mensaje con <code className="text-primary font-mono">tarea: ...</code>{" "}
                  (o <code className="text-primary font-mono">diaria: ...</code> /{" "}
                  <code className="text-primary font-mono">trabajo: ...</code>) o envía una{" "}
                  <strong>nota de voz (audio)</strong> al bot para crear tareas automáticamente en tu
                  tablero.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 pt-1">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Teléfono destino para pruebas y resumen diario</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={testWaPhone}
                onChange={(e) => setTestWaPhone(e.target.value)}
                placeholder="+56986343217"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendTestWhatsApp}
                disabled={sendingTestWa}
                className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingTestWa ? "Enviando..." : "Probar Conexión"}
              </Button>
              <Button
                size="sm"
                onClick={handleSendDailySummaryNow}
                disabled={sendingDailyBriefing}
                className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-semibold gap-1.5"
              >
                <Sun className="w-3.5 h-3.5" />
                {sendingDailyBriefing ? "Enviando Resumen..." : "Enviar Resumen Diario Ahora"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Motor de Transcripción de Audio WhatsApp (STT) */}
        <Card className="p-4 space-y-4 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                  Transcripción de Audio WhatsApp (Notas de Voz)
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                    Zero-AI / Groq Whisper / OpenAI
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Elige cómo procesar las notas de voz recibidas por WhatsApp sin depender de Gemini
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Motor de Audio Activo</Label>
              <Select
                value={sttConfig.audioEngine}
                onValueChange={(val) => setSttConfig({ ...sttConfig, audioEngine: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecciona motor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq">⚡ Groq Whisper (Recomendado · Rápido y Gratis)</SelectItem>
                  <SelectItem value="openai">🤖 OpenAI Whisper-1 (Estándar Oficial)</SelectItem>
                  <SelectItem value="none">🔒 Directo / Sin IA (Solo adjuntar audio original)</SelectItem>
                  <SelectItem value="webhook">🌐 Webhook Propio / n8n</SelectItem>
                  <SelectItem value="auto">🔄 Automático (Prioridad: Groq &gt; OpenAI &gt; Webhook)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {sttConfig.audioEngine === "groq" && "Usa Whisper Large V3 en Groq. Latencia ultrarrápida (~250ms), ideal para notas de voz."}
                {sttConfig.audioEngine === "openai" && "Usa Whisper-1 de OpenAI. Máxima precisión para términos técnicos en español."}
                {sttConfig.audioEngine === "none" && "No pasa por ninguna IA: adjunta la nota de voz a la tarea directamente con reproductor."}
                {sttConfig.audioEngine === "webhook" && "Envía el audio en base64 a tu propio servidor o flujo n8n para transcribir."}
                {sttConfig.audioEngine === "auto" && "Prueba Groq primero; si no hay clave, pasa a OpenAI o Webhook."}
              </p>
            </div>

            {sttConfig.audioEngine === "groq" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Clave API de Groq (gsk_...)</Label>
                <Input
                  type="password"
                  placeholder="gsk_..."
                  value={sttConfig.groqApiKey}
                  onChange={(e) => setSttConfig({ ...sttConfig, groqApiKey: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Obtén tu clave gratuita en{" "}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary underline">
                    console.groq.com
                  </a>
                </p>
              </div>
            )}

            {sttConfig.audioEngine === "openai" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Clave API de OpenAI (sk-...)</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={sttConfig.openaiApiKey}
                  onChange={(e) => setSttConfig({ ...sttConfig, openaiApiKey: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Obtén tu clave en{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline">
                    platform.openai.com
                  </a>
                </p>
              </div>
            )}

            {sttConfig.audioEngine === "webhook" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">URL de Webhook STT</Label>
                <Input
                  placeholder="https://tu-n8n.com/webhook/stt"
                  value={sttConfig.webhookUrl}
                  onChange={(e) => setSttConfig({ ...sttConfig, webhookUrl: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={handleSaveSttConfig}
              disabled={savingStt}
              className="h-8 text-xs px-4 gradient-button font-heading font-semibold"
            >
              {savingStt ? "Guardando..." : "Guardar Configuración de Audio"}
            </Button>
          </div>
        </Card>

        <Card className="p-4 space-y-4 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
          <h2 className="text-sm md:text-base font-heading font-semibold">Datos de Empresa y Perfil</h2>

          <div className="space-y-1.5">
            <Label className="text-xs">Logo de Empresa</Label>
            {profile.logo_url ? (
              <div className="flex items-center gap-3">
                <img
                  src={profile.logo_url}
                  alt="Logo"
                  className="h-14 object-contain border border-border rounded p-1.5"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleRemoveLogo}
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Eliminar
                </Button>
              </div>
            ) : (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="h-8 text-xs cursor-pointer"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Sube el logo de tu empresa (max 2MB)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre Completo</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                value={profile.nombre || ""}
                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email (cuenta)</Label>
              <Input className="h-8 text-xs md:text-sm" value={profile.email || ""} disabled />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email de Empresa (comprobantes)</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                value={profile.email_empresa || ""}
                onChange={(e) => setProfile({ ...profile, email_empresa: e.target.value })}
                placeholder="ej: contacto@miempresa.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nombre de Empresa</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                value={profile.nombre_empresa || ""}
                onChange={(e) => setProfile({ ...profile, nombre_empresa: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">RUT / Tax ID</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                value={profile.rut || ""}
                onChange={(e) => setProfile({ ...profile, rut: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono (WhatsApp)</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                value={profile.telefono || ""}
                onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Dirección</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                value={profile.direccion || ""}
                onChange={(e) => setProfile({ ...profile, direccion: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Moneda Predeterminada</Label>
              <Select
                value={profile.moneda_predeterminada}
                onValueChange={(v) => setProfile({ ...profile, moneda_predeterminada: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Términos y Condiciones por Defecto</Label>
            <Textarea
              className="text-xs"
              value={profile.plantilla_tyc || ""}
              onChange={(e) => setProfile({ ...profile, plantilla_tyc: e.target.value })}
              rows={3}
            />
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="h-8 text-xs px-4 gradient-button font-heading font-semibold"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Card>

        <Card className="p-4 space-y-3 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="text-sm md:text-base font-heading font-semibold">Cambiar Contraseña</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nueva Contraseña</Label>
              <Input
                type="password"
                className="h-8 text-xs md:text-sm"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Confirmar Nueva Contraseña</Label>
              <Input
                type="password"
                className="h-8 text-xs md:text-sm"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleChangePassword}
            disabled={
              changingPassword || !passwordData.newPassword || !passwordData.confirmPassword
            }
            className="h-8 text-xs px-4 gradient-button font-heading font-semibold"
          >
            {changingPassword ? "Actualizando..." : "Cambiar Contraseña"}
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
