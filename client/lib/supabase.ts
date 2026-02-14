import { createClient } from "@supabase/supabase-js";

// Helper to check if a value is a placeholder
const isPlaceholder = (val: string | undefined) => 
  !val || val.includes("your-") || val.includes("__") || val.length < 20;

// Try multiple environment variable names
const supabaseUrl = !isPlaceholder(import.meta.env.VITE_SB_SUPABASE_URL)
  ? import.meta.env.VITE_SB_SUPABASE_URL
  : (import.meta.env.VITE_SUPABASE_URL || "");

const supabaseAnonKey = !isPlaceholder(import.meta.env.VITE_SB_SUPABASE_ANON_KEY)
  ? import.meta.env.VITE_SB_SUPABASE_ANON_KEY
  : (import.meta.env.VITE_SUPABASE_ANON_KEY || "");

// Always require real credentials
if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.error("❌ Supabase credentials missing or invalid:", {
    url: supabaseUrl ? "present" : "missing",
    key: supabaseAnonKey ? "present" : "missing",
    isUrlPlaceholder: isPlaceholder(supabaseUrl),
    isKeyPlaceholder: isPlaceholder(supabaseAnonKey)
  });
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder"
);
