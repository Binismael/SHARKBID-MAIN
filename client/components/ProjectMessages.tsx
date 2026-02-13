import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
    <Card className="flex flex-col h-[500px] overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Messages</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <User className="h-12 w-12 mb-2" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[10px] font-bold uppercase mb-1 opacity-70">
                      {msg.profiles?.company_name || 'Partner'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  <p className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t bg-card flex gap-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-[10px] text-center border-t border-destructive/20">
          {error}
        </div>
      )}
    </Card>
  );
}
