// Lightweight browser Supabase client with safe fallbacks
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Prefer Vite env vars, but provide safe public fallbacks so preview works even if Vite doesn't reload config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rgbylwefvhlijfrrdvhi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYnlsd2VmdmhsaWpmcnJkdmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY2OTIsImV4cCI6MjA3Nzg0MjY5Mn0.jtyilhKoJKce5g4EO5AqKASNT4_evz_GEJGGeG_Eyvs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
