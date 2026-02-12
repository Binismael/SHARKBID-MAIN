import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Shield, AlertCircle, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getAllUserBlocks, unblockUser, getAuditLogs } from "@/lib/admin-controls-service";

interface UserBlock {
  id: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
  expires_at?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  description?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminControls() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"blocks" | "logs">("blocks");
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    const [blocksResult, logsResult] = await Promise.all([
      getAllUserBlocks(),
      getAuditLogs({ limit: 50 }),
    ]);

    if (blocksResult.success) {
      setBlocks(blocksResult.blocks);
    }
    if (logsResult.success) {
      setLogs(logsResult.logs);
    }
    setLoading(false);
  };

  const handleUnblock = async (userId: string) => {
    if (!window.confirm("Are you sure you want to unblock this user?")) return;

    const result = await unblockUser(userId);
    if (result.success) {
      setBlocks((prev) => prev.filter((b) => b.user_id !== userId));
    }
  };

  const filteredBlocks = blocks.filter((block) =>
    block.user?.email?.includes(searchUser.toLowerCase()) ||
    block.user?.name?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredLogs = logs.filter((log) =>
    log.user?.email?.includes(searchUser.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <DashboardLayout role="admin" userName={user?.email || "Admin"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Admin Controls
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Manage user blocks, permissions, and audit logs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("blocks")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "blocks"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted text-foreground"
            }`}
          >
            Blocked Users ({blocks.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "logs"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted text-foreground"
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search by user email or name..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="pl-4"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : activeTab === "blocks" ? (
          <div className="space-y-4">
            {filteredBlocks.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No blocked users</p>
              </div>
            ) : (
              filteredBlocks.map((block) => (
                <Card key={block.id} className="border-l-4 border-l-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {block.user?.name} ({block.user?.email})
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {block.reason}
                        </p>
                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                          <span>
                            Blocked:{" "}
                            {new Date(block.created_at).toLocaleDateString()}
                          </span>
                          {block.expires_at && (
                            <span>
                              Expires:{" "}
                              {new Date(block.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUnblock(block.user_id)}
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Unblock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No audit logs</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          <span className="text-accent capitalize">{log.action}</span>{" "}
                          <span className="text-muted-foreground">
                            {log.entity_type}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.user?.name} ({log.user?.email})
                        </p>
                        {log.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                        {log.entity_type}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
