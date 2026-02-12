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

// Utility function for retries with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Get all approved creators for marketplace
export async function getApprovedCreators(filters?: {
  skill?: string;
  tier?: string;
  minRating?: number;
  availability?: string;
}) {
  try {
    // Fetch creator profiles with retry
    const { data: profiles, error: profilesError } = await withRetry(
      () => supabase
        .from("creator_profiles")
        .select("id, bio, skills, day_rate, status")
        .eq("status", "approved")
    );

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return { success: true, creators: [] };
    }

    // Fetch user data separately (with error handling)
    const { data: users } = await withRetry(
      () => supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url")
    ).catch(() => ({ data: null }));

    // Fetch ratings for all creators (with error handling)
    const { data: ratings } = await withRetry(
      () => supabase
        .from("creator_ratings")
        .select("creator_id, rating")
    ).catch(() => ({ data: null }));

    // Fetch preferences for all creators (with error handling)
    const { data: preferences } = await withRetry(
      () => supabase
        .from("creator_preferences")
        .select("creator_id, hourly_rate, availability_status")
    ).catch(() => ({ data: null }));

    // Enrich profiles with related data
    const enriched = profiles.map((creator: any) => {
      const user = users?.find((u) => u.id === creator.id);
      const creatorRatings = ratings?.filter((r) => r.creator_id === creator.id) || [];
      const creatorPrefs = preferences?.find((p) => p.creator_id === creator.id);

      return {
        ...creator,
        user,
        ratings: creatorRatings,
        preferences: creatorPrefs,
        averageRating: calculateAverageRating(creatorRatings),
        ratingCount: creatorRatings.length,
      };
    });

    // Apply client-side filtering
    let filtered = enriched;
    if (filters?.availability) {
      filtered = filtered.filter(
        (c) => c.preferences?.availability_status === filters.availability
      );
    }
    if (filters?.minRating) {
      filtered = filtered.filter((c) => c.averageRating >= filters.minRating);
    }
    if (filters?.skill) {
      filtered = filtered.filter((c) =>
        c.skills?.some((s: string) =>
          s.toLowerCase().includes(filters.skill.toLowerCase())
        )
      );
    }

    return { success: true, creators: filtered };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching creators:", message);
    // Return empty array gracefully on error
    return { success: true, creators: [] };
  }
}

// Get creator profile with portfolio and ratings
export async function getCreatorProfile(creatorId: string) {
  try {
    // Fetch creator profile
    const { data: profile, error: profileError } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", creatorId)
      .single();

    if (profileError) throw profileError;

    // Fetch user info
    const { data: user } = await supabase
      .from("user_profiles")
      .select("name, email, avatar_url")
      .eq("id", creatorId)
      .single();

    // Fetch portfolio
    const { data: portfolio } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("creator_id", creatorId)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    // Fetch ratings
    const { data: ratings } = await supabase
      .from("creator_ratings")
      .select("id, rating, review, created_at, client_id")
      .eq("creator_id", creatorId);

    // Fetch client info for ratings
    const clientIds = ratings?.map((r) => r.client_id) || [];
    const { data: clients } = clientIds.length > 0 ? await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", clientIds) : { data: null };

    // Enrich ratings with client info
    const enrichedRatings = ratings?.map((r) => ({
      ...r,
      client: clients?.find((c) => c.id === r.client_id) || null,
    })) || [];

    // Fetch preferences
    const { data: preferences } = await supabase
      .from("creator_preferences")
      .select("*")
      .eq("creator_id", creatorId)
      .maybeSingle();

    // Fetch project assignments
    const { data: assignments } = await supabase
      .from("project_assignments")
      .select("id, project_id")
      .eq("creator_id", creatorId);

    // Fetch project details
    const projectIds = assignments?.map((a) => a.project_id) || [];
    const { data: projects } = projectIds.length > 0 ? await supabase
      .from("projects")
      .select("id, title, tier, status")
      .in("id", projectIds) : { data: null };

    // Enrich assignments with project info
    const enrichedAssignments = assignments?.map((a) => ({
      ...a,
      project: projects?.find((p) => p.id === a.project_id) || null,
    })) || [];

    return {
      success: true,
      profile: {
        ...profile,
        user,
        portfolio: portfolio || [],
        ratings: enrichedRatings,
        preferences: preferences || null,
        projects: enrichedAssignments,
        averageRating: calculateAverageRating(enrichedRatings),
        ratingCount: enrichedRatings.length,
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching creator profile:", message);
    return { success: false, error: message, profile: null };
  }
}

// Add rating for creator
export async function rateCreator(
  creatorId: string,
  clientId: string,
  rating: number,
  review?: string,
  projectId?: string
) {
  try {
    const { data, error } = await supabase
      .from("creator_ratings")
      .upsert(
        [
          {
            creator_id: creatorId,
            client_id: clientId,
            project_id: projectId,
            rating,
            review: review || null,
          },
        ],
        { onConflict: "creator_id,client_id,project_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, rating: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error rating creator:", message);
    return { success: false, error: message };
  }
}

// Add portfolio item
export async function addPortfolioItem(
  creatorId: string,
  title: string,
  options?: {
    description?: string;
    imageUrl?: string;
    url?: string;
    category?: string;
    featured?: boolean;
    assetId?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert([
        {
          creator_id: creatorId,
          title,
          description: options?.description,
          image_url: options?.imageUrl,
          url: options?.url,
          category: options?.category,
          featured: options?.featured || false,
          asset_id: options?.assetId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, item: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error adding portfolio item:", message);
    return { success: false, error: message };
  }
}

// Delete portfolio item
export async function deletePortfolioItem(itemId: string) {
  try {
    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error deleting portfolio item:", message);
    return { success: false, error: message };
  }
}

// Update creator preferences
export async function updateCreatorPreferences(
  creatorId: string,
  preferences: {
    preferred_project_types?: string[];
    preferred_project_tiers?: string[];
    hourly_rate?: number;
    availability_status?: string;
    max_concurrent_projects?: number;
  }
) {
  try {
    const { data, error } = await supabase
      .from("creator_preferences")
      .upsert(
        [
          {
            creator_id: creatorId,
            ...preferences,
          },
        ],
        { onConflict: "creator_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, preferences: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error updating preferences:", message);
    return { success: false, error: message };
  }
}

// Find matching creators for a project (simple matching algorithm)
export async function findMatchingCreators(
  projectId: string,
  limit = 5
) {
  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("tier, goals, platforms")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // Get approved creators
    const { data: creators, error: creatorsError } = await supabase
      .from("creator_profiles")
      .select("id, skills, day_rate, status")
      .eq("status", "approved");

    if (creatorsError) throw creatorsError;

    // Fetch preferences and assignments
    const { data: preferences } = await supabase
      .from("creator_preferences")
      .select("creator_id, preferred_project_tiers, availability_status, max_concurrent_projects");

    const { data: assignments } = await supabase
      .from("project_assignments")
      .select("creator_id");

    // Score creators based on compatibility
    const scored = (creators || [])
      .map((creator: any) => {
        let score = 0;
        const creatorPrefs = preferences?.find((p) => p.creator_id === creator.id);
        const creatorAssignments = assignments?.filter((a) => a.creator_id === creator.id) || [];

        // Check tier preference (boost score if matches)
        if (creatorPrefs?.preferred_project_tiers?.includes(project.tier)) {
          score += 3;
        }

        // Check availability
        if (creatorPrefs?.availability_status === "available") {
          score += 2;
        } else if (creatorPrefs?.availability_status === "busy") {
          score += 1;
        } else {
          score = 0; // Not available
        }

        // Check concurrent projects limit
        const currentProjects = creatorAssignments.length;
        const maxProjects = creatorPrefs?.max_concurrent_projects || 3;
        if (currentProjects < maxProjects) {
          score += 1;
        } else {
          score = 0; // At capacity
        }

        // Check skill match (if goals contain skills)
        if (creator.skills && project.goals) {
          const matchingSkills = creator.skills.filter((s: string) =>
            project.goals.toLowerCase().includes(s.toLowerCase())
          ).length;
          score += matchingSkills;
        }

        return {
          ...creator,
          matchScore: score,
        };
      })
      .filter((c: any) => c.matchScore > 0)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return { success: true, creators: scored };
  } catch (error) {
    const message = formatError(error);
    console.error("Error finding matching creators:", message);
    return { success: false, error: message, creators: [] };
  }
}

// Helper function to calculate average rating
function calculateAverageRating(ratings: any[] | undefined): number {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
