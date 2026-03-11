import "./global.css";

import { Component } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { AIAssistant } from "@/components/AIAssistant";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BusinessIntake from "./pages/BusinessIntake";
import NotFound from "./pages/NotFound";
import DebugPage from "./pages/Debug";

// Protected pages (to be built)
import UserProfile from "./pages/UserProfile";
import SecuritySettings from "./pages/SecuritySettings";
import ActivityFeed from "./pages/ActivityFeed";

// Dashboard pages
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVendors from "./pages/AdminVendors";
import AdminVendorDetail from "./pages/AdminVendorDetail";
import AdminProjects from "./pages/AdminProjects";
import AdminRouting from "./pages/AdminRouting";
import AdminUsers from "./pages/AdminUsers";
import AdminBusinessDetail from "./pages/AdminBusinessDetail";
import BusinessVendors from "./pages/BusinessVendors";
import BusinessVendorDetail from "./pages/BusinessVendorDetail";
import VendorDashboard from "./pages/VendorDashboard";
import VendorAvailableProjects from "./pages/VendorAvailableProjects";
import VendorProfile from "./pages/VendorProfile";
import VendorLeadDetail from "./pages/VendorLeadDetail";
import VendorMessages from "./pages/VendorMessages";
import CreatorApply from "./pages/CreatorApply";
import CreateProjectForm from "./pages/CreateProjectForm";
import ProjectDetail from "./pages/ProjectDetail";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/debug" element={<DebugPage />} />

    {/* Business Portal Routes */}
    <Route
      path="/business/dashboard"
      element={
        <ProtectedRoute requiredRole="business">
          <BusinessDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/business/intake"
      element={
        <ProtectedRoute requiredRole="business">
          <BusinessIntake />
        </ProtectedRoute>
      }
    />
    <Route
      path="/business/projects/create"
      element={
        <ProtectedRoute requiredRole="business">
          <CreateProjectForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/business/project/:projectId"
      element={
        <ProtectedRoute requiredRole="business">
          <ProjectDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/business/vendors"
      element={
        <ProtectedRoute requiredRole="business">
          <BusinessVendors />
        </ProtectedRoute>
      }
    />
    <Route
      path="/business/vendors/:vendorId"
      element={
        <ProtectedRoute requiredRole="business">
          <BusinessVendorDetail />
        </ProtectedRoute>
      }
    />

    {/* Vendor Portal Routes */}
    <Route
      path="/vendor/dashboard"
      element={
        <ProtectedRoute requiredRole="vendor">
          <VendorDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/vendor/profile"
      element={
        <ProtectedRoute requiredRole="vendor">
          <VendorProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/vendor/lead/:projectId"
      element={
        <ProtectedRoute requiredRole="vendor">
          <VendorLeadDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/vendor/messages"
      element={
        <ProtectedRoute requiredRole="vendor">
          <VendorMessages />
        </ProtectedRoute>
      }
    />
    <Route
      path="/vendor/projects"
      element={
        <ProtectedRoute requiredRole="vendor">
          <VendorAvailableProjects />
        </ProtectedRoute>
      }
    />
    <Route path="/vendor/apply" element={<CreatorApply />} />

    {/* Admin Portal Routes */}
    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/projects"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminProjects />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/vendors"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminVendors />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/vendors/:vendorId"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminVendorDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/routing"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminRouting />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users/business/:businessId"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminBusinessDetail />
        </ProtectedRoute>
      }
    />

    {/* Shared Routes */}
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/security"
      element={
        <ProtectedRoute>
          <SecuritySettings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/activity"
      element={
        <ProtectedRoute>
          <ActivityFeed />
        </ProtectedRoute>
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false as const, message: undefined as string | undefined };

  static getDerivedStateFromError(error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-lg w-full rounded-lg border border-border bg-card p-6">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.message}
            </p>
            <a
              className="mt-4 inline-block text-sm underline"
              href="/"
            >
              Go back home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <AppRoutes />
        <AIAssistant />
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
