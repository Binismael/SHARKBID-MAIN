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

// Get available projects for vendors (bypass RLS)
export const handleGetAvailableProjects: RequestHandler = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Get available projects error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get routed leads for a specific vendor (bypass RLS)
export const handleGetRoutedLeads: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(400).json({ error: "Missing x-user-id header" });
    }

    const { data: routedLeads, error: routeError } = await supabaseAdmin
      .from("project_routing")
      .select(`
        id,
        project_id,
        routed_at,
        status,
        projects (
          id,
          title,
          description,
          service_category_id,
          budget_min,
          budget_max,
          project_zip,
          project_state,
          created_at
        )
      `)
      .eq("vendor_id", userId)
      .order("routed_at", { ascending: false });

    if (routeError) throw routeError;

    res.json({
      success: true,
      data: routedLeads || [],
    });
  } catch (error) {
    console.error("Get routed leads error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get projects for a specific business (bypass RLS)
export const handleGetBusinessProjects: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(400).json({ error: "Missing x-user-id header" });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("business_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Get business projects error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get unrouted open projects for a specific vendor (bypass RLS)
export const handleGetUnroutedProjects: RequestHandler = async (req, res) => {
  try {
    const vendorId = req.headers["x-vendor-id"] as string;

    if (!vendorId) {
      return res.status(400).json({ error: "Missing x-vendor-id header" });
    }

    // 1. Fetch all open projects
    const { data: openProjects, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (projectError) throw projectError;

    // 2. Fetch project IDs already routed to this vendor
    const { data: routedData, error: routeError } = await supabaseAdmin
      .from("project_routing")
      .select("project_id")
      .eq("vendor_id", vendorId);

    if (routeError) throw routeError;

    const routedIds = new Set(routedData?.map(r => r.project_id) || []);

    // 3. Filter projects
    const availableProjects = (openProjects || []).filter(p => !routedIds.has(p.id));

    res.json({
      success: true,
      data: availableProjects,
    });
  } catch (error) {
    console.error("Get unrouted projects error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create or update a project_routing record (Request to Bid / Invite) (bypass RLS)
export const handleUpsertRouting: RequestHandler = async (req, res) => {
  try {
    const { projectId, vendorId, status = 'interested' } = req.body;

    if (!projectId || !vendorId) {
      return res.status(400).json({ error: "Missing projectId or vendorId" });
    }

    const { data, error } = await supabaseAdmin
      .from("project_routing")
      .upsert([
        {
          project_id: projectId,
          vendor_id: vendorId,
          status: status
        }
      ], { onConflict: 'project_id, vendor_id' })
      .select();

    if (error) throw error;

    res.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error("Upsert routing error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all bids submitted by a specific vendor (bypass RLS)
export const handleGetVendorBids: RequestHandler = async (req, res) => {
  try {
    const vendorId = req.headers["x-vendor-id"] as string;

    if (!vendorId) {
      return res.status(400).json({ error: "Missing x-vendor-id header" });
    }

    const { data, error } = await supabaseAdmin
      .from("vendor_responses")
      .select("project_id, status")
      .eq("vendor_id", vendorId);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Get vendor bids error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Submit or update a bid (bypass RLS)
export const handleVendorSubmitBid: RequestHandler = async (req, res) => {
  try {
    const { projectId, vendorId, bidAmount, proposedTimeline, responseNotes, bidId } = req.body;

    if (!projectId || !vendorId || !bidAmount || !proposedTimeline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let result;
    if (bidId) {
      // Update existing bid
      const { data, error } = await supabaseAdmin
        .from("vendor_responses")
        .update({
          bid_amount: bidAmount,
          proposed_timeline: proposedTimeline,
          response_notes: responseNotes,
          updated_at: new Date(),
        })
        .eq("id", bidId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new bid
      const { data, error } = await supabaseAdmin
        .from("vendor_responses")
        .insert({
          project_id: projectId,
          vendor_id: vendorId,
          bid_amount: bidAmount,
          proposed_timeline: proposedTimeline,
          response_notes: responseNotes,
          status: 'submitted',
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Update routing status
      await supabaseAdmin
        .from("project_routing")
        .update({ status: 'bid_submitted' })
        .eq("project_id", projectId)
        .eq("vendor_id", vendorId);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Submit bid error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
