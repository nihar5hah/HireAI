"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, type JobWithQuestions, type ResumeStatus, type CandidateAIScore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function CandidateGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "candidate") router.replace("/recruiter");
  }, [user, loading, router]);
  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user || user.role !== "candidate") return null;
  return <>{children}</>;
}

function CandidateContent() {
  const { user } = useAuth();
  const router = useRouter();

  // Resume state
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Assessment state
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<JobWithQuestions | null>(null);
  const [aiScore, setAiScore] = useState<CandidateAIScore | null>(null);

  // Fetch resume status on mount and poll while processing
  const fetchResumeStatus = useCallback(async () => {
    try {
      const data = await api.getResumeStatus();
      setResumeStatus(data);
      return data.resume_status;
    } catch {
      return "none";
    }
  }, []);

  useEffect(() => {
    fetchResumeStatus();
  }, [fetchResumeStatus]);

  // Poll when processing
  useEffect(() => {
    if (resumeStatus?.resume_status === "processing") {
      const interval = setInterval(async () => {
        const status = await fetchResumeStatus();
        if (status !== "processing") {
          clearInterval(interval);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [resumeStatus?.resume_status, fetchResumeStatus]);

  // Dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext || "")) {
      setUploadError("Only PDF and DOCX files are accepted");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5MB");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      await api.uploadResume(file);
      setResumeStatus((prev) => prev ? { ...prev, resume_status: "processing" } : { resume_status: "processing", parsed_skills: [], parsed_experience: [], parsed_projects: [], parsed_education: [] });
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const loadJob = async () => {
    if (!jobId.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await api.getJob(jobId.trim());
      setJob(data);
      // Try to fetch AI score for this job
      try {
        const scoreData = await api.getResumeScore(jobId.trim());
        setAiScore(scoreData);
      } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Assessment not found");
    } finally { setLoading(false); }
  };

  const startAssessment = () => {
    router.push(`/assessment?jobId=${jobId.trim()}`);
  };

  const statusColors: Record<string, string> = {
    none: "bg-muted text-muted-foreground",
    uploaded: "bg-blue-500/20 text-blue-400",
    processing: "bg-amber-500/20 text-amber-400",
    processed: "bg-emerald-500/20 text-emerald-400",
    error: "bg-destructive/20 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    none: "No resume",
    uploaded: "Uploaded",
    processing: "AI Processing...",
    processed: "Processed",
    error: "Error - please re-upload",
  };

  const currentStatus = resumeStatus?.resume_status || "none";

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto py-12 px-6 bg-black min-h-screen">
      <motion.div custom={0} variants={fadeUp} className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-white">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Upload your resume, take assessments, and view your scores</p>
      </motion.div>

      {/* Section 1: Resume Upload */}
      <motion.div custom={1} variants={fadeUp} className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4 mb-6 hover:border-gray-700 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Resume</h3>
            <p className="text-xs text-gray-400 mt-0.5">Upload your resume for AI analysis</p>
          </div>
          <Badge className={`text-[10px] py-0.5 px-2 ${statusColors[currentStatus]}`}>
            {statusLabels[currentStatus]}
          </Badge>
        </div>

        {currentStatus === "processing" && (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <p className="text-xs text-amber-200/80">AI is parsing your resume. This may take a moment...</p>
          </div>
        )}

        {currentStatus !== "processing" && (
          <div
            {...getRootProps()}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-700 hover:border-primary/40 hover:bg-primary/5"
            } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-gray-800/50 flex items-center justify-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">
                {isDragActive ? "Drop your resume here" : uploading ? "Uploading..." : "Drag & drop your resume or click to browse"}
              </p>
              <p className="text-[11px] text-gray-500">PDF or DOCX, max 5MB</p>
            </div>
          </div>
        )}

        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

        {/* Parsed skills display */}
        {currentStatus === "processed" && resumeStatus?.parsed_skills && resumeStatus.parsed_skills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Extracted Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {resumeStatus.parsed_skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px] py-0.5 px-2">
                  {skill}
                </Badge>
              ))}
            </div>
            {resumeStatus.parsed_experience.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground font-medium mb-1">Experience</p>
                <div className="space-y-1">
                  {resumeStatus.parsed_experience.slice(0, 3).map((exp, i) => (
                    <p key={i} className="text-xs text-foreground/70">{exp.role} at {exp.company} ({exp.years}y)</p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Section 2: Quick actions */}
      <motion.div custom={2} variants={fadeUp} className="grid sm:grid-cols-2 gap-3 mb-6">
        <Link href="/candidate/results" className="group rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:border-primary/30 hover:bg-gray-900/70 transition-all duration-200">
          <div className="text-sm font-medium group-hover:text-primary/80 transition-colors text-white">My Results</div>
          <p className="text-xs text-gray-400 mt-1">View scores and performance</p>
        </Link>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 transition-all">
          <div className="text-sm font-medium text-white">Profile</div>
          <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
        </div>
      </motion.div>

      {/* Section 3: Assessment lookup */}
      <motion.div custom={3} variants={fadeUp} className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4 hover:border-gray-700 transition-all">
        <div>
          <h3 className="text-sm font-semibold mb-1 text-white">Take an assessment</h3>
          <p className="text-xs text-gray-400">Paste the assessment ID shared by your recruiter</p>
        </div>
        <div>
          <Label htmlFor="jobId" className="text-xs text-gray-400">Assessment ID</Label>
          <Textarea
            id="jobId"
            placeholder="Paste ID here..."
            value={jobId}
            onChange={(e) => { setJobId(e.target.value); setJob(null); setError(""); setAiScore(null); }}
            rows={1}
            className="mt-1 font-mono text-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {!job ? (
          <Button onClick={loadJob} disabled={loading || !jobId.trim()} size="sm" className="bg-primary hover:bg-primary/90 text-black">
            {loading ? "Loading..." : "Look up assessment"}
          </Button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-gray-800 bg-gray-800/20 p-4 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white">{job.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{job.questions.length} questions · 30 min · proctored</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(JSON.parse(typeof job.required_skills === "string" ? job.required_skills : "[]") as string[]).slice(0, 5).map((s: string) => (
                <Badge key={s} variant="secondary" className="text-[10px] py-0.5 px-2">{s}</Badge>
              ))}
            </div>
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span>{job.questions.filter((q) => q.type === "mcq").length} MCQ</span>
              <span>{job.questions.filter((q) => q.type === "subjective").length} Subjective</span>
              <span>{job.questions.filter((q) => q.type === "coding").length} Coding</span>
            </div>

            {/* AI Match score if available */}
            {aiScore?.score && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary/80">
                  Your profile matches {Math.round(aiScore.score.final_weighted_score)}% with job requirements
                </p>
                {aiScore.score.ai_summary && (
                  <p className="text-[11px] text-gray-400 mt-1">{aiScore.score.ai_summary}</p>
                )}
              </motion.div>
            )}

            <Button onClick={startAssessment} size="sm" className="bg-primary hover:bg-primary/90 text-black">Start assessment</Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function CandidatePage() {
  return (
    <CandidateGuard>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
        <CandidateContent />
      </Suspense>
    </CandidateGuard>
  );
}
