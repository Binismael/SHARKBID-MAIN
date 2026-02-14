import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  AlertCircle, 
  User, 
  Bot,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'react-router-dom';
import { getErrorMessage } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  initialMessage?: string;
  systemPrompt?: string;
  context?: string;
}

export function AIAssistant({
  initialMessage,
  systemPrompt,
  context
}: AIAssistantProps) {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine initial message based on path and role
  const getInitialContent = () => {
    if (initialMessage) return initialMessage;

    const path = location.pathname;

    if (path === '/signup') return "Hi! Need help choosing an account type or setting up your profile? I'm here to guide you through the registration process.";
    if (path === '/login') return "Welcome back! Having trouble logging in or need help with your account? Ask me anything.";
    if (path.startsWith('/vendor/onboarding')) return "I'm here to help you complete your creator profile. We can talk about your skills, rates, or portfolio!";
    if (path.startsWith('/business/intake')) return "I can help you describe your project perfectly so you get the best vendor matches.";

    if (userRole === 'business') return "Hi! Need help managing your projects or finding the right vendors? I'm your Sharkbid assistant.";
    if (userRole === 'vendor') return "Hi! Ready to find your next project? I can help you with bidding, profile updates, or payment questions.";

    return "Hi! I'm your Sharkbid assistant. How can I help you today?";
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getInitialContent(),
      timestamp: new Date(),
    }
  ]);

  // Reset messages when path changes significantly (e.g. going to onboarding)
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: getInitialContent(),
        timestamp: new Date(),
      }
    ]);
  }, [location.pathname, userRole]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHidden = ['/business/intake'].includes(location.pathname);

  if (isHidden) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const defaultSystemPrompt = `You are a helpful assistant for Sharkbid, a B2B marketplace connecting businesses with vendors.
Your current user is a ${userRole || 'visitor'}.
The current page is: ${location.pathname}.
Additional context: ${context || 'General help'}.

Your goal is to help the user navigate the platform, answer questions about account creation, project posting, bidding, and general platform usage.

If the user is at /signup:
- Explain the difference between Business (find vendors) and Vendor (bid on projects).
- Help them understand what information is required for each.

If the user is at /vendor/onboarding:
- Guide them through filling out their profile, rates, and portfolio.
- Explain that a complete profile gets better matches.

If the user is a Business (Client):
- Help them with account setup and project posting.
- Explain how the matching process works.

If the user is a Vendor (Creator):
- Help them with onboarding and profile completion.
- Explain how to find and bid on projects.

Be friendly, professional, and concise. Use markdown for formatting if helpful.`;

  const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
      const response = await fetch('/api/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: input,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: finalSystemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('AI Assistant Error:', err);

      const errorAssistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 animate-bounce"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 ease-in-out",
        isMinimized ? "h-14 w-64" : "h-[500px] w-[350px] sm:w-[400px]"
      )}
    >
      <Card className="flex-1 flex flex-col shadow-2xl border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold text-sm">Sharkbid Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-2",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' ? "bg-primary/10" : "bg-primary text-primary-foreground"
                  )}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card border border-border rounded-tl-none"
                    )}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <span className="text-[10px] opacity-50 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-none px-3 py-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-destructive/10 text-destructive text-[10px] px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 h-9 text-sm"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-9 w-9 shrink-0"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Powered by Sharkbid AI
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
