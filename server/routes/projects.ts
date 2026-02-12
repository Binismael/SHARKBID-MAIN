import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { routeProjectToVendors } from "./lead-routing";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Publish a project (change status from draft to open and route to vendors)
export const handlePublishProject: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId || !userId) {
      return res
        .status(400)
        .json({ error: "Missing projectId or userId" });
    }

    // Verify ownership
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("business_id", userId)
      .single();

    if (fetchError || !project) {
      return res.status(403).json({
        error: "Project not found or you don't have permission to modify it",
      });
    }

    if (project.status !== "draft") {
      return res
        .status(400)
        .json({ error: "Only draft projects can be published" });
    }

    // Update project status to open
    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update({
        status: "open",
        published_at: new Date(),
      })
      .eq("id", projectId);

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabaseAdmin.from("project_activity").insert({
      project_id: projectId,
      user_id: userId,
      action: "published",
    });

    // Trigger lead routing
    const matched = await routeProjectToVendors(projectId);

    res.json({
      success: true,
      projectId,
      status: "open",
      matched_vendors: matched.length,
    });
  } catch (error) {
    console.error("Publish project error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: message,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get project details (with bid information)
export const handleGetProject: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId" });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select(
        `
        *,
        service_categories (
          id,
          name
        ),
        vendor_responses (
          id,
          vendor_id,
          bid_amount,
          proposed_timeline,
          response_notes,
          status,
          created_at,
          profiles (
            company_name,
            contact_email
          )
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check authorization: business owner or admin
    if (userId && project.business_id !== userId) {
      // Could add admin check here
      return res.status(403).json({ error: "Not authorized to view this project" });
    }

    res.json(project);
  } catch (error) {
    console.error("Get project error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: message,
    });
  }
};
