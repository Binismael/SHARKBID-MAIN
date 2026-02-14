import { createClient } from "@supabase/supabase-js";

// Basic environment variable retrieval
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SB_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SB_SUPABASE_ANON_KEY;

// Validation with helpful error messages
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase configuration missing!", {
    url: supabaseUrl ? "present" : "MISSING",
    key: supabaseAnonKey ? "present" : "MISSING",
    availableKeys: Object.keys(import.meta.env).filter(k => k.includes("SUPABASE"))
  });
}

// Check for placeholder values (common issue)
const isPlaceholder = (val: string | undefined) => 
  val && (val.includes("your-") || val.includes("__") || val.length < 10);

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.warn("⚠️ Supabase client initialized with potential placeholder values.", {
    urlIsPlaceholder: isPlaceholder(supabaseUrl),
    keyIsPlaceholder: isPlaceholder(supabaseAnonKey)
  });
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
