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

// Generate project report
export async function generateProjectReport(projectId: string) {
  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // Fetch milestones
    const { data: milestones } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId);

    // Fetch deliverables
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("*, creator:creator_id(name, email)")
      .eq("project_id", projectId);

    // Fetch payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("project_id", projectId);

    // Fetch assets
    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("project_id", projectId);

    // Calculate metrics
    const totalBudget = project.budget || 0;
    const totalSpent = payments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingPayments = payments
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const completedDeliverables = deliverables?.filter((d) => d.approved_at).length || 0;
    const totalDeliverables = deliverables?.length || 0;

    return {
      success: true,
      report: {
        project,
        metrics: {
          totalBudget,
          totalSpent,
          pendingPayments,
          budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
          completedDeliverables,
          totalDeliverables,
          completionPercentage: totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0,
          totalMilestones: milestones?.length || 0,
          totalAssets: assets?.length || 0,
        },
        milestones,
        deliverables,
        payments,
        assets,
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error generating project report:", message);
    return { success: false, error: message };
  }
}

// Get creator performance metrics
export async function getCreatorMetrics(creatorId: string, dateRange?: { start: string; end: string }) {
  try {
    // Fetch creator profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("id", creatorId)
      .single();

    // Fetch assignmentss
    const { data: assignments } = await supabase
      .from("project_assignments")
      .select("project:project_id(title, tier)")
      .eq("creator_id", creatorId);

    // Fetch deliverables
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("*")
      .eq("creator_id", creatorId);

    // Fetch payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("creator_id", creatorId);

    // Calculate metrics
    const totalEarned = payments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingEarnings = payments
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const averageEarningsPerProject = assignments && assignments.length > 0 ? totalEarned / assignments.length : 0;
    const completionRate = deliverables && deliverables.length > 0
      ? Math.round((deliverables.filter((d) => d.approved_at).length / deliverables.length) * 100)
      : 0;

    return {
      success: true,
      metrics: {
        profile,
        projectCount: assignments?.length || 0,
        totalEarned,
        pendingEarnings,
        averageEarningsPerProject: Math.round(averageEarningsPerProject),
        deliverablesSubmitted: deliverables?.length || 0,
        deliverablesApproved: deliverables?.filter((d) => d.approved_at).length || 0,
        completionRate,
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching creator metrics:", message);
    return { success: false, error: message, metrics: {} };
  }
}

// Get platform-wide analytics
export async function getPlatformAnalytics() {
  try {
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*, payments(amount, status)");

    const { data: users } = await supabase
      .from("user_profiles")
      .select("role");

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, status");

    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("approved_at");

    if (projectsError) throw projectsError;

    const totalProjects = projects?.length || 0;
    const totalUsers = users?.length || 0;
    const adminCount = users?.filter((u) => u.role === "admin").length || 0;
    const clientCount = users?.filter((u) => u.role === "client").length || 0;
    const creatorCount = users?.filter((u) => u.role === "creator").length || 0;

    const totalRevenue = payments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingRevenue = payments
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const completedDeliverables = deliverables?.filter((d) => d.approved_at).length || 0;
    const totalDeliverables = deliverables?.length || 0;

    // Calculate project metrics
    const projectsByStatus = (projects || []).reduce((acc: any, p: any) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const projectsByTier = (projects || []).reduce((acc: any, p: any) => {
      acc[p.tier] = (acc[p.tier] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      analytics: {
        overview: {
          totalProjects,
          totalUsers,
          totalRevenue,
          pendingRevenue,
        },
        userBreakdown: {
          admins: adminCount,
          clients: clientCount,
          creators: creatorCount,
        },
        projectMetrics: {
          byStatus: projectsByStatus,
          byTier: projectsByTier,
          completedDeliverables,
          totalDeliverables,
          completionRate: totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0,
        },
      },
    };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching platform analytics:", message);
    return { success: false, error: message, analytics: {} };
  }
}

// Export data to CSV
export function exportToCSV(
  data: Array<Record<string, any>>,
  filename: string
) {
  try {
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return `"${JSON.stringify(value)}"`;
            if (typeof value === "string" && value.includes(","))
              return `"${value.replace(/"/g, '""')}"`;
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error exporting to CSV:", message);
    return { success: false, error: message };
  }
}

// Export data to JSON
export function exportToJSON(
  data: Record<string, any>,
  filename: string
) {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error exporting to JSON:", message);
    return { success: false, error: message };
  }
}
