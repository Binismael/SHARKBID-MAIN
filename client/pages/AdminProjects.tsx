import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, FileText, Search, Filter, DollarSign, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  service_category_id: string;
  business_id: string;
  status: "draft" | "open" | "in_review" | "selected" | "completed" | "cancelled";
  budget_min: number | null;
  budget_max: number | null;
  project_state: string | null;
  project_city: string | null;
  timeline_start: string | null;
  timeline_end: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface BusinessProfile {
  id: string;
  company_name: string;
}

export default function AdminProjects() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Record<string, string>>({});
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200",
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    in_review: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
    selected: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
    completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (projectsError) throw projectsError;

        // Fetch service categories
        const { data: servicesData, error: servicesError } = await supabase
          .from("service_categories")
          .select("id, name");

        if (servicesError) throw servicesError;

        const serviceMap = servicesData?.reduce((acc: Record<string, string>, service) => {
          acc[service.id] = service.name;
          return acc;
        }, {}) || {};

        setServiceCategories(serviceMap);

        // Fetch business profiles
        if (projectsData && projectsData.length > 0) {
          const businessIds = [...new Set(projectsData.map((p) => p.business_id))];
          const { data: businessesData, error: businessesError } = await supabase
            .from("profiles")
            .select("id, company_name")
            .in("id", businessIds);

          if (businessesError) {
            console.warn("Error fetching businesses:", businessesError);
          } else if (businessesData) {
            const businessMap = businessesData.reduce((acc: Record<string, string>, business) => {
              acc[business.id] = business.company_name;
              return acc;
            }, {});
            setBusinessNames(businessMap);
          }
        }

        setProjects(projectsData || []);
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || "Failed to load projects");
        setError(message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (businessNames[p.business_id] || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    open: projects.filter((p) => p.status === "open").length,
    inReview: projects.filter((p) => p.status === "in_review").length,
    completed: projects.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage all business projects</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Projects</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">{stats.total}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Open</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-3">{stats.open}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">In Review</p>
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-3">{stats.inReview}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Completed</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">{stats.completed}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by project title or business..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="selected">Selected</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Projects ({filteredProjects.length})
                </h2>
              </div>
              <div className="p-6">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No projects found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Project Title
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Business
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Service
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Budget
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Location
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => (
                          <tr
                            key={project.id}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-900 dark:text-white max-w-xs truncate">
                                {project.title}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-700 dark:text-slate-300">
                                {businessNames[project.business_id] || "Unknown"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-700 dark:text-slate-300 text-xs">
                                {serviceCategories[project.service_category_id] || "Unknown"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {project.budget_min && project.budget_max
                                  ? `${project.budget_min.toLocaleString()}-${project.budget_max.toLocaleString()}`
                                  : project.budget_max
                                  ? `~${project.budget_max.toLocaleString()}`
                                  : "N/A"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {project.project_city || project.project_state || "N/A"}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  statusColors[project.status] ||
                                  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {project.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-600 dark:text-slate-400 text-xs flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(project.created_at).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
