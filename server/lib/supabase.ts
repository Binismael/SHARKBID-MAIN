import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

export const isPlaceholder = (val: string | undefined) =>
  !val || val.includes("your-") || val.includes("__") || val.length < 20;

// Try multiple environment variable names
const supabaseUrl = !isPlaceholder(process.env.VITE_SUPABASE_URL)
  ? process.env.VITE_SUPABASE_URL!
  : (process.env.VITE_SB_SUPABASE_URL || "");

const serviceRoleKey = !isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : (process.env.SB_SUPABASE_SERVICE_ROLE_KEY || "");

export const isSupabaseConfigured = !isPlaceholder(supabaseUrl) && !isPlaceholder(serviceRoleKey);

if (!isSupabaseConfigured) {
  console.warn("⚠️ [SUPABASE] Credentials missing or using placeholders. Service role operations will fail.");
}

// Create client
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  serviceRoleKey || "sb_secret_placeholder"
);

export default supabaseAdmin;
