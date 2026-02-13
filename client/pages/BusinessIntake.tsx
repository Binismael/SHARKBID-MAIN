import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectData {
  service_category?: string;
  title?: string;
  description?: string;
  timeline_start?: string;
  timeline_end?: string;
  budget_min?: number;
  budget_max?: number;
  business_size?: string;
  project_zip?: string;
  project_city?: string;
  project_state?: string;
  special_requirements?: string;
}

const SYSTEM_PROMPT = `You are a helpful project intake assistant for Sharkbid, a B2B marketplace connecting businesses with vendors.

Your goal is to have a natural conversation to understand the business's project needs and help them submit a clear project request.

Guide the conversation to collect:
1. What service they need (e.g., payroll, accounting, IT services, construction, etc.)
2. Project title and description
3. Timeline (start and end dates)
4. Budget range
5. Company size (number of employees)
6. Project location (ZIP code, city, state)
7. Any special requirements or preferences

After gathering these details, summarize what you've learned and ask if they'd like to proceed.

Be conversational, friendly, and efficient. Extract information naturally from what they share.
Always respond in a concise, helpful manner.`;

export default function BusinessIntake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you describe your project so we can match you with the right vendors. What kind of service are you looking for today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Call AI to get response
      const response = await fetch('/api/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: input,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw errorData.error || errorData.message || `Server error: ${response.status}`;
        } catch (e) {
          if (e instanceof Error || typeof e === 'string' || (typeof e === 'object' && e !== null)) {
            throw e;
          }
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Invalid response from AI service');
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update extracted project data
      if (data.extractedData) {
        setProjectData(prev => ({
          ...prev,
          ...data.extractedData,
        }));
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err || 'An error occurred while getting AI response');
      setError(errorMessage);
      console.error('AI Intake Error:', err);

      // Add error message to chat
      const errorAssistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try again or contact support if the problem persists.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!user || !projectData.title || !projectData.service_category) {
      setError('Please provide at least a project title and service category');
      return;
    }

    setSubmitting(true);
    try {
      // Get service category ID
      const { data: categoryData } = await supabase
        .from('service_categories')
        .select('id')
        .eq('name', projectData.service_category)
        .single();

      if (!categoryData) {
        throw new Error('Invalid service category');
      }

      // Create project in Supabase
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          business_id: user.id,
          title: projectData.title || 'Untitled Project',
          description: projectData.description || '',
          service_category_id: categoryData.id,
          project_details: projectData,
          timeline_start: projectData.timeline_start,
          timeline_end: projectData.timeline_end,
          budget_min: projectData.budget_min,
          budget_max: projectData.budget_max,
          project_zip: projectData.project_zip,
          project_city: projectData.project_city,
          project_state: projectData.project_state,
          status: 'draft',
        })
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

      // Log activity
      await supabase
        .from('project_activity')
        .insert({
          project_id: project.id,
          user_id: user.id,
          action: 'created',
          details: { source: 'ai_intake_chat' },
        });

      // Publish the project (triggers lead routing)
      const publishResponse = await fetch('/api/projects/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!publishResponse.ok) {
        throw new Error('Failed to publish project');
      }

      // Redirect to dashboard
      navigate(`/business/dashboard`, { replace: true });
    } catch (err) {
      const errorMessage = getErrorMessage(err || 'Failed to submit project');
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isProjectReady = projectData.title && projectData.service_category && projectData.project_zip;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/business/dashboard")}
            className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Describe Your Project</h1>
          <p className="text-muted-foreground">Chat with our AI assistant to create a project that vendors can bid on</p>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/30">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border border-border rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="bg-card border border-border rounded-lg rounded-bl-none px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="border-t border-border bg-destructive/10 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="border-t border-border p-4 flex gap-2">
              <Input
                placeholder="Tell me about your project..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Project Summary Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Project Summary</h2>
            <div className="space-y-3">
              {/* Service Category */}
              <div>
                <label className="text-xs text-muted-foreground uppercase font-medium">Service</label>
                <p className="text-sm font-medium">
                  {projectData.service_category || 'Not specified yet'}
                </p>
              </div>

              {/* Project Title */}
              <div>
                <label className="text-xs text-muted-foreground uppercase font-medium">Title</label>
                <p className="text-sm font-medium">
                  {projectData.title || 'Not specified yet'}
                </p>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs text-muted-foreground uppercase font-medium">Budget</label>
                <p className="text-sm font-medium">
                  {projectData.budget_min && projectData.budget_max
                    ? `$${projectData.budget_min.toLocaleString()} - $${projectData.budget_max.toLocaleString()}`
                    : 'Not specified yet'}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-muted-foreground uppercase font-medium">Location</label>
                <p className="text-sm font-medium">
                  {projectData.project_zip ? `${projectData.project_city}, ${projectData.project_state} ${projectData.project_zip}` : 'Not specified yet'}
                </p>
              </div>

              {/* Timeline */}
              <div>
                <label className="text-xs text-muted-foreground uppercase font-medium">Timeline</label>
                <p className="text-sm font-medium">
                  {projectData.timeline_start && projectData.timeline_end
                    ? `${projectData.timeline_start} to ${projectData.timeline_end}`
                    : 'Not specified yet'}
                </p>
              </div>
            </div>

            {/* Readiness Indicator */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                {isProjectReady ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Ready to submit</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">Needs more info</span>
                  </>
                )}
              </div>
              <Button
                onClick={handleSubmitProject}
                disabled={!isProjectReady || submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Project'
                )}
              </Button>
            </div>
          </Card>

          {/* Tips Card */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <h3 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-200">💡 Tips for best results:</h3>
            <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-300">
              <li>Be specific about your project scope</li>
              <li>Mention any must-have features or requirements</li>
              <li>Provide accurate timeline expectations</li>
              <li>Include your budget range if possible</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
