import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, DollarSign, Clock, CheckCircle, TrendingUp, FileText, AlertCircle, Calendar, ArrowRight, AlertTriangle, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getCreatorDeliverables, getCreatorPayments, getCreatorStats, getCreatorProjects } from "@/lib/creator-service";
import { getCreatorProfile } from "@/lib/creator-onboarding-service";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSection } from "@/components/ui/dashboard-section";

interface Project {
  id: string;
  project_id?: string;
  project?: { id: string; title: string; description?: string; tier?: string; status?: string };
  role?: string;
  assigned_at?: string;
}

interface Deliverable {
  id: string;
  project?: { title: string };
  milestone?: { title: string };
  status: "pending" | "in_progress" | "submitted" | "approved";
  description?: string;
  submitted_at?: string;
  approved_at?: string;
  payment?: { amount: number; status: string };
}

interface Payment {
  id: string;
  milestone?: { title: string };
  project?: { title: string };
  amount: number;
  status: "pending" | "paid";
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const handleStartWork = async (deliverableId: string) => {
    try {
      const { updateDeliverableStatus } = await import("@/lib/creator-service");
      await updateDeliverableStatus(deliverableId, "in_progress");
      // Refresh deliverables
      const updatedDeliverables = await getCreatorDeliverables(user?.id || "");
      setDeliverables(updatedDeliverables);
    } catch (error) {
      console.error("Error starting work:", error);
      alert("Failed to start work. Please try again.");
    }
  };

  const handleUploadDeliverable = async (deliverableId: string) => {
    try {
      const { updateDeliverableStatus } = await import("@/lib/creator-service");
      await updateDeliverableStatus(deliverableId, "submitted");
      // Refresh deliverables
      const updatedDeliverables = await getCreatorDeliverables(user?.id || "");
      setDeliverables(updatedDeliverables);
    } catch (error) {
      console.error("Error uploading deliverable:", error);
      alert("Failed to submit deliverable. Please try again.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const [projectsData, deliverablesData, paymentsData, statsData, profileData] = await Promise.all([
          getCreatorProjects(user.id).catch(() => []),
          getCreatorDeliverables(user.id).catch(() => []),
          getCreatorPayments(user.id).catch(() => []),
          getCreatorStats(user.id).catch(() => null),
          getCreatorProfile(user.id).catch(() => ({ profile: null })),
        ]);

        setProjects(projectsData || []);
        setDeliverables(deliverablesData || []);
        setPayments(paymentsData || []);
        setStats(statsData || {});
        setProfileComplete(profileData?.profile?.onboarding_completed || false);
      } catch (error) {
        console.error("Error fetching creator data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Use real data only - no fallback dummy data
  const displayDeliverables = deliverables;
  const displayPayments = payments;

  const displayStats = stats || {
    activeProjects: 0,
    pendingDeliverables: 0,
    totalEarned: 0,
    pendingPayments: 0,
    processingPayments: 0,
    totalPayments: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "submitted":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "approved":
        return "bg-green-100 text-green-700 border border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-secondary/20 text-secondary";
      case "processing":
      case "unpaid":
        return "bg-accent/20 text-accent";
      case "pending":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const totalPending = displayDeliverables.reduce((sum, d) => sum + (d.payment?.amount || 0), 0);
  const totalEarned = displayPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout role="creator" userName={user?.email || "Creator"}>
      <div className="space-y-8">
        {/* Profile Completion Banner */}
        {!profileComplete && (
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-accent">Complete Your Profile</p>
                    <p className="text-sm text-accent/80 mt-1">
                      Finish your onboarding to get matched with projects and appear in creator search
                    </p>
                  </div>
                </div>
                <Button asChild className="bg-accent hover:bg-accent/90 gap-2">
                  <Link to="/creator/onboarding">
                    Complete Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Page Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Execution Console
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Track your deliverables and earnings in real-time
            </p>
          </div>
          <Button asChild className="gap-2 h-11 bg-accent hover:bg-accent/90 shadow-lg">
            <Link to="/creator/payments">
              View Payment History
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Zap}
            label="Active Projects"
            value={displayStats.activeProjects || 0}
            subtext="Projects assigned to you"
            variant="accent"
          />
          <StatCard
            icon={CheckCircle}
            label="Pending Deliverables"
            value={`$${totalPending.toLocaleString()}`}
            subtext="Ready to be delivered"
            variant="secondary"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Earned"
            value={`$${totalEarned.toLocaleString()}`}
            subtext="Paid invoices"
            variant="accent"
          />
          <StatCard
            icon={DollarSign}
            label="Pending Payments"
            value={`$${(displayStats.pendingPayments || 0).toLocaleString()}`}
            subtext="Awaiting payment"
            variant="default"
          />
        </div>

        {/* Your Assigned Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-accent" />
              Your Projects
            </h2>
            <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {projects.length} assigned
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
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No projects assigned yet.</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Check back soon for new project opportunities!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            projects.map((assignment) => (
              <Link
                key={assignment.id}
                to={`/creator/projects/${assignment.project_id || assignment.project?.id}`}
                className="block no-underline"
              >
                <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold group-hover:text-accent transition-colors">
                          {assignment.project?.title || "Unknown Project"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Role: <span className="font-medium capitalize">{assignment.role || "contributor"}</span>
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {assignment.project?.tier || "standard"}
                      </span>
                    </div>
                    {assignment.project?.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {assignment.project.description.substring(0, 150)}
                        {assignment.project.description.length > 150 ? "..." : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Assigned {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : "recently"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Assigned Deliverables */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent" />
              Your Deliverables
            </h2>
            <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {displayDeliverables.length} active
            </span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading deliverables...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : displayDeliverables.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No deliverables assigned yet.</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    Once projects are created and you're assigned as a creator, your deliverables will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            displayDeliverables.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold group-hover:text-accent transition-colors">
                        {item.project?.title || "Unknown Project"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.milestone?.title || "No milestone"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status
                        .replace(/_/g, " ")
                        .split(" ")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
                    {/* Payment Value */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Value</p>
                      <p className="text-lg font-bold text-secondary">
                        ${(item.payment?.amount || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${getPaymentStatusColor(item.payment?.status || "pending")}`}>
                        {(item.payment?.status || "pending").charAt(0).toUpperCase() +
                          (item.payment?.status || "pending").slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2">
                    {item.status === "pending" && (
                      <Button
                        className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-white transition-all"
                        onClick={() => handleStartWork(item.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Start Work
                      </Button>
                    )}
                    {item.status === "in_progress" && (
                      <Button
                        className="flex-1 gap-2 bg-secondary hover:bg-secondary/90 text-white transition-all"
                        onClick={() => handleUploadDeliverable(item.id)}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Upload Deliverable
                      </Button>
                    )}
                    {item.status === "submitted" && (
                      <div className="flex-1 p-3 bg-accent/10 rounded-lg border border-accent/30">
                        <p className="text-sm text-accent font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Awaiting client approval
                        </p>
                      </div>
                    )}
                    {item.status === "approved" && (
                      <div className="flex-1 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                        <p className="text-sm text-secondary font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Approved by client
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Recent Earnings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-accent" />
              Recent Earnings
            </h2>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to="/creator/payments">
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {displayPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No payments yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Your payments will appear here once deliverables are approved.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayPayments.slice(0, 5).map((earning, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {earning.milestone?.title || "Untitled Milestone"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {earning.project?.title || "Unknown Project"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">
                          ${earning.amount.toLocaleString()}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${getPaymentStatusColor(
                            earning.status
                          )}`}
                        >
                          {earning.status.charAt(0).toUpperCase() +
                            earning.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
