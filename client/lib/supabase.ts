import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL in client:", supabaseUrl);
console.log("Supabase Anon Key in client:", supabaseAnonKey);

// Always require real credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ FATAL: Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

console.log("✅ Supabase configured with URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
