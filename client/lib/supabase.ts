import { createClient } from "@supabase/supabase-js";

// Helper to check if a value is a placeholder
const isPlaceholder = (val: string | undefined) => 
  !val || val.includes("your-") || val.includes("__") || val.length < 20;

const rawUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SB_SUPABASE_URL || "";
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SB_SUPABASE_ANON_KEY || "";

const supabaseUrl = !isPlaceholder(rawUrl) ? rawUrl : "";
const supabaseAnonKey = !isPlaceholder(rawKey) ? rawKey : "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase configuration missing!");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
