-- Migration: Add recruiter_id column to jobs table
-- Run this in Supabase SQL Editor if you have existing jobs table without recruiter_id
-- Project Settings -> SQL Editor -> New Query -> Paste this

-- Add the recruiter_id column to jobs table (if it doesn't exist)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);

-- Note: You may need to manually set recruiter_id for existing jobs
-- UPDATE jobs SET recruiter_id = '<recruiter_user_id>' WHERE id = '<job_id>';
