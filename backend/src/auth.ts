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
    const { name, email, password } = req.body;
    const role = "candidate"; // Default role, user picks on next screen
    console.log(`[REGISTER] Attempting registration for ${email}`);
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const supabase = getSupabase();
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      console.log(`[REGISTER] Email ${email} already exists`);
      return res.status(409).json({ error: "Email already registered" });
    }

    const id = uuidv4();
    const password_hash = hashPassword(password);
    const { error: insertError } = await supabase.from("users").insert({ id, name, email, password_hash, role });
    
    if (insertError) {
      console.error("[REGISTER] Supabase insert error:", insertError);
      return res.status(500).json({ error: "Database error: " + insertError.message });
    }

    console.log(`[REGISTER] Successfully created user ${email}`);
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
    console.log(`[LOGIN] Attempting login for ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const supabase = getSupabase();
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (error || !user) {
      console.log(`[LOGIN] User not found: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!verifyPassword(password, user.password_hash)) {
      console.log(`[LOGIN] Invalid password for ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log(`[LOGIN] Successfully logged in ${email}`);
    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/check-user - Check if a user already exists by email
router.get("/api/auth/check-user", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const supabase = getSupabase();
    const { data } = await supabase.from("users").select("id, role").eq("email", email).maybeSingle();
    res.json({ exists: !!data, role: data?.role || null });
  } catch (error) {
    console.error("Check user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/google
router.post("/api/auth/google", async (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body;
    console.log(`[GOOGLE_AUTH] Processing Google auth for ${email} as ${role}`);

    if (!email || !name || !role) {
      return res.status(400).json({ error: "Email, name, and role are required" });
    }
    if (!["recruiter", "candidate"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'recruiter' or 'candidate'" });
    }

    const supabase = getSupabase();
    
    // Check if user already exists
    const { data: existing } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    
    let user = existing;
    if (!existing) {
      // Create new user for Google OAuth (no password needed)
      const id = uuidv4();
      const { error: insertError } = await supabase.from("users").insert({
        id,
        name,
        email,
        role,
        password_hash: null, // Google OAuth users don't have password
      });
      
      if (insertError) {
        console.error("[GOOGLE_AUTH] Supabase insert error:", insertError);
        return res.status(500).json({ error: "Database error: " + insertError.message });
      }
      
      user = { id, name, email, role, password_hash: null };
      console.log(`[GOOGLE_AUTH] Created new user ${email} as ${role}`);
    } else {
      // Existing user - use their stored role (role is locked)
      console.log(`[GOOGLE_AUTH] Found existing user ${email} with role ${existing.role}`);
      user = existing;
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/set-role (for newly registered email/password users)
router.post("/api/auth/set-role", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const authUser = (req as any).user;
    console.log(`[SET_ROLE] Setting role for ${authUser.email} to ${role}`);

    if (!role || !["recruiter", "candidate"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'recruiter' or 'candidate'" });
    }

    const supabase = getSupabase();
    const { data: existing } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle();
    
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update role
    const { error: updateError } = await supabase.from("users").update({ role }).eq("id", authUser.id);
    if (updateError) {
      console.error("[SET_ROLE] Update error:", updateError);
      return res.status(500).json({ error: "Database error: " + updateError.message });
    }

    console.log(`[SET_ROLE] Successfully set role for ${authUser.email} to ${role}`);
    const token = signToken({ id: existing.id, email: existing.email, name: existing.name, role });
    res.json({ token, user: { id: existing.id, name: existing.name, email: existing.email, role } });
  } catch (error) {
    console.error("Set role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/auth/account
router.delete("/api/auth/account", authMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    console.log(`[DELETE_ACCOUNT] Deleting account for ${authUser.email}`);

    const supabase = getSupabase();
    
    try {
      // First, find the candidate record(s) linked to this user
      const { data: candidates, error: candidatesError } = await supabase.from("candidates").select("id").eq("user_id", authUser.id);
      
      if (candidatesError) {
        console.error("[DELETE_ACCOUNT] Error fetching candidates:", candidatesError);
      } else if (candidates && candidates.length > 0) {
        const candidateIds = candidates.map((c: any) => c.id);
        console.log(`[DELETE_ACCOUNT] Found ${candidateIds.length} candidate record(s)`);
        
        // Delete results for this candidate
        await supabase.from("results").delete().in("candidate_id", candidateIds);
        
        // Delete submissions for this candidate
        await supabase.from("submissions").delete().in("candidate_id", candidateIds);
        
        // Delete AI scores for this candidate
        await supabase.from("ai_scores").delete().in("candidate_id", candidateIds);
        
        // Delete proctor snapshots linked to submissions (if still needed)
        // Note: proctor_snapshots cascade from submissions, so they might be auto-deleted
        
        // Delete candidate record
        await supabase.from("candidates").delete().in("id", candidateIds);
      }
      
      // If recruiter, handle job deletion (requires recruiter_id column migration)
      try {
        const { data: jobs, error: jobsError } = await supabase.from("jobs").select("id").eq("recruiter_id", authUser.id);
        if (!jobsError && jobs && jobs.length > 0) {
          const jobIds = jobs.map((j: any) => j.id);
          console.log(`[DELETE_ACCOUNT] Found ${jobIds.length} job(s) to delete`);
          
          // Delete results for these jobs
          await supabase.from("results").delete().in("job_id", jobIds);
          
          // Delete submissions for these jobs
          await supabase.from("submissions").delete().in("job_id", jobIds);
          
          // Delete AI scores for these jobs
          await supabase.from("ai_scores").delete().in("job_id", jobIds);
          
          // Delete questions for these jobs
          await supabase.from("questions").delete().in("job_id", jobIds);
          
          // Delete the jobs
          await supabase.from("jobs").delete().eq("recruiter_id", authUser.id);
          console.log(`[DELETE_ACCOUNT] Deleted ${jobIds.length} job(s)`);
        }
      } catch (jobDeleteError: any) {
        // recruiter_id column might not exist yet - skip job deletion
        console.log(`[DELETE_ACCOUNT] Skipping job deletion (recruiter_id column may not exist yet):`, jobDeleteError.message);
      }
      
      // Finally, delete the user
      const { error: deleteUserError } = await supabase.from("users").delete().eq("id", authUser.id);
      if (deleteUserError) {
        console.error("[DELETE_ACCOUNT] Error deleting user:", deleteUserError);
        return res.status(500).json({ error: "Failed to delete account: " + deleteUserError.message });
      }

      console.log(`[DELETE_ACCOUNT] Successfully deleted account for ${authUser.email}`);
      res.json({ message: "Account deleted successfully" });
    } catch (innerError: any) {
      console.error("[DELETE_ACCOUNT] Inner error:", innerError);
      return res.status(500).json({ error: "Error during deletion: " + (innerError.message || "Unknown error") });
    }
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/api/auth/me", authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ user });
});

export default router;
