import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Robust fallbacks: prefer VITE_* from .env, then process.env VITE_*, then secrets without prefix, and finally hardcoded public defaults
  const supaUrl =
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://rgbylwefvhlijfrrdvhi.supabase.co"; // final safe fallback (public URL)

  const supaKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYnlsd2VmdmhsaWpmcnJkdmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjY2OTIsImV4cCI6MjA3Nzg0MjY5Mn0.jtyilhKoJKce5g4EO5AqKASNT4_evz_GEJGGeG_Eyvs"; // final safe fallback (anon key)

  const supaProject =
    env.VITE_SUPABASE_PROJECT_ID ||
    process.env.VITE_SUPABASE_PROJECT_ID ||
    process.env.SUPABASE_PROJECT_ID ||
    "rgbylwefvhlijfrrdvhi"; // final safe fallback (project id)

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supaUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supaKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supaProject),
    },
  };
});
