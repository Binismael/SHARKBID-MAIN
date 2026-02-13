import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, Calendar, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [loading, setLoading] = useState(true);

  const statusColors: Record<string, string> = {
    routed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    viewed: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
    interested: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
    bid_submitted: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  };

  useEffect(() => {
    const fetchRoutings = async () => {
      try {
        setLoading(true);

        // Fetch project_routing data via Admin API to bypass RLS recursion
        const response = await fetch("/api/admin/routings", {
          headers: {
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load routings");
        }

        const data = result.data;

        // Get unique vendor IDs
        const vendorIds = [...new Set(data?.map((r: any) => r.vendor_id) || [])];

        // Fetch vendor profiles
        let vendorProfiles: Record<string, any> = {};
        if (vendorIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, company_name, contact_email")
            .in("user_id", vendorIds);

          if (profileError) {
            console.error("Error fetching profiles:", getErrorMessage(profileError));
          } else if (profiles) {
            vendorProfiles = profiles.reduce((acc: Record<string, any>, profile) => {
              acc[profile.user_id] = profile;
              return acc;
            }, {});
          }
        }

        // Combine the data
        const routingsWithProfiles = data?.map((routing: any) => ({
          ...routing,
          profiles: vendorProfiles[routing.vendor_id] || { company_name: "Unknown Vendor", contact_email: "N/A" }
        })) || [];

        setRoutings(routingsWithProfiles);
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Project Routing
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor how projects are distributed to vendors
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Routings</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Routed</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-3">{stats.routed}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Viewed</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-3">{stats.viewed}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Interested</p>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mt-3">{stats.interested}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 border border-transparent hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bids Submitted</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">{stats.bid_submitted}</p>
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
                  placeholder="Search by project, vendor, or email..."
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
                <option value="all">All Status</option>
                <option value="routed">Routed</option>
                <option value="viewed">Viewed</option>
                <option value="interested">Interested</option>
                <option value="bid_submitted">Bid Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Routings Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Routings ({filteredRoutings.length})
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredRoutings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No routings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Project
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Vendor
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Budget
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Routed Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutings.map((routing) => (
                      <tr
                        key={routing.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {routing.projects?.title || "Unknown Project"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-700 dark:text-slate-300">
                            {routing.profiles?.company_name ||
                              "Unknown Vendor"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-600 dark:text-slate-400 text-xs">
                            {routing.profiles?.contact_email || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            ${(routing.projects?.budget_max || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusColors[routing.status] ||
                              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {routing.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs">
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
          </div>
        </div>
      </div>
    </div>
  );
}
