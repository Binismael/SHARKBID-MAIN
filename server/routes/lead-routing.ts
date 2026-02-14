import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ [LEAD-ROUTING] Supabase credentials missing. Lead routing will fail.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface MatchedVendor {
  vendor_id: string;
  score: number; // Matching score
  reasons: string[];
}

// Helper: Check if vendor's coverage areas include the project location
async function checkGeographicMatch(
  projectZip: string,
  projectState: string,
  vendorCoverageAreas: string[]
): Promise<boolean> {
  if (!vendorCoverageAreas || vendorCoverageAreas.length === 0) {
    return false;
  }

  try {
    // Get coverage area details
    const { data: coverageDetails } = await supabaseAdmin
      .from("coverage_areas")
      .select("state")
      .in("id", vendorCoverageAreas);

    if (!coverageDetails) return false;

    // Check if any coverage area includes the project state
    return coverageDetails.some((c: any) => c.state === projectState.toUpperCase());
  } catch (error) {
    console.error("Error checking geographic match:", error);
    return false;
  }
}

// Helper: Check if vendor offers the required service
async function checkServiceMatch(
  projectServiceCategoryId: string,
  vendorServices: string[]
): Promise<boolean> {
  if (!vendorServices || vendorServices.length === 0) {
    return false;
  }

  return vendorServices.includes(projectServiceCategoryId);
}

// Main routing function
async function routeProjectToVendors(projectId: string): Promise<MatchedVendor[]> {
  try {
    // 1. Fetch project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectError?.message}`);
    }

    console.log(`[ROUTING] Processing project: ${project.id} (${project.title})`);

    // 2. Fetch all approved vendors
    const { data: vendors, error: vendorError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, vendor_services, vendor_coverage_areas, company_name")
      .eq("role", "vendor")
      .eq("is_approved", true);

    if (vendorError || !vendors) {
      throw new Error(`Failed to fetch vendors: ${vendorError?.message}`);
    }

    // 3. Find matching vendors
    const matchedVendors: MatchedVendor[] = [];

    for (const vendor of vendors) {
      const reasons: string[] = [];
      let score = 0;

      // Check service match
      const hasService = await checkServiceMatch(
        project.service_category_id,
        vendor.vendor_services || []
      );

      if (hasService) {
        score += 50;
        reasons.push("Service match");
      } else {
        continue; // Skip if service doesn't match
      }

      // Check geographic match
      const hasLocation = await checkGeographicMatch(
        project.project_zip,
        project.project_state,
        vendor.vendor_coverage_areas || []
      );

      if (hasLocation) {
        score += 50;
        reasons.push("Location match");
      } else {
        continue; // Skip if location doesn't match
      }

      matchedVendors.push({
        vendor_id: vendor.user_id,
        score,
        reasons,
      });

      console.log(
        `[ROUTING] Matched vendor: ${vendor.company_name} (score: ${score})`
      );
    }

    // 4. Create routing records for matched vendors
    if (matchedVendors.length > 0) {
      const routingRecords = matchedVendors.map((matched) => ({
        project_id: projectId,
        vendor_id: matched.vendor_id,
        status: "routed",
      }));

      const { error: routingError } = await supabaseAdmin
        .from("project_routing")
        .insert(routingRecords);

      if (routingError) {
        console.warn(`[ROUTING] Error creating routing records:`, routingError);
      } else {
        console.log(
          `[ROUTING] Created ${routingRecords.length} routing records`
        );

        // 5. Log activity
        await supabaseAdmin.from("project_activity").insert({
          project_id: projectId,
          action: "routed",
          details: {
            matched_vendors: matchedVendors.length,
            matched_vendor_ids: matchedVendors.map((m) => m.vendor_id),
          },
        });
      }
    } else {
      console.log(
        `[ROUTING] No matching vendors found for project: ${projectId}`
      );

      // Log no match
      await supabaseAdmin.from("project_activity").insert({
        project_id: projectId,
        action: "routing_failed",
        details: { reason: "No matching vendors found" },
      });
    }

    return matchedVendors;
  } catch (error) {
    console.error("[ROUTING] Error in routeProjectToVendors:", error);
    throw error;
  }
}

// API Endpoint to manually trigger routing (for testing/admin)
export const handleTriggerRouting: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId" });
    }

    const matched = await routeProjectToVendors(projectId);

    res.json({
      success: true,
      projectId,
      matched_vendors: matched.length,
      matched: matched,
    });
  } catch (error) {
    console.error("Trigger routing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: message,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Export routing function for use in other routes
export { routeProjectToVendors };
