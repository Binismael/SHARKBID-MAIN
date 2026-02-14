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
    const response = await fetch('/api/admin/projects', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` // Placeholder for token
      }
    });
    const result = await response.json();

    if (!result.success) {
      console.warn("Project fetch error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("Error in getProjects:", error);
    return [];
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
  // Map company_id to business_id for server API compatibility
  const response = await fetch('/api/projects/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': projectData.company_id // Using company_id as userId
    },
    body: JSON.stringify({
      ...projectData,
      service_category: 'Other', // Placeholder
      project_state: 'NY' // Placeholder
    })
  });

  const result = await response.json();
  if (!result.success) throw result.error || 'Failed to create project';
  return result.project;
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
  // For update, we might need a dedicated endpoint or use direct Supabase if RLS allows
  // For now, continuing to use direct Supabase but with business_id correction if needed
  // Actually, let's keep it as is but be aware of RLS
  const { data, error } = await supabase
    .from("projects")
    .update(projectData)
    .eq("id", projectId)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deleteProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': 'admin' // In real app, this should be the actual user ID or handled by admin middleware
    }
  });

  const result = await response.json();
  if (!result.success) throw result.error || 'Failed to delete project';
}

// User Profiles & Creators
export async function getUserProfiles(role?: string) {
  // We can use the admin endpoint or direct Supabase for profiles
  // Profiles usually have simpler RLS
  let query = supabase.from("profiles").select("*");

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCreatorProfiles() {
  try {
    // Fetch via direct Supabase but using profiles table
    const { data: creators, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "vendor")
        .order("created_at", { ascending: false });

    if (error) {
      console.warn("Creator profiles fetch error:", error);
      return [];
    }

    return creators || [];
  } catch (error) {
    console.error("Error in getCreatorProfiles:", error);
    return [];
  }
}

export async function updateCreatorStatus(
  creatorId: string,
  status: "pending" | "approved" | "rejected"
) {
  const is_approved = status === "approved";
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_approved })
    .eq("user_id", creatorId)
    .select();

  if (error) throw error;
  return data?.[0];
}

// Companies (Business Profiles)
export async function getCompanies() {
  try {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "business")
        .order("created_at", { ascending: false });

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
    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
      console.warn("Payment fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPayments:", error);
    return [];
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
    const response = await fetch('/api/admin/stats');
    const result = await response.json();

    if (!result.success) {
      throw result.error || 'Failed to load stats';
    }

    return result.data.metrics;
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return {
      totalProjects: 0,
      totalCreators: 0,
      totalCompanies: 0,
      pendingPayments: 0,
      totalPendingAmount: 0,
    };
  }
}

// Project Assignments - Using admin server-side API
export async function assignCreatorToProject(
  projectId: string,
  creatorId: string,
  role: string = "contributor"
) {
  try {
    const response = await fetch('/api/admin/assign-creator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        creatorId,
        role
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw result.error || 'Failed to assign creator';
    }

    return {
      success: true,
      data: result.data,
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
    const response = await fetch(`/api/admin/project-assignments/${projectId}`);
    const result = await response.json();

    if (!result.success) {
      console.warn("Assignment fetch error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    return [];
  }
}
