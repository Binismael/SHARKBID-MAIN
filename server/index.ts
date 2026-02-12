import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAIIntake } from "./routes/ai-intake";
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

  // Email routes
  app.use("/api", emailRouter);

  // Admin routes (server-side, bypass RLS)
  app.use("/api", adminRouter);

  return app;
}
