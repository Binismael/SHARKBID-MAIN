import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, TrendingUp, AlertCircle, Loader2, Eye, CheckCircle2, Clock, LogOut, ArrowLeft, Briefcase, MessageSquare, Inbox } from 'lucide-react';
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
  status: string;
  selected_vendor_id?: string;
  bid_status?: 'not_bid' | 'submitted' | 'accepted' | 'bid_submitted' | 'bid_accepted' | 'declined' | 'withdrawn';
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

        // 1. Fetch vendor's bids via server-side API
        const bidsResponse = await fetch('/api/projects/vendor-bids', {
          headers: {
            'x-vendor-id': user.id
          }
        });
        const bidsResult = await bidsResponse.json();

        if (!bidsResult.success) {
          throw bidsResult.error || 'Failed to load bids';
        }

        const bidsData = bidsResult.data;
        const bidMap = new Map(bidsData?.map((b: any) => [b.project_id, b.status]) || []);

        // 2. Fetch projects where this vendor is the selected vendor via server-side API
        const assignedResponse = await fetch('/api/projects/vendor', {
          headers: {
            'x-user-id': user.id
          }
        });
        const assignedResult = await assignedResponse.json();

        if (!assignedResult.success) {
          throw assignedResult.error || 'Failed to load assigned projects';
        }

        const assignedProjects = assignedResult.data;

        // 3. Fetch routed leads for this vendor via server-side API
        const response = await fetch('/api/projects/routed', {
          headers: {
            'x-user-id': user.id
          }
        });
        const result = await response.json();

        if (!result.success) {
          throw result.error || 'Failed to load leads';
        }

        const routedLeads = result.data;

        // 4. Combine and deduplicate projects
        const allProjectsMap = new Map();

        // Add routed projects
        (routedLeads || []).forEach((item: any) => {
          if (item.projects && item.status !== 'declined') {
            allProjectsMap.set(item.projects.id, {
              ...item.projects,
              routed_at: item.routed_at,
              bid_status: bidMap.get(item.projects.id) || 'not_bid',
            });
          }
        });

        // Add assigned projects (ensure they have correct status if not in routing)
        (assignedProjects || []).forEach((p: any) => {
          if (!allProjectsMap.has(p.id)) {
            allProjectsMap.set(p.id, {
              ...p,
              bid_status: bidMap.get(p.id) || 'accepted',
            });
          } else {
            // Update status if it's accepted in bids but maybe not in routing
            const existing = allProjectsMap.get(p.id);
            if (bidMap.get(p.id) === 'accepted' || p.selected_vendor_id === user.id) {
              existing.bid_status = 'accepted';
            }
          }
        });

        const combinedLeads = Array.from(allProjectsMap.values());
        setLeads(combinedLeads);

        // Calculate stats
        setStats({
          total_leads: combinedLeads.filter(l => l.status !== 'completed' && l.bid_status !== 'accepted').length,
          bids_submitted: bidsData?.filter((b: any) => (b.status === 'submitted' || b.status === 'bid_submitted') && b.status !== 'withdrawn').length || 0,
          bids_accepted: (assignedProjects?.filter((p: any) => p.status !== 'completed').length || 0),
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
      'submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bid Submitted' },
      'bid_submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bid Submitted' },
      'accepted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
      'bid_accepted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
    };
    const badge = badges[status || 'not_bid'];
    return badge;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-20">
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
                onClick={() => navigate('/vendor/messages')}
                variant="outline"
                className="gap-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <MessageSquare className="h-4 w-4" />
                Messages
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 border border-white/50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{stat.label}</p>
                    <p className="text-5xl font-black mt-3 text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${stat.accentColor}`}></span>
                      {stat.description}
                    </p>
                  </div>
                  <div className={`${stat.accentColor} rounded-2xl p-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7 text-white" />
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

        {/* Active Projects */}
        {leads.some(l => (l.bid_status === 'accepted' || l.bid_status === 'bid_accepted' || l.selected_vendor_id === user?.id) && l.status !== 'completed') && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Active Projects</h2>
            </div>
            <div className="grid gap-5">
              {leads.filter(l => (l.bid_status === 'accepted' || l.bid_status === 'bid_accepted' || l.selected_vendor_id === user?.id) && l.status !== 'completed').map((lead) => (
                <Card
                  key={lead.id}
                  className="p-6 border-l-4 border-l-green-500 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(`/vendor/lead/${lead.id}`)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex-1">{lead.title}</h3>
                        <span className="text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-800 uppercase">
                          Active & Secured
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{lead.description}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600">Messages active</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Started {new Date(lead.routed_at || lead.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white gap-2 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vendor/lead/${lead.id}`);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Open Workspace
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Leads List */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">New Opportunities</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Projects matched to your profile seeking proposals</p>
          </div>

          {loading ? (
            <Card className="p-16 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
            </Card>
          ) : leads.filter(l => l.bid_status !== 'accepted' && l.bid_status !== 'bid_accepted' && l.selected_vendor_id !== user?.id && l.status !== 'completed').length === 0 ? (
            <Card className="p-12 text-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-dashed border-2 border-slate-300 dark:border-slate-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Inbox className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No new leads</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                All caught up! We'll notify you when new projects matching your profile are posted.
              </p>
            </Card>
          ) : (
            <div className="grid gap-5">
              {leads.filter(l => l.bid_status !== 'accepted' && l.bid_status !== 'bid_accepted' && l.selected_vendor_id !== user?.id && l.status !== 'completed').map((lead) => {
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

        {/* Completed Projects */}
        {leads.some(l => l.status === 'completed') && (
          <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Completed History</h2>
            </div>
            <div className="grid gap-4">
              {leads.filter(l => l.status === 'completed').map((lead) => (
                <Card
                  key={lead.id}
                  className="p-5 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100 transition-all cursor-pointer"
                  onClick={() => navigate(`/vendor/lead/${lead.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-700 dark:text-slate-200">{lead.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Completed on {new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-500">View Archive</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
