import { supabase } from "./supabase";

// Retry helper with aggressive timeout and exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 6,
  delayMs = 100,
  timeoutMs = 3000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Create timeout promise - fail fast
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
          ),
        ]);
        clearTimeout(timeoutId);
        return result;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error) {
      lastError = error;
      const isTimeout = error instanceof Error && (error.message === "Timeout" || error.message.includes("timeout"));
      const isNetworkError = error instanceof TypeError && error.message.includes("Failed to fetch");
      const shouldRetry = isTimeout || isNetworkError;

      if (shouldRetry && attempt < maxAttempts - 1) {
        // Very fast exponential backoff for immediate retry on network issues
        const baseDelay = delayMs * Math.pow(1.5, attempt);
        const jitter = Math.random() * 50;
        const delay = Math.min(baseDelay + jitter, 1000); // Cap at 1 second

        console.debug(`Attempt ${attempt + 1}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (!shouldRetry) {
        // Non-network errors should fail immediately
        throw error;
      }
    }
  }

  throw lastError;
}

// Projects
export async function getProjects() {
  try {
    // Try simple query first (no relationships, faster)
    const { data, error } = await withRetry(
      () => supabase
        .from("projects")
        .select("id, title, description, status, tier, budget, budget_used, client_id, company_id, created_at, updated_at")
        .order("created_at", { ascending: false }),
      6,  // Maximum attempts
      100,  // Very fast initial backoff
      3000  // 3 second timeout
    );

    if (error) {
      console.warn("Project fetch error:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error in getProjects:", error);
    return [];  // Return empty array gracefully instead of throwing
  }
}

export async function createProject(projectData: {
  title: string;
  description: string;
  tier: "essential" | "standard" | "visionary";
  budget: number;
  company_id: string;
  goals?: string;
  platforms?: string[];
  timeline?: string;
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert([projectData])
    .select();
  
  if (error) throw error;
  return data?.[0];
}

export async function updateProject(
  projectId: string,
  projectData: Partial<{
    title: string;
    description: string;
    tier: "essential" | "standard" | "visionary";
    status: string;
    budget: number;
    budget_used: number;
    goals: string;
    platforms: string[];
    timeline: string;
  }>
) {
  const { data, error } = await supabase
    .from("projects")
    .update(projectData)
    .eq("id", projectId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  
  if (error) throw error;
}

// User Profiles & Creators
export async function getUserProfiles(role?: string) {
  let query = supabase.from("user_profiles").select("*");
  
  if (role) {
    query = query.eq("role", role);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getCreatorProfiles() {
  try {
    // Fetch ALL creators (pending, approved, rejected) for admin review
    const { data: creators, error } = await withRetry(
      () => supabase
        .from("creator_profiles")
        .select("id, bio, skills, specialties, portfolio_links, day_rate, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      6,
      100,
      3000
    );

    if (error) {
      console.warn("Creator profiles fetch error:", error);
      return [];
    }

    if (!creators || creators.length === 0) {
      return [];
    }

    console.log("Found creators:", creators.length);

    // Enrich with user profile data - fetch in batches
    const enrichedCreators = await Promise.all(
      creators.map(async (creator) => {
        try {
          const { data: userProfile, error: userError } = await supabase
            .from("user_profiles")
            .select("id, name, email, role")
            .eq("id", creator.id)
            .single();

          if (userError || !userProfile) {
            console.warn(`No user profile found for creator ${creator.id}`);
            return {
              ...creator,
              user_profiles: { name: "Unknown Creator", email: "" },
            };
          }

          return {
            ...creator,
            user_profiles: userProfile,
          };
        } catch (err) {
          console.error(`Error fetching user profile for ${creator.id}:`, err);
          return {
            ...creator,
            user_profiles: { name: "Unknown Creator", email: "" },
          };
        }
      })
    );

    console.log("Enriched creators with user profiles:", enrichedCreators);
    return enrichedCreators;
  } catch (error) {
    console.error("Error in getCreatorProfiles:", error);
    return [];
  }
}

export async function updateCreatorStatus(
  creatorId: string,
  status: "pending" | "approved" | "rejected"
) {
  const { data, error } = await supabase
    .from("creator_profiles")
    .update({ status })
    .eq("id", creatorId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

// Companies (Business Profiles)
export async function getCompanies() {
  try {
    const { data, error } = await withRetry(
      () => supabase
        .from("profiles")
        .select("id, user_id, company_name, company_description, company_website, contact_email, contact_phone, created_at")
        .eq("role", "business")
        .order("created_at", { ascending: false }),
      6,
      100,
      3000
    );

    if (error) {
      console.warn("Companies fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCompanies:", error);
    return [];
  }
}

// Payments
export async function getPayments() {
  try {
    // Simple query without relationships (faster, less prone to timeout)
    const { data, error } = await withRetry(
      () => supabase
        .from("payments")
        .select("id, project_id, creator_id, milestone_id, amount, status, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(50),  // Limit to 50 to keep response small
      6,  // Maximum attempts
      100,  // Very fast initial backoff
      3000  // 3 second timeout
    );

    if (error) {
      console.warn("Payment fetch error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Return base data without enrichment to avoid slow loads
    return data.map(payment => ({
      ...payment,
      creator: null,
      project: null,
      milestone: null,
    }));
  } catch (error) {
    console.error("Error in getPayments:", error);
    return [];  // Return empty array gracefully instead of throwing
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: "pending" | "paid",
  paidDate?: string
) {
  const updateData: any = { status };
  if (status === "paid" && paidDate) {
    updateData.paid_at = paidDate;
    updateData.paid_date = paidDate;
  }
  
  const { data, error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", paymentId)
    .select();
  
  if (error) throw error;
  return data?.[0];
}

// Dashboard Stats
export async function getDashboardStats() {
  try {
    // Fast count queries with aggressive retries and short timeouts
    const [projects, creators, payments, companies] = await Promise.allSettled([
      withRetry(() => supabase.from("projects").select("id", { count: "exact", head: true }), 5, 100, 2500),
      withRetry(() => supabase.from("user_profiles").select("id", { count: "exact", head: true }).eq("role", "creator"), 5, 100, 2500),
      withRetry(() => supabase.from("payments").select("id", { count: "exact", head: true }), 5, 100, 2500),
      withRetry(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "business"), 5, 100, 2500),
    ]);

    // Extract counts safely
    const totalProjects = projects.status === "fulfilled" ? projects.value.count || 0 : 0;
    const totalCreators = creators.status === "fulfilled" ? creators.value.count || 0 : 0;
    const totalCompanies = companies.status === "fulfilled" ? companies.value.count || 0 : 0;

    let pendingPayments = 0;
    let totalPendingAmount = 0;

    // Try to get pending payment info (but don't fail if it times out)
    try {
      const { data: paymentData } = await withRetry(
        () => supabase
          .from("payments")
          .select("amount, status")
          .eq("status", "pending")
          .limit(100),
        3,
        100,
        2000
      ).catch(() => ({ data: null }));

      if (paymentData) {
        pendingPayments = paymentData.length;
        totalPendingAmount = paymentData.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      }
    } catch (err) {
      console.debug("Could not fetch pending payments:", err);
    }

    return {
      totalProjects,
      totalCreators,
      totalCompanies,
      pendingPayments,
      totalPendingAmount,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    // Return safe defaults instead of throwing
    return {
      totalProjects: 0,
      totalCreators: 0,
      totalCompanies: 0,
      pendingPayments: 0,
      totalPendingAmount: 0,
    };
  }
}

// Project Assignments - Direct insertion using admin user context
export async function assignCreatorToProject(
  projectId: string,
  creatorId: string,
  role: string = "contributor"
) {
  try {
    // Validate inputs
    if (!projectId || !creatorId) {
      return {
        success: false,
        error: "Missing projectId or creatorId",
      };
    }

    console.log(`[Assignment] Checking if creator ${creatorId} is already assigned to project ${projectId}...`);

    // Check if already assigned
    const { data: existingAssignments, error: checkError } = await withRetry(
      () => supabase
        .from("project_assignments")
        .select("id")
        .eq("project_id", projectId)
        .eq("creator_id", creatorId),
      3,
      100,
      2500
    );

    if (checkError) {
      console.error("Error checking existing assignments:", checkError);
      return {
        success: false,
        error: "Failed to check existing assignments",
      };
    }

    // If already assigned, return success but indicate it was a duplicate
    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`[Assignment] ⚠️ Creator ${creatorId} is already assigned to project ${projectId}`);
      return {
        success: true,
        data: existingAssignments[0],
        alreadyAssigned: true,
      };
    }

    console.log(`[Assignment] Creator ${creatorId} not yet assigned, attempting insertion...`);
    const { data, error } = await withRetry(
      () => supabase
        .from("project_assignments")
        .insert([
          {
            project_id: projectId,
            creator_id: creatorId,
            role,
          },
        ])
        .select(),
      3,  // 3 retry attempts
      100,  // 100ms initial delay
      2500  // 2.5 second timeout
    );

    if (error) {
      console.error("Direct insertion error:", error);
      throw new Error(error.message || "Failed to assign creator");
    }

    console.log(`[Assignment] ✅ Successfully inserted assignment for creator ${creatorId}`);
    return {
      success: true,
      data: data?.[0],
      alreadyAssigned: false,
    };
  } catch (error) {
    console.error("Error in assignCreatorToProject:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign creator",
    };
  }
}

export async function getProjectAssignments(projectId: string) {
  try {
    if (!projectId) {
      return [];
    }

    // Direct Supabase query
    const { data, error } = await withRetry(
      () => supabase
        .from("project_assignments")
        .select("id, project_id, creator_id, role, assigned_at")
        .eq("project_id", projectId),
      3,  // 3 retry attempts
      100,  // 100ms initial delay
      2500  // 2.5 second timeout
    );

    if (error) {
      console.warn("Assignment fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    return [];
  }
}
