import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search, Calendar, ArrowRight, Eye, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

interface Routing {
  id: string;
  project_id: string;
  vendor_id: string;
  routed_at: string;
  status: "routed" | "viewed" | "interested" | "bid_submitted";
  projects?: {
    id: string;
    title: string;
    budget_max: number | null;
  };
  profiles?: {
    company_name: string;
    contact_email: string;
  };
}

export default function AdminRouting() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [loading, setLoading] = useState(true);

  const statusColors: Record<string, string> = {
    routed: "bg-blue-100 text-blue-700",
    viewed: "bg-purple-100 text-purple-700",
    interested: "bg-orange-100 text-orange-700",
    bid_submitted: "bg-green-100 text-green-700",
  };

  useEffect(() => {
    const fetchRoutings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("project_routing")
          .select(
            `
            id,
            project_id,
            vendor_id,
            routed_at,
            status,
            projects(id, title, budget_max),
            profiles!vendor_id(company_name, contact_email)
          `
          )
          .order("routed_at", { ascending: false });

        if (error) {
          console.error("Error fetching routings:", getErrorMessage(error));
          toast.error("Failed to load routings");
          return;
        }

        setRoutings(data || []);
      } catch (error) {
        console.error("Error fetching routings:", getErrorMessage(error));
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    fetchRoutings();
  }, []);

  const filteredRoutings = routings.filter((routing) => {
    const matchesSearch =
      !search ||
      (routing.projects?.title || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (routing.profiles?.company_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (routing.profiles?.contact_email || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || routing.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: routings.length,
    routed: routings.filter((r) => r.status === "routed").length,
    viewed: routings.filter((r) => r.status === "viewed").length,
    interested: routings.filter((r) => r.status === "interested").length,
    bid_submitted: routings.filter((r) => r.status === "bid_submitted").length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            Project Routing
          </h1>
          <p className="text-slate-600">
            Monitor how projects are distributed to vendors
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {stats.total}
                </div>
                <div className="text-sm text-slate-600 mt-1">Total Routings</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.routed}
                </div>
                <div className="text-sm text-slate-600 mt-1">Routed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.viewed}
                </div>
                <div className="text-sm text-slate-600 mt-1">Viewed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.interested}
                </div>
                <div className="text-sm text-slate-600 mt-1">Interested</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.bid_submitted}
                </div>
                <div className="text-sm text-slate-600 mt-1">Bid Submitted</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by project, vendor, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="routed">Routed</option>
                  <option value="viewed">Viewed</option>
                  <option value="interested">Interested</option>
                  <option value="bid_submitted">Bid Submitted</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routings Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Routings ({filteredRoutings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredRoutings.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No routings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Project
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Vendor
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Budget
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Routed Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutings.map((routing) => (
                      <tr
                        key={routing.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">
                            {routing.projects?.title || "Unknown Project"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-700">
                            {routing.profiles?.company_name ||
                              "Unknown Vendor"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-600 text-xs">
                            {routing.profiles?.contact_email || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">
                            ${(routing.projects?.budget_max || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusColors[routing.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {routing.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-slate-600 text-xs">
                            <Calendar className="w-4 h-4" />
                            {formatDate(routing.routed_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
