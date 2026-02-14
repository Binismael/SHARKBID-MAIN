import { Navigate } from "react-router-dom";
import { useAuth } from "./auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "business" | "vendor";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if user has it
  // Admin bypass: admins can access any protected route
  if (requiredRole && userRole !== requiredRole && userRole !== "admin") {
    // If user is logged in but doesn't have the right role, redirect to their dashboard
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "business") {
      return <Navigate to="/business/dashboard" replace />;
    } else if (userRole === "vendor") {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    // Fallback
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
