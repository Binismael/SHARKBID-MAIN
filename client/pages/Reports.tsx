import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { FileText, Download, BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getPlatformAnalytics, exportToJSON } from "@/lib/analytics-service";

interface Analytics {
  overview: {
    totalProjects: number;
    totalUsers: number;
    totalRevenue: number;
    pendingRevenue: number;
  };
  userBreakdown: {
    admins: number;
    clients: number;
    creators: number;
  };
  projectMetrics: {
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
    completedDeliverables: number;
    totalDeliverables: number;
    completionRate: number;
  };
}

export default function Reports() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [user?.id]);

  const loadAnalytics = async () => {
    setLoading(true);
    const result = await getPlatformAnalytics();
    if (result.success) {
      setAnalytics(result.analytics);
    }
    setLoading(false);
  };

  const handleExportJSON = async () => {
    if (!analytics) return;
    setExporting(true);
    const result = exportToJSON(analytics, "platform-analytics");
    setExporting(false);

    if (result.success) {
      // Show success message (you could add a toast here)
      console.log("Export successful");
    }
  };

  return (
    <DashboardLayout role="admin" userName={user?.email || "Admin"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Platform insights and performance metrics
            </p>
          </div>
          <Button
            onClick={handleExportJSON}
            disabled={loading || exporting}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export Report"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Projects</p>
                      <p className="text-3xl font-bold mt-1">
                        {analytics.overview.totalProjects}
                      </p>
                    </div>
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                      <p className="text-3xl font-bold mt-1">
                        {analytics.overview.totalUsers}
                      </p>
                    </div>
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold mt-1">
                        ${analytics.overview.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Pending Revenue</p>
                      <p className="text-3xl font-bold mt-1">
                        ${analytics.overview.pendingRevenue.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">User Breakdown</h2>
                </div>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-destructive"></div>
                      <span className="text-sm">Admins</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {analytics.userBreakdown.admins}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-secondary"></div>
                      <span className="text-sm">Clients</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {analytics.userBreakdown.clients}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-accent"></div>
                      <span className="text-sm">Creators</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {analytics.userBreakdown.creators}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Project Metrics */}
              <Card>
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">Project Metrics</h2>
                </div>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-secondary"
                          style={{
                            width: `${analytics.projectMetrics.completionRate}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-12 text-right">
                        {analytics.projectMetrics.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm">Completed Deliverables</span>
                    <span className="text-2xl font-bold">
                      {analytics.projectMetrics.completedDeliverables}/
                      {analytics.projectMetrics.totalDeliverables}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Status & Tier Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">Projects by Status</h2>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Object.entries(analytics.projectMetrics.byStatus).map(
                      ([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status.replace(/_/g, " ")}</span>
                          <span className="font-bold bg-accent/10 text-accent px-3 py-1 rounded">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">Projects by Tier</h2>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Object.entries(analytics.projectMetrics.byTier).map(
                      ([tier, count]) => (
                        <div key={tier} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{tier}</span>
                          <span className="font-bold bg-secondary/10 text-secondary px-3 py-1 rounded">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Unable to load analytics</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
