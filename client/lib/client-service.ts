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

// Utility function for retries with exponential backoff and timeout
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 4,
  delayMs = 200,
  timeoutMs = 5000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      );

      // Race against timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts - 1) {
        // Exponential backoff with jitter
        const baseDelay = delayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 50;
        const delay = Math.min(baseDelay + jitter, 1500);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Get all projects for a client (using server API to bypass RLS)
export async function getClientProjects(clientId: string) {
  if (!clientId) {
    return [];
  }

  try {
    const response = await fetch('/api/projects/business', {
      headers: {
        'x-user-id': clientId
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Error fetching client projects:", result.error);
      return [];
    }

    const data = result.data;
    if (!data) {
      return [];
    }

    // Format project data
    const enrichedData = data.map((project: any) => ({
      ...project,
      nextMilestone: "Project in progress",
      milestoneDueDate: null,
      deliverableCount: 0,
      deliverableStatus: [],
    }));

    return enrichedData;
  } catch (error) {
    console.error("Error fetching client projects:", formatError(error));
    return [];
  }
}

// Get single project by ID (using server API)
export async function getProjectById(projectId: string, clientId: string) {
  if (!projectId || !clientId) {
    return null;
  }

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      headers: {
        'x-user-id': clientId
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      ...data,
      nextMilestone: "Project in progress",
      milestoneDueDate: null,
      deliverableCount: 0,
      deliverableStatus: [],
    };
  } catch (error) {
    console.debug("Project fetch error:", error);
    return null;
  }
}

// Get client profile
export async function getClientProfile(clientId: string) {
  if (!clientId) {
    return { id: clientId, name: "User", email: "" };
  }

  try {
    const { data, error } = await withRetry(
      () => supabase
        .from("profiles")
        .select("user_id, company_name, contact_email")
        .eq("user_id", clientId)
        .maybeSingle()
    );

    if (error) {
      console.error("Error fetching client profile:", formatError(error));
      return { id: clientId, name: "User", email: "" };
    }

    return data ? {
      id: data.user_id,
      name: data.company_name || "User",
      email: data.contact_email || ""
    } : { id: clientId, name: "User", email: "" };
  } catch (error) {
    console.error("Error fetching client profile:", formatError(error));
    return { id: clientId, name: "User", email: "" };
  }
}

// Get client dashboard stats (using server API)
export async function getClientStats(clientId: string) {
  try {
    const response = await fetch('/api/projects/business', {
      headers: {
        'x-user-id': clientId
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        activeProjects: 0,
        totalBudget: 0,
        budgetRemaining: 0,
        totalSpent: 0,
        budgetUtilization: 0,
      };
    }

    const data = result.data;
    let totalBudget = 0;
    if (data) {
      totalBudget = data.reduce((sum: number, p: any) => sum + (p.budget_max || 0), 0);
    }

    return {
      activeProjects: data?.length || 0,
      totalBudget,
      budgetRemaining: totalBudget,
      totalSpent: 0,
      budgetUtilization: 0,
    };
  } catch (error) {
    console.error("Error fetching client stats:", formatError(error));
    return {
      activeProjects: 0,
      totalBudget: 0,
      budgetRemaining: 0,
      totalSpent: 0,
      budgetUtilization: 0,
    };
  }
}

// Get client assets
export async function getClientAssets(clientId: string) {
  if (!clientId) return [];

  try {
    const { data, error } = await supabase
      .from("assets")
      .select("id, filename, asset_type, file_size, created_at, project_id")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assets:", formatError(error));
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching client assets:", formatError(error));
    return [];
  }
}

// Get project deliverables for client
export async function getProjectDeliverables(projectId: string) {
  if (!projectId) return [];

  try {
    // Fetch with timeout
    const deliverablesFetch = supabase
      .from("deliverables")
      .select(`
        id,
        milestone_id,
        creator_id,
        status,
        submitted_at,
        approved_at,
        created_at
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    const { data, error } = await Promise.race([
      deliverablesFetch,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Deliverables fetch timeout")), 4000)
      ),
    ]) as any;

    if (error || !data) return [];
    if (data.length === 0) return [];

    // Enrich with milestone and creator data with timeout
    const enrichedData = await Promise.allSettled(
      data.slice(0, 10).map(async (deliverable) => {
        // Limit to first 10 to avoid slow page loads
        try {
          const enrichPromise = Promise.all([
            supabase
              .from("milestones")
              .select("id, title")
              .eq("id", deliverable.milestone_id)
              .maybeSingle()
              .catch(() => ({ data: null })),
            supabase
              .from("user_profiles")
              .select("id, name")
              .eq("id", deliverable.creator_id)
              .maybeSingle()
              .catch(() => ({ data: null })),
          ]);

          const [milestoneRes, creatorRes] = await Promise.race([
            enrichPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Enrichment timeout")), 2000)
            ),
          ]) as any;

          return {
            ...deliverable,
            milestone: milestoneRes?.data || null,
            creator: creatorRes?.data || null,
          };
        } catch (enrichError) {
          // Return deliverable without enrichment on error
          return {
            ...deliverable,
            milestone: null,
            creator: null,
          };
        }
      })
    );

    // Filter out rejected promises and return successful enrichments
    return enrichedData
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value);
  } catch (error) {
    console.debug("Deliverables fetch timeout (graceful degradation)");
    return [];
  }
}
