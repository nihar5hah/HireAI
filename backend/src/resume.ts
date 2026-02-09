import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import mammoth from "mammoth";
import { getSupabase } from "./supabase";
import { authMiddleware, requireRole } from "./auth";
import { parseResume } from "./ai-resume";

// Multer memory storage - file kept in buffer for Supabase upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname || "").split(".").pop()?.toLowerCase();
    if (["pdf", "docx"].includes(ext || "")) cb(null, true);
    else cb(new Error("Only PDF and DOCX files are allowed"));
  },
});

const router = Router();

async function extractText(buffer: Buffer, ext: string): Promise<string> {
  if (ext === "pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return result.text || "";
    } catch (err) {
      console.warn("pdf-parse failed, falling back to basic text extraction:", err);
      // Fallback: extract readable ASCII text from the PDF buffer
      const text = buffer
        .toString("utf-8")
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (text.length > 50) return text;
      throw new Error("PDF text extraction is not available in this environment. Please upload a DOCX file instead.");
    }
  } else if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  throw new Error("Unsupported file format");
}

// POST /api/resume/upload
router.post(
  "/api/resume/upload",
  authMiddleware,
  requireRole("candidate"),
  upload.single("resume"),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No resume file uploaded" });
      }

      const supabase = getSupabase();
      const ext = (file.originalname || "").split(".").pop()?.toLowerCase() || "pdf";
      const storagePath = `${uuidv4()}.${ext}`;

      // Find or create candidate
      let { data: candidate } = await supabase.from("candidates").select("*").eq("user_id", user.id).maybeSingle();

      if (!candidate) {
        const { data: byEmail } = await supabase.from("candidates").select("*").eq("email", user.email).is("user_id", null).maybeSingle();
        if (byEmail) {
          await supabase.from("candidates").update({ user_id: user.id }).eq("id", byEmail.id);
          candidate = byEmail;
        } else {
          const candidateId = uuidv4();
          await supabase.from("candidates").insert({ id: candidateId, name: user.name, email: user.email, user_id: user.id });
          candidate = { id: candidateId, name: user.name, email: user.email };
        }
      }

      // Delete old resume from Storage if exists
      if (candidate.resume_file_path) {
        await supabase.storage.from("resumes").remove([candidate.resume_file_path]);
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, file.buffer, { contentType: ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload resume" });
      }

      // Update candidate record
      await supabase
        .from("candidates")
        .update({
          resume_file_path: storagePath,
          resume_status: "processing",
          name: user.name,
        })
        .eq("id", candidate.id);

      res.json({
        candidate_id: candidate.id,
        status: "processing",
        message: "Resume uploaded. AI parsing in progress...",
      });

      // Background: extract text and parse
      (async () => {
        try {
          const text = await extractText(file.buffer, ext);
          await supabase.from("candidates").update({ raw_resume_text: text }).eq("id", candidate.id);

          const parsed = await parseResume(text);
          await supabase
            .from("candidates")
            .update({
              parsed_skills: JSON.stringify(parsed.skills),
              parsed_experience: JSON.stringify(parsed.experience),
              parsed_projects: JSON.stringify(parsed.projects),
              parsed_education: JSON.stringify(parsed.education),
              phone: parsed.phone || candidate.phone,
              resume_status: "processed",
            })
            .eq("id", candidate.id);

          console.log(`Resume parsed for candidate ${candidate.id}`);
        } catch (err) {
          console.error("Resume parsing error:", err);
          await supabase.from("candidates").update({ resume_status: "error" }).eq("id", candidate.id);
        }
      })();
    } catch (error: any) {
      console.error("Resume upload error:", error);
      if (error.message?.includes("Only PDF and DOCX")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to upload resume" });
    }
  }
);

// GET /api/resume/status
router.get("/api/resume/status", authMiddleware, requireRole("candidate"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const supabase = getSupabase();
    const { data: candidate } = await supabase.from("candidates").select("*").eq("user_id", user.id).maybeSingle();

    if (!candidate) {
      return res.json({
        resume_status: "none",
        parsed_skills: [],
        parsed_experience: [],
        parsed_projects: [],
        parsed_education: [],
      });
    }

    res.json({
      candidate_id: candidate.id,
      resume_status: candidate.resume_status || "none",
      parsed_skills: candidate.parsed_skills ? JSON.parse(candidate.parsed_skills) : [],
      parsed_experience: candidate.parsed_experience ? JSON.parse(candidate.parsed_experience) : [],
      parsed_projects: candidate.parsed_projects ? JSON.parse(candidate.parsed_projects) : [],
      parsed_education: candidate.parsed_education ? JSON.parse(candidate.parsed_education) : [],
    });
  } catch (error) {
    console.error("Resume status error:", error);
    res.status(500).json({ error: "Failed to get resume status" });
  }
});

// GET /api/resume/score/:jobId
router.get("/api/resume/score/:jobId", authMiddleware, requireRole("candidate"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const supabase = getSupabase();
    const { data: candidate } = await supabase.from("candidates").select("id").eq("user_id", user.id).maybeSingle();

    if (!candidate) return res.json({ score: null });

    const { data: score } = await supabase.from("ai_scores").select("*").eq("candidate_id", candidate.id).eq("job_id", req.params.jobId).maybeSingle();

    if (!score) return res.json({ score: null });

    res.json({
      score: {
        skills_score: score.skills_score,
        experience_score: score.experience_score,
        projects_score: score.projects_score,
        test_score: score.test_score,
        final_weighted_score: score.final_weighted_score,
        ai_summary: score.ai_summary,
      },
    });
  } catch (error) {
    console.error("Resume score error:", error);
    res.status(500).json({ error: "Failed to get score" });
  }
});

export default router;
