import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Users, FileText, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch metrics
        const [
          { data: businessProfiles },
          { data: vendorProfiles },
          { data: projectsData },
          { data: bidsData },
          { data: routingData },
        ] = await Promise.all([
          supabase.from('profiles').select('id').eq('role', 'business'),
          supabase.from('profiles').select('id, is_approved').eq('role', 'vendor'),
          supabase.from('projects').select('id, status').order('created_at', { ascending: false }).limit(5),
          supabase.from('vendor_responses').select('id'),
          supabase.from('project_routing').select('id'),
        ]);

        const approvedVendors = vendorProfiles?.filter(v => v.is_approved).length || 0;
        const totalBids = bidsData?.length || 0;
        const totalRouted = routingData?.length || 0;
        const totalProjects = projectsData?.length || 0;

        const matchRate = totalProjects > 0 ? (totalRouted / totalProjects * 100).toFixed(1) : 0;

        setMetrics({
          total_businesses: businessProfiles?.length || 0,
          total_vendors: vendorProfiles?.length || 0,
          approved_vendors: approvedVendors,
          pending_vendors: (vendorProfiles?.length || 0) - approvedVendors,
          total_projects: totalProjects,
          open_projects: projectsData?.filter(p => p.status === 'open').length || 0,
          total_bids: totalBids,
          match_rate: parseFloat(matchRate as string) || 0,
        });

        // Fetch recent projects
        setRecentProjects(
          projectsData?.map(p => ({
            ...p,
            routed_vendors: Math.floor(Math.random() * 5) + 1, // Placeholder
          })) || []
        );

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
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
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
      color: 'text-blue-600',
    },
    {
      label: 'Total Vendors',
      value: metrics.total_vendors,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      label: 'Approved Vendors',
      value: metrics.approved_vendors,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      label: 'Pending Vendors',
      value: metrics.pending_vendors,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'Total Projects',
      value: metrics.total_projects,
      icon: FileText,
      color: 'text-indigo-600',
    },
    {
      label: 'Open Projects',
      value: metrics.open_projects,
      icon: TrendingUp,
      color: 'text-teal-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Marketplace overview and management</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error */}
        {error && (
          <Card className="p-4 mb-8 border-destructive/30 bg-destructive/10 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Marketplace Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase">{stat.label}</p>
                          <p className="text-2xl font-bold mt-2">{stat.value}</p>
                        </div>
                        <Icon className={`h-6 w-6 ${stat.color} opacity-50`} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Match Rate */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Marketplace Performance</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Lead Matching Rate</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.match_rate}%</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(metrics.match_rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metrics.total_bids} total bids submitted on {metrics.total_projects} projects
                  </p>
                </div>
              </div>
            </Card>

            {/* Pending Vendors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Vendor Approvals</h2>
                {pendingVendors.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">All vendors approved!</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pendingVendors.map((vendor) => (
                      <Card key={vendor.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{vendor.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(vendor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Review
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Projects */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <Card key={project.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          project.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {project.routed_vendors} vendors matched
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Management Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/admin/vendors')}
                className="gap-2 h-12"
              >
                <Users className="h-4 w-4" />
                Manage Vendors
              </Button>
              <Button
                onClick={() => navigate('/admin/projects')}
                variant="outline"
                className="gap-2 h-12"
              >
                <FileText className="h-4 w-4" />
                View All Projects
              </Button>
              <Button
                onClick={() => navigate('/admin/routing')}
                variant="outline"
                className="gap-2 h-12"
              >
                <TrendingUp className="h-4 w-4" />
                Routing Configuration
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
