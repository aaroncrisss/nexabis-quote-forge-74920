/**
 * CRM Supabase Client Helper
 * 
 * The auto-generated Supabase types don't include the new CRM tables yet.
 * This helper provides an untyped client for CRM tables until the types 
 * are regenerated after migration deployment.
 * 
 * Usage: import { supabaseCRM } from "@/integrations/supabase/crm-client";
 *        supabaseCRM.from("pagos").select("*")
 */
import { supabase } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';

export const supabaseCRM = supabase as unknown as SupabaseClient;
