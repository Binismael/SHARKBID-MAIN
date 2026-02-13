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
    let isOwner = userId && project.business_id === userId;
    let isRouted = false;

    if (isOwner) {
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
    if (isOwner) {
      // Owner sees all bids
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
    let vendorId = isOwner ? targetVendorId : userId;

    if (!isOwner) {
      // If not owner, verify this user is a vendor for this project
      const { data: routing } = await supabaseAdmin
        .from("project_routing")
        .select("id")
        .eq("project_id", projectId)
        .eq("vendor_id", userId)
        .maybeSingle();

      if (!routing) {
        return res.status(403).json({ error: "Not authorized to view messages" });
      }
    }

    // Filter messages:
    // 1. Project ID must match
    // 2. Either (sender is owner and recipient/context is vendorId) OR (sender is vendorId)
    // Actually, let's use a simpler approach:
    // If vendorId is provided (or inferred), show messages where (sender=owner AND context_vendor=vendorId) OR (sender=vendorId)
    // We'll use vendor_response_id if we want to be strict, but for now we'll use a custom query logic.

    // Since we don't have a formal recipient_id, we'll use the presence of vendorId to filter.
    // We should probably add vendor_id to project_messages for easier filtering.
    // For now, we'll assume messages between owner and vendorId are what we want.

    let query = supabaseAdmin
      .from("project_messages")
      .select("*")
      .eq("project_id", projectId);

    if (vendorId) {
      const { data: response } = await supabaseAdmin
        .from("vendor_responses")
        .select("id")
        .eq("project_id", projectId)
        .eq("vendor_id", vendorId)
        .maybeSingle();

      // Simplified filter: messages linked to this vendor's bid OR messages between owner and vendor without a link
      // This ensures business messages always show up even if the link is missing.
      query = query.or(`vendor_response_id.eq.${response?.id || '00000000-0000-0000-0000-000000000000'},and(sender_id.eq.${project.business_id},sender_id.neq.${userId}),and(sender_id.eq.${vendorId})`);
    }

    const { data: messages, error: msgError } = await query.order("created_at", { ascending: true });

    if (msgError) throw msgError;

    if (messages && messages.length > 0) {
      const senderIds = Array.from(new Set(messages.map(m => m.sender_id)));
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, company_name, contact_email, role")
        .in("user_id", senderIds);

      const profileMap = (profiles || []).reduce((acc: any, p) => {
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
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Send a message
export const handleSendMessage: RequestHandler = async (req, res) => {
  try {
    const { projectId, messageText, vendorId: targetVendorId } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!projectId || !messageText || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("business_id, selected_vendor_id")
      .eq("id", projectId)
      .single();

    if (!project) return res.status(404).json({ error: "Project not found" });

    const isOwner = project.business_id === userId;
    const vendorId = isOwner ? targetVendorId : userId;

    if (!isOwner) {
      const { data: routing } = await supabaseAdmin
        .from("project_routing")
        .select("id")
        .eq("project_id", projectId)
        .eq("vendor_id", userId)
        .maybeSingle();

      if (!routing) return res.status(403).json({ error: "Not authorized" });
    }

    // Find vendor_response_id to link the message
    const { data: response } = await supabaseAdmin
      .from("vendor_responses")
      .select("id")
      .eq("project_id", projectId)
      .eq("vendor_id", vendorId || '')
      .maybeSingle();

    const { data: message, error } = await supabaseAdmin
      .from("project_messages")
      .insert({
        project_id: projectId,
        sender_id: userId,
        message_text: messageText,
        vendor_response_id: response?.id || null
      })
      .select("*")
      .single();

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
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
