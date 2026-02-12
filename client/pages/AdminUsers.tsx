import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Check, X, Eye, Star } from "lucide-react";
import { getCreatorProfiles, getUserProfiles, updateCreatorStatus } from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";

interface Creator {
  id: string;
  user_profiles?: { name: string; email: string };
  bio?: string;
  skills?: string[];
  status: "pending" | "approved" | "rejected";
  portfolio_links?: string[];
  day_rate?: number;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"creators" | "clients">("creators");
  const [searchCreators, setSearchCreators] = useState("");
  const [searchClients, setSearchClients] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creatorsData, clientsData] = await Promise.all([
          getCreatorProfiles().catch((err) => {
            console.error("Error fetching creators:", err);
            return [];
          }),
          getUserProfiles("client").catch((err) => {
            console.error("Error fetching clients:", err);
            return [];
          }),
        ]);
        setCreators(creatorsData || []);
        setClients(clientsData || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-accent/20 text-accent";
      case "approved":
        return "bg-secondary/20 text-secondary";
      case "active":
        return "bg-secondary/20 text-secondary";
      case "rejected":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "essential":
        return "bg-muted text-muted-foreground";
      case "standard":
        return "bg-accent/20 text-accent";
      case "visionary":
        return "bg-secondary/20 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredCreators = creators.filter((c) => {
    const name = c.user_profiles?.name || "";
    const email = c.user_profiles?.email || "";
    return (
      name.toLowerCase().includes(searchCreators.toLowerCase()) ||
      email.toLowerCase().includes(searchCreators.toLowerCase())
    );
  });

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchClients.toLowerCase()) ||
      c.email.toLowerCase().includes(searchClients.toLowerCase())
  );

  const handleApproveCreator = async (creatorId: string) => {
    try {
      await updateCreatorStatus(creatorId, "approved");
      setCreators(
        creators.map((c) =>
          c.id === creatorId ? { ...c, status: "approved" } : c
        )
      );
    } catch (error) {
      console.error("Error approving creator:", error);
      alert("Failed to approve creator");
    }
  };

  const handleRejectCreator = async (creatorId: string) => {
    try {
      await updateCreatorStatus(creatorId, "rejected");
      setCreators(
        creators.map((c) =>
          c.id === creatorId ? { ...c, status: "rejected" } : c
        )
      );
    } catch (error) {
      console.error("Error rejecting creator:", error);
      alert("Failed to reject creator");
    }
  };

  return (
    <DashboardLayout role="admin" userName={user?.email || "Admin"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage creators and clients ({creators.length} creators, {clients.length} clients)
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab("creators")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === "creators"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Creators {creators.filter((c) => c.status === "pending").length > 0 && (
              <span className="ml-2 bg-destructive text-white text-xs rounded-full px-2 py-1">
                {creators.filter((c) => c.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === "clients"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Clients
          </button>
        </div>

        {/* Creators Tab */}
        {activeTab === "creators" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search creators by name or email..."
                value={searchCreators}
                onChange={(e) => setSearchCreators(e.target.value)}
                className="max-w-md"
              />
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading creators...</p>
            ) : filteredCreators.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    {creators.length === 0
                      ? "No creators yet."
                      : "No creators match your search."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCreators.map((creator) => {
                  const name = creator.user_profiles?.name || "Unknown Creator";
                  const email = creator.user_profiles?.email || "";
                  const portfolio = creator.portfolio_links?.[0] || "";
                  return (
                    <Card key={creator.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {email}
                              {portfolio && ` • Portfolio: ${portfolio}`}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              {creator.skills?.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-xs bg-muted px-2 py-1 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Applied: {new Date(creator.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium px-3 py-1 rounded ${getStatusColor(
                                creator.status
                              )}`}
                            >
                              {creator.status.charAt(0).toUpperCase() +
                                creator.status.slice(1)}
                            </span>

                            {creator.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Approve"
                                  onClick={() => handleApproveCreator(creator.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="Reject"
                                  onClick={() => handleRejectCreator(creator.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search clients by name or email..."
                value={searchClients}
                onChange={(e) => setSearchClients(e.target.value)}
                className="max-w-md"
              />
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading clients...</p>
            ) : filteredClients.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    {clients.length === 0
                      ? "No clients yet."
                      : "No clients match your search."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <Card key={client.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {client.email}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Joined: {new Date(client.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-muted-foreground">
                              Role: {client.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
