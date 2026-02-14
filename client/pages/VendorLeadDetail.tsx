import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, ArrowLeft, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import ProjectMessages from '@/components/ProjectMessages';

interface Project {
  id: string;
  title: string;
  description: string;
  service_category_id: string;
  budget_min: number;
  budget_max: number;
  project_zip: string;
  project_city: string;
  project_state: string;
  timeline_start?: string;
  timeline_end?: string;
  project_details?: any;
  status: string;
  selected_vendor_id?: string;
  created_at: string;
}

interface ExistingBid {
  id: string;
  bid_amount: number;
  proposed_timeline: string;
  response_notes: string;
  status: string;
}

interface ServiceCategory {
  name: string;
}

export default function VendorLeadDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [service, setService] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingBid, setExistingBid] = useState<ExistingBid | null>(null);
  const [hasMessages, setHasMessages] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  // Form state
  const [bidAmount, setBidAmount] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch project via server-side API to bypass RLS recursion
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

        // Fetch service category
        if (projectData.service_category_id) {
          const { data: categoryData } = await supabase
            .from('service_categories')
            .select('name')
            .eq('id', projectData.service_category_id)
            .single();

          setService(categoryData);
        }

        // Check for existing bid via server-side API to bypass RLS recursion
        const bidsResponse = await fetch('/api/projects/vendor-bids', {
          headers: {
            'x-vendor-id': user.id
          }
        });
        const bidsResult = await bidsResponse.json();

        if (bidsResult.success) {
          const bidData = bidsResult.data.find((b: any) => b.project_id === projectId);
          if (bidData) {
            setExistingBid(bidData);
            setBidAmount(bidData.bid_amount.toString());
            setProposedTimeline(bidData.proposed_timeline || '');
            setResponseNotes(bidData.response_notes || '');
          }
        }

        // Check for existing messages
        const msgsResponse = await fetch(`/api/projects/${projectId}/messages`, {
          headers: {
            'x-user-id': user.id
          }
        });
        const msgsResult = await msgsResponse.json();
        if (msgsResult.success && msgsResult.data && msgsResult.data.length > 0) {
          setHasMessages(true);
        }
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load project');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, user]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bidAmount || !proposedTimeline) {
      setError('Please fill in all required fields');
      return;
    }

    if (!projectId || !user) return;

    setSubmitting(true);
    setError(null);

    try {
      // Submit bid via server-side API to bypass RLS recursion
      const response = await fetch('/api/projects/submit-bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          vendorId: user.id,
          bidAmount: parseFloat(bidAmount),
          proposedTimeline,
          responseNotes,
          bidId: existingBid?.id
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || 'Failed to submit bid';
      }

      setShowBidForm(false);
      setExistingBid(result.data);
      toast.success(existingBid ? 'Bid updated successfully' : 'Bid submitted successfully');
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to submit bid');
      setError(message);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (action: 'decline' | 'complete') => {
    if (!project || !user || !projectId) return;

    const confirmMessage = action === 'decline'
      ? 'Are you sure you want to decline this lead? This will withdraw your bid if you have one.'
      : 'Are you sure you want to mark this project as completed?';

    if (!window.confirm(confirmMessage)) return;

    setUpdatingStatus(action);
    try {
      const response = await fetch('/api/projects/vendor-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          projectId,
          action
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw result.error || `Failed to ${action} project`;
      }

      toast.success(result.message);

      if (action === 'decline') {
        navigate('/vendor/dashboard');
      } else {
        setProject({ ...project, status: 'completed' });
      }
    } catch (err) {
      const message = getErrorMessage(err || `Failed to ${action} project`);
      toast.error(message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button onClick={() => navigate('/vendor/dashboard')} variant="outline" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Project not found</h2>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <Button
            onClick={() => navigate('/vendor/dashboard')}
            variant="ghost"
            size="sm"
            className="gap-2 mb-2 lg:mb-4 text-slate-500 hover:text-slate-900 px-0 hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Back to Dashboard</span>
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                {project.title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold uppercase tracking-widest border border-blue-100">
                  {service?.name || 'Lead Opportunity'}
                </span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Ref: {project.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {project.status === 'completed' ? (
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl border border-purple-100 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Project Completed
                </div>
              ) : project.selected_vendor_id === user.id ? (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Selected Partner
                </div>
              ) : (
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 font-bold text-xs uppercase tracking-widest">
                  Open Lead
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Project Briefing</h2>
              </div>
              <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10 font-medium">{project.description}</p>
              </Card>
            </section>

            {/* Project Specs */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Project Specifications</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Budget Range</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                  </p>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Location</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {project.project_city}, {project.project_state}
                  </p>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Desired Timeline</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {project.timeline_start && project.timeline_end
                      ? `${new Date(project.timeline_start).toLocaleDateString()} to ${new Date(project.timeline_end).toLocaleDateString()}`
                      : 'Flexible Timeline'}
                  </p>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Lead Since</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {new Date(project.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </Card>
              </div>
            </section>

            {/* Additional Intel */}
            {project.project_details && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Additional Intel</h2>
                </div>
                <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {project.project_details.special_requirements && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Special Requirements</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-4">{project.project_details.special_requirements}</p>
                      </div>
                    )}
                    {project.project_details.business_size && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Context</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">{project.project_details.business_size} Employee Org</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </section>
            )}

            {/* Messaging System */}
            {(existingBid || project.selected_vendor_id === user.id || hasMessages) && (
              <section className="pt-12 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Workspace Communication</h2>
                </div>
                <ProjectMessages projectId={project.id} />
              </section>
            )}
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-28 space-y-6">
              {/* Active Selection Status */}
              {project.selected_vendor_id === user.id && project.status !== 'completed' && (
                <Card className="p-8 border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-110" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-blue-100">Project Management</h3>
                   <p className="text-sm font-medium leading-relaxed mb-8 text-blue-50 opacity-90 relative z-10">
                     You are the lead partner. Use the tools below to manage project completion and communication.
                   </p>
                   <Button
                    onClick={() => handleStatusUpdate('complete')}
                    disabled={!!updatingStatus}
                    className="w-full bg-white text-blue-700 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-12 shadow-xl relative z-10"
                  >
                    {updatingStatus === 'complete' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Finish Project
                  </Button>
                </Card>
              )}

              {/* Status Section */}
              <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                {existingBid ? (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Active Proposal</h3>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 italic">
                        {existingBid.status}
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Submitted Amount</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">${existingBid.bid_amount.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Proposed Timeline</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{existingBid.proposed_timeline}</p>
                        </div>
                        {existingBid.response_notes && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Proposal Notes</p>
                            <p className="text-xs text-slate-500 italic leading-relaxed">"{existingBid.response_notes}"</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                        {project.status !== 'completed' && (
                          <>
                            <Button
                              onClick={() => setShowBidForm(!showBidForm)}
                              variant="outline"
                              className="w-full font-black uppercase text-[10px] tracking-widest h-11 border-slate-200"
                            >
                              {showBidForm ? 'Discard Changes' : 'Refine Proposal'}
                            </Button>

                            {project.selected_vendor_id !== user.id && (
                              <Button
                                onClick={() => handleStatusUpdate('decline')}
                                variant="ghost"
                                disabled={!!updatingStatus}
                                className="w-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest transition-all"
                              >
                                {updatingStatus === 'decline' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Withdraw Interest
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {showBidForm && (
                      <form onSubmit={handleSubmitBid} className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">New Amount ($)</label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              className="h-12 font-bold focus-visible:ring-blue-500/20 border-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">New Timeline</label>
                            <Input
                              placeholder="e.g., 2-3 weeks"
                              value={proposedTimeline}
                              onChange={(e) => setProposedTimeline(e.target.value)}
                              className="h-12 font-bold focus-visible:ring-blue-500/20 border-slate-200"
                            />
                          </div>
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest h-12 shadow-xl">
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Proposal'}
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2 leading-none">Submit Bid</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">Present your value proposition to this business client.</p>
                    </div>

                    <form onSubmit={handleSubmitBid} className="space-y-5">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block tracking-widest">Investment ($) *</label>
                          <Input
                            type="number"
                            placeholder="Enter your fee"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="h-12 font-bold border-slate-200 shadow-sm"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block tracking-widest">Timeline *</label>
                          <Input
                            placeholder="e.g., 30 days"
                            value={proposedTimeline}
                            onChange={(e) => setProposedTimeline(e.target.value)}
                            className="h-12 font-bold border-slate-200 shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block tracking-widest">Why us? *</label>
                          <textarea
                            placeholder="Describe your strategy..."
                            value={responseNotes}
                            onChange={(e) => setResponseNotes(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white dark:bg-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2">
                          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">{error}</p>
                        </div>
                      )}

                      <Button type="submit" disabled={submitting} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest h-12 shadow-2xl">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Proposal'}
                      </Button>

                      <Button
                        onClick={() => handleStatusUpdate('decline')}
                        variant="ghost"
                        disabled={!!updatingStatus}
                        className="w-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest"
                      >
                        {updatingStatus === 'decline' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Skip Lead
                      </Button>
                    </form>
                  </div>
                )}
              </Card>

              {/* Marketplace Tips */}
              <Card className="p-8 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mb-16 blur-3xl transition-all group-hover:scale-110" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-500">Marketplace Tips</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="h-1 w-4 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Accurate timelines often lead to higher selection rates.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-1 w-4 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Transparency in notes builds trust with clients.</p>
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
