import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

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
  created_at: string;
  updated_at: string;
  published_at: string;
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !projectId) {
      navigate('/business/dashboard');
      return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('business_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching project:', fetchError);
          setError('Project not found or you do not have permission to view it');
          setLoading(false);
          return;
        }

        setProject(data);
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load project');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId, navigate]);

  const handleDelete = async () => {
    if (!project || !window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('business_id', user?.id);

      if (deleteError) {
        throw deleteError;
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
