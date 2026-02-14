import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Search, ChevronRight, ArrowLeft, Briefcase, MapPin, DollarSign, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  service_category_id: string;
  budget_min: number;
  budget_max: number;
  project_state: string;
  project_city: string;
  created_at: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

export default function VendorAvailableProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Fetch unrouted projects via server-side API to bypass RLS recursion
        const response = await fetch('/api/projects/unrouted', {
          headers: {
            'x-vendor-id': user.id
          }
        });
        const result = await response.json();

        if (!result.success) {
          throw result.error || 'Failed to load projects';
        }

        setProjects(result.data || []);

        // Fetch service categories
        const { data: servicesData } = await supabase
          .from('service_categories')
          .select('id, name');

        const serviceMap = servicesData?.reduce((acc: Record<string, string>, s) => {
          acc[s.id] = s.name;
          return acc;
        }, {}) || {};
        setServiceCategories(serviceMap);

        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load projects');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    let filtered = projects.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projects, search]);

  const handleRequestToBid = async (projectId: string) => {
    if (!user) return;

    try {
      setRequestingId(projectId);

      // Request to bid via server-side API to bypass RLS recursion
      const response = await fetch('/api/projects/upsert-routing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          vendorId: user.id,
          status: 'interested'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || 'Failed to send request';
      }

      toast.success("Request sent! You can now bid on this project.");

      // Remove from list
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to send request');
      toast.error(message);
    } finally {
      setRequestingId(null);
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
            onClick={() => navigate("/vendor/dashboard")}
            className="mb-4 gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Available Projects</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Discover new opportunities and request to bid</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
            <Search className="h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search for projects by title, description, or industry..."
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

        {/* Projects List */}
        <div>
          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-900 border-dashed">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No available projects found</p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{project.title}</h3>
                        <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                          {serviceCategories[project.service_category_id] || "Service"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-3">
                        {project.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <MapPin className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{project.project_city || "Multiple"}, {project.project_state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <DollarSign className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Budget</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Briefcase className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Posted</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col gap-3 shrink-0">
                      <Button
                        onClick={() => handleRequestToBid(project.id)}
                        disabled={requestingId === project.id}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 shadow-lg shadow-green-500/20 transition-all"
                      >
                        {requestingId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Request to Bid</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/vendor/lead/${project.id}`)}
                        className="h-12 border-slate-200 dark:border-slate-700"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
