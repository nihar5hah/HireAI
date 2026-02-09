import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getSupabase } from "./supabase";
import { parseJobDescription, generateQuestions } from "./ai-groq";
import { scoreSubjectiveAnswer, scoreCodingAnswer } from "./ai-mock";
import { authMiddleware, requireRole } from "./auth";
import { scoreCandidateBackground } from "./ai-resume";
import { Question, Result } from "./types";

const router = Router();

// POST /api/jobs/generate
router.post("/api/jobs/generate", async (req: Request, res: Response) => {
  try {
    const { description, mcq_count, subjective_count, coding_count } = req.body;
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Job description is required" });
    }
    const parsed = await parseJobDescription(description);
    const generated = await generateQuestions(parsed, {
      mcq: mcq_count ?? 5,
      subjective: subjective_count ?? 2,
      coding: coding_count ?? 1,
    });
    const questions = [
      ...generated.mcqs.map((m) => ({ type: "mcq" as const, question: m.question, options: m.options, correct_answer: m.correct_answer, skill: m.skill, difficulty: m.difficulty })),
      ...generated.subjective.map((s) => ({ type: "subjective" as const, question: s.question, options: null, correct_answer: null, skill: s.skill, difficulty: s.difficulty })),
      ...generated.coding.map((c) => ({ type: "coding" as const, question: c.question, options: null, correct_answer: null, skill: c.skill, difficulty: c.difficulty })),
    ];
    res.json({ job: parsed, questions });
  } catch (error: unknown) {
    console.error("Error generating draft:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.includes("GROQ_API_KEY")) return res.status(503).json({ error: message });
    res.status(500).json({ error: message });
  }
});

// POST /api/jobs
router.post("/api/jobs", async (req: Request, res: Response) => {
  try {
    const { job, description, questions: reqQuestions } = req.body;
    let parsed: { title: string; required_skills: string[]; experience_level: string; tools_technologies: string[] };
    let desc: string;
    let providedQuestions: Array<{ type: string; question: string; options?: string[] | null; correct_answer?: string | null; skill?: string; difficulty?: string }>;

    if (job && description && Array.isArray(reqQuestions) && reqQuestions.length > 0) {
      parsed = { title: job.title || "Assessment", required_skills: job.required_skills || [], experience_level: job.experience_level || "Mid-level", tools_technologies: job.tools_technologies || [] };
      desc = description;
      providedQuestions = reqQuestions;
    } else if (typeof req.body.description === "string" && req.body.description.trim()) {
      desc = req.body.description;
      parsed = await parseJobDescription(desc);
      const counts = { mcq: req.body.mcq_count ?? 5, subjective: req.body.subjective_count ?? 2, coding: req.body.coding_count ?? 1 };
      const generated = await generateQuestions(parsed, counts);
      providedQuestions = [
        ...generated.mcqs.map((m: any) => ({ type: "mcq", question: m.question, options: m.options, correct_answer: m.correct_answer, skill: m.skill, difficulty: m.difficulty })),
        ...generated.subjective.map((s: any) => ({ type: "subjective", question: s.question, options: null, correct_answer: null, skill: s.skill, difficulty: s.difficulty })),
        ...generated.coding.map((c: any) => ({ type: "coding", question: c.question, options: null, correct_answer: null, skill: c.skill, difficulty: c.difficulty })),
      ];
    } else {
      return res.status(400).json({ error: "Job description or job+questions required" });
    }

    const supabase = getSupabase();
    const jobId = uuidv4();
    await supabase.from("jobs").insert({
      id: jobId,
      title: parsed.title,
      description: desc,
      required_skills: JSON.stringify(parsed.required_skills),
      experience_level: parsed.experience_level,
      tools_technologies: JSON.stringify(parsed.tools_technologies),
    });

    for (let i = 0; i < providedQuestions.length; i++) {
      const q = providedQuestions[i];
      const type = q.type || "mcq";
      const options = type === "mcq" && q.options ? JSON.stringify(q.options) : null;
      const correctAnswer = type === "mcq" ? (q.correct_answer || null) : null;
      await supabase.from("questions").insert({
        id: uuidv4(),
        job_id: jobId,
        type,
        question: q.question || "",
        options,
        correct_answer: correctAnswer,
        skill: q.skill || "General",
        difficulty: q.difficulty || "Medium",
        order_index: i,
      });
    }

    const { data: questions } = await supabase.from("questions").select("*").eq("job_id", jobId).order("order_index");
    res.status(201).json({
      job: { id: jobId, title: parsed.title, required_skills: parsed.required_skills, experience_level: parsed.experience_level, tools_technologies: parsed.tools_technologies },
      questions: (questions || []).map((q: any) => ({ ...q, options: q.options ? JSON.parse(q.options) : null })),
    });
  } catch (error: unknown) {
    console.error("Error creating job:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.includes("GROQ_API_KEY")) return res.status(503).json({ error: message });
    res.status(500).json({ error: message });
  }
});

// GET /api/jobs
router.get("/api/jobs", async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: jobs } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    res.json((jobs || []).map((job: any) => ({ ...job, required_skills: JSON.parse(job.required_skills || "[]"), tools_technologies: JSON.parse(job.tools_technologies || "[]") })));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/jobs/:id
router.get("/api/jobs/:id", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", req.params.id).maybeSingle();
    if (error || !job) return res.status(404).json({ error: "Job not found" });

    const { data: questions } = await supabase.from("questions").select("*").eq("job_id", req.params.id).order("order_index");
    res.json({
      ...job,
      required_skills: JSON.parse(job.required_skills || "[]"),
      tools_technologies: JSON.parse(job.tools_technologies || "[]"),
      questions: (questions || []).map((q: any) => ({ id: q.id, type: q.type, question: q.question, options: q.options ? JSON.parse(q.options) : null, skill: q.skill, difficulty: q.difficulty, order_index: q.order_index })),
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/submissions
router.post("/api/submissions", async (req: Request, res: Response) => {
  try {
    const { candidate_name, candidate_email, job_id, answers, time_taken_seconds, disqualified, snapshots = [] } = req.body;
    if (!candidate_name || !candidate_email || !job_id || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabase = getSupabase();
    const { data: job } = await supabase.from("jobs").select("*").eq("id", job_id).maybeSingle();
    if (!job) return res.status(404).json({ error: "Job not found" });

    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || "hireai-dev-secret-change-in-production") as any;
        userId = decoded.id;
      } catch (_) {}
    }

    let { data: candidate } = await supabase.from("candidates").select("*").eq("email", candidate_email).maybeSingle();
    if (!candidate) {
      const candidateId = uuidv4();
      await supabase.from("candidates").insert({ id: candidateId, name: candidate_name, email: candidate_email, user_id: userId });
      candidate = { id: candidateId, name: candidate_name, email: candidate_email };
    } else if (userId && !candidate.user_id) {
      await supabase.from("candidates").update({ user_id: userId }).eq("id", candidate.id);
    }

    const submissionId = uuidv4();
    const isDisqualified = !!disqualified;
    await supabase.from("submissions").insert({
      id: submissionId,
      candidate_id: candidate.id,
      job_id,
      user_id: userId,
      answers: JSON.stringify(answers),
      time_taken_seconds: time_taken_seconds || 0,
      disqualified: isDisqualified,
    });

    const snapshotsToStore = Array.isArray(snapshots) ? snapshots.slice(0, 30) : [];
    for (const imgData of snapshotsToStore) {
      if (typeof imgData === "string" && imgData.startsWith("data:image")) {
        await supabase.from("proctor_snapshots").insert({ id: uuidv4(), submission_id: submissionId, image_data: imgData });
      }
    }

    const { data: questions } = await supabase.from("questions").select("*").eq("job_id", job_id).order("order_index");
    const qList = (questions || []) as Question[];

    let mcqCorrect = 0, mcqTotal = 0, subjectiveTotal = 0, subjectiveScore = 0, codingScore = 0, codingTotal = 0;
    const skillScores: Record<string, { correct: number; total: number }> = {};

    for (const q of qList) {
      const answer = answers[q.id] || "";
      if (!skillScores[q.skill]) skillScores[q.skill] = { correct: 0, total: 0 };
      skillScores[q.skill].total += 100;

      if (q.type === "mcq") {
        mcqTotal++;
        if (answer === q.correct_answer) { mcqCorrect++; skillScores[q.skill].correct += 100; }
      } else if (q.type === "subjective") {
        subjectiveTotal++;
        const score = scoreSubjectiveAnswer(q.question, answer);
        subjectiveScore += score;
        skillScores[q.skill].correct += score;
      } else if (q.type === "coding") {
        codingTotal++;
        const score = scoreCodingAnswer(q.question, answer);
        codingScore += score;
        skillScores[q.skill].correct += score;
      }
    }

    const mcqPercent = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;
    const subjectivePercent = subjectiveTotal > 0 ? Math.round(subjectiveScore / subjectiveTotal) : 0;
    const codingPercent = codingTotal > 0 ? Math.round(codingScore / codingTotal) : 0;
    const totalScore = isDisqualified ? 0 : Math.round(mcqPercent * 0.4 + subjectivePercent * 0.3 + codingPercent * 0.3);

    const skillPercentages: Record<string, number> = {};
    for (const [skill, data] of Object.entries(skillScores)) {
      skillPercentages[skill] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    }

    const resultId = uuidv4();
    await supabase.from("results").insert({
      id: resultId,
      submission_id: submissionId,
      candidate_id: candidate.id,
      job_id,
      total_score: totalScore,
      mcq_score: mcqPercent,
      subjective_score: subjectivePercent,
      coding_score: codingPercent,
      skill_scores: JSON.stringify(skillPercentages),
      disqualified: isDisqualified,
    });

    res.status(201).json({
      result_id: resultId,
      submission_id: submissionId,
      total_score: totalScore,
      mcq_score: mcqPercent,
      subjective_score: subjectivePercent,
      coding_score: codingPercent,
      skill_scores: skillPercentages,
    });

    scoreCandidateBackground(candidate.id, job_id).catch((err) => console.error("Background AI scoring error:", err));
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/results/:jobId
router.get("/api/results/:jobId", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: results } = await supabase.from("results").select("*").eq("job_id", req.params.jobId).order("total_score", { ascending: false });
    if (!results || results.length === 0) return res.json([]);

    const candidateIds = [...new Set((results as any[]).map((r) => r.candidate_id))];
    const { data: candidates } = await supabase.from("candidates").select("id, name, email").in("id", candidateIds);
    const cMap = new Map((candidates || []).map((c: any) => [c.id, c]));

    res.json((results as any[]).map((r) => ({
      ...r,
      candidate_name: cMap.get(r.candidate_id)?.name,
      candidate_email: cMap.get(r.candidate_id)?.email,
      skill_scores: typeof r.skill_scores === "string" ? JSON.parse(r.skill_scores) : r.skill_scores,
      disqualified: !!r.disqualified,
    })));
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/results/detail/:resultId
router.get("/api/results/detail/:resultId", async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: result, error } = await supabase.from("results").select("*").eq("id", req.params.resultId).maybeSingle();
    if (error || !result) return res.status(404).json({ error: "Result not found" });

    const r = result as any;
    const { data: cand } = await supabase.from("candidates").select("name, email").eq("id", r.candidate_id).maybeSingle();
    const { data: jobRow } = await supabase.from("jobs").select("title").eq("id", r.job_id).maybeSingle();
    r.candidates = cand ? { name: cand.name, email: cand.email } : {};
    r.jobs = jobRow ? { title: jobRow.title } : {};
    const { data: submission } = await supabase.from("submissions").select("answers").eq("id", r.submission_id).maybeSingle();
    const { data: questions } = await supabase.from("questions").select("*").eq("job_id", r.job_id).order("order_index");
    const { data: snapshots } = await supabase.from("proctor_snapshots").select("id, image_data, captured_at").eq("submission_id", r.submission_id).order("captured_at");

    const answers: Record<string, string> = submission?.answers ? (typeof submission.answers === "string" ? JSON.parse(submission.answers) : submission.answers) : {};
    const qList = (questions || []) as Question[];

    const question_review = qList.map((q) => {
      const yourAnswer = answers[q.id] ?? "";
      const isMcq = q.type === "mcq";
      return {
        id: q.id, type: q.type, question: q.question, skill: q.skill,
        your_answer: yourAnswer,
        ...(isMcq && { correct_answer: q.correct_answer, is_correct: yourAnswer === q.correct_answer }),
      };
    });

    const { data: allResults } = await supabase.from("results").select("id").eq("job_id", r.job_id).order("total_score", { ascending: false });
    const rank = (allResults || []).findIndex((x: any) => x.id === r.id) + 1;

    res.json({
      ...r,
      candidate_name: r.candidates?.name,
      candidate_email: r.candidates?.email,
      job_title: r.jobs?.title,
      skill_scores: typeof r.skill_scores === "string" ? JSON.parse(r.skill_scores) : r.skill_scores,
      disqualified: !!r.disqualified,
      rank,
      total_candidates: (allResults || []).length,
      question_review,
      proctor_snapshots: snapshots || [],
    });
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recruiter/dashboard
router.get("/api/recruiter/dashboard", authMiddleware, requireRole("recruiter"), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const { data: jobs } = await supabase.from("jobs").select("id, title, created_at").order("created_at", { ascending: false });
    const jobIds = (jobs || []).map((j: any) => j.id);

    let totalCandidates = 0;
    let completed = 0;
    let pending = 0;
    const jobCandidateCounts: Record<string, number> = {};
    const jobEvaluatedCounts: Record<string, number> = {};

    if (jobIds.length > 0) {
      const { data: submissions } = await supabase.from("submissions").select("candidate_id, job_id").in("job_id", jobIds);
      const uniqueCandidates = new Set((submissions || []).map((s: any) => s.candidate_id));
      totalCandidates = uniqueCandidates.size;

      for (const jid of jobIds) {
        jobCandidateCounts[jid] = (submissions || []).filter((s: any) => s.job_id === jid).length;
      }

      const { data: aiScores } = await supabase.from("ai_scores").select("candidate_id, job_id").in("job_id", jobIds);
      const evaluatedSet = new Set((aiScores || []).map((a: any) => `${a.candidate_id}:${a.job_id}`));
      for (const a of aiScores || []) {
        jobEvaluatedCounts[a.job_id] = (jobEvaluatedCounts[a.job_id] || 0) + 1;
      }

      const subList = submissions || [];
      for (const s of subList) {
        if (evaluatedSet.has(`${s.candidate_id}:${s.job_id}`)) completed++;
        else pending++;
      }
    }

    const recentJobs = (jobs || []).slice(0, 8);
    res.json({
      total_assessments: jobs?.length ?? 0,
      total_candidates: totalCandidates,
      completed,
      pending,
      recent_assessments: recentJobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        candidate_count: jobCandidateCounts[j.id] ?? 0,
        status: (jobCandidateCounts[j.id] ?? 0) > 0 ? "Active" : "New",
      })),
    });
  } catch (error) {
    console.error("Error fetching recruiter dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/recruiter/score-job/:jobId
router.post("/api/recruiter/score-job/:jobId", authMiddleware, requireRole("recruiter"), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const jobId = req.params.jobId;
    const { data: submissions } = await supabase.from("submissions").select("candidate_id").eq("job_id", jobId);
    const candidateIds = [...new Set((submissions || []).map((s: any) => s.candidate_id))];

    res.json({ triggered: candidateIds.length, message: "AI scoring started in background" });
    for (const id of candidateIds) {
      scoreCandidateBackground(String(id), String(jobId)).catch((err) => console.error(`AI score failed for ${id}:`, err));
    }
  } catch (error) {
    console.error("Error triggering AI scoring:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recruiter/stats/:jobId
router.get("/api/recruiter/stats/:jobId", authMiddleware, requireRole("recruiter"), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const jobId = req.params.jobId;

    const { count: totalApplicants } = await supabase.from("submissions").select("candidate_id", { count: "exact", head: true }).eq("job_id", jobId);

    const { data: subData } = await supabase.from("submissions").select("candidate_id").eq("job_id", jobId);
    const cIds = [...new Set((subData || []).map((s: any) => s.candidate_id))];
    let resumesUploaded = 0;
    if (cIds.length > 0) {
      const { count } = await supabase.from("candidates").select("*", { count: "exact", head: true }).in("id", cIds).eq("resume_status", "processed");
      resumesUploaded = count || 0;
    }

    const { count: testsCompleted } = await supabase.from("results").select("*", { count: "exact", head: true }).eq("job_id", jobId);

    const { data: resData } = await supabase.from("results").select("candidate_id").eq("job_id", jobId);
    const completedIds = new Set((resData || []).map((r: any) => r.candidate_id));
    const testsPending = cIds.filter((id) => !completedIds.has(id)).length;

    res.json({
      total_applicants: totalApplicants || 0,
      resumes_uploaded: resumesUploaded,
      tests_completed: testsCompleted || 0,
      tests_pending: testsPending,
    });
  } catch (error) {
    console.error("Error fetching recruiter stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recruiter/leaderboard/:jobId
router.get("/api/recruiter/leaderboard/:jobId", authMiddleware, requireRole("recruiter"), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const jobId = req.params.jobId;
    const { sort, search } = req.query;

    const { data: subData } = await supabase.from("submissions").select("candidate_id").eq("job_id", jobId);
    const candidateIds = [...new Set((subData || []).map((s: any) => s.candidate_id))];
    if (candidateIds.length === 0) return res.json([]);

    const { data: candidates } = await supabase.from("candidates").select("*").in("id", candidateIds);
    const { data: aiScores } = await supabase.from("ai_scores").select("*").eq("job_id", jobId).in("candidate_id", candidateIds);
    const { data: results } = await supabase.from("results").select("*").eq("job_id", jobId).in("candidate_id", candidateIds);

    const aiMap = new Map((aiScores || []).map((a: any) => [a.candidate_id, a]));
    const resMap = new Map((results || []).map((r: any) => [r.candidate_id, r]));

    let list = (candidates || []).map((c: any) => {
      const a = aiMap.get(c.id);
      const r = resMap.get(c.id);
      const finalScore = a?.final_weighted_score ?? r?.total_score ?? 0;
      return {
        candidate_id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        parsed_skills: c.parsed_skills,
        resume_status: c.resume_status || "none",
        skills_score: a?.skills_score ?? 0,
        experience_score: a?.experience_score ?? 0,
        projects_score: a?.projects_score ?? 0,
        test_score: a?.test_score ?? r?.total_score ?? 0,
        test_raw_score: r?.total_score ?? 0,
        final_weighted_score: finalScore,
        ai_summary: a?.ai_summary ?? "",
        disqualified: !!r?.disqualified,
      };
    });

    list.sort((a: any, b: any) => (b.final_weighted_score || 0) - (a.final_weighted_score || 0));

    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      if (q) {
        list = list.filter((c: any) => {
          if (c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) return true;
          if (c.parsed_skills) {
            try {
              const skills = typeof c.parsed_skills === "string" ? JSON.parse(c.parsed_skills) : c.parsed_skills;
              const arr = Array.isArray(skills) ? skills : [];
              return arr.some((s: string) => String(s || "").toLowerCase().includes(q));
            } catch { return false; }
          }
          return false;
        });
      }
    }

    if (sort && typeof sort === "string") {
      const sortKey = sort as string;
      list.sort((a: any, b: any) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0));
    }

    const result = list.map((c: any, idx: number) => ({
      rank: idx + 1,
      candidate_id: c.candidate_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      resume_status: c.resume_status,
      skills_score: c.skills_score,
      experience_score: c.experience_score,
      projects_score: c.projects_score,
      test_score: c.test_score,
      final_weighted_score: c.final_weighted_score,
      ai_summary: c.ai_summary,
      parsed_skills: c.parsed_skills ? JSON.parse(c.parsed_skills) : [],
      disqualified: c.disqualified,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recruiter/candidate/:candidateId
router.get("/api/recruiter/candidate/:candidateId", authMiddleware, requireRole("recruiter"), async (req: Request, res: Response) => {
  try {
    const supabase = getSupabase();
    const candidateId = req.params.candidateId;
    const { data: candidate, error } = await supabase.from("candidates").select("*").eq("id", candidateId).maybeSingle();
    if (error || !candidate) return res.status(404).json({ error: "Candidate not found" });

    const { data: aiScores } = await supabase.from("ai_scores").select("*").eq("candidate_id", candidateId);
    const { data: results } = await supabase.from("results").select("*, jobs(title)").eq("candidate_id", candidateId).order("evaluated_at", { ascending: false });

    res.json({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || "",
      resume_status: candidate.resume_status || "none",
      resume_file_path: candidate.resume_file_path || null,
      parsed_skills: candidate.parsed_skills ? JSON.parse(candidate.parsed_skills) : [],
      parsed_experience: candidate.parsed_experience ? JSON.parse(candidate.parsed_experience) : [],
      parsed_projects: candidate.parsed_projects ? JSON.parse(candidate.parsed_projects) : [],
      parsed_education: candidate.parsed_education ? JSON.parse(candidate.parsed_education) : [],
      ai_scores: (aiScores || []).map((s: any) => ({
        job_id: s.job_id,
        skills_score: s.skills_score,
        experience_score: s.experience_score,
        projects_score: s.projects_score,
        test_score: s.test_score,
        final_weighted_score: s.final_weighted_score,
        ai_summary: s.ai_summary,
      })),
      results: (results || []).map((r: any) => ({
        ...r,
        job_title: r.jobs?.title,
        skill_scores: r.skill_scores ? (typeof r.skill_scores === "string" ? JSON.parse(r.skill_scores) : r.skill_scores) : {},
        disqualified: !!r.disqualified,
      })),
    });
  } catch (error) {
    console.error("Error fetching candidate detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/recruiter/resume/:candidateId - Download from Supabase Storage
router.get(
  "/api/recruiter/resume/:candidateId",
  (req: Request, res: Response, next: any) => {
    const token = req.query.token;
    if (!req.headers.authorization && token) {
      req.headers.authorization = `Bearer ${Array.isArray(token) ? token[0] : token}`;
    }
    next();
  },
  authMiddleware,
  requireRole("recruiter"),
  async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data: candidate } = await supabase.from("candidates").select("resume_file_path, name").eq("id", req.params.candidateId).maybeSingle();

      if (!candidate || !candidate.resume_file_path) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const { data, error } = await supabase.storage.from("resumes").download(candidate.resume_file_path);
      if (error || !data) {
        return res.status(404).json({ error: "Resume file not found" });
      }

      const ext = candidate.resume_file_path.includes(".docx") ? ".docx" : ".pdf";
      const filename = `${(candidate.name || "resume").replace(/[^a-zA-Z0-9]/g, "_")}_resume${ext}`;
      const buffer = Buffer.from(await data.arrayBuffer());
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", ext === ".pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.send(buffer);
    } catch (error) {
      console.error("Error downloading resume:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
