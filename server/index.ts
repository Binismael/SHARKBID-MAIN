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

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Supabase Proxy
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://kpytttekmeoeqskfopqj.supabase.co").replace(/\/$/, "");
  console.log(`[PROXY] Supabase target: ${supabaseUrl}`);

  app.use("/api/v1/supabase", async (req, res) => {
    try {
      const targetUrl = (process.env.VITE_SUPABASE_URL || "https://kpytttekmeoeqskfopqj.supabase.co").replace(/\/$/, "");
      const url = `${targetUrl}${req.url}`;

      const headers: Record<string, string> = {};
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key === 'host' || key === 'connection' || key === 'content-length') return;
        if (value) {
          headers[key] = Array.isArray(value) ? value.join(', ') : value;
        }
      });

      // Ensure the host is set to the target Supabase host
      const targetHost = new URL(targetUrl).host;
      headers['host'] = targetHost;

      // Fail-safe: If apikey is missing or placeholder, use the one from environment
      const envAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      if (envAnonKey && (!headers['apikey'] || headers['apikey'] === 'placeholder' || headers['apikey'].includes('your-'))) {
        headers['apikey'] = envAnonKey;

        // Only overwrite authorization if it's missing, or if it's the anon key placeholder
        if (!headers['authorization'] || headers['authorization'].includes('placeholder') || headers['authorization'].includes('your-')) {
          headers['authorization'] = `Bearer ${envAnonKey}`;
        }
      }

      const response = await fetch(url, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : (typeof req.body === 'object' ? JSON.stringify(req.body) : req.body),
      });

      const buffer = await response.arrayBuffer();

      console.log(`[PROXY] Manual Response: ${response.status} for ${url} (length: ${buffer.byteLength})`);

      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Skip headers that should be handled by Express or might cause issues
        const skipHeaders = ['content-encoding', 'transfer-encoding', 'content-length', 'connection', 'keep-alive'];
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error(`[PROXY] Manual Error:`, error);
      res.status(500).json({ error: "Proxy Error", message: error instanceof Error ? error.message : String(error) });
    }
  });

  app.use("/api/test-me", (req, res) => {
    res.json({ success: true, message: "Hit Express successfully!" });
  });

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
