import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Search, ChevronRight, ArrowLeft, Users, Building2, Briefcase, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  company_description?: string;
  contact_email: string;
  vendor_services?: string[];
  is_approved: boolean;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

export default function BusinessVendors() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // For Invite Modal
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch only approved vendors
        const { data: vendorData, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'vendor')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setVendors(vendorData || []);

        // Fetch my projects
        if (user) {
          let query = supabase
            .from('projects')
            .select('id, title')
            .neq('status', 'completed')
            .neq('status', 'cancelled');

          // Only filter by business_id if not an admin
          if (userRole !== 'admin') {
            query = query.eq('business_id', user.id);
          }

          const { data: projectData } = await query;

          setMyProjects(projectData || []);
        }

        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load vendors');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    let filtered = vendors.filter(vendor =>
      vendor.company_name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.contact_email.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [vendors, search]);

  const handleInvite = async () => {
    if (!selectedVendor || !selectedProject || !user) return;

    try {
      setInviting(true);
      
      // Create project_routing record
      const { error: routeError } = await supabase
        .from('project_routing')
        .upsert([
          {
            project_id: selectedProject,
            vendor_id: selectedVendor.user_id,
            status: 'routed' // or 'invited' if we add that status
          }
        ], { onConflict: 'project_id, vendor_id' });

      if (routeError) throw routeError;

      toast.success(`Invitation sent to ${selectedVendor.company_name}`);
      setSelectedVendor(null);
      setSelectedProject('');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to send invitation');
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/business/dashboard")}
            className="mb-4 gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Browse Vendors</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Find and invite expert vendors to your projects</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
            <Search className="h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by company name, industry, or expertise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-slate-900 dark:text-white placeholder-slate-500"
            />
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Vendors List */}
        <div>
          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-900 border-dashed">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No matching vendors found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredVendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-start gap-6">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                      <Building2 className="h-8 w-8" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{vendor.company_name}</h3>
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                        {vendor.company_description || "Expert vendor providing high-quality B2B services through Sharkbid."}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                          Verified Vendor
                        </span>
                        {vendor.vendor_services?.slice(0, 2).map((s, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400">
                            Service
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setSelectedVendor(vendor)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Invite to Project
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/business/vendors/${vendor.id}`)}
                          className="px-4 border-slate-200 dark:border-slate-700"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal (Simulated with fixed overlay if needed, but I'll use a simple absolute overlay) */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invite to Project</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Invite <span className="font-semibold text-slate-900 dark:text-white">{selectedVendor.company_name}</span> to bid on one of your active projects.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Select Project</label>
                {myProjects.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-300 text-sm">
                    You don't have any active projects. <button onClick={() => navigate('/business/projects/create')} className="font-bold underline">Create one first.</button>
                  </div>
                ) : (
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a project...</option>
                    {myProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedVendor(null)}
                className="flex-1 border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!selectedProject || inviting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
