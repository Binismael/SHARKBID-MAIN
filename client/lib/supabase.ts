import { createClient } from "@supabase/supabase-js";

// Note: In Vite, only variables starting with VITE_ are exposed to the client
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Use absolute proxy URL
const supabaseUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/api/v1/supabase`
  : "https://kpytttekmeoeqskfopqj.supabase.co";

if (!rawKey || rawKey.length < 10 || rawKey.includes("your-")) {
  console.error("❌ Supabase Anon Key missing or invalid!", {
    hasKey: !!rawKey,
    keyLength: rawKey?.length || 0,
    allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes("SUPABASE"))
  });
} else {
  console.log("✅ Supabase initialized via proxy:", supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl,
  rawKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);
