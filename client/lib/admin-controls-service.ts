import { supabase } from "./supabase";

function formatError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return `${error.message} - ${error.details}`;
  return JSON.stringify(error);
}

// Block/Suspend a user
export async function blockUser(
  userId: string,
  reason: string,
  adminId: string,
  expiresAt?: string
) {
  try {
    const { data, error } = await supabase
      .from("user_blocks")
      .upsert(
        [
          {
            user_id: userId,
            blocked_by: adminId,
            reason,
            expires_at: expiresAt,
            status: "active",
          },
        ],
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, block: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error blocking user:", message);
    return { success: false, error: message };
  }
}

// Unblock a user
export async function unblockUser(userId: string) {
  try {
    const { error } = await supabase
      .from("user_blocks")
      .update({ status: "removed" })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error unblocking user:", message);
    return { success: false, error: message };
  }
}

// Get user block info
export async function getUserBlock(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    return { success: true, block: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting user block:", message);
    return { success: false, error: message, block: null };
  }
}

// Check if user is blocked
export async function isUserBlocked(userId: string): Promise<boolean> {
  const result = await getUserBlock(userId);
  if (!result.success || !result.block) return false;

  // Check if block has expired
  if (result.block.expires_at) {
    const expiresAt = new Date(result.block.expires_at);
    if (expiresAt < new Date()) {
      // Block has expired, remove it
      await unblockUser(userId);
      return false;
    }
  }

  return true;
}

// Set usage limits for user
export async function setUsageLimits(
  userId: string,
  limits: {
    max_projects?: number;
    max_api_calls?: number;
    max_storage_gb?: number;
    monthly_limit_reset_date?: number;
  }
) {
  try {
    const { data, error } = await supabase
      .from("usage_limits")
      .upsert([{ user_id: userId, ...limits }], { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return { success: true, limits: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error setting usage limits:", message);
    return { success: false, error: message };
  }
}

// Get usage limits for user
export async function getUserLimits(userId: string) {
  try {
    const { data, error } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, limits: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting usage limits:", message);
    return { success: false, error: message, limits: null };
  }
}

// Get user's current usage for current month
export async function getUserUsage(userId: string) {
  try {
    const today = new Date();
    const monthYear = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", monthYear)
      .maybeSingle();

    if (error) throw error;
    return { success: true, usage: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting user usage:", message);
    return { success: false, error: message, usage: null };
  }
}

// Track usage (increment counters)
export async function trackUsage(
  userId: string,
  type: "api_calls" | "storage" | "project",
  amount: number = 1
) {
  try {
    const today = new Date();
    const monthYear = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const updateData: any = {};
    if (type === "api_calls") updateData.api_calls = amount;
    if (type === "storage") updateData.storage_used_gb = amount;
    if (type === "project") updateData.project_count = amount;

    const { data, error } = await supabase
      .from("usage_tracking")
      .upsert(
        [
          {
            user_id: userId,
            month_year: monthYear,
            ...updateData,
          },
        ],
        { onConflict: "user_id,month_year" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, usage: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error tracking usage:", message);
    return { success: false, error: message };
  }
}

// Get all user blocks
export async function getAllUserBlocks() {
  try {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Enrich with user data if needed
    const enrichedBlocks = await Promise.all(
      (data || []).map(async (block) => {
        try {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("name, email")
            .eq("id", block.user_id)
            .maybeSingle();

          return {
            ...block,
            user: userProfile || { name: "Unknown", email: "Unknown" },
          };
        } catch {
          return {
            ...block,
            user: { name: "Unknown", email: "Unknown" },
          };
        }
      })
    );

    return { success: true, blocks: enrichedBlocks || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting user blocks:", message);
    return { success: false, error: message, blocks: [] };
  }
}

// Get role permissions
export async function getRolePermissions(role: string) {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role", role);

    if (error) throw error;
    return { success: true, permissions: data?.map((p) => p.permission) || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting role permissions:", message);
    return { success: false, error: message, permissions: [] };
  }
}

// Get all audit logs
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from("activity_logs")
      .select("*");

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.action) {
      query = query.eq("action", filters.action);
    }
    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(filters?.limit || 100);

    if (error) throw error;

    // Enrich with user data if needed
    const enrichedLogs = await Promise.all(
      (data || []).map(async (log) => {
        try {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("name, email")
            .eq("id", log.user_id)
            .maybeSingle();

          return {
            ...log,
            user: userProfile || { name: "Unknown", email: "Unknown" },
          };
        } catch {
          return {
            ...log,
            user: { name: "Unknown", email: "Unknown" },
          };
        }
      })
    );

    return { success: true, logs: enrichedLogs || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting audit logs:", message);
    return { success: false, error: message, logs: [] };
  }
}
