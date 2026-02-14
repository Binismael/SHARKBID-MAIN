import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ [PROFILES] Supabase credentials missing. Profile endpoints will fail.");
}

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const handleGetMyProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(400).json({ error: "Missing x-user-id header" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const profileUpdates = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing x-user-id header" });
    }

    // Ensure we don't change the user_id
    delete profileUpdates.user_id;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert({
        ...profileUpdates,
        user_id: userId,
        updated_at: new Date(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
