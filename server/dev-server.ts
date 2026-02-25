import dotenv from "dotenv";
dotenv.config({ override: true });
import { createServer } from "./index";

const app = createServer();
const port = process.env.API_PORT || 3001;

app.listen(port, () => {
  console.log(`🔧 Express API server running on http://localhost:${port}`);
  console.log(`📍 API endpoints available at http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Express server shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Express server shutting down...");
  process.exit(0);
});
