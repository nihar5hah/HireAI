const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "recruiter" | "candidate";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  experience_level: string;
  tools_technologies: string[];
  created_at: string;
}

export interface Question {
  id: string;
  type: "mcq" | "subjective" | "coding";
  question: string;
  options: string[] | null;
  skill: string;
  difficulty: string;
  order_index: number;
}

export interface JobWithQuestions extends Job {
  questions: Question[];
}

export interface CreateJobResponse {
  job: {
    id: string;
    title: string;
    required_skills: string[];
    experience_level: string;
    tools_technologies: string[];
  };
  questions: Question[];
}

export interface SubmissionResponse {
  result_id: string;
  submission_id: string;
  total_score: number;
  mcq_score: number;
  subjective_score: number;
  coding_score: number;
  skill_scores: Record<string, number>;
}

export interface QuestionReviewItem {
  id: string;
  type: "mcq" | "subjective" | "coding";
  question: string;
  skill: string;
  your_answer: string;
  correct_answer?: string;
  is_correct?: boolean;
}

export interface ResultDetail {
  id: string;
  submission_id: string;
  candidate_id: string;
  disqualified?: boolean;
  job_id: string;
  question_review?: QuestionReviewItem[];
  proctor_snapshots?: { id: string; image_data: string; captured_at: string }[];
  total_score: number;
  mcq_score: number;
  subjective_score: number;
  coding_score: number;
  skill_scores: Record<string, number>;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  rank: number;
  total_candidates: number;
  evaluated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  candidate_name: string;
  candidate_email: string;
  total_score: number;
  disqualified?: boolean;
  mcq_score: number;
  subjective_score: number;
  coding_score: number;
  skill_scores: Record<string, number>;
  evaluated_at: string;
}

// Resume types
export interface ResumeStatus {
  candidate_id?: string;
  resume_status: "none" | "uploaded" | "processing" | "processed" | "error";
  parsed_skills: string[];
  parsed_experience: Array<{ role: string; company: string; years: number; description: string }>;
  parsed_projects: Array<{ name: string; tech_stack: string[]; description: string; impact: string }>;
  parsed_education: Array<{ degree: string; institution: string; year: string }>;
}

export interface ResumeUploadResponse {
  candidate_id: string;
  status: string;
  message: string;
}

export interface CandidateAIScore {
  score: {
    skills_score: number;
    experience_score: number;
    projects_score: number;
    test_score: number;
    final_weighted_score: number;
    ai_summary: string;
  } | null;
}

// Recruiter types
export interface RecruiterDashboard {
  total_assessments: number;
  total_candidates: number;
  completed: number;
  pending: number;
  recent_assessments: Array<{ id: string; title: string; candidate_count: number; status: string }>;
}

export interface RecruiterStats {
  total_applicants: number;
  resumes_uploaded: number;
  tests_completed: number;
  tests_pending: number;
}

export interface LeaderboardCandidate {
  rank: number;
  candidate_id: string;
  name: string;
  email: string;
  phone: string;
  resume_status: string;
  skills_score: number;
  experience_score: number;
  projects_score: number;
  test_score: number;
  final_weighted_score: number;
  ai_summary: string;
  parsed_skills: string[];
  disqualified: boolean;
}

export interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_status: string;
  resume_file_path: string | null;
  parsed_skills: string[];
  parsed_experience: Array<{ role: string; company: string; years: number; description: string }>;
  parsed_projects: Array<{ name: string; tech_stack: string[]; description: string; impact: string }>;
  parsed_education: Array<{ degree: string; institution: string; year: string }>;
  ai_scores: Array<{
    job_id: string;
    skills_score: number;
    experience_score: number;
    projects_score: number;
    test_score: number;
    final_weighted_score: number;
    ai_summary: string;
  }>;
  results: Array<{
    id: string;
    job_id: string;
    job_title: string;
    total_score: number;
    mcq_score: number;
    subjective_score: number;
    coding_score: number;
    skill_scores: Record<string, number>;
    disqualified: boolean;
  }>;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface GenerateDraftResponse {
  job: { title: string; required_skills: string[]; experience_level: string; tools_technologies: string[] };
  questions: Array<{
    type: "mcq" | "subjective" | "coding";
    question: string;
    options: string[] | null;
    correct_answer: string | null;
    skill: string;
    difficulty: string;
  }>;
}

export interface EditableQuestion {
  type: "mcq" | "subjective" | "coding";
  question: string;
  options?: string[] | null;
  correct_answer?: string | null;
  skill: string;
  difficulty: string;
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    fetchApi<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  login: (email: string, password: string) =>
    fetchApi<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  googleAuth: (email: string, name: string, role: "recruiter" | "candidate") =>
    fetchApi<AuthResponse>("/api/auth/google", { method: "POST", body: JSON.stringify({ email, name, role }) }),

  setRole: (role: "recruiter" | "candidate") =>
    fetchApi<AuthResponse>("/api/auth/set-role", { method: "POST", body: JSON.stringify({ role }) }),

  deleteAccount: () =>
    fetchApi<{ message: string }>("/api/auth/account", { method: "DELETE" }),

  getMe: () => fetchApi<{ user: AuthUser }>("/api/auth/me"),

  // Jobs & assessments
  generateJobDraft: (description: string, counts?: { mcq_count?: number; subjective_count?: number; coding_count?: number }) =>
    fetchApi<GenerateDraftResponse>("/api/jobs/generate", {
      method: "POST",
      body: JSON.stringify({ description, ...counts }),
    }),

  createJobWithQuestions: (job: { title: string; required_skills: string[]; experience_level: string; tools_technologies: string[] }, description: string, questions: EditableQuestion[]) =>
    fetchApi<CreateJobResponse>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ job, description, questions }),
    }),

  createJob: (description: string, counts?: { mcq_count?: number; subjective_count?: number; coding_count?: number }) =>
    fetchApi<CreateJobResponse>("/api/jobs", {
      method: "POST",
      body: JSON.stringify({ description, ...counts }),
    }),

  getJobs: () => fetchApi<Job[]>("/api/jobs"),

  getJob: (id: string) => fetchApi<JobWithQuestions>(`/api/jobs/${id}`),

  submitAssessment: (data: {
    candidate_name: string;
    candidate_email: string;
    job_id: string;
    answers: Record<string, string>;
    time_taken_seconds: number;
    disqualified?: boolean;
    snapshots?: string[];
  }) =>
    fetchApi<SubmissionResponse>("/api/submissions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getResults: (jobId: string) => fetchApi<LeaderboardEntry[]>(`/api/results/${jobId}`),

  getResultDetail: (resultId: string) => fetchApi<ResultDetail>(`/api/results/detail/${resultId}`),

  // Resume endpoints
  uploadResume: async (file: File): Promise<ResumeUploadResponse> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("resume", file);
    const res = await fetch(`${API_BASE}/api/resume/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  getResumeStatus: () => fetchApi<ResumeStatus>("/api/resume/status"),

  getResumeScore: (jobId: string) => fetchApi<CandidateAIScore>(`/api/resume/score/${jobId}`),

  // Recruiter endpoints
  getRecruiterDashboard: () => fetchApi<RecruiterDashboard>("/api/recruiter/dashboard"),
  getRecruiterStats: (jobId: string) => fetchApi<RecruiterStats>(`/api/recruiter/stats/${jobId}`),

  triggerAIScoring: (jobId: string) =>
    fetchApi<{ triggered: number; message: string }>(`/api/recruiter/score-job/${jobId}`, { method: "POST" }),

  getRecruiterLeaderboard: (jobId: string, params?: { sort?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.sort) query.set("sort", params.sort);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return fetchApi<LeaderboardCandidate[]>(`/api/recruiter/leaderboard/${jobId}${qs ? `?${qs}` : ""}`);
  },

  getCandidateDetail: (candidateId: string) =>
    fetchApi<CandidateDetail>(`/api/recruiter/candidate/${candidateId}`),

  getResumeDownloadUrl: (candidateId: string) => {
    const token = getToken();
    return `${API_BASE}/api/recruiter/resume/${candidateId}?token=${token}`;
  },
};
