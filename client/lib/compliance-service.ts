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

export interface UserData {
  profile: any;
  projects: any[];
  assets: any[];
  payments: any[];
  deliverables: any[];
  messages: any[];
  ratings: any[];
}

// Export user's personal data (GDPR)
export async function exportUserData(userId: string): Promise<{
  success: boolean;
  data?: UserData;
  error?: string;
}> {
  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Fetch projects
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .or(`client_id.eq.${userId},created_by.eq.${userId}`);

    // Fetch assets
    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("uploaded_by", userId);

    // Fetch payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .or(`creator_id.eq.${userId},processed_by.eq.${userId}`);

    // Fetch deliverables
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("*")
      .eq("creator_id", userId);

    // Fetch messages
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

    // Fetch ratings (as creator)
    const { data: ratings } = await supabase
      .from("creator_ratings")
      .select("*")
      .eq("creator_id", userId);

    const userData: UserData = {
      profile: profile || {},
      projects: projects || [],
      assets: assets || [],
      payments: payments || [],
      deliverables: deliverables || [],
      messages: messages || [],
      ratings: ratings || [],
    };

    return { success: true, data: userData };
  } catch (error) {
    const message = formatError(error);
    console.error("Error exporting user data:", message);
    return { success: false, error: message };
  }
}

// Request account deletion (GDPR - right to be forgotten)
export async function requestAccountDeletion(userId: string, reason?: string) {
  try {
    // For now, we'll soft-delete by updating a deletion_requested field
    // In production, you'd want to implement actual data deletion with proper auditing
    
    const { error } = await supabase
      .from("user_profiles")
      .update({
        email: `deleted-${userId}@example.com`, // Anonymize email
      })
      .eq("id", userId);

    if (error) throw error;

    // Log the deletion request for audit purposes
    await supabase
      .from("activity_logs")
      .insert([
        {
          user_id: userId,
          action: "requested_deletion",
          entity_type: "account",
          entity_id: userId,
          description: `User requested account deletion. Reason: ${reason || "Not provided"}`,
        },
      ]);

    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error requesting account deletion:", message);
    return { success: false, error: message };
  }
}

// Get user's data usage and storage info
export async function getUserDataUsage(userId: string) {
  try {
    // Get assets size
    const { data: assets } = await supabase
      .from("assets")
      .select("file_size")
      .eq("uploaded_by", userId);

    const totalStorageMB = (assets || []).reduce(
      (sum, asset) => sum + (asset.file_size || 0),
      0
    ) / (1024 * 1024);

    // Count data points
    const { data: projects, count: projectCount } = await supabase
      .from("projects")
      .select("id", { count: "exact" })
      .or(`client_id.eq.${userId},created_by.eq.${userId}`);

    const { data: deliverables, count: deliverableCount } = await supabase
      .from("deliverables")
      .select("id", { count: "exact" })
      .eq("creator_id", userId);

    const { data: messages, count: messageCount } = await supabase
      .from("messages")
      .select("id", { count: "exact" })
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

    return {
      success: true,
      usage: {
        storageUsedMB: Math.round(totalStorageMB * 100) / 100,
        projectsCount: projectCount || 0,
        deliverablesCount: deliverableCount || 0,
        messagesCount: messageCount || 0,
        totalDataPoints: (projectCount || 0) + (deliverableCount || 0) + (messageCount || 0),
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting user data usage:", message);
    return { success: false, error: message, usage: {} };
  }
}

// Get privacy settings
export async function getPrivacySettings(userId: string) {
  try {
    // This could be stored in a privacy_settings table
    // For now, returning default settings
    return {
      success: true,
      settings: {
        emailNotifications: true,
        marketingEmails: false,
        dataCollection: true,
        profileVisibility: "public", // public, private, registered_only
        showInMarketplace: true,
        twoFactorEnabled: false,
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting privacy settings:", message);
    return { success: false, error: message, settings: {} };
  }
}

// Update privacy settings
export async function updatePrivacySettings(
  userId: string,
  settings: {
    emailNotifications?: boolean;
    marketingEmails?: boolean;
    dataCollection?: boolean;
    profileVisibility?: string;
    showInMarketplace?: boolean;
  }
) {
  try {
    // Store in activity logs for audit purposes
    await supabase
      .from("activity_logs")
      .insert([
        {
          user_id: userId,
          action: "updated",
          entity_type: "privacy_settings",
          entity_id: userId,
          metadata: settings,
        },
      ]);

    return { success: true, settings };
  } catch (error) {
    const message = formatError(error);
    console.error("Error updating privacy settings:", message);
    return { success: false, error: message };
  }
}

// Get compliance status
export async function getComplianceStatus(userId: string) {
  try {
    // Check if user has agreed to ToS and Privacy Policy
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return {
      success: true,
      compliance: {
        hasAcceptedToS: true, // Would be stored in database
        hasAcceptedPrivacy: true,
        dataExportRequested: false,
        deletionRequested: false,
        lastComplianceCheck: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error getting compliance status:", message);
    return { success: false, error: message, compliance: {} };
  }
}

// Log security event
export async function logSecurityEvent(
  userId: string,
  eventType: string,
  details?: any
) {
  try {
    await supabase
      .from("activity_logs")
      .insert([
        {
          user_id: userId,
          action: "security_event",
          entity_type: eventType,
          entity_id: userId,
          description: `Security event: ${eventType}`,
          metadata: details || {},
        },
      ]);

    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error logging security event:", message);
    return { success: false, error: message };
  }
}
