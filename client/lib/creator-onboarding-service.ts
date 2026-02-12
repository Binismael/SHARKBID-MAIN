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

export interface CreatorOnboardingData {
  bio: string;
  skills: string[];
  specialties: string[];
  day_rate: number;
  hourly_rate: number;
  portfolio_url?: string;
  availability_status: "available" | "unavailable" | "limited";
  max_concurrent_projects: number;
  preferred_project_types: string[];
  experience_years: number;
  certifications?: string;
  timezone?: string;
  languages?: string[];
}

export interface PortfolioItem {
  id?: string;
  creator_id?: string;
  title: string;
  description: string;
  project_type: string;
  image_url: string;
  external_url?: string;
  skills_used: string[];
  client_name?: string;
  completion_date: string;
  featured: boolean;
}

// Get existing creator profile
export async function getCreatorProfile(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", creatorId)
      .single();

    if (error) {
      return {
        success: false,
        error: formatError(error),
        profile: null,
      };
    }

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
      profile: null,
    };
  }
}

// Get creator preferences
export async function getCreatorPreferences(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from("creator_preferences")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is okay
      return {
        success: false,
        error: formatError(error),
        preferences: null,
      };
    }

    return {
      success: true,
      preferences: data || null,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
      preferences: null,
    };
  }
}

// Update or create creator profile
export async function updateCreatorProfile(
  creatorId: string,
  data: Partial<CreatorOnboardingData>
) {
  try {
    // First check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("id", creatorId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return {
        success: false,
        error: formatError(fetchError),
      };
    }

    const profileData = {
      bio: data.bio || "",
      skills: data.skills || [],
      specialties: data.specialties || [],
      day_rate: data.day_rate || 0,
      experience_years: data.experience_years || 0,
      certifications: data.certifications,
      portfolio_url: data.portfolio_url,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing
      const { error } = await supabase
        .from("creator_profiles")
        .update(profileData)
        .eq("id", creatorId);

      result = error;
    } else {
      // Create new
      const { error } = await supabase
        .from("creator_profiles")
        .insert({
          id: creatorId,
          ...profileData,
          status: "pending",
        });

      result = error;
    }

    if (result) {
      return {
        success: false,
        error: formatError(result),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Update creator preferences
export async function updateCreatorPreferences(
  creatorId: string,
  data: {
    hourly_rate?: number;
    day_rate?: number;
    availability_status?: "available" | "unavailable" | "limited";
    max_concurrent_projects?: number;
    preferred_project_types?: string[];
    timezone?: string;
    languages?: string[];
  }
) {
  try {
    // First check if preferences exist
    const { data: existingPreferences } = await supabase
      .from("creator_preferences")
      .select("id")
      .eq("creator_id", creatorId)
      .single();

    const preferencesData = {
      hourly_rate: data.hourly_rate,
      day_rate: data.day_rate,
      availability_status: data.availability_status || "available",
      max_concurrent_projects: data.max_concurrent_projects || 3,
      preferred_project_types: data.preferred_project_types || [],
      timezone: data.timezone,
      languages: data.languages,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingPreferences) {
      // Update existing
      const { error } = await supabase
        .from("creator_preferences")
        .update(preferencesData)
        .eq("creator_id", creatorId);

      result = error;
    } else {
      // Create new
      const { error } = await supabase
        .from("creator_preferences")
        .insert({
          creator_id: creatorId,
          ...preferencesData,
        });

      result = error;
    }

    if (result) {
      return {
        success: false,
        error: formatError(result),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Get portfolio items
export async function getPortfolioItems(creatorId: string) {
  try {
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: formatError(error),
        items: [],
      };
    }

    return {
      success: true,
      items: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
      items: [],
    };
  }
}

// Add portfolio item
export async function addPortfolioItem(creatorId: string, item: PortfolioItem) {
  try {
    const { error } = await supabase
      .from("portfolio_items")
      .insert({
        creator_id: creatorId,
        title: item.title,
        description: item.description,
        project_type: item.project_type,
        image_url: item.image_url,
        external_url: item.external_url,
        skills_used: item.skills_used,
        client_name: item.client_name,
        completion_date: item.completion_date,
        featured: item.featured || false,
      });

    if (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Delete portfolio item
export async function deletePortfolioItem(itemId: string) {
  try {
    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Mark onboarding as complete
export async function completeCreatorOnboarding(creatorId: string) {
  try {
    const { error } = await supabase
      .from("creator_profiles")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", creatorId);

    if (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Check if onboarding is complete
export async function isOnboardingComplete(creatorId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("creator_profiles")
      .select("onboarding_completed")
      .eq("id", creatorId)
      .single();

    return data?.onboarding_completed || false;
  } catch {
    return false;
  }
}
