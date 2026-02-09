import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import authRoutes from "./auth";
import resumeRoutes from "./resume";
import { initSupabase } from "./supabase";

const app = express();
const PORT = process.env.PORT || 3002;

// CORS - allow Vercel frontend in production
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL || "", // Set this on Render to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    // Allow any vercel.app domain or configured origins
    if (origin.endsWith(".vercel.app") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
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
