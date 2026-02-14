import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { routeProjectToVendors } from "./lead-routing";

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

    // 1. Fetch the project basic info first to avoid complex join errors
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Database error fetching project:", projectError);
      return res.status(500).json({ error: "Internal server error fetching project" });
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 2. Authorization check: business owner, routed vendor, or admin
    let isAuthorized = false;

    // Fetch user profile to check role
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = userProfile?.role === "admin";
    let isOwner = userId && project.business_id === userId;
    let isSelectedVendor = userId && project.selected_vendor_id === userId;
    let isRouted = false;

    if (isAdmin || isOwner || isSelectedVendor) {
      isAuthorized = true;
    } else if (userId) {
      // Check if this user is a routed vendor for this project
      const { data: routing, error: routingError } = await supabaseAdmin
        .from("project_routing")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("vendor_id", userId)
        .maybeSingle();

      if (routing) {
        isRouted = true;
        isAuthorized = true;
      }
    }

    // Also allow viewing if project is 'open' (discovery mode for vendors)
    if (!isAuthorized && project.status === "open") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: "Not authorized to view this project" });
    }

    // 3. Enrich project with service category
    if (project.service_category_id) {
      const { data: category } = await supabaseAdmin
        .from("service_categories")
        .select("id, name")
        .eq("id", project.service_category_id)
        .maybeSingle();

      project.service_categories = category;
    }

    // 4. Fetch responses based on who's asking
    if (isOwner || isAdmin) {
      // Owner or Admin sees all bids
      const { data: responses, error: respError } = await supabaseAdmin
        .from("vendor_responses")
        .select("*")
        .eq("project_id", projectId);

      if (responses && responses.length > 0) {
        // Fetch profiles for these vendors manually
        const vendorIds = responses.map(r => r.vendor_id);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id, company_name, contact_email")
          .in("user_id", vendorIds);

        const profileMap = (profiles || []).reduce((acc: any, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {});

        project.vendor_responses = responses.map(r => ({
          ...r,
          vendor_profile: profileMap[r.vendor_id]
        }));
      } else {
        project.vendor_responses = [];
      }
    } else if (userId) {
      // Vendor only sees their own bid
      const { data: responses } = await supabaseAdmin
        .from("vendor_responses")
        .select("*")
        .eq("project_id", projectId)
        .eq("vendor_id", userId);

      project.vendor_responses = responses || [];
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

// Get all message threads for a vendor (Inbox)
export const handleGetVendorThreads: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(400).json({ error: "Missing x-user-id header" });
    }

    // We want to find all unique project IDs where:
    // 1. Vendor is routed
    // 2. Vendor has a bid
    // 3. Vendor has messages (either sent by them or explicitly for them)

    const [routing, responses, messages] = await Promise.all([
      supabaseAdmin
        .from("project_routing")
        .select("project_id")
        .eq("vendor_id", userId),
      supabaseAdmin
        .from("vendor_responses")
        .select("project_id")
        .eq("vendor_id", userId),
      // For messages, we check if they are the sender,
      // as vendor_id might not exist yet
      supabaseAdmin
        .from("project_messages")
        .select("project_id")
        .eq("sender_id", userId)
    ]);

    // Also check for messages explicitly for them via vendor_id if column exists
    // We'll do this as a separate step to avoid failing the whole promise
    let vendorSpecificMessageIds: any[] = [];
    const { data: vendorData, error: vendorError } = await supabaseAdmin
      .from("project_messages")
      .select("project_id")
      .eq("vendor_id", userId);

    if (vendorData && !vendorError) {
      vendorSpecificMessageIds = vendorData;
    }

    const projectIds = new Set([
      ...(routing.data?.map(r => r.project_id) || []),
      ...(responses.data?.map(r => r.project_id) || []),
      ...(messages.data?.map(m => m.project_id) || []),
      ...(vendorSpecificMessageIds.map(m => m.project_id) || [])
    ]);

    if (projectIds.size === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch project details for these IDs
    const { data: projects, error: projectError } = await supabaseAdmin
      .from("projects")
      .select(`
        id,
        title,
        description,
        status,
        created_at
      `)
      .in("id", Array.from(projectIds))
      .order("created_at", { ascending: false });

    if (projectError) throw projectError;

    res.json({
      success: true,
      data: projects || [],
    });
  } catch (error) {
    console.error("Get vendor threads error:", error);
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

// Get projects where a vendor is assigned (bypass RLS)
export const handleGetVendorProjects: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(400).json({ error: "Missing x-user-id header" });
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("selected_vendor_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Get vendor projects error:", error);
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
      .select("*")
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

      // Update routing status (upsert in case it doesn't exist yet)
      await supabaseAdmin
        .from("project_routing")
        .upsert({
          project_id: projectId,
          vendor_id: vendorId,
          status: 'bid_submitted',
          updated_at: new Date()
        }, { onConflict: 'project_id, vendor_id' });
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

// Assign a vendor to a project (bypass RLS)
export const handleAssignVendor: RequestHandler = async (req, res) => {
  try {
    const { projectId, vendorId, bidId } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId || !vendorId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify ownership via admin client
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("business_id")
      .eq("id", projectId)
      .single();

    if (fetchError || !project || project.business_id !== userId) {
      return res.status(403).json({ error: "Not authorized to modify this project" });
    }

    // Update project
    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update({
        selected_vendor_id: vendorId,
        status: 'selected'
      })
      .eq("id", projectId);

    if (updateError) throw updateError;

    // Update bid status if provided
    if (bidId) {
      await supabaseAdmin
        .from("vendor_responses")
        .update({ status: 'accepted', is_selected: true })
        .eq("id", bidId);
    }

    res.json({
      success: true,
      message: "Vendor assigned successfully"
    });
  } catch (error) {
    console.error("Assign vendor error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a project (bypass RLS)
export const handleDeleteProject: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId || !userId) {
      return res.status(400).json({ error: "Missing projectId or userId" });
    }

    // Verify ownership
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("business_id")
      .eq("id", projectId)
      .single();

    if (fetchError || !project || project.business_id !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this project" });
    }

    // Delete project-related data first (if cascade delete is not set)
    await supabaseAdmin.from('project_activity').delete().eq('project_id', projectId);
    await supabaseAdmin.from('project_messages').delete().eq('project_id', projectId);
    await supabaseAdmin.from('vendor_responses').delete().eq('project_id', projectId);
    await supabaseAdmin.from('project_routing').delete().eq('project_id', projectId);

    // Delete project
    const { error: deleteError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get messages for a project
export const handleGetMessages: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.headers["x-user-id"] as string;
    const targetVendorId = req.query.vendorId as string;

    if (!projectId || !userId) {
      return res.status(400).json({ error: "Missing projectId or userId" });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("business_id, selected_vendor_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isOwner = project.business_id === userId;

    // Fetch user profile to check role
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = userProfile?.role === "admin";

    // effectiveVendorId is the vendor whose conversation we are looking at.
    // 1. If owner: must provide targetVendorId.
    // 2. If vendor: is their own userId.
    // 3. If admin: can provide targetVendorId or leave empty to see all.
    let effectiveVendorId = targetVendorId;
    if (!isOwner && !isAdmin) {
      effectiveVendorId = userId;
    }

    if (!isOwner && !isAdmin) {
      // If not owner or admin, verify this user is a vendor for this project
      // Check routing, responses, selection, or existing messages
      const [{ data: routing }, { data: response }, { data: hasMessages }] = await Promise.all([
        supabaseAdmin
          .from("project_routing")
          .select("id")
          .eq("project_id", projectId)
          .eq("vendor_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("vendor_responses")
          .select("id")
          .eq("project_id", projectId)
          .eq("vendor_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("project_messages")
          .select("id")
          .eq("project_id", projectId)
          .eq("vendor_id", userId)
          .limit(1)
          .maybeSingle()
      ]);

      const isSelectedVendor = project.selected_vendor_id === userId;

      if (!routing && !response && !isSelectedVendor && !hasMessages) {
        return res.status(403).json({ error: "Not authorized to view messages" });
      }
    }

    // Filter messages:
    // 1. Project ID must match
    // 2. Either (sender is owner/admin and recipient/context is effectiveVendorId) OR (sender is effectiveVendorId)

    let query = supabaseAdmin
      .from("project_messages")
      .select("*")
      .eq("project_id", projectId);

    if (isAdmin && !effectiveVendorId) {
      // For Admin, if no vendorId is provided, they see everything for this project
      const { data: messages, error: msgError } = await query.order("created_at", { ascending: true });
      if (msgError) throw msgError;
      return respondWithEnrichedMessages(res, messages, supabaseAdmin);
    }

    if (effectiveVendorId) {
      // We'll try to use the most comprehensive filter, but fallback if vendor_id column is missing
      const { data: response } = await supabaseAdmin
        .from("vendor_responses")
        .select("id")
        .eq("project_id", projectId)
        .eq("vendor_id", effectiveVendorId)
        .maybeSingle();

      const responseId = response?.id || '00000000-0000-0000-0000-000000000000';

      try {
        // First attempt: Try with vendor_id column
        const { data: messages, error: msgError } = await supabaseAdmin
          .from("project_messages")
          .select("*")
          .eq("project_id", projectId)
          .or(`vendor_id.eq.${effectiveVendorId},sender_id.eq.${effectiveVendorId},and(sender_id.eq.${project.business_id},vendor_response_id.eq.${responseId})`)
          .order("created_at", { ascending: true });

        if (!msgError) {
          return respondWithEnrichedMessages(res, messages, supabaseAdmin);
        }

        if (msgError.code !== '42703') {
          throw msgError;
        }
      } catch (e: any) {
        if (e?.code !== '42703') throw e;
      }

      // Fallback: Use only existing columns
      const { data: fallbackMessages, error: fallbackError } = await supabaseAdmin
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .or(`vendor_response_id.eq.${responseId},sender_id.eq.${effectiveVendorId},and(sender_id.eq.${project.business_id},vendor_response_id.eq.${responseId})`)
        .order("created_at", { ascending: true });

      if (fallbackError) throw fallbackError;
      return respondWithEnrichedMessages(res, fallbackMessages, supabaseAdmin);
    }

    const { data: messages, error: msgError } = await query.order("created_at", { ascending: true });

    if (msgError) throw msgError;
    return respondWithEnrichedMessages(res, messages, supabaseAdmin);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Helper function to enrich messages with profiles
async function respondWithEnrichedMessages(res: any, messages: any[] | null, supabaseAdmin: any) {
  if (messages && messages.length > 0) {
    const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, company_name, contact_email, role")
      .in("user_id", senderIds);

    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const enrichedMessages = messages.map(m => ({
      ...m,
      profiles: profileMap[m.sender_id]
    }));

    return res.json({
      success: true,
      data: enrichedMessages,
    });
  }

  res.json({
    success: true,
    data: messages || [],
  });
}

// Vendor update project or routing status (Decline or Complete)
export const handleVendorUpdateStatus: RequestHandler = async (req, res) => {
  try {
    const { projectId, action } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId || !action || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: project, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (action === 'decline') {
      // Vendor declining a lead/routing
      const { error: updateError } = await supabaseAdmin
        .from("project_routing")
        .update({ status: 'declined', updated_at: new Date() })
        .eq("project_id", projectId)
        .eq("vendor_id", userId);

      if (updateError) throw updateError;

      // Also update bid status if it exists
      await supabaseAdmin
        .from("vendor_responses")
        .update({ status: 'withdrawn' })
        .eq("project_id", projectId)
        .eq("vendor_id", userId);

      return res.json({ success: true, message: "Lead declined successfully" });
    }

    if (action === 'complete') {
      // Vendor marking project as completed
      // Must be the selected vendor
      if (project.selected_vendor_id !== userId) {
        return res.status(403).json({ error: "Only the assigned vendor can mark a project as completed" });
      }

      const { error: updateError } = await supabaseAdmin
        .from("projects")
        .update({ status: 'completed', updated_at: new Date() })
        .eq("id", projectId);

      if (updateError) throw updateError;

      // Log activity
      await supabaseAdmin.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        action: "completed_by_vendor",
      });

      return res.json({ success: true, message: "Project marked as completed" });
    }

    if (action === 'approve') {
      // Business owner approving project
      // Must be the owner or admin
      const { data: userProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const isAdmin = userProfile?.role === "admin";
      const isOwner = project.business_id === userId;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "Only the project owner can approve the project" });
      }

      const { error: updateError } = await supabaseAdmin
        .from("projects")
        .update({ status: 'completed', updated_at: new Date() })
        .eq("id", projectId);

      if (updateError) throw updateError;

      // Log activity
      await supabaseAdmin.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        action: "approved_by_business",
      });

      return res.json({ success: true, message: "Project approved and completed" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Vendor update status error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Send a message
export const handleSendMessage: RequestHandler = async (req, res) => {
  try {
    const { projectId, messageText, vendorId: targetVendorId, imageUrl } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId || (!messageText && !imageUrl) || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("business_id, selected_vendor_id")
      .eq("id", projectId)
      .single();

    if (!project) return res.status(404).json({ error: "Project not found" });

    const isOwner = project.business_id === userId;

    // Fetch user profile to check role
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = userProfile?.role === "admin";
    const vendorId = isOwner ? targetVendorId : (isAdmin ? targetVendorId : userId);

    if (!isOwner && !isAdmin) {
      // Verify vendor authorization
      const [{ data: routing }, { data: response }, { data: hasMessages }] = await Promise.all([
        supabaseAdmin
          .from("project_routing")
          .select("id")
          .eq("project_id", projectId)
          .eq("vendor_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("vendor_responses")
          .select("id")
          .eq("project_id", projectId)
          .eq("vendor_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("project_messages")
          .select("id")
          .eq("project_id", projectId)
          .eq("vendor_id", userId)
          .limit(1)
          .maybeSingle()
      ]);

      const isSelectedVendor = project.selected_vendor_id === userId;

      if (!routing && !response && !isSelectedVendor && !hasMessages) {
        return res.status(403).json({ error: "Not authorized" });
      }
    }

    // Find vendor_response_id to link the message (optional)
    const { data: response } = await supabaseAdmin
      .from("vendor_responses")
      .select("id")
      .eq("project_id", projectId)
      .eq("vendor_id", vendorId || '')
      .maybeSingle();

    // Prepare insert data, but handle missing vendor_id column gracefully
    const insertData: any = {
      project_id: projectId,
      sender_id: userId,
      message_text: messageText || "",
      vendor_response_id: response?.id || null,
      image_url: imageUrl || null
    };

    // Only add vendor_id if we have reason to believe the column exists
    // or we can just try and catch. But since we're in a handler,
    // we'll try to insert and if it fails due to missing column, we retry without it.

    let { data: message, error } = await supabaseAdmin
      .from("project_messages")
      .insert({ ...insertData, vendor_id: vendorId || null })
      .select("*")
      .single();

    if (error && error.code === '42703') {
      // Column doesn't exist yet, retry without vendor_id
      const { data: retryMessage, error: retryError } = await supabaseAdmin
        .from("project_messages")
        .insert(insertData)
        .select("*")
        .single();

      message = retryMessage;
      error = retryError;
    }

    if (error) throw error;

    // Fetch sender profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_name, contact_email, role")
      .eq("user_id", userId)
      .maybeSingle();

    res.json({
      success: true,
      data: {
        ...message,
        profiles: profile
      },
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    const errorMessage = error?.message || error?.error_description || "Unknown error";
    res.status(500).json({
      error: errorMessage,
    });
  }
};
