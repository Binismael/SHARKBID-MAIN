import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_APP;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_APP;

// Always require real credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ FATAL: Supabase credentials not configured. Set VITE_SUPABASE_URL_APP and VITE_SUPABASE_ANON_KEY_APP"
  );
}

console.log("✅ Supabase configured with URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
