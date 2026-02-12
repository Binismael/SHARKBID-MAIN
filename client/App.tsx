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
import CreatorApply from "./pages/CreatorApply";

// Client routes
import ClientDashboard from "./pages/ClientDashboard";
import ClientProjects from "./pages/ClientProjects";
import ClientAssets from "./pages/ClientAssets";
import ClientProjectBriefing from "./pages/ClientProjectBriefing";
import CreatorMarketplace from "./pages/CreatorMarketplace";
import CreatorPortfolio from "./pages/CreatorPortfolio";

// Shared routes
import ActivityFeed from "./pages/ActivityFeed";
import SecuritySettings from "./pages/SecuritySettings";
import UserProfile from "./pages/UserProfile";

// Creator routes
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorOnboarding from "./pages/CreatorOnboarding";
import CreatorProjects from "./pages/CreatorProjects";
import CreatorPayments from "./pages/CreatorPayments";
import CreatorAssets from "./pages/CreatorAssets";

// Admin routes
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProjects from "./pages/AdminProjects";
import AdminPayments from "./pages/AdminPayments";
import Reports from "./pages/Reports";
import AdminControls from "./pages/AdminControls";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/apply" element={<CreatorApply />} />

    {/* Client routes */}
    <Route
      path="/client/dashboard"
      element={
        <ProtectedRoute requiredRole="client">
          <ClientDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/client/projects/:id"
      element={
        <ProtectedRoute requiredRole="client">
          <ClientProjects />
        </ProtectedRoute>
      }
    />
    <Route
      path="/client/assets"
      element={
        <ProtectedRoute requiredRole="client">
          <ClientAssets />
        </ProtectedRoute>
      }
    />
    <Route
      path="/client/briefing"
      element={
        <ProtectedRoute requiredRole="client">
          <ClientProjectBriefing />
        </ProtectedRoute>
      }
    />
    <Route
      path="/activity-feed"
      element={
        <ProtectedRoute>
          <ActivityFeed />
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
      path="/profile"
      element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/client/profile"
      element={
        <ProtectedRoute requiredRole="client">
          <UserProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/creator/profile"
      element={
        <ProtectedRoute requiredRole="creator">
          <UserProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/profile"
      element={
        <ProtectedRoute requiredRole="admin">
          <UserProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/marketplace"
      element={
        <ProtectedRoute requiredRole="client">
          <CreatorMarketplace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/creator/:creatorId"
      element={
        <ProtectedRoute requiredRole="client">
          <CreatorPortfolio />
        </ProtectedRoute>
      }
    />

    {/* Creator routes */}
    <Route
      path="/creator/onboarding"
      element={
        <ProtectedRoute requiredRole="creator">
          <CreatorOnboarding />
        </ProtectedRoute>
      }
    />
    <Route
      path="/creator/dashboard"
      element={
        <ProtectedRoute requiredRole="creator">
          <CreatorDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/creator/projects/:id"
      element={
        <ProtectedRoute requiredRole="creator">
          <CreatorProjects />
        </ProtectedRoute>
      }
    />
    <Route
      path="/creator/payments"
      element={
        <ProtectedRoute requiredRole="creator">
          <CreatorPayments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/creator/assets"
      element={
        <ProtectedRoute requiredRole="creator">
          <CreatorAssets />
        </ProtectedRoute>
      }
    />

    {/* Admin routes */}
    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
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
      path="/admin/projects"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminProjects />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/payments"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminPayments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/reports"
      element={
        <ProtectedRoute requiredRole="admin">
          <Reports />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/controls"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminControls />
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
