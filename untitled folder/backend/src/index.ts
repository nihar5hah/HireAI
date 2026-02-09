import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import authRoutes from "./auth";
import resumeRoutes from "./resume";
import { initSupabase } from "./supabase";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(authRoutes);
app.use(resumeRoutes);
app.use(routes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function start() {
  await initSupabase();
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
