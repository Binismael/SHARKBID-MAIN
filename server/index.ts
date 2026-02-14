import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import { handleDemo } from "./routes/demo";
import { handleAIIntake } from "./routes/ai-intake";
import { handleTriggerRouting } from "./routes/lead-routing";
import { handleGetMyProfile, handleUpdateProfile } from "./routes/profiles";
import { handlePublishProject, handleGetProject, handleGetAvailableProjects, handleGetRoutedLeads, handleGetVendorThreads, handleGetBusinessProjects, handleGetVendorProjects, handleGetUnroutedProjects, handleUpsertRouting, handleGetVendorBids, handleVendorSubmitBid, handleAssignVendor, handleDeleteProject, handleGetMessages, handleSendMessage, handleVendorUpdateStatus } from "./routes/projects";
import { handleCreateProject } from "./routes/create-project";
import emailRouter from "./routes/email";
import adminRouter from "./routes/admin";

export function createServer() {
  const app = express();

  // Supabase Proxy (Must come before body parsers to avoid issues with large payloads or multipart)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kpytttekmeoeqskfopqj.supabase.co";
  const cleanSupabaseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;

  app.use("/supabase", proxy(cleanSupabaseUrl, {
    proxyReqPathResolver: (req) => {
      return req.url; // Forward the rest of the path
    },
    proxyReqOptDecorator: (proxyReqOpts) => {
      // Ensure origin and referer are handled if needed by Supabase
      return proxyReqOpts;
    }
  }));

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // AI Intake route
  app.post("/api/ai-intake", handleAIIntake);

  // Profile routes
  app.get("/api/profiles/me", handleGetMyProfile);
  app.post("/api/profiles/update", handleUpdateProfile);

  // Project routes
  app.post("/api/projects/create", handleCreateProject);
  app.post("/api/projects/publish", handlePublishProject);
  app.get("/api/projects/available", handleGetAvailableProjects);
  app.get("/api/projects/unrouted", handleGetUnroutedProjects);
  app.get("/api/projects/routed", handleGetRoutedLeads);
  app.get("/api/projects/vendor-threads", handleGetVendorThreads);
  app.get("/api/projects/business", handleGetBusinessProjects);
  app.get("/api/projects/vendor", handleGetVendorProjects);
  app.post("/api/projects/upsert-routing", handleUpsertRouting);
  app.get("/api/projects/vendor-bids", handleGetVendorBids);
  app.post("/api/projects/submit-bid", handleVendorSubmitBid);
  app.post("/api/projects/assign-vendor", handleAssignVendor);
  app.post("/api/projects/vendor-update-status", handleVendorUpdateStatus);
  app.delete("/api/projects/:projectId", handleDeleteProject);
  app.get("/api/projects/:projectId/messages", handleGetMessages);
  app.post("/api/projects/:projectId/messages", handleSendMessage);
  app.get("/api/projects/:projectId", handleGetProject);

  // Lead routing (manual trigger for testing)
  app.post("/api/routing/trigger", handleTriggerRouting);

  // Email routes
  app.use("/api", emailRouter);

  // Admin routes (server-side, bypass RLS)
  app.use("/api", adminRouter);

  return app;
}
