import { createClient } from "@supabase/supabase-js";

// Helper to check if a value is a placeholder
const isPlaceholder = (val: string | undefined) => 
  !val || val.includes("your-") || val.includes("__") || val.length < 10;

// Retrieve environment variables
const rawUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SB_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const rawKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SB_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "";

// Clean the URL (remove trailing slash)
const supabaseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
const supabaseAnonKey = rawKey;

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.error("❌ Supabase configuration missing or invalid!", {
    url: supabaseUrl ? (isPlaceholder(supabaseUrl) ? "PLACEHOLDER" : "PRESENT") : "MISSING",
    key: supabaseAnonKey ? (isPlaceholder(supabaseAnonKey) ? "PLACEHOLDER" : "PRESENT") : "MISSING"
  });
} else {
  console.log("✅ Supabase initialized for client:", supabaseUrl);
}

// In case fetch is overridden, we log it but use it.
// If it fails, the user will see it in the console.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage // Explicitly use localStorage
    }
  }
);
