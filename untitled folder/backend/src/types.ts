export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string; // JSON array
  experience_level: string;
  tools_technologies: string; // JSON array
  created_at: string;
}

export interface Question {
  id: string;
  job_id: string;
  type: "mcq" | "subjective" | "coding";
  question: string;
  options: string | null; // JSON array for MCQs
  correct_answer: string | null; // For MCQs
  skill: string;
  difficulty: string;
  order_index: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Submission {
  id: string;
  candidate_id: string;
  job_id: string;
  answers: string; // JSON object
  submitted_at: string;
  time_taken_seconds: number;
}

export interface Result {
  id: string;
  submission_id: string;
  candidate_id: string;
  job_id: string;
  total_score: number;
  mcq_score: number;
  subjective_score: number;
  coding_score: number;
  skill_scores: string; // JSON object
  evaluated_at: string;
}

export interface ParsedJobDescription {
  title: string;
  required_skills: string[];
  experience_level: string;
  tools_technologies: string[];
}

export interface GeneratedQuestions {
  mcqs: Array<{
    question: string;
    options: string[];
    correct_answer: string;
    skill: string;
    difficulty: string;
  }>;
  subjective: Array<{
    question: string;
    skill: string;
    difficulty: string;
  }>;
  coding: Array<{
    question: string;
    skill: string;
    difficulty: string;
  }>;
}
