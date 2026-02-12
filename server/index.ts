import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAIIntake } from "./routes/ai-intake";
import { handleTriggerRouting } from "./routes/lead-routing";
import { handlePublishProject, handleGetProject } from "./routes/projects";
import { handleCreateProject } from "./routes/create-project";
import emailRouter from "./routes/email";
import adminRouter from "./routes/admin";

export function createServer() {
  const app = express();

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

  // Project routes
  app.post("/api/projects/create", handleCreateProject);
  app.post("/api/projects/publish", handlePublishProject);
  app.get("/api/projects/:projectId", handleGetProject);

  // Lead routing (manual trigger for testing)
  app.post("/api/routing/trigger", handleTriggerRouting);

  // Email routes
  app.use("/api", emailRouter);

  // Admin routes (server-side, bypass RLS)
  app.use("/api", adminRouter);

  return app;
}
