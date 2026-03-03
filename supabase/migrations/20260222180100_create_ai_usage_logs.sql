-- =====================================================
-- MIGRATION: Create AI usage logs table
-- Tracks AI consumption per user to prevent abuse
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_operacion text NOT NULL,          -- 'cotizacion' | 'optimizacion' | 'nl_to_items'
  tokens_entrada int,
  tokens_salida int,
  modelo text,                           -- 'gemini-2.5-flash'
  rubro_contexto text,
  exitoso boolean DEFAULT true,
  error_mensaje text,
  metadata jsonb,                        -- Additional context data
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI usage logs
CREATE POLICY "Users can view own AI logs"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = usuario_id);

-- Users can insert their own AI usage logs
CREATE POLICY "Users can insert own AI logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Admins can view all AI logs
CREATE POLICY "Admins can view all AI logs"
  ON public.ai_usage_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_usuario_id ON public.ai_usage_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tipo ON public.ai_usage_logs(tipo_operacion);
