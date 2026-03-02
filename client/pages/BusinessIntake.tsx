import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Send,
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
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

Your goal is to have a natural conversation to understand the business's needs and help them submit a clear project request.

Use this 3-step flow (keep it concise and move one step at a time):

Step 1 — Industry & Location
- What industry are they in?
- What service do they need? (e.g., payroll, accounting, IT services, marketing, legal, construction, etc.)
- Where do they need the service? Ask for City + State + ZIP.
- Also ask the scope: City / Statewide / National / Remote.

Step 2 — Problem & Urgency
- What problem are they trying to solve?
- How urgent is this? Offer options: ASAP / Within 30 days / Within 90 days / Flexible
- What happens if this doesn’t get fixed?

Step 3 — Project Details
- Give the project a short title
- One-time project or ongoing?
- Company size (offer options): 1–10 / 10–50 / 50–200 / 200+
- Any specific requirements? (Certifications / Insurance / Compliance / Other notes)

After collecting the key details, summarize what you've learned and ask if they'd like to submit.

Be conversational, friendly, and efficient. Always respond in a concise, helpful manner.`;

export default function BusinessIntake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! Let’s get this scoped in a few quick steps. Step 1: What industry are you in, and what kind of service do you need?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice mode (browser native Web Speech API)
  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const voiceSupported = Boolean(SpeechRecognitionCtor) && typeof window !== 'undefined';
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setInterimTranscript('');

    try {
      // Call AI to get response
      const response = await fetch('/api/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          conversationHistory: messages.map((m) => ({
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

      setMessages((prev) => [...prev, assistantMessage]);

      // Update extracted project data
      if (data.extractedData) {
        setProjectData((prev) => ({
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
      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setIsListening(false);
    setInterimTranscript('');
  };

  const startListening = () => {
    if (!voiceSupported || isListening) return;

    const recognition = new (SpeechRecognitionCtor as any)();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = String(event.results[i][0]?.transcript || '');
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = async () => {
      setIsListening(false);
      recognitionRef.current = null;
      const text = finalTranscript.trim();
      finalTranscript = '';
      setInterimTranscript('');

      if (text) {
        // Put the transcript into the input so the user can review/edit,
        // then manually press Send.
        setInput(text);
      }
    };

    setIsListening(true);
    recognition.start();
  };

  const speak = (text: string) => {
    if (!autoSpeakEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
      try {
        window.speechSynthesis?.cancel?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoSpeakEnabled) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return;
    speak(last.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, autoSpeakEnabled]);

  const handleSubmitProject = async () => {
    if (!user) {
      setError('Please sign in again to submit your project');
      return;
    }

    if (!projectData.service_category || !projectData.title) {
      setError('Please provide at least a project title and service category');
      return;
    }

    if (!projectData.project_state || !projectData.project_zip) {
      setError('Please provide your project location (state + ZIP code)');
      return;
    }

    setSubmitting(true);
    try {
      // Create project via server API to bypass RLS recursion
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          title: projectData.title || 'Untitled Project',
          description: projectData.description || '',
          service_category: projectData.service_category,
          timeline_start: projectData.timeline_start,
          timeline_end: projectData.timeline_end,
          budget_min: projectData.budget_min,
          budget_max: projectData.budget_max,
          project_zip: projectData.project_zip,
          project_city: projectData.project_city,
          project_state: projectData.project_state?.toUpperCase(),
          business_size: projectData.business_size,
          special_requirements: projectData.special_requirements,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw result.error || 'Failed to submit project';
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

  const isProjectReady = Boolean(projectData.title && projectData.service_category && projectData.project_state && projectData.project_zip);

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
              <div className="flex-1 space-y-2">
                <Input
                  placeholder={
                    voiceInputEnabled
                      ? isListening
                        ? 'Listening…'
                        : 'Press the mic and speak…'
                      : 'Tell me about your project…'
                  }
                  value={interimTranscript ? `${input}${input ? ' ' : ''}${interimTranscript}` : input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isListening}
                  className="flex-1"
                />

                {voiceSupported ? (
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2"
                      onClick={() => setVoiceInputEnabled((v) => !v)}
                    >
                      {voiceInputEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      Voice input
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2"
                      onClick={() => setAutoSpeakEnabled((v) => !v)}
                    >
                      {autoSpeakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      Read replies
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Voice conversation isn’t supported in this browser.
                  </p>
                )}
              </div>

              {voiceSupported && voiceInputEnabled && (
                <Button
                  type="button"
                  variant={isListening ? 'destructive' : 'secondary'}
                  size="icon"
                  disabled={isLoading}
                  onClick={() => (isListening ? stopListening() : startListening())}
                  title={isListening ? 'Stop listening' : 'Start listening'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}

              <Button type="submit" disabled={isLoading || !input.trim() || isListening} size="icon">
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
                  {projectData.project_state || projectData.project_zip ? `${projectData.project_city ? `${projectData.project_city}, ` : ''}${projectData.project_state || ''}${projectData.project_zip ? ` ${projectData.project_zip}` : ''}`.trim() : 'Not specified yet'}
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
