import { supabase } from "./supabase";
import { createNotification } from "./notification-service";
import { sendCreatorApplicationEmail } from "./email-service";

function formatError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return `${error.message} - ${error.details}`;
  return JSON.stringify(error);
}

export interface CreatorApplication {
  id?: string;
  name: string;
  email: string;
  portfolio_url: string;
  specialties: string[];
  status: "pending" | "approved" | "rejected";
  applied_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

// Submit a new creator application
export async function submitCreatorApplication(
  application: Omit<CreatorApplication, "id" | "status" | "applied_at">
) {
  try {
    // Validate required fields
    if (!application.name || !application.email || !application.specialties.length) {
      return {
        success: false,
        error: "Please fill in all required fields",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(application.email)) {
      return {
        success: false,
        error: "Please enter a valid email address",
      };
    }

    // Check if email already has an application
    const { data: existing } = await supabase
      .from("creator_applications")
      .select("id")
      .eq("email", application.email)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "You have already submitted an application. Please wait for review.",
      };
    }

    // Insert application
    const { data, error } = await supabase
      .from("creator_applications")
      .insert([
        {
          name: application.name,
          email: application.email,
          portfolio_url: application.portfolio_url || null,
          specialties: application.specialties,
          status: "pending",
          applied_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }

    // Send confirmation email to applicant
    try {
      await sendCreatorApplicationEmail(application.email, application.name, "received");
    } catch (emailError) {
      console.warn("Could not send confirmation email:", emailError);
      // Don't fail the entire operation if email fails
    }

    // Notify admins in-app
    try {
      // Get all admin users
      const { data: admins } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        // Send notifications to all admins
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          title: "New Creator Application",
          message: `${application.name} has applied to become a creator. Review their application.`,
          type: "info" as const,
          category: "application",
          related_id: data.id,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notificationError) {
      console.warn("Could not notify admins:", notificationError);
      // Don't fail the entire operation if notification fails
    }

    return {
      success: true,
      applicationId: data.id,
      message: "Your application has been submitted! We'll review it and get back to you shortly.",
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Get all applications (admin only)
export async function getApplications(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from("creator_applications")
      .select("*", { count: "exact" })
      .order("applied_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching applications:", formatError(error));
      return { success: false, applications: [], total: 0 };
    }

    return {
      success: true,
      applications: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching applications:", formatError(error));
    return { success: false, applications: [], total: 0 };
  }
}

// Get single application
export async function getApplication(applicationId: string) {
  try {
    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching application:", formatError(error));
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching application:", formatError(error));
    return null;
  }
}

// Approve application (admin)
export async function approveApplication(
  applicationId: string,
  adminId: string,
  reviewNotes?: string
) {
  try {
    // Update application status
    const { error: updateError } = await supabase
      .from("creator_applications")
      .update({
        status: "approved",
        reviewed_by: adminId,
        review_notes: reviewNotes || null,
      })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    // Get application details
    const application = await getApplication(applicationId);
    if (!application) throw new Error("Application not found");

    // Create a creator profile from the application
    const { data: creatorProfile, error: creatorError } = await supabase
      .from("creator_profiles")
      .insert([
        {
          id: application.id, // Will be set to a new UUID normally
          bio: `Creator from ${application.email}`,
          skills: application.specialties || [],
          specialties: application.specialties?.join(", ") || "",
          status: "approved",
          portfolio_url: application.portfolio_url || null,
        },
      ])
      .select()
      .single();

    if (creatorError && !creatorError.message.includes("duplicate")) {
      console.warn("Could not create creator profile:", creatorError);
    }

    // Send approval email to applicant
    try {
      await sendCreatorApplicationEmail(application.email, application.name, "approved");
    } catch (emailError) {
      console.warn("Could not send approval email:", emailError);
      // Don't fail the entire operation if email fails
    }

    // Send in-app notification
    try {
      await createNotification(
        application.email,
        "Application Approved",
        "Congratulations! Your creator application has been approved. You can now log in and complete your profile.",
        {
          type: "success",
          category: "application",
          related_id: applicationId,
        }
      );
    } catch (notificationError) {
      console.warn("Could not send in-app notification:", notificationError);
    }

    return {
      success: true,
      message: "Application approved successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Reject application (admin)
export async function rejectApplication(
  applicationId: string,
  adminId: string,
  reviewNotes: string
) {
  try {
    if (!reviewNotes.trim()) {
      return {
        success: false,
        error: "Please provide a reason for rejection",
      };
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("creator_applications")
      .update({
        status: "rejected",
        reviewed_by: adminId,
        review_notes: reviewNotes,
      })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    // Get application details
    const application = await getApplication(applicationId);
    if (!application) throw new Error("Application not found");

    // Send rejection email to applicant
    try {
      await sendCreatorApplicationEmail(
        application.email,
        application.name,
        "rejected",
        reviewNotes
      );
    } catch (emailError) {
      console.warn("Could not send rejection email:", emailError);
      // Don't fail the entire operation if email fails
    }

    // Send in-app notification
    try {
      await createNotification(
        application.email,
        "Application Update",
        `Your creator application has been reviewed. ${reviewNotes}`,
        {
          type: "error",
          category: "application",
          related_id: applicationId,
        }
      );
    } catch (notificationError) {
      console.warn("Could not send in-app notification:", notificationError);
    }

    return {
      success: true,
      message: "Application rejected",
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}
