import { supabase } from "./supabase";

// Helper function to format error messages
function formatError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return `${error.message} - ${error.details}`;
  return JSON.stringify(error);
}

// Get creator's assigned projects
export async function getCreatorProjects(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from("project_assignments")
      .select("*, project:project_id(id, title, description, status, tier, budget)")
      .eq("creator_id", creatorId)
      .order("assigned_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching creator projects:", formatError(error));
    return [];
  }
}

// Get creator's deliverables
export async function getCreatorDeliverables(creatorId: string) {
  if (!creatorId) {
    console.warn("getCreatorDeliverables: No creatorId provided");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("deliverables")
      .select(`
        id,
        project_id,
        milestone_id,
        description,
        status,
        submitted_at,
        approved_at,
        created_at,
        updated_at
      `)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error for deliverables:", formatError(error));
      throw error;
    }
    if (!data) {
      console.warn("No deliverables found for creator:", creatorId);
      return [];
    }

    // Enrich with project and milestone data
    console.log("Enriching", data.length, "deliverables for creator:", creatorId);
    const enrichedData = await Promise.all(
      data.map(async (deliverable) => {
        try {
          const [projectRes, milestoneRes, paymentRes] = await Promise.all([
            supabase
              .from("projects")
              .select("id, title")
              .eq("id", deliverable.project_id)
              .maybeSingle()
              .catch((err) => {
                console.warn("Failed to fetch project", deliverable.project_id, ":", formatError(err));
                return { data: null, error: null };
              }),
            supabase
              .from("milestones")
              .select("id, title, budget_allocation")
              .eq("id", deliverable.milestone_id)
              .maybeSingle()
              .catch((err) => {
                console.warn("Failed to fetch milestone", deliverable.milestone_id, ":", formatError(err));
                return { data: null, error: null };
              }),
            supabase
              .from("payments")
              .select("id, amount, status")
              .eq("creator_id", creatorId)
              .eq("milestone_id", deliverable.milestone_id)
              .maybeSingle()
              .catch((err) => {
                console.warn("Failed to fetch payment for milestone", deliverable.milestone_id, ":", formatError(err));
                return { data: null, error: null };
              }),
          ]);

          return {
            ...deliverable,
            project: projectRes?.data || null,
            milestone: milestoneRes?.data || null,
            payment: paymentRes?.data || null,
          };
        } catch (enrichError) {
          console.error("Error enriching deliverable", deliverable.id, ":", formatError(enrichError));
          return deliverable;
        }
      })
    );

    return enrichedData;
  } catch (error) {
    console.error("Error fetching creator deliverables:", formatError(error));
    return [];
  }
}

// Get creator's payments/earnings
export async function getCreatorPayments(creatorId: string) {
  if (!creatorId) return [];

  try {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        milestone_id,
        project_id,
        amount,
        status,
        due_date,
        paid_at,
        created_at
      `)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // Enrich with milestone and project data
    const enrichedData = await Promise.all(
      data.map(async (payment) => {
        try {
          const [milestoneRes, projectRes] = await Promise.all([
            supabase
              .from("milestones")
              .select("id, title")
              .eq("id", payment.milestone_id)
              .maybeSingle()
              .catch(() => ({ data: null, error: null })),
            supabase
              .from("projects")
              .select("id, title")
              .eq("id", payment.project_id)
              .maybeSingle()
              .catch(() => ({ data: null, error: null })),
          ]);

          return {
            ...payment,
            milestone: milestoneRes?.data || null,
            project: projectRes?.data || null,
          };
        } catch (enrichError) {
          console.error("Error enriching payment:", formatError(enrichError));
          return payment;
        }
      })
    );

    return enrichedData;
  } catch (error) {
    console.error("Error fetching creator payments:", formatError(error));
    return [];
  }
}

// Get creator profile info
export async function getCreatorProfile(creatorId: string) {
  if (!creatorId) return null;

  try {
    // Try with relationship first
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*, user_profiles!creator_profiles_id_fkey(id, name, email)")
      .eq("id", creatorId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    // If relationship fails, try without it
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", creatorId)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    return fallbackData;
  } catch (error) {
    console.error("Error fetching creator profile:", formatError(error));
    return null;
  }
}

// Update deliverable status
export async function updateDeliverableStatus(
  deliverableId: string,
  status: "pending" | "in_progress" | "submitted" | "approved"
) {
  try {
    const updateData: any = { status };
    
    if (status === "submitted") {
      updateData.submitted_at = new Date().toISOString();
    } else if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from("deliverables")
      .update(updateData)
      .eq("id", deliverableId)
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error("Error updating deliverable status:", formatError(error));
    throw error;
  }
}

// Upload deliverable asset
export async function uploadDeliverableAsset(
  deliverableId: string,
  assetId: string
) {
  try {
    const { data, error } = await supabase
      .from("deliverables")
      .update({ asset_id: assetId })
      .eq("id", deliverableId)
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error("Error uploading deliverable asset:", formatError(error));
    throw error;
  }
}

// Get creator dashboard stats
export async function getCreatorStats(creatorId: string) {
  try {
    const [projects, deliverables, payments] = await Promise.all([
      supabase
        .from("project_assignments")
        .select("id", { count: "exact" })
        .eq("creator_id", creatorId),
      supabase
        .from("deliverables")
        .select("id, status", { count: "exact" })
        .eq("creator_id", creatorId),
      supabase
        .from("payments")
        .select("amount, status", { count: "exact" })
        .eq("creator_id", creatorId),
    ]);

    let totalEarned = 0;
    let pendingPayments = 0;
    let processingPayments = 0;

    if (payments.data) {
      totalEarned = payments.data
        .filter((p: any) => p.status === "paid")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      pendingPayments = payments.data
        .filter((p: any) => p.status === "pending")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      processingPayments = payments.data
        .filter((p: any) => p.status === "processing" || p.status === "paid")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    }

    const pendingDeliverables = deliverables.data
      ? deliverables.data.filter((d: any) => d.status === "pending").length
      : 0;

    return {
      activeProjects: projects.count || 0,
      pendingDeliverables,
      totalEarned,
      pendingPayments,
      processingPayments,
      totalPayments: payments.count || 0,
    };
  } catch (error) {
    console.error("Error fetching creator stats:", formatError(error));
    return {
      activeProjects: 0,
      pendingDeliverables: 0,
      totalEarned: 0,
      pendingPayments: 0,
      processingPayments: 0,
      totalPayments: 0,
    };
  }
}
