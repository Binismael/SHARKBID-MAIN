import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';

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
  const [showBidForm, setShowBidForm] = useState(false);

  // Form state
  const [bidAmount, setBidAmount] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [responseNotes, setResponseNotes] = useState('');

  useEffect(() => {
    if (!projectId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
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

        // Check for existing bid
        const { data: bidData } = await supabase
          .from('vendor_responses')
          .select('*')
          .eq('project_id', projectId)
          .eq('vendor_id', user.id)
          .single();

        if (bidData) {
          setExistingBid(bidData);
          setBidAmount(bidData.bid_amount.toString());
          setProposedTimeline(bidData.proposed_timeline || '');
          setResponseNotes(bidData.response_notes || '');
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
      if (existingBid) {
        // Update existing bid
        const { error: updateError } = await supabase
          .from('vendor_responses')
          .update({
            bid_amount: parseFloat(bidAmount),
            proposed_timeline: proposedTimeline,
            response_notes: responseNotes,
            updated_at: new Date(),
          })
          .eq('id', existingBid.id);

        if (updateError) throw updateError;
      } else {
        // Create new bid
        const { error: insertError } = await supabase
          .from('vendor_responses')
          .insert({
            project_id: projectId,
            vendor_id: user.id,
            bid_amount: parseFloat(bidAmount),
            proposed_timeline: proposedTimeline,
            response_notes: responseNotes,
            status: 'submitted',
          });

        if (insertError) throw insertError;

        // Update routing status
        await supabase
          .from('project_routing')
          .update({ status: 'bid_submitted' })
          .eq('project_id', projectId)
          .eq('vendor_id', user.id);
      }

      setShowBidForm(false);
      // Refresh data
      const { data: updatedBid } = await supabase
        .from('vendor_responses')
        .select('*')
        .eq('project_id', projectId)
        .eq('vendor_id', user.id)
        .single();

      setExistingBid(updatedBid);
    } catch (err) {
      const message = getErrorMessage(err || 'Failed to submit bid');
      setError(message);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => navigate('/vendor/dashboard')}
            variant="ghost"
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-1">{service?.name || 'Service'}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Project Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
          </Card>

          {/* Project Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Budget Range</p>
                <p className="text-lg font-semibold">
                  ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Location</p>
                <p className="text-lg font-semibold">
                  {project.project_city}, {project.project_state} {project.project_zip}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Timeline</p>
                <p className="text-lg font-semibold">
                  {project.timeline_start && project.timeline_end
                    ? `${project.timeline_start} to ${project.timeline_end}`
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase font-medium mb-1">Posted</p>
                <p className="text-lg font-semibold">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* Additional Details from AI Chat */}
          {project.project_details && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <div className="space-y-2 text-sm">
                {project.project_details.special_requirements && (
                  <div>
                    <p className="text-muted-foreground font-medium">Special Requirements</p>
                    <p>{project.project_details.special_requirements}</p>
                  </div>
                )}
                {project.project_details.business_size && (
                  <div>
                    <p className="text-muted-foreground font-medium">Client Company Size</p>
                    <p>{project.project_details.business_size} employees</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Bid Section */}
        <div>
          {existingBid ? (
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-semibold">Bid Submitted</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Bid Amount</p>
                  <p className="text-2xl font-bold">${existingBid.bid_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Proposed Timeline</p>
                  <p className="text-sm font-medium">{existingBid.proposed_timeline}</p>
                </div>
                {existingBid.response_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Notes</p>
                    <p className="text-sm">{existingBid.response_notes}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Status: <span className="font-medium capitalize">{existingBid.status}</span></p>
                  <Button
                    onClick={() => setShowBidForm(!showBidForm)}
                    variant="outline"
                    className="w-full"
                  >
                    {showBidForm ? 'Cancel Edit' : 'Edit Bid'}
                  </Button>
                </div>
              </div>

              {showBidForm && (
                <form onSubmit={handleSubmitBid} className="mt-6 pt-6 border-t space-y-4">
                  <div>
                    <label className="text-sm font-medium">Bid Amount ($) *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Proposed Timeline *</label>
                    <Input
                      placeholder="e.g., 2-3 weeks, 30 days"
                      value={proposedTimeline}
                      onChange={(e) => setProposedTimeline(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      placeholder="Tell the business about your approach..."
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background mt-1"
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Update Bid
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          ) : (
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Submit Your Bid</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Submit your bid to show the business you're interested in this project.
              </p>

              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Bid Amount ($) *</label>
                  <Input
                    type="number"
                    placeholder="Enter your bid amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="mt-1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Proposed Timeline *</label>
                  <Input
                    placeholder="e.g., 2-3 weeks, 30 days"
                    value={proposedTimeline}
                    onChange={(e) => setProposedTimeline(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    placeholder="Tell the business about your approach, experience, and why you're a good fit..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background mt-1"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Bid
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
