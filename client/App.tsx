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

// Protected pages (to be built)
import UserProfile from "./pages/UserProfile";
import SecuritySettings from "./pages/SecuritySettings";
import ActivityFeed from "./pages/ActivityFeed";

// Dashboard pages
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProfile from "./pages/VendorProfile";
import VendorLeadDetail from "./pages/VendorLeadDetail";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

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
    <Route path="/vendor/apply" element={<Index />} />

    {/* Admin Portal Routes */}
    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
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
