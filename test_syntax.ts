import { serve } from "https://deno.land/std@0.177.1/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = "AIzaSyDk5uvdwd0OtwS2MZICfTa4d_I0oaGY9i8";

const SYSTEM_PROMPT = `[TODO: paste full SYSTEM_PROMPT here]`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipoProyecto, descripcion, funcionalidades, urgencia, horasMaximas } = await req.json();

    const userPrompt = "Analiza el siguiente requerimiento y genera una estimación técnica USANDO LOS RANGOS DE TIEMPO BASE del sistema.\n\nTIPO DE PROYECTO: " + tipoProyecto + "\n\nDESCRIPCIÓN DEL REQUERIMIENTO:\n" + descripcion + "\n\nFUNCIONALIDADES SOLICITADAS:\n" + (funcionalidades && funcionalidades.length > 0 ? funcionalidades.map((f, i) => (i + 1) + ". " + f).join('\n') : 'No especificadas') + "\n\nNIVEL DE URGENCIA: " + urgencia + "\n\n" + (horasMaximas ? "LÍMITE DE HORAS (PRESUPUESTO): " + horasMaximas + " horas. Ajusta el alcance si es necesario." : 'Sin límite de presupuesto especificado.') + "\n\nIMPORTANTE: Usa los RANGOS DE TIEMPO BASE definidos en las instrucciones del sistema para estimar cada módulo. Por ejemplo, si es 'Autenticación básica', estima entre 6-8 horas.\n\nGenera la estimación en formato JSON según la estructura requerida.";

    [REST OF FILE CONTINUES...]
