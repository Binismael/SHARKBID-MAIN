import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Clock, CheckCircle, AlertCircle, FileText, ArrowRight, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getClientProjects, getClientStats, getClientProfile } from "@/lib/client-service";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectCard } from "@/components/ui/project-card";
import { DashboardSection } from "@/components/ui/dashboard-section";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  tier: string;
  budget: number;
  budget_used: number;
  nextMilestone: string;
  milestoneDueDate?: string;
  deliverableCount: number;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const [projectsData, statsData, profileData] = await Promise.all([
          getClientProjects(user.id).catch((err) => {
            console.error("Error fetching projects:", err);
            return [];
          }),
          getClientStats(user.id).catch((err) => {
            console.error("Error fetching stats:", err);
            return {
              activeProjects: 0,
              totalBudget: 0,
              budgetRemaining: 0,
              totalSpent: 0,
              budgetUtilization: 0,
            };
          }),
          getClientProfile(user.id).catch((err) => {
            console.error("Error fetching profile:", err);
            return null;
          }),
        ]);

        setProjects(projectsData || []);
        setStats(statsData || {});
        setProfile(profileData || {});
      } catch (error) {
        console.error("Error fetching client data:", error);
        // Set defaults on error
        setProjects([]);
        setStats({
          activeProjects: 0,
          totalBudget: 0,
          budgetRemaining: 0,
          totalSpent: 0,
          budgetUtilization: 0,
        });
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "briefing":
        return "bg-accent/20 text-accent";
      case "preprod":
      case "pre_production":
        return "bg-secondary/20 text-secondary";
      case "production":
        return "bg-accent/20 text-accent";
      case "postprod":
      case "post_production":
        return "bg-secondary/20 text-secondary";
      case "delivered":
        return "bg-secondary/20 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "essential":
        return "bg-muted text-muted-foreground";
      case "standard":
        return "bg-accent/20 text-accent";
      case "visionary":
        return "bg-secondary/20 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const budgetPercent = (spent: number, total: number) =>
    total > 0 ? Math.round((spent / total) * 100) : 0;

  const displayStats = stats || {
    activeProjects: 0,
    totalBudget: 0,
    budgetRemaining: 0,
    totalSpent: 0,
    budgetUtilization: 0,
  };

  return (
    <DashboardLayout role="client" userName={profile?.name || user?.email || "Client"}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Vision Dashboard
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manage your projects and find the perfect creators
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2 h-11">
              <Link to="/client/assets">
                Assets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="gap-2 h-11 bg-accent hover:bg-accent/90 shadow-lg">
              <Link to="/client/briefing">
                New Project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Actions for Project Creation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-accent/30 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-accent mb-1">Create New Project</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use our guided briefing to find the perfect creator
                  </p>
                  <Button asChild size="sm" className="bg-accent hover:bg-accent/90">
                    <Link to="/client/briefing" className="gap-1">
                      Start Briefing
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-secondary/30 bg-secondary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary mb-1">Browse Creators</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Explore creators and view their portfolios
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/marketplace" className="gap-1">
                      View Marketplace
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Zap}
            label="Active Projects"
            value={displayStats.activeProjects}
            variant="accent"
          />
          <StatCard
            icon={DollarSign}
            label="Total Budget"
            value={`$${(displayStats.totalBudget / 1000).toFixed(1)}k`}
            variant="secondary"
          />
          <StatCard
            icon={CheckCircle}
            label="Budget Remaining"
            value={`$${(displayStats.budgetRemaining / 1000).toFixed(1)}k`}
            variant="accent"
          />
          <StatCard
            icon={TrendingUp}
            label="Budget Utilization"
            value={`${displayStats.budgetUtilization || 0}%`}
            variant="default"
          />
        </div>

        {/* Active Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
              Active Projects
            </h2>
            <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {projects.length} projects
            </span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading projects...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No projects yet.</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Projects will appear here once they're created and assigned to you.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <Link
                        to={`/client/projects/${project.id}`}
                        className="text-lg font-bold group-hover:text-accent transition-colors"
                      >
                        {project.title}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Next: {project.nextMilestone}
                      </p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${getTierBadgeColor(
                          project.tier
                        )}`}
                      >
                        {project.tier.charAt(0).toUpperCase() + project.tier.slice(1)}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                          project.status.replace(/_/g, " ").slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Budget Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Budget Utilization</span>
                        <span className="text-sm text-accent font-bold">
                          {budgetPercent(project.budget_used, project.budget)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-secondary to-secondary/80 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(budgetPercent(project.budget_used, project.budget), 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${project.budget_used?.toLocaleString() || "0"} / $
                        {project.budget?.toLocaleString() || "0"}
                      </p>
                    </div>

                    {/* Project Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Deliverables</p>
                        <p className="text-lg font-bold text-foreground">
                          {project.deliverableCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {project.status.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Budget Remaining</p>
                        <p className="text-lg font-bold text-accent">
                          ${((project.budget || 0) - (project.budget_used || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
