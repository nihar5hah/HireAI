import Groq from "groq-sdk";
import { ParsedJobDescription, GeneratedQuestions } from "./types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY?.trim()) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your .env file. Get a FREE key at https://console.groq.com"
    );
  }
  return groq;
}

export async function parseJobDescription(description: string): Promise<ParsedJobDescription> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are an expert recruiter. Extract structured information from job descriptions.
Return ONLY valid JSON with this exact structure (no markdown, no code block):
{"title":"Job Title","required_skills":["Skill1","Skill2",...],"experience_level":"Junior|Mid-level|Senior","tools_technologies":["Tool1","Tool2",...]}
- title: Short job title (max 80 chars)
- required_skills: 4-6 key skills/technologies (e.g. React, Python, SQL)
- experience_level: Junior, Mid-level, or Senior
- tools_technologies: 3-5 tools/technologies (e.g. Git, Docker, AWS)`,
      },
      {
        role: "user",
        content: `Extract from this job description:\n\n${description}`,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() || "{}";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as ParsedJobDescription;

  if (!parsed.title) parsed.title = "Software Engineering Position";
  if (!Array.isArray(parsed.required_skills) || parsed.required_skills.length === 0) {
    parsed.required_skills = ["Problem Solving", "Technical Skills"];
  }
  if (!parsed.experience_level) parsed.experience_level = "Mid-level";
  if (!Array.isArray(parsed.tools_technologies) || parsed.tools_technologies.length === 0) {
    parsed.tools_technologies = ["Git", "VS Code"];
  }

  return parsed;
}

export async function generateQuestions(
  parsed: ParsedJobDescription,
  counts?: { mcq?: number; subjective?: number; coding?: number }
): Promise<GeneratedQuestions> {
  const client = getClient();
  const skills = parsed.required_skills.join(", ");
  const level = parsed.experience_level;
  const mcqCount = Math.min(Math.max(counts?.mcq ?? 5, 0, 10), 10);
  const subCount = Math.min(Math.max(counts?.subjective ?? 2, 0, 5), 5);
  const codeCount = Math.min(Math.max(counts?.coding ?? 1, 0, 3), 3);

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are an expert technical assessor. Generate UNIQUE, CREATIVE assessment questions for a ${level} role.

Return ONLY valid JSON with this exact structure (no markdown, no code block):
{
  "mcqs": [
    {"question":"...","options":["A","B","C","D"],"correct_answer":"exact option text","skill":"SkillName","difficulty":"Easy|Medium|Hard"}
  ],
  "subjective": [
    {"question":"...","skill":"SkillName","difficulty":"Medium|Hard"}
  ],
  "coding": [
    {"question":"Full problem description with example and requirements","skill":"SkillName","difficulty":"Medium|Hard"}
  ]
}

Requirements:
- Generate exactly ${mcqCount} MCQs, ${subCount} subjective, ${codeCount} coding question(s)
- MCQs: 4 options each, correct_answer must exactly match one option. Cover different skills.
- Subjective: Open-ended questions requiring 2-3 paragraph answers
- Coding: One programming problem with clear example input/output. Specify language if relevant.
- Use varied difficulties based on ${level} level
- Be creative - generate NEW questions each time, not generic ones
- Skills should come from: ${skills}`,
      },
      {
        role: "user",
        content: `Generate assessment questions for a ${level} position requiring: ${skills}`,
      },
    ],
    temperature: 0.9, // Higher temperature for variety
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() || "{}";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const result = JSON.parse(cleaned) as GeneratedQuestions;

  // Validate and ensure correct structure
  const mcqs = Array.isArray(result.mcqs) ? result.mcqs.slice(0, mcqCount) : [];
  const subjective = Array.isArray(result.subjective) ? result.subjective.slice(0, subCount) : [];
  const coding = Array.isArray(result.coding) ? result.coding.slice(0, codeCount) : [];

  while (mcqs.length < mcqCount) {
    mcqs.push({
      question: `Explain a key concept in ${parsed.required_skills[0] || "software development"}.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: "Option A",
      skill: parsed.required_skills[0] || "General",
      difficulty: "Medium",
    });
  }

  while (subjective.length < subCount) {
    subjective.push({
      question: "Describe your approach to problem-solving in technical projects.",
      skill: "Problem Solving",
      difficulty: "Medium",
    });
  }
  while (coding.length < codeCount) {
    coding.push({
      question: "Write a function that takes an array of numbers and returns the sum of all positive numbers.",
      skill: parsed.required_skills[0] || "Programming",
      difficulty: "Medium",
    });
  }

  return { mcqs, subjective, coding };
}
