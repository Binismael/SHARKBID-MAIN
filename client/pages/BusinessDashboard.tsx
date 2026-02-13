import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, BarChart3, TrendingUp, AlertCircle, Loader2, Clock, CheckCircle2, MessageSquare, Eye, LogOut, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
  vendor_response_count?: number;
}

export default function BusinessDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('business_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        const message = getErrorMessage(err || 'Failed to load projects');
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

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

  const totalBids = projects.reduce((sum, p) => sum + (p.vendor_response_count || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: BarChart3,
      color: 'from-blue-600 to-blue-400',
      description: `${completedProjects} completed`,
    },
    {
      label: 'Active Bids',
      value: totalBids,
      icon: TrendingUp,
      color: 'from-green-600 to-green-400',
      description: `${projects.filter(p => p.status === 'open').length} open projects`,
    },
    {
      label: 'In Review',
      value: projects.filter(p => p.status === 'in_review').length,
      icon: Clock,
      color: 'from-orange-600 to-orange-400',
      description: 'Awaiting decisions',
    },
  ];

  const recentProjects = projects.slice(0, 3);
  const projectsNeedingAttention = projects.filter(p => p.status === 'in_review' || p.status === 'open').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between gap-8">
            {/* Left Side - Title */}
            <div className="flex-1">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground font-medium">Welcome back</p>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Project Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                You have <span className="font-semibold text-foreground">{projectsNeedingAttention}</span> projects that need your attention
              </p>
            </div>

            {/* Right Side - Actions and User Menu */}
            <div className="flex gap-2 items-center ml-8">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Website
              </Button>
              <Button
                onClick={() => navigate('/business/projects/create')}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <Button
                onClick={() => navigate('/business/intake')}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className="h-4 w-4" />
                AI Assistant
              </Button>

              {/* User Menu */}
              <div className="flex items-center gap-3 ml-6 pl-6 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Logout"
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className={`p-6 border-0 bg-gradient-to-br ${stat.color} text-white overflow-hidden relative`}>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                      <p className="text-4xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <Icon className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-white/70 text-sm">{stat.description}</p>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-10">
                  <Icon className="h-24 w-24" />
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

        {/* Projects List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Projects</h2>

          {loading ? (
            <Card className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
          ) : projects.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-muted/20 to-muted/5">
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Create Your First Project</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Get started by creating a project. Choose between our smart form or have a conversation with our AI assistant to describe your project.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  onClick={() => navigate('/business/projects/create')}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Traditional Form
                </Button>
                <Button
                  onClick={() => navigate('/business/intake')}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                >
                  <MessageSquare className="h-4 w-4" />
                  AI Assistant
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-200 group"
                  onClick={() => navigate(`/business/project/${project.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                          {project.title}
                        </h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${getStatusColor(project.status)}`}>
                          {project.status === 'open' && <span className="inline-block w-2 h-2 bg-current rounded-full mr-1.5"></span>}
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>

                      {/* Meta Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Budget */}
                        {project.budget_min && project.budget_max && (
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Budget</p>
                            <p className="text-sm font-semibold">${project.budget_min.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">to ${project.budget_max.toLocaleString()}</p>
                          </div>
                        )}

                        {/* Posted Date */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Posted</p>
                          <p className="text-sm font-semibold">{new Date(project.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{Math.ceil((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
                        </div>

                        {/* Bids */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Bids Received</p>
                          <p className="text-sm font-semibold">{project.vendor_response_count || 0}</p>
                          <p className="text-xs text-muted-foreground">vendor proposals</p>
                        </div>

                        {/* Location */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Location</p>
                          <p className="text-sm font-semibold">{project.project_state}</p>
                          <p className="text-xs text-muted-foreground truncate">{project.project_city}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Quick Actions */}
                    <div className="flex flex-col items-center gap-3 ml-4">
                      <div className="text-center">
                        <MessageSquare className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                        <p className="text-2xl font-bold text-primary">{project.vendor_response_count || 0}</p>
                        <p className="text-xs text-muted-foreground">responses</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/business/project/${project.id}`);
                        }}
                        className="mt-2"
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
