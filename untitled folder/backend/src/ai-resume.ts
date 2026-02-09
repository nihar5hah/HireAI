import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";
import { getSupabase } from "./supabase";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY?.trim()) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  return groq;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Array<{ role: string; company: string; years: number; description: string }>;
  projects: Array<{ name: string; tech_stack: string[]; description: string; impact: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are an expert resume parser. Extract structured information from the resume text.
Return ONLY valid JSON with this exact structure (no markdown, no code block):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "skills": ["Skill1", "Skill2", ...],
  "experience": [
    {"role": "Job Title", "company": "Company Name", "years": 2, "description": "Brief description of responsibilities"}
  ],
  "projects": [
    {"name": "Project Name", "tech_stack": ["Tech1", "Tech2"], "description": "What the project does", "impact": "Results/metrics achieved"}
  ],
  "education": [
    {"degree": "Degree Name", "institution": "University Name", "year": "2024"}
  ]
}

Rules:
- Extract ALL skills mentioned (programming languages, frameworks, tools, soft skills)
- For experience, estimate years if not explicitly stated
- For projects, extract tech stack from description if not listed separately
- If a field is not found, use empty string or empty array
- Be thorough - extract every relevant detail`,
      },
      { role: "user", content: `Parse this resume:\n\n${resumeText.slice(0, 8000)}` },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() || "{}";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as ParsedResume;

  if (!parsed.name) parsed.name = "";
  if (!parsed.email) parsed.email = "";
  if (!parsed.phone) parsed.phone = "";
  if (!Array.isArray(parsed.skills)) parsed.skills = [];
  if (!Array.isArray(parsed.experience)) parsed.experience = [];
  if (!Array.isArray(parsed.projects)) parsed.projects = [];
  if (!Array.isArray(parsed.education)) parsed.education = [];

  return parsed;
}

export async function scoreCandidate(candidateId: string, jobId: string): Promise<void> {
  const supabase = getSupabase();
  const client = getClient();

  const { data: candidate } = await supabase.from("candidates").select("*").eq("id", candidateId).maybeSingle();
  if (!candidate) throw new Error("Candidate not found");

  const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) throw new Error("Job not found");

  const skills = candidate.parsed_skills ? JSON.parse(candidate.parsed_skills) : [];
  const experience = candidate.parsed_experience ? JSON.parse(candidate.parsed_experience) : [];
  const projects = candidate.parsed_projects ? JSON.parse(candidate.parsed_projects) : [];
  const jobSkills = JSON.parse(job.required_skills || "[]");
  const jobTools = JSON.parse(job.tools_technologies || "[]");

  const { data: result } = await supabase.from("results").select("total_score").eq("candidate_id", candidateId).eq("job_id", jobId).order("evaluated_at", { ascending: false }).limit(1).maybeSingle();
  const testScore = result ? Number(result.total_score) : 0;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are an expert technical recruiter evaluating a candidate against a job posting.
Score each category 0-100 based on the criteria below.
Return ONLY valid JSON (no markdown):
{
  "skills_score": <0-100>,
  "experience_score": <0-100>,
  "projects_score": <0-100>,
  "reasoning": "Brief explanation of scores"
}

Scoring Criteria:
- skills_score: How well do the candidate's skills match the required skills and tools?
- experience_score: Years of relevant experience, role relevance, career progression, company quality.
- projects_score: Project complexity, tech stack alignment, real-world impact, innovation.
Be fair but rigorous. A perfect score (90+) should be rare.`,
      },
      {
        role: "user",
        content: `Job: ${job.title}\nRequired Skills: ${jobSkills.join(", ")}\nTools: ${jobTools.join(", ")}\nLevel: ${job.experience_level}\n\nCandidate Skills: ${skills.join(", ")}\nExperience: ${JSON.stringify(experience)}\nProjects: ${JSON.stringify(projects)}`,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const scoreText = response.choices[0]?.message?.content?.trim() || "{}";
  const scores = JSON.parse(scoreText.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim());

  const skillsScore = Math.min(100, Math.max(0, Number(scores.skills_score) || 0));
  const experienceScore = Math.min(100, Math.max(0, Number(scores.experience_score) || 0));
  const projectsScore = Math.min(100, Math.max(0, Number(scores.projects_score) || 0));
  const finalScore = skillsScore * 0.3 + experienceScore * 0.2 + projectsScore * 0.15 + testScore * 0.35;

  let aiSummary = "";
  try {
    aiSummary = await generateSummary(candidateId);
  } catch (err) {
    console.error("Summary generation failed:", err);
  }

  const { data: existing } = await supabase.from("ai_scores").select("id").eq("candidate_id", candidateId).eq("job_id", jobId).maybeSingle();

  if (existing) {
    await supabase
      .from("ai_scores")
      .update({
        skills_score: skillsScore,
        experience_score: experienceScore,
        projects_score: projectsScore,
        test_score: testScore,
        final_weighted_score: Math.round(finalScore * 100) / 100,
        ai_summary: aiSummary,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("ai_scores").insert({
      id: uuidv4(),
      candidate_id: candidateId,
      job_id: jobId,
      skills_score: skillsScore,
      experience_score: experienceScore,
      projects_score: projectsScore,
      test_score: testScore,
      final_weighted_score: Math.round(finalScore * 100) / 100,
      ai_summary: aiSummary,
    });
  }
}

export async function generateSummary(candidateId: string): Promise<string> {
  const supabase = getSupabase();
  const client = getClient();

  const { data: candidate } = await supabase.from("candidates").select("*").eq("id", candidateId).maybeSingle();
  if (!candidate) throw new Error("Candidate not found");

  const skills = candidate.parsed_skills ? JSON.parse(candidate.parsed_skills) : [];
  const experience = candidate.parsed_experience ? JSON.parse(candidate.parsed_experience) : [];
  const projects = candidate.parsed_projects ? JSON.parse(candidate.parsed_projects) : [];
  const education = candidate.parsed_education ? JSON.parse(candidate.parsed_education) : [];

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Write a 1-2 sentence professional summary of this candidate for a recruiter dashboard. Be concise and factual. Return ONLY the summary text, no JSON, no quotes.`,
      },
      {
        role: "user",
        content: `Name: ${candidate.name}\nSkills: ${skills.join(", ")}\nExperience: ${JSON.stringify(experience)}\nProjects: ${JSON.stringify(projects)}\nEducation: ${JSON.stringify(education)}`,
      },
    ],
    temperature: 0.4,
  });

  return response.choices[0]?.message?.content?.trim() || "No summary available.";
}

export async function scoreCandidateBackground(candidateId: string, jobId: string): Promise<void> {
  try {
    await scoreCandidate(candidateId, jobId);
    console.log(`AI scoring completed for candidate ${candidateId}, job ${jobId}`);
  } catch (err) {
    console.error(`AI scoring failed for candidate ${candidateId}:`, err);
  }
}
