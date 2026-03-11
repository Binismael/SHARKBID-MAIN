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

Your goal is to have a natural, friendly conversation to understand their needs and help them describe their project for vendors.

Gather information naturally about:
- Service type (payroll, accounting, IT, marketing, legal, construction, cleaning, HVAC, electrical, etc.)
- Location (city/state)
- The problem they're solving
- Timeline/urgency (ASAP / within 30 days / within 90 days / flexible)
- Project title or description
- One-time or ongoing work
- Company size (ballpark estimate)
- Special requirements (certifications, insurance, compliance, etc.)

Guidelines:
- Ask questions naturally and conversationally, NOT as a rigid checklist
- Ask only 1-2 questions per message
- Keep responses to 1-3 sentences max
- Be friendly and encouraging
- Don't repeat questions already answered
- Move the conversation forward naturally

When you have the essentials (service, location, problem, timeline), provide a brief summary and let them know they can submit. If they're ready to submit, direct them to click the submit button on the right.`;

export default function BusinessIntake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you describe your project. What kind of service do you need help with?",
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
  const keepListeningRef = useRef(false);

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
    const fullText = `${input} ${interimTranscript}`.trim();
    if (isListening) stopListening();
    setInput(fullText);
    await sendMessage(fullText);
  };

  const stopListening = () => {
    keepListeningRef.current = false;
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

    keepListeningRef.current = true;

    const recognition = new (SpeechRecognitionCtor as any)();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = String(event.results[i][0]?.transcript || '').trim();
        if (!transcript) continue;

        if (event.results[i].isFinal) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          interim += (interim ? ' ' : '') + transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setInterimTranscript('');

      if (keepListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
          return;
        } catch {
          // fall through
        }
      }

      setIsListening(false);
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

    if (!projectData.project_state || (!projectData.project_zip && !projectData.project_city)) {
      setError('Please provide your project location (at least state, and either city or ZIP code)');
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

  const isProjectReady = Boolean(
    projectData.title &&
      projectData.service_category &&
      projectData.project_state &&
      (projectData.project_zip || projectData.project_city)
  );

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
                      onClick={() => {
                        setVoiceInputEnabled((v) => {
                          const next = !v;
                          if (!next) stopListening();
                          return next;
                        });
                      }}
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
                    Voice conversation isn't supported in this browser.
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

              <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Project Summary Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-4">Project Summary</h2>
            <div className="space-y-3 text-sm">
              {projectData.service_category && (
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{projectData.service_category}</p>
                </div>
              )}
              {projectData.title && (
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium">{projectData.title}</p>
                </div>
              )}
              {projectData.description && (
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium text-xs">{projectData.description}</p>
                </div>
              )}
              {(projectData.project_state || projectData.project_city || projectData.project_zip) && (
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[projectData.project_city, projectData.project_state, projectData.project_zip]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
              {projectData.budget_min || projectData.budget_max ? (
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    ${projectData.budget_min?.toLocaleString() || '0'}
                    {projectData.budget_max && projectData.budget_max !== projectData.budget_min
                      ? ` - $${projectData.budget_max.toLocaleString()}`
                      : ''}
                  </p>
                </div>
              ) : null}
              {projectData.business_size && (
                <div>
                  <p className="text-muted-foreground">Company Size</p>
                  <p className="font-medium">{projectData.business_size}</p>
                </div>
              )}
            </div>

            {isProjectReady ? (
              <Button
                onClick={handleSubmitProject}
                disabled={submitting}
                className="w-full mt-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit Project
                  </>
                )}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-4">
                Keep chatting — once you provide a service category, project title, and location, you'll be able to submit.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
