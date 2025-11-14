import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Robust fallbacks: prefer VITE_* from .env, then process.env VITE_*, then secrets without prefix, and finally hardcoded self-hosted defaults
  const supaUrl =
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://supabase.nexabistech.com"; // final safe fallback (self-hosted URL)

  const supaKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzEzMTU2MCwiZXhwIjo0OTE4ODA1MTYwLCJyb2xlIjoiYW5vbiJ9.AqizZuZKilSwv5aiPwaWx5wooHg-5KjoH8rNZAnymCY"; // final safe fallback (self-hosted anon key)

  const supaProject =
    env.VITE_SUPABASE_PROJECT_ID ||
    process.env.VITE_SUPABASE_PROJECT_ID ||
    process.env.SUPABASE_PROJECT_ID ||
    "supabasekong-r8w4w4ckogk0s8oko8cwoo0c"; // final safe fallback (self-hosted project id)

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
