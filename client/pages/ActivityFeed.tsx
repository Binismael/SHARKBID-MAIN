import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Activity, Code2, FileUp, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getActivityFeed } from "@/lib/notification-service";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export default function ActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [user?.id]);

  const loadActivities = async () => {
    if (!user?.id) return;
    setLoading(true);
    const result = await getActivityFeed(user.id, 50);
    if (result.success) {
      setActivities(result.activities);
    }
    setLoading(false);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Code2 className="h-5 w-5 text-accent" />;
      case "uploaded":
        return <FileUp className="h-5 w-5 text-secondary" />;
      case "approved":
      case "completed":
        return <CheckCircle className="h-5 w-5 text-secondary" />;
      case "paid":
        return <DollarSign className="h-5 w-5 text-secondary" />;
      case "flagged":
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "approved":
      case "completed":
      case "paid":
        return "border-l-secondary";
      case "rejected":
      case "flagged":
        return "border-l-destructive";
      default:
        return "border-l-accent";
    }
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    const actionText =
      {
        created: "Created",
        updated: "Updated",
        deleted: "Deleted",
        uploaded: "Uploaded",
        approved: "Approved",
        rejected: "Rejected",
        completed: "Completed",
        paid: "Marked as paid",
        flagged: "Flagged",
      }[activity.action] || activity.action;

    const entityText = activity.entity_type.charAt(0).toUpperCase() + activity.entity_type.slice(1);

    return `${actionText} ${entityText}`;
  };

  return (
    <DashboardLayout role="client" userName={user?.email || "User"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Activity Feed
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent activities and updates
          </p>
        </div>

        {/* Activities Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2 font-medium">No activities yet</p>
            <p className="text-sm text-muted-foreground">
              Your activities will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card
                key={activity.id}
                className={`border-l-4 hover:shadow-lg transition-all duration-300 ${getActivityColor(
                  activity.action
                )}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getActivityIcon(activity.action)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {formatActivityMessage(activity)}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground">
                                {key}:
                              </span>
                              <span className="ml-1 font-medium">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(activity.created_at).toLocaleDateString()} at{" "}
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                      {activity.entity_type}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
