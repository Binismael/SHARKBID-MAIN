import { createClient } from "@supabase/supabase-js";

// Note: In Vite, only variables starting with VITE_ are exposed to the client
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const envUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");

// Use direct Supabase URL from env in the browser. This avoids intermittent "Failed to fetch"
// errors whenever the local /api proxy restarts during dev HMR.
const supabaseUrl = envUrl || "https://kpytttekmeoeqskfopqj.supabase.co";

if (!rawKey || rawKey.length < 10 || rawKey.includes("your-")) {
  console.error("❌ Supabase Anon Key missing or invalid!", {
    hasKey: !!rawKey,
    keyLength: rawKey?.length || 0,
    allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes("SUPABASE"))
  });
} else {
  console.log("✅ Supabase initialized:", supabaseUrl);
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
