import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, User, Building, Shield, ArrowRight, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  role: "business" | "vendor" | "admin";
  is_approved: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "business" | "vendor" | "admin">("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setUsers(data || []);
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || "Failed to load users");
        setError(message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.company_name.toLowerCase().includes(search.toLowerCase()) ||
      u.contact_email.toLowerCase().includes(search.toLowerCase());

    const matchesTab = activeTab === "all" || u.role === activeTab;

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: users.length,
    businesses: users.filter((u) => u.role === "business").length,
    vendors: users.filter((u) => u.role === "vendor").length,
    admins: users.filter((u) => u.role === "admin").length,
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage all marketplace participants</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Users</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</p>
          </Card>
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30">
            <p className="text-sm font-semibold text-blue-600 uppercase">Businesses</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">{stats.businesses}</p>
          </Card>
          <Card className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30">
            <p className="text-sm font-semibold text-indigo-600 uppercase">Vendors</p>
            <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mt-2">{stats.vendors}</p>
          </Card>
          <Card className="p-6 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-600 uppercase">Admins</p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-300 mt-2">{stats.admins}</p>
          </Card>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(["all", "business", "vendor", "admin"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="p-12 text-center">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No users found</p>
            </Card>
          ) : (
            filteredUsers.map((u) => (
              <Card
                key={u.id}
                className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        u.role === "business"
                          ? "bg-blue-100 text-blue-600"
                          : u.role === "vendor"
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {u.role === "business" ? (
                        <Building className="h-6 w-6" />
                      ) : u.role === "vendor" ? (
                        <User className="h-6 w-6" />
                      ) : (
                        <Shield className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {u.company_name}
                      </h3>
                      <p className="text-sm text-slate-500">{u.contact_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        u.role === "business"
                          ? "bg-blue-100 text-blue-700"
                          : u.role === "vendor"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>

                    {u.role === "vendor" && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.is_approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {u.is_approved ? "Approved" : "Pending Approval"}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                      {u.role === "vendor" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/vendors/${u.id}`)}
                          className="text-blue-600 hover:text-blue-700 gap-1"
                        >
                          Details <ArrowRight className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-slate-400">
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
