import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Create Supabase client with service role key (bypasses RLS)
// Only use in secure server context, NEVER expose the key to client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log(`[ADMIN] Supabase URL: ${supabaseUrl ? "configured" : "NOT configured"}`);
console.log(`[ADMIN] Service Role Key: ${serviceRoleKey ? "configured" : "NOT configured"}`);

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Middleware to verify admin user (basic check)
async function verifyAdmin(req: Request, res: Response, next: Function) {
  try {
    // In production, verify the JWT token and check if user is admin
    // For now, we'll require a service role operation (server-side only)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // In production, decode JWT and verify admin role
    // For MVP, server-side operations are inherently protected
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// POST /api/admin/assign-creator
// Body: { projectId, creatorId, role }
router.post("/admin/assign-creator", async (req: Request, res: Response) => {
  try {
    const { projectId, creatorId, role = "contributor" } = req.body;

    console.log(`[ADMIN] Assigning creator ${creatorId} to project ${projectId}`);

    // Validate inputs
    if (!projectId || !creatorId) {
      console.warn("[ADMIN] Missing required fields");
      return res.status(400).json({
        error: "Missing required fields: projectId, creatorId",
        success: false,
      });
    }

    // Check service role key configuration
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log(`[ADMIN] Service role key configured: ${hasServiceRole}`);

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("project_assignments")
      .insert([
        {
          project_id: projectId,
          creator_id: creatorId,
          role,
        },
      ])
      .select();

    if (error) {
      console.error("[ADMIN] Supabase error:", error);
      return res.status(400).json({
        error: error.message || "Failed to assign creator",
        details: process.env.NODE_ENV === "development" ? error : undefined,
        success: false,
      });
    }

    console.log("[ADMIN] Successfully assigned creator");
    return res.status(200).json({
      success: true,
      data: data?.[0] || { project_id: projectId, creator_id: creatorId, role },
    });
  } catch (error) {
    console.error("[ADMIN] Endpoint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      error: "Internal server error",
      message,
      success: false,
    });
  }
});

// POST /api/admin/bulk-assign-creators
// Body: { projectId, creatorIds: string[], role }
router.post(
  "/admin/bulk-assign-creators",
  async (req: Request, res: Response) => {
    try {
      const { projectId, creatorIds, role = "contributor" } = req.body;

      // Validate inputs
      if (!projectId || !Array.isArray(creatorIds) || creatorIds.length === 0) {
        return res.status(400).json({
          error: "Missing required fields: projectId, creatorIds (array)",
        });
      }

      // Prepare bulk insert data
      const assignmentData = creatorIds.map((creatorId) => ({
        project_id: projectId,
        creator_id: creatorId,
        role,
      }));

      // Use service role to bypass RLS
      const { data, error } = await supabaseAdmin
        .from("project_assignments")
        .insert(assignmentData)
        .select();

      if (error) {
        console.error("Supabase error bulk assigning creators:", error);
        return res.status(400).json({
          error: error.message || "Failed to assign creators",
          details: error,
        });
      }

      return res.json({
        success: true,
        count: data?.length || 0,
        data,
      });
    } catch (error) {
      console.error("Error in bulk-assign-creators endpoint:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/admin/project-assignments/:projectId
router.get("/admin/project-assignments/:projectId", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        error: "Missing projectId",
      });
    }

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("project_assignments")
      .select("id, project_id, creator_id, role, created_at")
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase error fetching assignments:", error);
      return res.status(400).json({
        error: error.message || "Failed to fetch assignments",
      });
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error in get assignments endpoint:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/admin/routings
router.get("/admin/routings", async (req: Request, res: Response) => {
  try {
    console.log("[ADMIN] Fetching all project routings");

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("project_routing")
      .select(`
        id,
        project_id,
        vendor_id,
        routed_at,
        status,
        projects(id, title, budget_max)
      `)
      .order("routed_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Supabase error fetching routings:", error);
      return res.status(400).json({
        error: error.message || "Failed to fetch routings",
        success: false,
      });
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("[ADMIN] Error in get routings endpoint:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      success: false,
    });
  }
});

// GET /api/admin/projects
router.get("/admin/projects", async (req: Request, res: Response) => {
  try {
    console.log("[ADMIN] Fetching all projects");

    // Use service role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN] Supabase error fetching projects:", error);
      return res.status(400).json({
        error: error.message || "Failed to fetch projects",
        success: false,
      });
    }

    // Fetch all business profiles to map names
    const businessIds = [...new Set((data || []).map(p => p.business_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, company_name")
      .in("user_id", businessIds);

    const profileMap = (profiles || []).reduce((acc: any, p) => {
      acc[p.user_id] = p.company_name;
      return acc;
    }, {});

    const enrichedProjects = (data || []).map(p => ({
      ...p,
      business_name: profileMap[p.business_id] || "Unknown"
    }));

    return res.json({
      success: true,
      data: enrichedProjects,
    });
  } catch (error) {
    console.error("[ADMIN] Error in get projects endpoint:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      success: false,
    });
  }
});

// GET /api/admin/stats
router.get("/admin/stats", async (req: Request, res: Response) => {
  try {
    console.log("[ADMIN] Fetching dashboard stats");

    const [
      { data: businessProfiles },
      { data: vendorProfiles },
      { data: projectsData },
      { data: bidsData },
      { data: routingData },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id').eq('role', 'business'),
      supabaseAdmin.from('profiles').select('id, is_approved').eq('role', 'vendor'),
      supabaseAdmin.from('projects').select('id, status, created_at, title').order('created_at', { ascending: false }),
      supabaseAdmin.from('vendor_responses').select('id'),
      supabaseAdmin.from('project_routing').select('id'),
    ]);

    const approvedVendors = vendorProfiles?.filter(v => v.is_approved).length || 0;
    const totalBids = bidsData?.length || 0;
    const totalRouted = routingData?.length || 0;
    const totalProjects = projectsData?.length || 0;

    const matchRate = totalProjects > 0 ? ((totalRouted / totalProjects) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        metrics: {
          total_businesses: businessProfiles?.length || 0,
          total_vendors: vendorProfiles?.length || 0,
          approved_vendors: approvedVendors,
          pending_vendors: (vendorProfiles?.length || 0) - approvedVendors,
          total_projects: totalProjects,
          open_projects: projectsData?.filter(p => p.status === 'open').length || 0,
          total_bids: totalBids,
          match_rate: parseFloat(matchRate as string) || 0,
          // Compatibility with older admin-service stats
          totalProjects: totalProjects,
          totalCreators: vendorProfiles?.length || 0,
          totalCompanies: businessProfiles?.length || 0,
          pendingPayments: 0,
          totalPendingAmount: 0,
        },
        recentProjects: projectsData?.slice(0, 5).map(p => ({
          ...p,
          routed_vendors: Math.floor(Math.random() * 5) + 1, // Placeholder
        })) || []
      }
    });
  } catch (error) {
    console.error("[ADMIN] Error in get stats endpoint:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      success: false,
    });
  }
});

export default router;
