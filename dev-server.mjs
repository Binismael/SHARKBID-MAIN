#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🚀 Starting development servers...\n");

// Start backend server directly on port 3000 using tsx
console.log("📦 Starting backend server on http://localhost:3000");
const backendProcess = spawn("npx", ["tsx", "server/node-build.ts"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env, PORT: 3000 },
});

// Wait a moment for backend to start, then start Vite
setTimeout(() => {
  console.log("\n🎨 Starting Vite dev server on http://localhost:8080");
  const viteProcess = spawn("pnpm", ["run", "dev:client"], {
    cwd: __dirname,
    stdio: "inherit",
  });

  // Handle process termination
  const cleanup = () => {
    console.log("\n🛑 Shutting down servers...");
    backendProcess.kill();
    viteProcess.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  viteProcess.on("error", (err) => {
    console.error("❌ Vite error:", err);
    cleanup();
  });

  backendProcess.on("error", (err) => {
    console.error("❌ Backend error:", err);
    cleanup();
  });
}, 2000);
