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
        setError(result.error || 'Failed to load messages');
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
        setError(result.error || 'Failed to send message');
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
    <Card className="flex flex-col h-[600px] overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Project Messages</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Direct Communication</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
              <User className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation.</p>
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
                  "flex flex-col",
                  isMe ? "items-end" : "items-start",
                  isSameSender ? "mt-1" : "mt-4"
                )}
              >
                {!isMe && !isSameSender && (
                  <p className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 tracking-tight">
                    {msg.profiles?.company_name || 'Partner'}
                  </p>
                )}

                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2.5 shadow-sm transition-all hover:shadow-md",
                    isMe
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-none"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                </div>

                {!isSameSender || (idx === messages.length - 1) ? (
                  <p className={cn(
                    "text-[9px] mt-1 text-slate-400 font-medium",
                    isMe ? "mr-1" : "ml-1"
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

      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm min-h-[40px] max-h-[120px]"
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
            className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-[10px] text-red-500 text-center font-medium">{error}</p>
        )}
      </div>
    </Card>
  );
}
