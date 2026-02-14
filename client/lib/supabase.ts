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

// Use proxied URL for browser requests to avoid fetch interception/CORS issues
// We use a full URL because supabase-js validates it must start with http/https
const supabaseUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/supabase`
  : "https://placeholder.supabase.co";

const supabaseAnonKey = rawKey;

if (isPlaceholder(rawKey)) {
  console.error("❌ Supabase Anon Key missing or invalid!", {
    key: rawKey ? "PLACEHOLDER" : "MISSING"
  });
} else {
  console.log("✅ Supabase client initialized via proxy:", supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);
