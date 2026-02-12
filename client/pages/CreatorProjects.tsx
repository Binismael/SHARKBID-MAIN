import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface ProjectDetail {
  id: string;
  title: string;
  description?: string;
  tier: string;
  budget: number;
  status: string;
  created_at: string;
  timeline_start?: string;
  timeline_end?: string;
  goals?: string;
  platforms?: string[];
  required_skills?: string[];
}

export default function CreatorProjects() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError("Project ID not found");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Project not found");
          return;
        }

        setProject(data);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "brief_submitted":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "briefing":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "pre_production":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "production":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "post_production":
        return "bg-green-100 text-green-700 border border-green-200";
      case "delivered":
        return "bg-green-100 text-green-700 border border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "essential":
        return "bg-slate-100 text-slate-700";
      case "standard":
        return "bg-blue-100 text-blue-700";
      case "visionary":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout role="creator" userName={user?.email || "Creator"}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/creator/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Loading project...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : project ? (
          <div className="space-y-6">
            {/* Project Header */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <CardTitle className="text-4xl mb-4">{project.title}</CardTitle>
                    <div className="flex gap-2">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getTierColor(project.tier)}`}>
                        {project.tier?.toUpperCase() || "STANDARD"}
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status?.replace(/_/g, " ").toUpperCase() || "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-lg text-muted-foreground mb-6">{project.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Project Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-100">
                      <DollarSign className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-2xl font-bold">${project.budget?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Calendar className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Timeline</p>
                      <p className="text-sm font-medium">
                        {project.timeline_start ? new Date(project.timeline_start).toLocaleDateString() : "TBD"}
                        {project.timeline_end && ` - ${new Date(project.timeline_end).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-100">
                      <CheckCircle className="h-6 w-6 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-sm font-medium capitalize">
                        {project.status?.replace(/_/g, " ") || "Pending"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Goals */}
              {project.goals && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Project Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{project.goals}</p>
                  </CardContent>
                </Card>
              )}

              {/* Platforms */}
              {project.platforms && project.platforms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Platforms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Required Skills */}
              {project.required_skills && project.required_skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Required Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Button */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/creator/dashboard")}
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No project data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
