import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Edit2, Users, DollarSign, Trash2, Plus, Search, ChevronRight, Calendar, Briefcase, X } from "lucide-react";
import { getProjects, deleteProject, getCompanies, updateProject, assignCreatorToProject, getCreatorProfiles, getProjectAssignments } from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";

interface Project {
  id: string;
  title: string;
  companies?: { name: string };
  company_id?: string;
  tier: "essential" | "standard" | "visionary";
  status: "brief_submitted" | "briefing" | "pre_production" | "production" | "post_production" | "delivered";
  budget: number;
  budget_used: number;
  created_at: string;
}

export default function AdminProjects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<Record<string, any[]>>({});
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    company_id: "",
    tier: "standard" as "essential" | "standard" | "visionary",
    budget: 0,
  });
  const [editProject, setEditProject] = useState({
    title: "",
    status: "" as any,
    budget: 0,
    tier: "" as any,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, companiesData, creatorsData] = await Promise.all([
          getProjects().catch((err) => {
            console.error("Error fetching projects:", err);
            return [];
          }),
          getCompanies().catch((err) => {
            console.error("Error fetching companies:", err);
            return [];
          }),
          getCreatorProfiles().catch((err) => {
            console.error("Error fetching creators:", err);
            return [];
          }),
        ]);
        setProjects(projectsData || []);
        setCompanies(companiesData || []);
        setCreators(creatorsData || []);

        // Fetch assignments for each project
        if (projectsData && projectsData.length > 0) {
          const assignmentsMap: Record<string, any[]> = {};
          for (const project of projectsData) {
            const assignments = await getProjectAssignments(project.id);
            console.log(`[AdminProjects] Loaded ${assignments?.length || 0} assignments for project ${project.id}:`, assignments);
            assignmentsMap[project.id] = assignments || [];
          }
          console.log("[AdminProjects] All assignments loaded:", assignmentsMap);
          setProjectAssignments(assignmentsMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statusColors: Record<string, string> = {
    brief_submitted: "bg-gray-100 text-gray-700",
    briefing: "bg-blue-100 text-blue-700",
    pre_production: "bg-purple-100 text-purple-700",
    production: "bg-yellow-100 text-yellow-700",
    post_production: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
  };

  const tierColors: Record<string, string> = {
    essential: "bg-slate-100 text-slate-700",
    standard: "bg-blue-100 text-blue-700",
    visionary: "bg-purple-100 text-purple-700",
  };

  const filteredProjects = projects.filter((p) => {
    const clientName = companies.find(c => c.id === p.company_id)?.name || "";
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const budgetUtilization = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.round((spent / budget) * 100);
  };

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.company_id) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      // import createProject
      // await createProject(newProject);
      setShowCreateModal(false);
      setNewProject({ title: "", description: "", company_id: "", tier: "standard", budget: 0 });
      // Refresh projects
      const updatedProjects = await getProjects();
      setProjects(updatedProjects || []);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditProject({
      title: project.title,
      status: project.status,
      budget: project.budget,
      tier: project.tier,
    });
    setShowEditModal(true);
  };

  const saveProjectChanges = async () => {
    if (!selectedProject) return;
    try {
      await updateProject(selectedProject.id, editProject);
      setProjects(projects.map(p =>
        p.id === selectedProject.id
          ? { ...p, ...editProject }
          : p
      ));
      setShowEditModal(false);
      alert("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project");
    }
  };

  const handleAssignCreators = (project: Project) => {
    setSelectedProject(project);
    setSelectedCreators([]);
    setShowAssignModal(true);
  };

  const saveCreatorAssignments = async () => {
    if (!selectedProject) {
      alert("No project selected");
      return;
    }

    if (!Array.isArray(selectedCreators) || selectedCreators.length === 0) {
      alert("Please select at least one creator");
      return;
    }

    console.log(`[Assignment] Starting assignment for project ${selectedProject.id} with creators:`, selectedCreators);

    let newlyAssignedCount = 0;
    let alreadyAssignedCount = 0;
    let failedCount = 0;
    const failedCreators: string[] = [];

    try {
      for (const creatorId of selectedCreators) {
        console.log(`[Assignment] Assigning creator ${creatorId}...`);
        const result = await assignCreatorToProject(selectedProject.id, creatorId, "contributor");

        console.log(`[Assignment] Result for ${creatorId}:`, result);

        if (result.success) {
          if (result.alreadyAssigned) {
            alreadyAssignedCount++;
            console.log(`[Assignment] ⚠️ Creator ${creatorId} was already assigned (skipped)`);
          } else {
            newlyAssignedCount++;
            console.log(`[Assignment] ✅ Successfully assigned creator ${creatorId}`);
          }
        } else {
          failedCount++;
          failedCreators.push(creatorId);
          console.error(`[Assignment] ❌ Failed to assign creator ${creatorId}:`, result.error);
        }
      }

      // Refresh assignments for all projects to ensure UI is up-to-date
      console.log("[Assignment] Refreshing project assignments after assignment...");
      const updatedProjectsList = await getProjects();
      console.log("[Assignment] Updated projects:", updatedProjectsList);

      if (updatedProjectsList && updatedProjectsList.length > 0) {
        const assignmentsMap: Record<string, any[]> = {};
        for (const proj of updatedProjectsList) {
          const assignments = await getProjectAssignments(proj.id);
          console.log(`[Assignment] Assignments for project ${proj.id}:`, assignments);
          assignmentsMap[proj.id] = assignments || [];
        }
        console.log("[Assignment] Updated assignments map:", assignmentsMap);
        setProjectAssignments(assignmentsMap);
        setProjects(updatedProjectsList);
      }

      setShowAssignModal(false);
      setSelectedCreators([]);

      // Show detailed feedback
      console.log(`[Assignment] Summary: ${newlyAssignedCount} newly assigned, ${alreadyAssignedCount} already assigned, ${failedCount} failed`);

      if (failedCount === 0) {
        if (newlyAssignedCount > 0) {
          let message = `✅ Successfully assigned ${newlyAssignedCount} creator(s)!`;
          if (alreadyAssignedCount > 0) {
            message += `\n\n${alreadyAssignedCount} creator(s) were already assigned (skipped).`;
          }
          alert(message);
        } else if (alreadyAssignedCount > 0) {
          alert(`⚠️ All selected creators were already assigned to this project.`);
        }
      } else {
        let message = `⚠️ ${failedCount} creator(s) failed to assign.`;
        if (newlyAssignedCount > 0) {
          message = `${newlyAssignedCount} assigned successfully, ` + message.toLowerCase();
        }
        if (alreadyAssignedCount > 0) {
          message += `\n${alreadyAssignedCount} were already assigned.`;
        }
        message += `\n\nCheck console for details.`;
        alert(message);
      }
    } catch (error) {
      console.error("[Assignment] Unexpected error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to assign creators: ${errorMessage}\n\nCheck console for details.`);
    }
  };

  const handleViewMilestones = (project: Project) => {
    setSelectedProject(project);
    setShowMilestonesModal(true);
  };

  return (
    <DashboardLayout role="admin" userName={user?.email || "Admin"}>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Project Control
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Manage {projects.length} projects across all clients
            </p>
          </div>
          <Button
            className="h-11 gap-2 bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-5 w-5" />
            Create Project
          </Button>
        </div>

        {/* Enhanced Filters */}
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:flex-1">
              <label className="text-sm font-medium mb-2 block">Search Projects</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project name or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 py-2 bg-background hover:border-accent/50 transition-colors"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground hover:border-accent/50 transition-colors cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="briefing">Briefing</option>
                <option value="preprod">Pre-Production</option>
                <option value="production">Production</option>
                <option value="postprod">Post-Production</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Enhanced Projects List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {projects.length === 0 ? "No projects yet. Create one to get started!" : "No projects match your search."}
                  </p>
                  {projects.length === 0 && (
                    <Button
                      className="mt-4 gap-2"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create First Project
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project) => {
              const clientName = companies.find(c => c.id === project.company_id)?.name || "Unknown Client";
              const budgetPercent = budgetUtilization(project.budget_used, project.budget);
              return (
                <Card
                  key={project.id}
                  className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4"
                  style={{
                    borderLeftColor: tierColors[project.tier]?.includes('purple') ? '#a78bfa' :
                                    tierColors[project.tier]?.includes('blue') ? '#60a5fa' : '#94a3b8'
                  }}
                >
                  <CardContent className="pt-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold group-hover:text-accent transition-colors">
                            {project.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-accent/50" />
                          {clientName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border ${tierColors[project.tier]}`}
                        >
                          {project.tier.charAt(0).toUpperCase() +
                            project.tier.slice(1)}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border ${statusColors[project.status]}`}
                        >
                          {project.status
                            .replace(/_/g, " ")
                            .split(" ")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-border">
                      {/* Budget Metric */}
                      <div className="group/metric hover:bg-accent/5 p-3 rounded-lg transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-2 bg-secondary/20 rounded-lg">
                              <DollarSign className="h-4 w-4 text-secondary" />
                            </div>
                            Budget Utilization
                          </span>
                          <span className="text-lg font-bold text-accent">
                            {budgetPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-secondary to-secondary/80 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(budgetPercent, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          ${project.budget_used?.toLocaleString() || "0"} / ${project.budget?.toLocaleString() || "0"}
                        </p>
                      </div>

                      {/* Status Metric */}
                      <div className="group/metric hover:bg-accent/5 p-3 rounded-lg transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-2 bg-accent/20 rounded-lg">
                              <Users className="h-4 w-4 text-accent" />
                            </div>
                            Project Status
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground capitalize">
                          {project.status.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          In {project.status.includes('production') ? 'active' : 'planning'} phase
                        </p>
                      </div>

                      {/* Timeline Metric */}
                      <div className="group/metric hover:bg-accent/5 p-3 rounded-lg transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-2 bg-secondary/20 rounded-lg">
                              <Calendar className="h-4 w-4 text-secondary" />
                            </div>
                            Created Date
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {Math.floor((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </p>
                      </div>
                    </div>

                    {/* Assigned Creators Section */}
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          Assigned Creators
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600">
                          {projectAssignments[project.id]?.length || 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {projectAssignments[project.id] && projectAssignments[project.id].length > 0 ? (
                          projectAssignments[project.id].map((assignment: any) => {
                            const creator = creators.find((c) => c.id === assignment.creator_id);
                            return (
                              <div
                                key={assignment.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm"
                              >
                                <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-600">
                                  {creator?.user_profiles?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground text-xs">
                                    {creator?.user_profiles?.name || "Unknown Creator"}
                                  </span>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {assignment.role || "contributor"}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No creators assigned yet</p>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors group/btn"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit2 className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" />
                        Edit Project
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        onClick={() => handleAssignCreators(project)}
                      >
                        <Users className="h-4 w-4" />
                        Assign Creators
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        onClick={() => handleViewMilestones(project)}
                      >
                        View Milestones
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 ml-auto text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-400 transition-all"
                        variant="outline"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Enhanced Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Plus className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Create New Project</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Set up a new project for your creative team
                </p>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Project Title */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-accent/20 text-accent rounded flex items-center justify-center text-xs font-bold">1</span>
                    Project Title
                  </label>
                  <Input
                    placeholder="e.g., Summer Campaign 2025"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({ ...newProject, title: e.target.value })
                    }
                    className="py-2 hover:border-accent/50 focus:border-accent transition-colors"
                  />
                </div>

                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-accent/20 text-accent rounded flex items-center justify-center text-xs font-bold">2</span>
                    Select Client
                  </label>
                  <select
                    value={newProject.company_id}
                    onChange={(e) =>
                      setNewProject({ ...newProject, company_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground hover:border-accent/50 focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="">Choose a client...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-accent/20 text-accent rounded flex items-center justify-center text-xs font-bold">3</span>
                    Project Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['essential', 'standard', 'visionary'].map((tier) => (
                      <button
                        key={tier}
                        onClick={() =>
                          setNewProject({
                            ...newProject,
                            tier: tier as any,
                          })
                        }
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-all border-2 ${
                          newProject.tier === tier
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-accent/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-accent/20 text-accent rounded flex items-center justify-center text-xs font-bold">4</span>
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProject.budget}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          budget: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="pl-7 py-2 hover:border-accent/50 focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-white font-semibold h-10 transition-all hover:shadow-lg"
                    onClick={handleCreateProject}
                  >
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Button>
                  <Button
                    className="flex-1 h-10 transition-all"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Edit2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Edit Project</CardTitle>
                </div>
                <button onClick={() => setShowEditModal(false)} className="hover:bg-muted p-2 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Project Title */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Project Title</label>
                  <Input
                    value={editProject.title}
                    onChange={(e) => setEditProject({ ...editProject, title: e.target.value })}
                    className="py-2 hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    value={editProject.status}
                    onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground hover:border-blue-500/50 focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="brief_submitted">Brief Submitted</option>
                    <option value="briefing">Briefing</option>
                    <option value="pre_production">Pre-Production</option>
                    <option value="production">Production</option>
                    <option value="post_production">Post-Production</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                {/* Tier */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['essential', 'standard', 'visionary'].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setEditProject({ ...editProject, tier })}
                        className={`py-2 px-3 rounded-lg font-medium text-sm transition-all border-2 ${
                          editProject.tier === tier
                            ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                            : 'border-border hover:border-blue-600/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Budget (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={editProject.budget}
                      onChange={(e) => setEditProject({ ...editProject, budget: parseFloat(e.target.value) || 0 })}
                      className="pl-7 py-2 hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 transition-all hover:shadow-lg"
                    onClick={saveProjectChanges}
                  >
                    <Edit2 className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    className="flex-1 h-10 transition-all"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assign Creators Modal */}
        {showAssignModal && selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md shadow-2xl border-0 max-h-[80vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-b border-border sticky top-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">Assign Creators</CardTitle>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="hover:bg-muted p-2 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <p className="text-sm text-muted-foreground">
                  Select creators to assign to <strong>{selectedProject.title}</strong>
                </p>

                {/* Creators List */}
                <div className="space-y-2">
                  {creators.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No creators available</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {creators.map((creator: any) => (
                        <div
                          key={creator.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (selectedCreators.includes(creator.id)) {
                              setSelectedCreators(selectedCreators.filter(id => id !== creator.id));
                            } else {
                              setSelectedCreators([...selectedCreators, creator.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCreators.includes(creator.id)}
                            onChange={() => {}}
                            className="w-4 h-4 rounded cursor-pointer accent-purple-600"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {creator.user_profiles?.name || creator.specialties || creator.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {creator.bio || "No bio available"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold h-10 transition-all hover:shadow-lg disabled:opacity-50"
                    onClick={saveCreatorAssignments}
                    disabled={selectedCreators.length === 0}
                  >
                    <Users className="h-4 w-4" />
                    Assign {selectedCreators.length > 0 ? `(${selectedCreators.length})` : ''}
                  </Button>
                  <Button
                    className="flex-1 h-10 transition-all"
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Milestones Modal */}
        {showMilestonesModal && selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Project Milestones</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{selectedProject.title}</p>
                  </div>
                </div>
                <button onClick={() => setShowMilestonesModal(false)} className="hover:bg-muted p-2 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Milestone management coming soon. You can create milestones after the project is set up.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For now, milestones can be created when defining the project deliverables.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    className="flex-1 h-10 transition-all"
                    variant="outline"
                    onClick={() => setShowMilestonesModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
