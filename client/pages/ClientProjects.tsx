import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getClientProjects,
  getProjectDeliverables,
  getProjectById,
} from "@/lib/client-service";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Target,
  BarChart3,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  status: string;
  due_date?: string;
}

interface Deliverable {
  id: string;
  milestone?: { title: string };
  creator?: { name: string };
  status: string;
  submitted_at?: string;
  approved_at?: string;
}

export default function ClientProjects() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !projectId) {
        setLoading(false);
        return;
      }

      // Set a hard timeout to prevent infinite loading
      const hardTimeout = setTimeout(() => {
        console.warn("Project detail page timeout - forcing load completion");
        setLoading(false);
      }, 10000); // 10 second max wait

      try {
        // Try direct fetch first (faster for single project)
        let foundProject = await getProjectById(projectId, user.id);

        // Fallback to full list if direct fetch fails
        if (!foundProject) {
          const projectsData = await getClientProjects(user.id);
          foundProject = projectsData.find((p) => p.id === projectId);
        }

        setProject(foundProject);

        // Fetch deliverables separately with short timeout
        if (projectId) {
          const delivs = await getProjectDeliverables(projectId);
          setDeliverables(delivs || []);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
        setProject(null);
      } finally {
        clearTimeout(hardTimeout);
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, projectId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-accent/20 text-accent";
      case "in_progress":
      case "in progress":
        return "bg-accent/20 text-accent";
      case "submitted":
        return "bg-secondary/20 text-secondary";
      case "approved":
        return "bg-secondary/20 text-secondary";
      case "briefing":
        return "bg-accent/20 text-accent";
      case "production":
        return "bg-accent/20 text-accent";
      case "delivered":
        return "bg-secondary/20 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-secondary" />;
      case "pending":
      case "briefing":
        return <AlertCircle className="h-5 w-5 text-accent" />;
      case "in_progress":
      case "production":
        return <Clock className="h-5 w-5 text-accent" />;
      case "submitted":
        return <FileText className="h-5 w-5 text-secondary" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const budgetPercent = project
    ? Math.round(((project.budget_used || 0) / (project.budget || 1)) * 100)
    : 0;

  if (loading) {
    return (
      <DashboardLayout role="client" userName={user?.email || "Client"}>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="client" userName={user?.email || "Client"}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Project not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/client/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={user?.email || "Client"}>
      <div className="space-y-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/client/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-muted-foreground mt-2">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span
              className={`text-sm font-bold px-4 py-2 rounded-full ${
                project.tier === "essential"
                  ? "bg-muted text-muted-foreground"
                  : project.tier === "standard"
                    ? "bg-accent/20 text-accent"
                    : "bg-secondary/20 text-secondary"
              }`}
            >
              {project.tier.charAt(0).toUpperCase() + project.tier.slice(1)}
            </span>
            <span className={`text-sm font-bold px-4 py-2 rounded-full ${getStatusColor(project.status)}`}>
              {project.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                project.status.replace(/_/g, " ").slice(1)}
            </span>
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Budget</p>
                  <p className="text-2xl font-bold mt-1">
                    ${(project.budget || 0).toLocaleString()}
                  </p>
                </div>
                <Target className="h-6 w-6 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Spent</p>
                  <p className="text-2xl font-bold mt-1">
                    ${(project.budget_used || 0).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Remaining</p>
                  <p className="text-2xl font-bold mt-1 text-secondary">
                    ${((project.budget || 0) - (project.budget_used || 0)).toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Utilization</p>
                  <p className="text-2xl font-bold mt-1 text-accent">{budgetPercent}%</p>
                </div>
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-secondary to-secondary/80 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${(project.budget_used || 0).toLocaleString()} spent</span>
              <span>${((project.budget || 0) - (project.budget_used || 0)).toLocaleString()} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
              Deliverables
            </h2>
            <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {deliverables.length} deliverables
            </span>
          </div>

          {deliverables.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No deliverables yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {deliverables.map((deliverable) => (
                <Card
                  key={deliverable.id}
                  className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(deliverable.status)}
                          <h3 className="text-lg font-semibold">
                            {deliverable.milestone?.title || "Unknown Milestone"}
                          </h3>
                        </div>
                        {deliverable.creator && (
                          <p className="text-sm text-muted-foreground">
                            by {deliverable.creator.name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${getStatusColor(deliverable.status)}`}>
                          {deliverable.status.replace(/_/g, " ").charAt(0).toUpperCase() +
                            deliverable.status.replace(/_/g, " ").slice(1)}
                        </span>
                        {deliverable.submitted_at && (
                          <span className="text-xs text-muted-foreground">
                            Submitted: {new Date(deliverable.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                        {deliverable.approved_at && (
                          <span className="text-xs text-secondary font-medium">
                            Approved: {new Date(deliverable.approved_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
