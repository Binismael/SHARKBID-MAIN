import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Users, FileText, TrendingUp, CheckCircle2, Clock, XCircle, ArrowRight, Shield, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Metrics {
  total_businesses: number;
  total_vendors: number;
  approved_vendors: number;
  pending_vendors: number;
  total_projects: number;
  open_projects: number;
  total_bids: number;
  match_rate: number;
}

interface RecentProject {
  id: string;
  title: string;
  business_id: string;
  status: string;
  created_at: string;
  routed_vendors?: number;
}

interface RecentVendor {
  id: string;
  user_id: string;
  company_name: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>({
    total_businesses: 0,
    total_vendors: 0,
    approved_vendors: 0,
    pending_vendors: 0,
    total_projects: 0,
    open_projects: 0,
    total_bids: 0,
    match_rate: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [pendingVendors, setPendingVendors] = useState<RecentVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to logout');
      toast.error(message);
      console.error('Logout error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch metrics via Admin API to bypass RLS recursion
        const response = await fetch("/api/admin/stats", {
          headers: {
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load stats");
        }

        setMetrics(result.data.metrics);
        setRecentProjects(result.data.recentProjects);

        // Fetch pending vendors
        const { data: pendingData } = await supabase
          .from('profiles')
          .select('id, user_id, company_name, is_approved, created_at')
          .eq('role', 'vendor')
          .eq('is_approved', false)
          .order('created_at', { ascending: false })
          .limit(5);

        setPendingVendors(pendingData || []);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load dashboard');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Businesses',
      value: metrics.total_businesses,
      icon: Users,
      gradientBg: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Vendors',
      value: metrics.total_vendors,
      icon: Users,
      gradientBg: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Approved Vendors',
      value: metrics.approved_vendors,
      icon: CheckCircle2,
      gradientBg: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Pending Vendors',
      value: metrics.pending_vendors,
      icon: Clock,
      gradientBg: 'from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Total Projects',
      value: metrics.total_projects,
      icon: FileText,
      gradientBg: 'from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900',
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Open Projects',
      value: metrics.open_projects,
      icon: TrendingUp,
      gradientBg: 'from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900',
      color: 'text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Marketplace overview and management</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2 border-slate-200 dark:border-slate-800"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Website
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="gap-2 text-red-600 border-red-100 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/30"
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Logout
              </Button>
            </div>
          </div>
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
            {/* Key Metrics */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Marketplace Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className={`bg-gradient-to-br ${stat.gradientBg} rounded-lg p-6 border border-transparent hover:shadow-lg transition-all`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            {stat.label}
                          </p>
                          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
                            {stat.value}
                          </p>
                        </div>
                        <Icon className={`h-6 w-6 ${stat.color} opacity-60`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match Rate */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 mb-12 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Marketplace Performance</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-slate-900 dark:text-white">Lead Matching Rate</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{metrics.match_rate}%</p>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(metrics.match_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    {metrics.total_bids} total bids submitted on {metrics.total_projects} projects
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Vendors & Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Pending Vendors */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pending Vendor Approvals</h2>
                {pendingVendors.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4 opacity-70" />
                    <p className="text-slate-600 dark:text-slate-400">All vendors approved!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{vendor.company_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Applied {new Date(vendor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Review
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Projects */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Projects</h2>
                <div className="space-y-3">
                  {recentProjects.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                      <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">No recent projects</p>
                    </div>
                  ) : (
                    recentProjects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {project.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
                              project.status === 'open'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
                          <span className="font-semibold text-slate-900 dark:text-white">{project.routed_vendors}</span> vendors matched
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & System Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 shadow-sm h-full">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Marketplace Control Panel</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        User Access
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">Manage permissions and roles for all platform users.</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')} className="w-full">
                        Manage Users
                      </Button>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        Routing Logic
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">Configure how projects are automatically routed to vendors.</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/routing')} className="w-full">
                        Configure Routing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-8 shadow-lg h-full text-white">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    System Status
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Database</span>
                      <span className="text-green-400 font-mono text-sm">Operational</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">AI Intake</span>
                      <span className="text-green-400 font-mono text-sm">Operational</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Lead Routing</span>
                      <span className="text-green-400 font-mono text-sm">Operational</span>
                    </div>
                    <div className="mt-8 pt-4">
                      <p className="text-xs text-slate-400 mb-2">Logged in as Administrator</p>
                      <p className="text-sm font-mono truncate opacity-60">Admin Role Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate('/admin/users')}
                className="gap-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Users className="h-5 w-5" />
                Manage Users
              </Button>
              <Button
                onClick={() => navigate('/admin/vendors')}
                className="gap-2 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Manage Vendors
              </Button>
              <Button
                onClick={() => navigate('/admin/projects')}
                className="gap-2 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
              >
                <FileText className="h-5 w-5 text-blue-600" />
                View All Projects
              </Button>
              <Button
                onClick={() => navigate('/admin/routing')}
                className="gap-2 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
              >
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Routing Config
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
