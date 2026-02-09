import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getSupabase } from "./supabase";

const JWT_SECRET = process.env.JWT_SECRET || "hireai-dev-secret-change-in-production";
const router = Router();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const test = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === test;
}

function signToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { id: string; email: string; name: string; role: string };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// POST /api/auth/register
router.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }
    if (!["recruiter", "candidate"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'recruiter' or 'candidate'" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const supabase = getSupabase();
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const id = uuidv4();
    const password_hash = hashPassword(password);
    await supabase.from("users").insert({ id, name, email, password_hash, role });

    const token = signToken({ id, email, name, role });
    res.status(201).json({ token, user: { id, name, email, role } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const supabase = getSupabase();
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (error || !user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/api/auth/me", authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

export default router;
