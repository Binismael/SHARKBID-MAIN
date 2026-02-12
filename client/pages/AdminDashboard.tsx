import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, DollarSign, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats } from "@/lib/admin-service";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSection } from "@/components/ui/dashboard-section";

interface Widget {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data || {});
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Set default stats to avoid blank page
        setStats({
          totalProjects: 0,
          totalCreators: 0,
          totalCompanies: 0,
          pendingPayments: 0,
          totalPendingAmount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const widgets: Widget[] = [
    {
      title: "Active Projects",
      value: stats?.totalProjects?.toString() || "0",
      description: "Across all clients",
      icon: <FileText className="h-5 w-5" />,
      trend: stats?.totalProjects ? "+3 this week" : "No projects yet",
    },
    {
      title: "Total Creators",
      value: stats?.totalCreators?.toString() || "0",
      description: "Approved & active",
      icon: <Users className="h-5 w-5" />,
      trend: stats?.totalCreators ? "+2 pending" : "No creators yet",
    },
    {
      title: "Pending Payments",
      value: `$${stats?.totalPendingAmount?.toLocaleString("en-US", { minimumFractionDigits: 0 }) || "0"}`,
      description: "Ready to process",
      icon: <DollarSign className="h-5 w-5" />,
      trend: `${stats?.pendingPayments || 0} invoices`,
    },
    {
      title: "Active Clients",
      value: stats?.totalCompanies?.toString() || "0",
      description: "With active projects",
      icon: <Users className="h-5 w-5" />,
      trend: stats?.totalCompanies ? "Growing" : "No clients yet",
    },
  ];

  const recentActivities = [
    {
      type: "project",
      description: "Dashboard initialized with real data",
      time: "Just now",
    },
    {
      type: "creator",
      description: "Creator management system ready for approvals",
      time: "Ready",
    },
    {
      type: "payment",
      description: "Payment processing available",
      time: "Ready",
    },
    {
      type: "delivery",
      description: "Project monitoring active",
      time: "Ready",
    },
  ];

  return (
    <DashboardLayout role="admin" userName="Alex Chen">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Control Tower</h1>
          <p className="text-muted-foreground">
            System overview and operational controls
          </p>
        </div>

        {/* Control Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Active Projects"
            value={stats?.totalProjects || 0}
            subtext="Across all clients"
            variant="accent"
          />
          <StatCard
            icon={Users}
            label="Total Creators"
            value={stats?.totalCreators || 0}
            subtext="Approved & active"
            variant="secondary"
          />
          <StatCard
            icon={DollarSign}
            label="Pending Payments"
            value={`$${(stats?.totalPendingAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
            subtext={`${stats?.pendingPayments || 0} invoices`}
            variant="destructive"
          />
          <StatCard
            icon={Users}
            label="Active Clients"
            value={stats?.totalCompanies || 0}
            subtext="With active projects"
            variant="default"
          />
        </div>

        {/* Burn Rate by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { tier: "Essential", amount: "$8,400", projects: 12, color: "bg-blue-100" },
                { tier: "Standard", amount: "$18,600", projects: 8, color: "bg-green-100" },
                { tier: "Visionary", amount: "$24,500", projects: 4, color: "bg-purple-100" },
              ].map((tier) => (
                <div key={tier.tier}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{tier.tier}</span>
                    <span className="text-sm font-semibold">{tier.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className={cn(tier.color, "h-full rounded-full")}
                        style={{
                          width: `${(tier.projects / 12) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {tier.projects} proj
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
