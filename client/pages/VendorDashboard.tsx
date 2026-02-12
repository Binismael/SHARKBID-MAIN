import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, AlertCircle, Loader2, Eye, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Lead {
  id: string;
  title: string;
  description: string;
  service_category_id: string;
  budget_min: number;
  budget_max: number;
  project_zip: string;
  project_state: string;
  created_at: string;
  routed_at?: string;
  bid_status?: 'not_bid' | 'bid_submitted' | 'bid_accepted';
}

interface BidStats {
  total_leads: number;
  bids_submitted: number;
  bids_accepted: number;
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<BidStats>({ total_leads: 0, bids_submitted: 0, bids_accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchVendorData = async () => {
      try {
        setLoading(true);

        // Check vendor profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData?.vendor_services && profileData.vendor_services.length > 0) {
          setProfileComplete(true);
        }

        // Fetch routed leads for this vendor
        const { data: routedLeads, error: routeError } = await supabase
          .from('project_routing')
          .select(`
            id,
            project_id,
            routed_at,
            status,
            projects (
              id,
              title,
              description,
              service_category_id,
              budget_min,
              budget_max,
              project_zip,
              project_state,
              created_at
            )
          `)
          .eq('vendor_id', user.id)
          .order('routed_at', { ascending: false });

        if (routeError) throw routeError;

        // Get vendor's bids
        const { data: bidsData } = await supabase
          .from('vendor_responses')
          .select('project_id, status')
          .eq('vendor_id', user.id);

        const bidMap = new Map(bidsData?.map(b => [b.project_id, b.status]) || []);

        // Transform leads with bid status
        const leadsWithStatus: Lead[] = (routedLeads || []).map((item: any) => ({
          ...item.projects,
          routed_at: item.routed_at,
          bid_status: bidMap.get(item.projects.id) || 'not_bid',
        }));

        setLeads(leadsWithStatus);

        // Calculate stats
        setStats({
          total_leads: leadsWithStatus.length,
          bids_submitted: bidsData?.filter(b => b.status === 'submitted').length || 0,
          bids_accepted: bidsData?.filter(b => b.status === 'accepted').length || 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load leads';
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user]);

  const statCards = [
    {
      label: 'Available Leads',
      value: stats.total_leads,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Bids Submitted',
      value: stats.bids_submitted,
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      label: 'Bids Accepted',
      value: stats.bids_accepted,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ];

  const getBidBadge = (status?: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'not_bid': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Not Bid' },
      'bid_submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bid Submitted' },
      'bid_accepted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
    };
    const badge = badges[status || 'not_bid'];
    return badge;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your leads and bids</p>
            </div>
            <Button
              onClick={() => navigate('/vendor/profile')}
              variant={profileComplete ? 'outline' : 'default'}
              className="gap-2"
            >
              {profileComplete ? 'Edit Profile' : 'Complete Profile'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Warning */}
        {!profileComplete && (
          <Card className="p-4 mb-8 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Profile Incomplete</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Complete your vendor profile to start receiving leads matching your services and coverage area.</p>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <Card className="p-4 mb-8 border-destructive/30 bg-destructive/10 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </Card>
        )}

        {/* Leads List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Leads</h2>

          {loading ? (
            <Card className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
          ) : leads.length === 0 ? (
            <Card className="p-12 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No leads yet</h3>
              <p className="text-muted-foreground mb-6">
                {profileComplete
                  ? "You'll see matched leads here when businesses post projects in your service categories and areas."
                  : "Complete your profile first to start receiving leads"}
              </p>
              <Button
                onClick={() => navigate('/vendor/profile')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {profileComplete ? 'View Profile' : 'Set Up Profile'}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {leads.map((lead) => {
                const badge = getBidBadge(lead.bid_status);
                return (
                  <Card
                    key={lead.id}
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/vendor/lead/${lead.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{lead.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{lead.description}</p>
                        <div className="flex gap-6 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-medium">${lead.budget_min?.toLocaleString()} - ${lead.budget_max?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium">{lead.project_zip}, {lead.project_state}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Received</p>
                            <p className="font-medium">{new Date(lead.routed_at || lead.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="ml-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vendor/lead/${lead.id}`);
                        }}
                      >
                        {lead.bid_status === 'not_bid' ? 'Submit Bid' : 'View Bid'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
