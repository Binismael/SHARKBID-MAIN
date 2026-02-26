import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

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

    if (error) {
      if (error.message.includes("portfolio_url") || error.message.includes("linkedin_url")) {
        return res.status(400).json({
          success: false,
          error: "Database migration required. Please run the SQL in migrations/20240322_add_social_links.sql in your Supabase SQL Editor.",
        });
      }
      throw error;
    }

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
