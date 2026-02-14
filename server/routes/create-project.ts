import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ [CREATE-PROJECT] Supabase credentials missing. Project creation will fail.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface CreateProjectRequest {
  title: string;
  description: string;
  service_category: string;
  budget_min?: number;
  budget_max?: number;
  timeline_start?: string;
  timeline_end?: string;
  project_city: string;
  project_state: string;
  project_zip: string;
  business_size?: string;
  special_requirements?: string;
}

export const handleCreateProject: RequestHandler = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const projectData: CreateProjectRequest = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate required fields
    if (!projectData.title || !projectData.service_category || !projectData.project_state) {
      return res.status(400).json({
        error: "Missing required fields: title, service_category, project_state",
      });
    }

    // Look up service category ID by name
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from("service_categories")
      .select("id")
      .eq("name", projectData.service_category)
      .single();

    if (categoryError || !categoryData) {
      console.error("Service category lookup error:", categoryError);
      return res.status(400).json({
        error: "Invalid service category",
        details: categoryError?.message,
      });
    }

    // Create project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert({
        business_id: userId,
        title: projectData.title,
        description: projectData.description || "",
        service_category_id: categoryData.id,
        budget_min: projectData.budget_min || null,
        budget_max: projectData.budget_max || null,
        timeline_start: projectData.timeline_start || null,
        timeline_end: projectData.timeline_end || null,
        project_city: projectData.project_city || "",
        project_state: projectData.project_state,
        project_zip: projectData.project_zip || "",
        business_size: projectData.business_size || "",
        special_requirements: projectData.special_requirements || "",
        status: "open",
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project creation error:", projectError);
      return res.status(500).json({
        error: projectError.message,
        details: projectError.details,
      });
    }

    // Log activity
    await supabaseAdmin.from("project_activity").insert({
      project_id: project.id,
      user_id: userId,
      action: "created",
      details: { source: "api_create" },
    });

    // Trigger lead routing
    try {
      // Route project to matching vendors
      const { data: vendors, error: vendorError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, vendor_services, vendor_coverage_areas, company_name")
        .eq("role", "vendor")
        .eq("is_approved", true);

      if (!vendorError && vendors && vendors.length > 0) {
        const matchedVendors = [];

        for (const vendor of vendors) {
          // Check if vendor offers this service category
          const vendorServices = vendor.vendor_services || [];
          if (vendorServices.includes(categoryData.id)) {
            // Check if vendor covers this state
            const vendorStates = vendor.vendor_coverage_areas || [];
            const { data: coverageData } = await supabaseAdmin
              .from("coverage_areas")
              .select("state")
              .in("id", vendorStates);

            const vendorCoversState = coverageData?.some(
              (c) => c.state === projectData.project_state.toUpperCase()
            );

            if (vendorCoversState) {
              matchedVendors.push({
                project_id: project.id,
                vendor_id: vendor.user_id,
                status: "routed",
              });
            }
          }
        }

        // Create routing records
        if (matchedVendors.length > 0) {
          await supabaseAdmin.from("project_routing").insert(matchedVendors);

          // Log activity
          await supabaseAdmin.from("project_activity").insert({
            project_id: project.id,
            action: "routed",
            details: { matched_vendors: matchedVendors.length },
          });
        }
      }
    } catch (routingError) {
      console.warn("Lead routing failed:", routingError);
      // Don't fail the entire operation if routing fails
    }

    res.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
      },
    });
  } catch (error) {
    console.error("Create project error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: message,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
