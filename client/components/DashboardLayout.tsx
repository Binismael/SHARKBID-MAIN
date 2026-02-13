import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, LogOut, X, Home, FileText, Settings, Zap, DollarSign, LayoutGrid, Users, BarChart3, Sliders, User, Lock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "client" | "creator";
  userName?: string;
}

export function DashboardLayout({
  children,
  role,
  userName = "User",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getRoleConfig = (r: string) => {
    switch (r) {
      case "admin":
        return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500", label: "Admin", title: "Control Tower" };
      case "client":
        return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", label: "Client", title: "Vision Dashboard" };
      case "creator":
        return { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500", label: "Creator", title: "Execution Console" };
      default:
        return { color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-500", label: "User", title: "Dashboard" };
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const adminNav = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutGrid },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Projects", href: "/admin/projects", icon: FileText },
    { label: "Payments", href: "/admin/payments", icon: DollarSign },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Controls", href: "/admin/controls", icon: Sliders },
    { label: "Profile", href: "/admin/profile", icon: User },
  ];

  const clientNav = [
    { label: "Dashboard", href: "/client/dashboard", icon: Home },
    { label: "New Project", href: "/client/briefing", icon: FileText },
    { label: "Marketplace", href: "/marketplace", icon: Zap },
    { label: "Assets", href: "/client/assets", icon: FileText },
    { label: "Profile", href: "/client/profile", icon: User },
  ];

  const creatorNav = [
    { label: "Dashboard", href: "/creator/dashboard", icon: Home },
    { label: "Onboarding", href: "/creator/onboarding", icon: FileText },
    { label: "Assets", href: "/creator/assets", icon: FileText },
    { label: "Payments", href: "/creator/payments", icon: DollarSign },
    { label: "Profile", href: "/creator/profile", icon: User },
  ];

  const navItems =
    role === "admin" ? adminNav : role === "client" ? clientNav : creatorNav;

  const roleConfig = getRoleConfig(role);
  const dashboardPath = role === "admin" ? "/admin/dashboard" : role === "client" ? "/client/dashboard" : "/creator/dashboard";
  const isAtDashboard = location.pathname === dashboardPath;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-card transition-all duration-300 flex flex-col shadow-sm",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3 font-bold">
            <Logo variant="dark" />
            {sidebarOpen && (
              <div>
                <span className="text-xs text-muted-foreground block">
                  {roleConfig.title}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  active
                    ? `${roleConfig.bg} text-white font-medium shadow-sm`
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "px-3 py-2 rounded-lg text-center transition-all",
            sidebarOpen ? "bg-muted/50" : "bg-muted/50"
          )}>
            <p className={cn("text-xs font-semibold", roleConfig.color)}>
              {sidebarOpen ? roleConfig.label : roleConfig.label.charAt(0)}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Welcome back
              </p>
              <p className="text-lg font-bold text-foreground">{userName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isAtDashboard && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(dashboardPath)}
                className="hidden sm:flex items-center gap-2 text-primary border-primary/20 hover:bg-primary/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Website
            </Button>

            <NotificationBell />

            <div className="h-8 w-px bg-border"></div>

            <div className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold text-white",
              roleConfig.bg
            )}>
              {roleConfig.label}
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/10">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
