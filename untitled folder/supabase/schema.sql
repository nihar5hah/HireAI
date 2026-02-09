-- HireAI Supabase Schema
-- Run this in Supabase SQL Editor: Project Settings -> SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (auth: login/signup)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'candidate')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  tools_technologies TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'subjective', 'coding')),
  question TEXT NOT NULL,
  options TEXT,
  correct_answer TEXT,
  skill TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  phone TEXT,
  resume_file_path TEXT,
  resume_status TEXT DEFAULT 'none',
  parsed_skills TEXT,
  parsed_experience TEXT,
  parsed_projects TEXT,
  parsed_education TEXT,
  raw_resume_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  user_id UUID,
  answers TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  disqualified BOOLEAN DEFAULT false
);

-- Results
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  total_score REAL NOT NULL DEFAULT 0,
  mcq_score REAL NOT NULL DEFAULT 0,
  subjective_score REAL NOT NULL DEFAULT 0,
  coding_score REAL NOT NULL DEFAULT 0,
  skill_scores TEXT NOT NULL DEFAULT '{}',
  disqualified BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- Proctor snapshots
CREATE TABLE IF NOT EXISTS proctor_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  image_data TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- AI Scores
CREATE TABLE IF NOT EXISTS ai_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  skills_score REAL DEFAULT 0,
  experience_score REAL DEFAULT 0,
  projects_score REAL DEFAULT 0,
  test_score REAL DEFAULT 0,
  final_weighted_score REAL DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_submissions_job_id ON submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_submissions_candidate_id ON submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_results_job_id ON results(job_id);
CREATE INDEX IF NOT EXISTS idx_results_candidate_id ON results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_candidate_job ON ai_scores(candidate_id, job_id);
CREATE INDEX IF NOT EXISTS idx_questions_job_id ON questions(job_id);

-- Storage bucket: Create in Supabase Dashboard -> Storage -> New bucket
-- Name: resumes | Public: No (private)
