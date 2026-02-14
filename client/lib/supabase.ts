import { createClient } from "@supabase/supabase-js";

// Helper to check if a value is a placeholder
const isPlaceholder = (val: string | undefined) => 
  !val || val.includes("your-") || val.includes("__") || val.length < 10;

// Retrieve environment variables
const rawKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SB_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "";

// Force use of the local proxy to bypass environment-level fetch interception
const supabaseUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/api/v1/supabase`
  : "https://kpytttekmeoeqskfopqj.supabase.co";

const supabaseAnonKey = rawKey;

if (isPlaceholder(rawKey)) {
  console.error("❌ Supabase Anon Key missing or invalid!", {
    key: rawKey ? "PLACEHOLDER" : "MISSING"
  });
} else {
  console.log("✅ Supabase initialized via proxy:", supabaseUrl);
  if (typeof window !== 'undefined') {
    console.log("✅ Window location origin:", window.location.origin);
    console.log("✅ Full constructed URL:", supabaseUrl);
  }
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
