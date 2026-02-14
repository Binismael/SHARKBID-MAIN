import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2, MessageSquare, Briefcase, TrendingUp, Clock, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import ProjectMessages from '@/components/ProjectMessages';

interface Project {
  id: string;
  title: string;
  description: string;
  service_category_id: string;
  budget_min: number;
  budget_max: number;
  timeline_start: string;
  timeline_end: string;
  project_city: string;
  project_state: string;
  project_zip: string;
  business_size: string;
  special_requirements: string;
  status: string;
  selected_vendor_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string;
}

interface Bid {
  id: string;
  vendor_id: string;
  bid_amount: number;
  proposed_timeline: string;
  response_notes: string;
  status: string;
  created_at: string;
  vendor_profile?: {
    company_name: string;
    contact_email: string;
  };
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) {
      navigate('/business/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch project via server API to bypass RLS recursion
        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            'x-user-id': user.id
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw result.error || 'Project not found';
        }

        const projectData = result;
        setProject(projectData);

        // Bids are already included in the response from handleGetProject
        setBids(projectData.vendor_responses || []);

        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load project');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, projectId, navigate]);

  const handleAssignVendor = async (vendorId: string, bidId?: string) => {
    if (!project || !window.confirm('Are you sure you want to assign this vendor to your project?')) {
      return;
    }

    try {
      setAssigning(vendorId);

      // Assign vendor via server API to bypass RLS recursion
      const response = await fetch('/api/projects/assign-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          projectId: project.id,
          vendorId,
          bidId
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || 'Failed to assign vendor';
      }

      toast.success('Vendor assigned successfully!');
      setProject({ ...project, selected_vendor_id: vendorId, status: 'selected' });
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to assign vendor');
      toast.error(message);
    } finally {
      setAssigning(null);
    }
  };

  const handleApprove = async () => {
    if (!project || !window.confirm('Are you sure you want to approve and complete this project?')) {
      return;
    }

    setApproving(true);
    try {
      const response = await fetch('/api/projects/vendor-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          projectId: project.id,
          action: 'approve'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || 'Failed to approve project';
      }

      toast.success('Project approved and completed!');
      setProject({ ...project, status: 'completed' });
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to approve project');
      toast.error(message);
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete project via server API to bypass RLS recursion
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || ''
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || 'Failed to delete project';
      }

      toast.success('Project deleted successfully');
      navigate('/business/dashboard');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to delete project');
      toast.error(message);
      console.error('Error deleting project:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <button
              onClick={() => navigate('/business/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 border-destructive/30 bg-destructive/10 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error || 'Project not found'}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      in_review: 'bg-blue-50 text-blue-700 border-blue-100',
      selected: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      completed: 'bg-purple-50 text-purple-700 border-purple-100',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/business/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-2 lg:mb-4 px-0 hover:bg-transparent"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Back to Dashboard</span>
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs font-medium text-slate-400">
                    Created {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {project.status === 'selected' && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                  onClick={handleApprove}
                  disabled={approving}
                >
                  {approving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-2" />
                      Approve & Complete
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" className="font-bold text-xs uppercase tracking-widest border-slate-200 dark:border-slate-800" disabled>
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Project Overview</h2>
              </div>
              <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-110" />
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10">{project.description || "No description provided."}</p>

                {project.special_requirements && (
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 relative z-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Requirements</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic">{project.special_requirements}</p>
                  </div>
                )}
              </Card>
            </section>

            {/* Bids Received */}
            <section className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Vendor Proposals</h2>
                </div>
                {bids.length > 0 && (
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase">
                    {bids.length} Received
                  </span>
                )}
              </div>

              {bids.length === 0 ? (
                <Card className="p-16 text-center bg-slate-50/30 dark:bg-slate-900/30 border-dashed border-2 border-slate-200 dark:border-slate-800">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Briefcase className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">No proposals yet</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-xs mx-auto">Vendors are currently reviewing your project. We'll notify you as soon as someone submits a bid.</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/business/vendors')}
                    className="font-bold text-xs uppercase tracking-widest px-8"
                  >
                    Browse & Invite Vendors
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => {
                    const isSelected = project.selected_vendor_id === bid.vendor_id;
                    return (
                      <Card key={bid.id} className={`p-0 overflow-hidden transition-all duration-300 hover:shadow-xl border-slate-200 dark:border-slate-800 ${isSelected ? 'ring-2 ring-blue-600 shadow-blue-500/10' : ''}`}>
                        <div className="p-6 lg:p-8">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl shadow-inner">
                                  {bid.vendor_profile?.company_name?.[0] || 'V'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">{bid.vendor_profile?.company_name || 'Expert Vendor'}</h3>
                                    {isSelected && (
                                      <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1 font-medium">{bid.vendor_profile?.contact_email}</p>
                                </div>
                              </div>

                              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                                "{bid.response_notes || "No notes provided with this bid."}"
                              </p>

                              <div className="flex items-center gap-8 pt-2">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment</p>
                                  <p className="font-black text-xl text-blue-600 tracking-tighter mt-1">${bid.bid_amount.toLocaleString()}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed Time</p>
                                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">{bid.proposed_timeline}</p>
                                </div>
                              </div>
                            </div>

                            <div className="lg:text-right">
                              {!project.selected_vendor_id ? (
                                <Button
                                  onClick={() => handleAssignVendor(bid.vendor_id, bid.id)}
                                  disabled={!!assigning}
                                  className="w-full lg:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-bold uppercase text-[10px] tracking-[0.2em] px-8 h-12 shadow-xl"
                                >
                                  {assigning === bid.vendor_id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept Proposal'}
                                </Button>
                              ) : isSelected && (
                                <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="font-bold text-xs uppercase tracking-widest tracking-tighter">Project Active</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Messaging System */}
            {(project.selected_vendor_id || userRole === 'admin') && (
              <section className="pt-12 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    {userRole === 'admin' ? 'Project Monitoring Room' : 'Workspace Messages'}
                  </h2>
                </div>
                <ProjectMessages
                  projectId={project.id}
                  vendorId={userRole === 'admin' ? undefined : (project.selected_vendor_id || undefined)}
                />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-28 space-y-6">
              {/* Main Info Sidebar Card */}
              <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8 bg-white dark:bg-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full -mr-12 -mt-12" />

                {/* Budget */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Investment Range</h3>
                  </div>
                  {project.budget_min && project.budget_max ? (
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                      ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-slate-400 font-medium italic">Unspecified Budget</p>
                  )}
                </div>

                {/* Timeline */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Expected Timeline</h3>
                  </div>
                  {project.timeline_start && project.timeline_end ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">{new Date(project.timeline_start).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">End Date</p>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">{new Date(project.timeline_end).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-medium italic">Unspecified Timeline</p>
                  )}
                </div>

                {/* Location */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Project Location</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                      {project.project_city ? `${project.project_city}, ` : ''}{project.project_state} {project.project_zip}
                    </p>
                  </div>
                </div>

                {/* Company Size */}
                {project.business_size && (
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Organization</h3>
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 tracking-tight">{project.business_size} Employees</p>
                  </div>
                )}
              </Card>

              {/* Quick Actions / Tips */}
              <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Pro Tips</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 items-start">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">Selecting a vendor will automatically notify others that the position is filled.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">Use the Workspace Messages to coordinate delivery and milestones.</p>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
