import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

        if (!response.ok) {
          const result = await response.json();
          throw result.error || 'Project not found';
        }

        const projectData = await response.json();
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

  if (loading) {
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
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-green-100 text-green-800',
      in_review: 'bg-blue-100 text-blue-800',
      selected: 'bg-purple-100 text-purple-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/business/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 px-0"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="text-muted-foreground mt-1">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Badge */}
            <div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
              </span>
            </div>

            {/* Description */}
            {project.description && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
              </Card>
            )}

            {/* Requirements */}
            {project.special_requirements && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3">Special Requirements</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{project.special_requirements}</p>
              </Card>
            )}

            {/* Bids Received */}
            <div className="pt-4">
              <h2 className="text-2xl font-bold mb-6">Vendor Proposals</h2>
              {bids.length === 0 ? (
                <Card className="p-12 text-center bg-muted/20 border-dashed">
                  <p className="text-muted-foreground">No proposals received yet.</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/business/vendors')}
                    className="mt-4"
                  >
                    Browse & Invite Vendors
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => {
                    const isSelected = project.selected_vendor_id === bid.vendor_id;
                    return (
                      <Card key={bid.id} className={`p-6 transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold">{bid.vendor_profile?.company_name || 'Expert Vendor'}</h3>
                              {isSelected && (
                                <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase">
                                  Selected Vendor
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{bid.response_notes}</p>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Bid Amount</p>
                                <p className="font-bold text-lg text-primary">${bid.bid_amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Timeline</p>
                                <p className="font-semibold text-sm">{bid.proposed_timeline}</p>
                              </div>
                            </div>
                          </div>

                          {!project.selected_vendor_id ? (
                            <Button
                              onClick={() => handleAssignVendor(bid.vendor_id, bid.id)}
                              disabled={!!assigning}
                              className="bg-primary hover:bg-primary/90 font-bold"
                            >
                              {assigning === bid.vendor_id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept Proposal'}
                            </Button>
                          ) : isSelected && (
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                              <CheckCircle2 className="h-5 w-5" />
                              Assigned
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Messaging System */}
            {project.selected_vendor_id && (
              <div className="pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Messages</h2>
                </div>
                <ProjectMessages projectId={project.id} vendorId={project.selected_vendor_id} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Budget Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Budget</h3>
              {project.budget_min && project.budget_max ? (
                <p className="text-2xl font-bold">
                  ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
                </p>
              ) : (
                <p className="text-muted-foreground">Not specified</p>
              )}
            </Card>

            {/* Timeline Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Timeline</h3>
              {project.timeline_start && project.timeline_end ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Start</p>
                    <p className="font-medium">{new Date(project.timeline_start).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End</p>
                    <p className="font-medium">{new Date(project.timeline_end).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Not specified</p>
              )}
            </Card>

            {/* Location Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Location</h3>
              <p className="font-medium">
                {project.project_city}, {project.project_state} {project.project_zip}
              </p>
            </Card>

            {/* Company Size Card */}
            {project.business_size && (
              <Card className="p-6">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Company Size</h3>
                <p className="font-medium">{project.business_size}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
