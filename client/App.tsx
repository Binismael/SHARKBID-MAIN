import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";

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

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
