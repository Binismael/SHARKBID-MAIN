import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SB_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SB_SUPABASE_ANON_KEY;

// Always require real credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ FATAL: Supabase credentials not configured. Set VITE_SB_SUPABASE_URL and VITE_SB_SUPABASE_ANON_KEY"
  );
}

console.log("✅ Supabase configured with URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
