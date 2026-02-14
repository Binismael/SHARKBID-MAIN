import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  profiles?: {
    company_name: string;
    contact_email: string;
    role: string;
  };
}

interface ProjectMessagesProps {
  projectId: string;
  vendorId?: string; // Optional vendorId to filter messages (required for business)
}

export default function ProjectMessages({ projectId, vendorId }: ProjectMessagesProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user || !projectId) return;

    try {
      const url = `/api/projects/${projectId}/messages${vendorId ? `?vendorId=${vendorId}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'x-user-id': user.id
        }
      });
      const result = await response.json();

      if (result.success) {
        setMessages(result.data);
      } else {
        setError(getErrorMessage(result.error || 'Failed to load messages'));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds (simplistic real-time)
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [projectId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !projectId || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          projectId,
          messageText: newMessage.trim(),
          vendorId // Include vendorId in the request
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages([...messages, result.data]);
        setNewMessage('');
      } else {
        setError(getErrorMessage(result.error || 'Failed to send message'));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-[650px] overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200/50">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">Project Workspace</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Direct Line
            </p>
          </div>
        </div>
        <div className="flex -space-x-2">
          <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
              <MessageCircle className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Initialize Conversation</h4>
            <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">Your secure workspace is ready. Send a message to begin coordination.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isSameSender = prevMsg?.sender_id === msg.sender_id;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col group",
                  isMe ? "items-end" : "items-start",
                  isSameSender ? "mt-1" : "mt-6"
                )}
              >
                {!isMe && !isSameSender && (
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2">
                    {msg.profiles?.company_name || 'Partner Account'}
                  </p>
                )}

                <div
                  className={cn(
                    "max-w-[80%] px-5 py-3.5 shadow-sm transition-all relative",
                    isMe
                      ? "bg-blue-600 text-white rounded-[2rem] rounded-tr-none shadow-blue-500/10 hover:shadow-blue-500/20"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-[2rem] rounded-tl-none border border-slate-100 dark:border-slate-700 hover:shadow-lg"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.message_text}</p>

                  <div className={cn(
                    "absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap py-1 px-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-2xl",
                    isMe ? "-left-12 translate-y-1/2" : "-right-12 translate-y-1/2"
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </div>
                </div>

                {!isSameSender || (idx === messages.length - 1) ? (
                  <p className={cn(
                    "text-[8px] mt-2 text-slate-400 font-black uppercase tracking-widest opacity-60",
                    isMe ? "mr-2 text-right" : "ml-2"
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all duration-300">
          <textarea
            placeholder="Write a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-5 text-sm min-h-[48px] max-h-[120px] font-medium placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !newMessage.trim()}
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 shrink-0 transition-transform active:scale-95"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 -rotate-12 translate-x-0.5" />}
          </Button>
        </form>
        {error && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-rose-500" />
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
