import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, XCircle, Building2, Mail, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export default function AdminBusinessDetail() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch business profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', businessId)
          .single();

        if (profileError) throw profileError;
        if (!profile) throw new Error('Business not found');
        setBusiness(profile);

        // Fetch business projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, status, created_at')
          .eq('business_id', profile.user_id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.warn('Error fetching projects:', projectsError);
        } else {
          setProjects(projectsData || []);
        }

        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load business details');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  const handleToggleApproval = async () => {
    if (!business) return;

    try {
      setUpdating(true);
      const newStatus = !business.is_approved;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_approved: newStatus })
        .eq('id', business.id);

      if (updateError) throw updateError;

      setBusiness({ ...business, is_approved: newStatus });
      toast.success(newStatus ? 'Business approved' : 'Business approval revoked');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to update business');
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-2xl mx-auto">
          <Button onClick={() => navigate('/admin/users')} variant="outline" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Button>
          <Card className="p-8 border-l-4 border-l-red-600">
            <AlertCircle className="h-6 w-6 text-red-600 mb-3" />
            <h2 className="text-lg font-bold">Error Loading Business</h2>
            <p className="text-slate-600 mt-2">{error || 'Business not found'}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <Button onClick={() => navigate('/admin/users')} variant="outline" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Business Details
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{business.company_name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Status and Actions */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {business.is_approved ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-200">Approved</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-200">Pending Approval</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleToggleApproval} 
              disabled={updating}
              variant={business.is_approved ? "outline" : "default"}
              className={!business.is_approved ? "bg-green-600 hover:bg-green-700 text-white" : "text-red-600 hover:bg-red-50"}
            >
              {business.is_approved ? (
                <><XCircle className="h-4 w-4 mr-2" /> Revoke Approval</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve Business</>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Business Info */}
            <div className="md:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" /> Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Contact Email</p>
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-slate-400" /> {business.contact_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Joined</p>
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-slate-400" /> {new Date(business.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Projects List */}
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" /> Projects
              </h3>
              
              {projects.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <p className="text-slate-500 italic">No projects posted by this business yet.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => (
                    <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{project.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Posted {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            project.status === 'open' ? 'bg-green-100 text-green-700' : 
                            project.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {project.status}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/business/project/${project.id}`)}
                            className="text-blue-600"
                          >
                            View
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
      </div>
    </div>
  );
}
