// Custom Supabase client for self-hosted instance
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://supabase.nexabistech.com';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzEzMTU2MCwiZXhwIjo0OTE4ODA1MTYwLCJyb2xlIjoiYW5vbiJ9.AqizZuZKilSwv5aiPwaWx5wooHg-5KjoH8rNZAnymCY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
