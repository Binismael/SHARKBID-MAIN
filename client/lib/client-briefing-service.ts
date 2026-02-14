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

export interface ProjectBriefing {
  title: string;
  description: string;
  project_type: string;
  budget: number;
  timeline_start?: string;
  timeline_end?: string;
  duration_weeks?: number;
  required_skills: string[];
  required_experience_years?: number;
  preferred_creator_skills?: string[];
  deliverables: string[];
  project_scope: "small" | "medium" | "large";
  additional_requirements?: string;
  attachments?: string[];
  communication_preference?: string;
  milestones?: {
    name: string;
    description: string;
    due_date: string;
    budget?: number;
  }[];
}

// Create a new project from briefing
export async function createProjectFromBriefing(
  clientId: string,
  briefing: ProjectBriefing
) {
  try {
    // Create main project via server API to bypass RLS recursion
    const response = await fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': clientId
      },
      body: JSON.stringify({
        title: briefing.title,
        description: briefing.description,
        service_category: briefing.project_type,
        budget_min: briefing.budget,
        budget_max: briefing.budget,
        timeline_start: briefing.timeline_start,
        timeline_end: briefing.timeline_end,
        project_state: 'NY', // Placeholder
        project_zip: '10001', // Placeholder
        special_requirements: briefing.additional_requirements
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create project',
      };
    }

    const project = result.project;

    // Create milestones if provided (using direct Supabase for now, or could be a new endpoint)
    if (briefing.milestones && briefing.milestones.length > 0) {
      const milestonesData = briefing.milestones
        .filter((m) => m.due_date && m.due_date.trim() !== "")
        .map((m) => ({
          project_id: project.id,
          title: m.name,
          description: m.description,
          due_date: m.due_date,
          budget: m.budget || briefing.budget / briefing.milestones.length,
        }));

      if (milestonesData.length > 0) {
        await supabase
          .from("project_milestones")
          .insert(milestonesData);
      }
    }

    return {
      success: true,
      projectId: project.id,
      project,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

// Get project briefing template
export function getProjectBriefingTemplate(): ProjectBriefing {
  return {
    title: "",
    description: "",
    project_type: "design",
    budget: 5000,
    timeline_start: "",
    timeline_end: "",
    duration_weeks: 4,
    required_skills: [],
    required_experience_years: 1,
    preferred_creator_skills: [],
    deliverables: [],
    project_scope: "medium",
    additional_requirements: "",
    attachments: [],
    communication_preference: "email",
    milestones: [],
  };
}

// Helper function to convert scope to tier
function getScopeToTier(scope: string): string {
  switch (scope) {
    case "small":
      return "essential";
    case "medium":
      return "standard";
    case "large":
      return "visionary";
    default:
      return "standard";
  }
}

// Get recommended creators based on briefing
export async function getRecommendedCreators(briefing: ProjectBriefing) {
  try {
    // Fetch creators with matching skills
    const { data: creators, error } = await supabase
      .from("creator_profiles")
      .select("id, bio, skills, specialties, day_rate, status")
      .eq("status", "approved");

    if (error) {
      return {
        success: false,
        error: formatError(error),
        creators: [],
      };
    }

    // Score creators based on skill match
    const scored = (creators || []).map((creator) => {
      let matchScore = 0;
      const creatorSkills = creator.skills || [];

      // Check skill matches
      briefing.required_skills.forEach((skill) => {
        if (creatorSkills.some((cs) => cs.toLowerCase().includes(skill.toLowerCase()))) {
          matchScore += 10;
        }
      });

      // Check preferred skills
      if (briefing.preferred_creator_skills) {
        briefing.preferred_creator_skills.forEach((skill) => {
          if (creatorSkills.some((cs) => cs.toLowerCase().includes(skill.toLowerCase()))) {
            matchScore += 5;
          }
        });
      }

      // Bonus for rate match
      if (creator.day_rate && creator.day_rate <= briefing.budget) {
        matchScore += 3;
      }

      return { ...creator, matchScore };
    });

    // Sort by match score
    const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      creators: sorted.slice(0, 5), // Top 5 matches
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
      creators: [],
    };
  }
}
