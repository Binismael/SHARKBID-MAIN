import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, AlertCircle, Loader2, Eye, CheckCircle2, Clock, LogOut, ArrowLeft, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<BidStats>({ total_leads: 0, bids_submitted: 0, bids_accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
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

        // Fetch routed leads for this vendor via server-side API to bypass RLS recursion
        const response = await fetch('/api/projects/routed', {
          headers: {
            'x-user-id': user.id
          }
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load leads');
        }

        const routedLeads = result.data;

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
        const message = getErrorMessage(err || 'Failed to load leads');
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
      description: 'Matched opportunities',
      icon: TrendingUp,
      gradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      iconColor: 'text-blue-600',
      accentColor: 'bg-blue-600',
    },
    {
      label: 'Bids Submitted',
      value: stats.bids_submitted,
      description: 'Active proposals',
      icon: Clock,
      gradient: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900',
      iconColor: 'text-orange-600',
      accentColor: 'bg-orange-600',
    },
    {
      label: 'Bids Accepted',
      value: stats.bids_accepted,
      description: 'Secured projects',
      icon: CheckCircle2,
      gradient: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
      iconColor: 'text-green-600',
      accentColor: 'bg-green-600',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Vendor Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your leads and grow your business</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="gap-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Website
              </Button>
              <Button
                onClick={() => navigate('/vendor/projects')}
                variant="outline"
                className="gap-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <Briefcase className="h-4 w-4" />
                Available Projects
              </Button>
              <Button
                onClick={() => navigate('/vendor/profile')}
                className={`gap-2 ${profileComplete ? 'bg-slate-200 text-slate-900 hover:bg-slate-300' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}
              >
                {profileComplete ? 'Edit Profile' : 'Complete Profile'}
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isSigningOut}
                variant="outline"
                className="gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Log Out'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Profile Warning */}
        {!profileComplete && (
          <Card className="p-5 mb-8 border-l-4 border-l-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 flex gap-4 shadow-sm">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-900 dark:text-yellow-200">Profile Incomplete</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">Complete your vendor profile to unlock matched leads from businesses in your service categories and coverage areas.</p>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-lg p-6 border border-transparent hover:shadow-lg transition-all duration-200`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.label}</p>
                    <p className="text-4xl font-bold mt-3 text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{stat.description}</p>
                  </div>
                  <div className={`${stat.accentColor} rounded-lg p-3 opacity-80`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <Card className="p-5 mb-8 border-l-4 border-l-red-600 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 flex gap-4 shadow-sm">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-200">Error Loading Leads</p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
            </div>
          </Card>
        )}

        {/* Leads List */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Leads</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Opportunities matched to your services and coverage areas</p>
          </div>

          {loading ? (
            <Card className="p-16 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            </Card>
          ) : leads.length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-dashed border-2 border-slate-300 dark:border-slate-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No leads yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                {profileComplete
                  ? "Get ready! You'll see matched leads here when businesses post projects in your service categories and coverage areas."
                  : "Complete your profile to unlock matched leads from businesses in your industry."}
              </p>
              <Button
                onClick={() => navigate('/vendor/profile')}
                className={`gap-2 ${profileComplete ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 hover:from-slate-300 hover:to-slate-400' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}
              >
                <Plus className="h-4 w-4" />
                {profileComplete ? 'View Profile' : 'Set Up Profile'}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5">
              {leads.map((lead) => {
                const badge = getBidBadge(lead.bid_status);
                const isNotBid = lead.bid_status === 'not_bid';

                return (
                  <Card
                    key={lead.id}
                    className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 bg-white dark:bg-slate-900"
                    onClick={() => navigate(`/vendor/lead/${lead.id}`)}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex-1">{lead.title}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{lead.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">${lead.budget_min?.toLocaleString()} - ${lead.budget_max?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">{lead.project_state} {lead.project_zip}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posted</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">{new Date(lead.routed_at || lead.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</p>
                            <p className={`font-bold mt-1 ${isNotBid ? 'text-orange-600' : 'text-green-600'}`}>
                              {isNotBid ? 'Bid Now' : 'View Bid'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        className={`ml-4 whitespace-nowrap ${isNotBid ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800' : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/vendor/lead/${lead.id}`);
                        }}
                      >
                        {isNotBid ? 'Submit Bid' : 'View Bid'}
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
