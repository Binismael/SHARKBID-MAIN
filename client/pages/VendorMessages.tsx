import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Loader2, Inbox, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';

interface Thread {
  id: string;
  title: string;
  description: string;
  status: string;
  bid_status: string;
  last_message_at?: string;
}

export default function VendorMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchThreads = async () => {
      try {
        setLoading(true);
        
        // 1. Get routed leads
        const routedResponse = await fetch('/api/projects/routed', {
          headers: { 'x-user-id': user.id }
        });
        const routedResult = await routedResponse.json();

        // 2. Get bids
        const bidsResponse = await fetch('/api/projects/vendor-bids', {
          headers: { 'x-vendor-id': user.id }
        });
        const bidsResult = await bidsResponse.json();

        if (routedResult.success && bidsResult.success) {
          const bidMap = new Map(bidsResult.data.map((b: any) => [b.project_id, b.status]));
          
          const threadData = routedResult.data.map((item: any) => ({
            id: item.projects.id,
            title: item.projects.title,
            description: item.projects.description,
            status: item.projects.status,
            bid_status: bidMap.get(item.projects.id) || 'no_bid'
          }));

          setThreads(threadData);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => navigate('/vendor/dashboard')}
            variant="ghost"
            size="sm"
            className="mb-4 gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Inbox className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Messages Inbox</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card className="p-8 border-red-200 bg-red-50 text-red-700 text-center">
            <p>{error}</p>
          </Card>
        ) : threads.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-2 text-slate-400">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No active threads</h3>
            <p className="mt-2">Threads will appear here once you're routed to projects or submit bids.</p>
          </Card>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className="p-6 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                onClick={() => navigate(`/vendor/lead/${thread.id}`)}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{thread.title}</h3>
                      {thread.bid_status === 'accepted' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Active Project
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{thread.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                      <MessageSquare className="h-4 w-4" />
                      Open Inbox
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
