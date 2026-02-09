"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  api,
  type CreateJobResponse,
  type EditableQuestion,
  type Job,
  type RecruiterStats,
  type RecruiterDashboard,
  type LeaderboardCandidate,
  type CandidateDetail,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Tab = "dashboard" | "create" | "applicants";
type Step = 1 | 2 | 3 | 4;

const slideIn = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function RecruiterGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "recruiter") router.replace("/candidate");
  }, [user, loading, router]);
  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user || user.role !== "recruiter") return null;
  return <>{children}</>;
}

export default function RecruiterPage() {
  return <RecruiterGuard><RecruiterContent /></RecruiterGuard>;
}

function RecruiterContent() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [preselectJobId, setPreselectJobId] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 bg-black min-h-screen">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-8 border-b border-gray-800 pb-px">
        {[
          { id: "dashboard" as Tab, label: "Dashboard" },
          { id: "create" as Tab, label: "Create Assessment" },
          { id: "applicants" as Tab, label: "Applicants" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
              tab === t.id
                ? "border-primary text-white"
                : "border-transparent text-gray-400 hover:text-white hover:border-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <DashboardTab setTab={setTab} onSelectJob={(id) => { setPreselectJobId(id); setTab("applicants"); }} />
          </motion.div>
        )}
        {tab === "create" && (
          <motion.div key="create" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <CreateAssessmentTab />
          </motion.div>
        )}
        {tab === "applicants" && (
          <motion.div key="applicants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <ApplicantsTab preselectJobId={preselectJobId} onPreselectConsumed={() => setPreselectJobId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================
// DASHBOARD TAB
// =====================
function DashboardTab({ setTab, onSelectJob }: { setTab: (t: Tab) => void; onSelectJob: (jobId: string) => void }) {
  const [dashboard, setDashboard] = useState<RecruiterDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRecruiterDashboard()
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const data = dashboard || {
    total_assessments: 0,
    total_candidates: 0,
    completed: 0,
    pending: 0,
    recent_assessments: [],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Welcome back! Here&apos;s an overview of your hiring activities.</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Assessments", value: data.total_assessments, sub: "Active assessments", icon: "📄" },
          { label: "Total Candidates", value: data.total_candidates, sub: "Across all assessments", icon: "👥" },
          { label: "Completed", value: data.completed, sub: "Evaluated submissions", icon: "✓", color: "text-emerald-400" },
          { label: "Pending Review", value: data.pending, sub: "Awaiting evaluation", icon: "🕐", color: "text-amber-400" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-semibold text-white">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
                <p className="text-[11px] text-gray-500 mt-1">{card.sub}</p>
              </div>
              <span className="text-2xl opacity-70" aria-hidden>{card.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Recent Assessments */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Assessments</h3>
              <p className="text-xs text-gray-400 mt-0.5">Your latest created assessments</p>
            </div>
            <button
              onClick={() => onSelectJob("")}
              className="text-xs font-medium text-primary/80 hover:text-primary/70"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {data.recent_assessments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No assessments yet. Create one to get started.</p>
            ) : (
              data.recent_assessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectJob(a.id)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-800 bg-gray-800/20 hover:bg-gray-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-white">{a.title}</p>
                      <p className="text-[11px] text-gray-400">{a.candidate_count} candidate{a.candidate_count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ${a.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800/40 text-gray-400"}`}>
                    {a.status}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Pro Tip */}
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-all">
            <h3 className="text-sm font-semibold mb-3 text-white">Quick Actions</h3>
            <p className="text-xs text-gray-400 mb-4">Common tasks and shortcuts</p>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => setTab("create")} size="sm" className="justify-start h-9 bg-primary hover:bg-primary/90 text-black">
                + New Assessment
              </Button>
              <Button variant="outline" onClick={() => onSelectJob("")} size="sm" className="justify-start h-9 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                View Candidates
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400" aria-hidden>⚡</span>
              <h3 className="text-sm font-semibold text-white">Pro Tip</h3>
            </div>
            <p className="text-xs text-primary/70 leading-relaxed">
              Use AI-powered JD parsing to automatically generate assessments tailored to your job requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================
// CREATE ASSESSMENT TAB
// =====================
function CreateAssessmentTab() {
  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState("");
  const [mcqCount, setMcqCount] = useState(5);
  const [subjectiveCount, setSubjectiveCount] = useState(2);
  const [codingCount, setCodingCount] = useState(1);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [job, setJob] = useState<{ title: string; required_skills: string[]; experience_level: string; tools_technologies: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateJobResponse | null>(null);
  const [error, setError] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editingQ, setEditingQ] = useState<EditableQuestion | null>(null);

  const totalQuestions = mcqCount + subjectiveCount + codingCount;

  const handleGenerateDraft = async () => {
    if (!description.trim()) { setError("Please paste a job description"); return; }
    setError(""); setLoading(true);
    try {
      const data = await api.generateJobDraft(description, { mcq_count: mcqCount, subjective_count: subjectiveCount, coding_count: codingCount });
      setJob(data.job);
      setQuestions(data.questions.map((q) => ({ type: q.type, question: q.question, options: q.options ?? null, correct_answer: q.correct_answer ?? null, skill: q.skill, difficulty: q.difficulty })));
      setStep(3);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to generate"); }
    finally { setLoading(false); }
  };

  const handleCreateFromScratch = () => {
    if (!description.trim()) { setError("Please paste a job description"); return; }
    setError(""); setLoading(true);
    api.generateJobDraft(description, { mcq_count: 0, subjective_count: 0, coding_count: 0 })
      .then((data) => { setJob(data.job); setQuestions([]); setStep(3); })
      .catch(() => { setJob({ title: "Custom Assessment", required_skills: [], experience_level: "Mid-level", tools_technologies: [] }); setQuestions([]); setStep(3); })
      .finally(() => setLoading(false));
  };

  const openEdit = (idx: number) => { setEditIndex(idx); setEditingQ({ ...questions[idx] }); };
  const saveEdit = () => { if (editingQ && editIndex !== null) { const next = [...questions]; next[editIndex] = editingQ; setQuestions(next); setEditIndex(null); setEditingQ(null); } };

  const addCustomQuestion = (type: "mcq" | "subjective" | "coding") => {
    const defaults: EditableQuestion = { type, question: "", options: type === "mcq" ? ["", "", "", ""] : null, correct_answer: type === "mcq" ? "" : null, skill: "General", difficulty: "Medium" };
    setQuestions((prev) => [...prev, defaults]);
    setEditIndex(questions.length); setEditingQ(defaults);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) { setEditIndex(null); setEditingQ(null); }
    else if (editIndex !== null && editIndex > idx) { setEditIndex(editIndex - 1); }
  };

  const handleFinalize = async () => {
    const valid = questions.filter((q) => q.question.trim());
    if (valid.length === 0) { setError("Add at least one question"); return; }
    if (!job || !description.trim()) return;
    setError(""); setLoading(true);
    try { const data = await api.createJobWithQuestions(job, description, valid); setResult(data); setStep(4); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to create assessment"); }
    finally { setLoading(false); }
  };

  const reset = () => { setStep(1); setDescription(""); setMcqCount(5); setSubjectiveCount(2); setCodingCount(1); setQuestions([]); setJob(null); setResult(null); setError(""); setEditIndex(null); setEditingQ(null); };

  /* Step 4: Success */
  if (result && step === 4) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✓</div>
            <div>
              <h1 className="text-lg font-semibold">Assessment created</h1>
              <p className="text-sm text-muted-foreground">{result.job.title} — {result.questions.length} questions</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Assessment ID</label>
              <div className="flex items-center gap-2 mt-1.5">
                <code className="flex-1 px-3 py-2 bg-muted/50 rounded-md text-sm font-mono break-all select-all text-foreground">{result.job.id}</code>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(result.job.id)} className="shrink-0 hover:bg-white/5">Copy</Button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <Link href={`/assessment?jobId=${result.job.id}`}><Button size="sm">Share link</Button></Link>
            <Link href={`/results?jobId=${result.job.id}`}><Button variant="outline" size="sm" className="hover:bg-white/5">Results</Button></Link>
            <Button variant="ghost" size="sm" onClick={reset} className="hover:bg-white/5">New assessment</Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Create assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure questions from a job description</p>
        {/* Steps */}
        <div className="flex items-center gap-3 mt-5">
          {[
            { n: 1, label: "Description" },
            { n: 2, label: "Method" },
            { n: 3, label: "Questions" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <button
                onClick={() => s.n < step ? setStep(s.n as Step) : undefined}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${step >= s.n ? "text-foreground" : "text-muted-foreground"} ${s.n < step ? "cursor-pointer hover:text-primary" : ""}`}
              >
                <span className={`h-5 w-5 rounded-full text-[10px] flex items-center justify-center font-semibold ${step > s.n ? "bg-primary/20 text-primary" : step === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > s.n ? "✓" : s.n}
                </span>
                {s.label}
              </button>
              {i < 2 && <div className={`w-8 h-px ${step > s.n ? "bg-primary/40" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-5">
            <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-5">
              <div>
                <label className="text-sm font-medium">Job description</label>
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  className="mt-1.5 resize-none text-sm bg-muted/30 border-border/50 focus:border-primary/50"
                />
              </div>
              <Separator className="bg-border/40" />
              <div>
                <label className="text-sm font-medium">Question counts</label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">Set how many of each type to generate</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "MCQ", max: 10, value: mcqCount, set: setMcqCount },
                    { label: "Subjective", max: 5, value: subjectiveCount, set: setSubjectiveCount },
                    { label: "Coding", max: 3, value: codingCount, set: setCodingCount },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md border border-border/40 bg-muted/20 p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1.5">{item.label} <span className="text-[10px]">(max {item.max})</span></div>
                      <Input
                        type="number"
                        min={0}
                        max={item.max}
                        value={item.value}
                        onChange={(e) => item.set(Math.min(item.max, Math.max(0, +e.target.value || 0)))}
                        className="h-8 text-center text-sm bg-transparent border-border/40"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Total: {totalQuestions} questions</p>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={() => setStep(2)} disabled={!description.trim()} size="sm">Continue</Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-card/50 p-5">
              <h3 className="text-sm font-medium mb-1">How do you want to create questions?</h3>
              <p className="text-xs text-muted-foreground mb-5">Generate with AI or start from scratch</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateDraft}
                  disabled={loading}
                  className="group rounded-lg border border-border/50 bg-muted/20 p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="text-sm font-medium group-hover:text-primary transition-colors">
                    {loading ? "Generating..." : "Generate with AI"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{totalQuestions} questions from your JD</p>
                </button>
                <button
                  onClick={handleCreateFromScratch}
                  disabled={loading}
                  className="group rounded-lg border border-border/50 bg-muted/20 p-4 text-left hover:border-border hover:bg-muted/40 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="text-sm font-medium group-hover:text-foreground transition-colors">Start from scratch</div>
                  <p className="text-xs text-muted-foreground mt-1">Add custom questions manually</p>
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="hover:bg-white/5">Back</Button>
          </motion.div>
        )}

        {step === 3 && job && (
          <motion.div key="s3" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-5">
            <div className="rounded-lg border border-border/50 bg-card/50 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{job.title}</h3>
                <span className="text-xs text-muted-foreground">{job.experience_level}</span>
              </div>
              {job.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.required_skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] py-0.5 px-2">{s}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border/50 bg-card/50">
              <div className="p-5 flex items-center justify-between border-b border-border/40">
                <div>
                  <h3 className="text-sm font-semibold">Questions ({questions.length})</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Edit, remove, or add custom questions</p>
                </div>
                <div className="flex gap-1.5">
                  {(["mcq", "subjective", "coding"] as const).map((t) => (
                    <Button key={t} variant="outline" size="sm" onClick={() => addCustomQuestion(t)} className="text-[11px] h-7 px-2 hover:bg-white/5 hover:border-primary/40">
                      + {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <motion.div variants={stagger} initial="hidden" animate="visible" className="divide-y divide-border/30">
                {questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-5">No questions yet. Add some above.</p>
                ) : (
                  questions.map((q, idx) => (
                    <motion.div key={idx} variants={fadeItem} className="group p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant={q.type === "mcq" ? "default" : q.type === "subjective" ? "secondary" : "outline"} className="text-[10px] py-0 px-1.5 h-4">
                              {q.type.toUpperCase()}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{q.skill} · {q.difficulty}</span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed truncate">{q.question || <span className="italic text-muted-foreground">Empty question</span>}</p>
                          {q.options && q.options.length > 0 && (
                            <div className="mt-2 space-y-0.5 pl-1">
                              {q.options.map((opt, i) => (
                                <p key={i} className="text-xs text-muted-foreground">{String.fromCharCode(65 + i)}. {opt}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(idx)} className="h-7 text-xs hover:bg-white/5">Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)} className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">Remove</Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button onClick={handleFinalize} disabled={loading || questions.filter((q) => q.question.trim()).length === 0} size="sm">
                {loading ? "Creating..." : "Create assessment"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="hover:bg-white/5">Back</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingQ !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => (setEditIndex(null), setEditingQ(null))} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border/50 bg-card p-6 shadow-2xl"
            >
              <h3 className="text-sm font-semibold mb-4">Edit question</h3>
              {editingQ && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Question</label>
                    <Textarea
                      value={editingQ.question}
                      onChange={(e) => setEditingQ({ ...editingQ, question: e.target.value })}
                      rows={3}
                      className="mt-1 text-sm bg-muted/30 border-border/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Skill</label>
                      <Input value={editingQ.skill} onChange={(e) => setEditingQ({ ...editingQ, skill: e.target.value })} className="mt-1 h-8 text-sm bg-muted/30 border-border/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Difficulty</label>
                      <select
                        value={editingQ.difficulty}
                        onChange={(e) => setEditingQ({ ...editingQ, difficulty: e.target.value })}
                        className="mt-1 flex h-8 w-full rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-foreground"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  {editingQ.type === "mcq" && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Options</label>
                      {(editingQ.options || ["", "", "", ""]).slice(0, 4).map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{String.fromCharCode(65 + i)}.</span>
                          <Input
                            value={opt}
                            onChange={(e) => { const opts = [...(editingQ.options || ["", "", "", ""])]; opts[i] = e.target.value; setEditingQ({ ...editingQ, options: opts }); }}
                            className="h-8 text-sm bg-muted/30 border-border/50"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-muted-foreground">Correct answer</label>
                        <select
                          value={String(editingQ.options?.findIndex((o) => o === editingQ.correct_answer) ?? -1)}
                          onChange={(e) => { const idx = parseInt(e.target.value, 10); const opts = editingQ.options || []; setEditingQ({ ...editingQ, correct_answer: idx >= 0 && opts[idx] ? opts[idx] : null }); }}
                          className="mt-1 flex h-8 w-full rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-foreground"
                        >
                          <option value="-1">Select correct option</option>
                          {(editingQ.options || []).slice(0, 4).map((opt, i) => (
                            <option key={i} value={i}>{String.fromCharCode(65 + i)}. {opt || "(empty)"}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => (setEditIndex(null), setEditingQ(null))} className="hover:bg-white/5">Cancel</Button>
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ================
// APPLICANTS TAB
// ================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function ApplicantsTab({ preselectJobId, onPreselectConsumed }: { preselectJobId: string | null; onPreselectConsumed: () => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardCandidate[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);
  const [sortBy, setSortBy] = useState("final_weighted_score");
  const [loadingLB, setLoadingLB] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");

  // Load jobs on mount
  useEffect(() => {
    api.getJobs().then((data) => {
      setJobs(data);
      if (data.length > 0) {
        if (preselectJobId && data.some((j) => j.id === preselectJobId)) {
          setSelectedJobId(preselectJobId);
          onPreselectConsumed();
        } else {
          setSelectedJobId(data[0].id);
        }
      }
    }).catch(() => {});
  }, [preselectJobId, onPreselectConsumed]);

  // Load stats + leaderboard when job changes
  const fetchData = useCallback(async () => {
    if (!selectedJobId) return;
    setLoadingLB(true); setError("");
    try {
      const [statsData, lbData] = await Promise.all([
        api.getRecruiterStats(selectedJobId),
        api.getRecruiterLeaderboard(selectedJobId, { sort: sortBy, search: debouncedSearch || undefined }),
      ]);
      setStats(statsData);
      setLeaderboard(lbData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoadingLB(false);
    }
  }, [selectedJobId, sortBy, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCandidateDetail = async (candidateId: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.getCandidateDetail(candidateId);
      setSelectedCandidate(data);
    } catch (err) {
      console.error("Failed to load candidate:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerateAIScores = async () => {
    if (!selectedJobId) return;
    setScoring(true); setError("");
    try {
      await api.triggerAIScoring(selectedJobId);
      await fetchData();
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger AI scoring");
    } finally {
      setScoring(false);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">No assessments created yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Create one in the &quot;Create Assessment&quot; tab first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground shrink-0">Assessment:</label>
        <select
          value={selectedJobId}
          onChange={(e) => { setSelectedJobId(e.target.value); setSelectedCandidate(null); }}
          className="flex h-8 w-full max-w-xs rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-foreground"
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title} ({j.id.slice(0, 8)}...)</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {/* Stats bar */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Applicants", value: stats.total_applicants, color: "text-foreground" },
            { label: "Resumes Uploaded", value: stats.resumes_uploaded, color: "text-blue-400" },
            { label: "Tests Completed", value: stats.tests_completed, color: "text-emerald-400" },
            { label: "Tests Pending", value: stats.tests_pending, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border/50 bg-card/50 p-4">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Score weights + Generate AI button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <p className="text-[11px] font-medium text-primary/90">Score formula</p>
          <p className="text-xs text-muted-foreground">Overall = 30% Skills + 20% Experience + 15% Projects + 35% Test</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateAIScores}
          disabled={scoring || leaderboard.length === 0}
          className="shrink-0 hover:bg-primary/10 hover:border-primary/40"
        >
          {scoring ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2 inline-block" />
              Generating AI scores...
            </>
          ) : (
            "Generate AI Scores"
          )}
        </Button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or skill..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 text-sm bg-muted/30 border-border/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground shrink-0">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex h-8 rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-foreground"
          >
            <option value="final_weighted_score">Overall Score</option>
            <option value="skills_score">Skills (30%)</option>
            <option value="experience_score">Experience (20%)</option>
            <option value="projects_score">Projects (15%)</option>
            <option value="test_score">Test (35%)</option>
          </select>
        </div>
      </div>

      {/* Leaderboard table */}
      {loadingLB ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No applicants yet for this assessment.
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-12">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Candidate</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground min-w-[200px]">AI Summary</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground">Overall</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground hidden sm:table-cell" title="30% weight">Skills</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground hidden sm:table-cell" title="20% weight">Exp</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground hidden sm:table-cell" title="15% weight">Proj</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground hidden md:table-cell" title="35% weight">Test</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted-foreground">Resume</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c) => {
                  const rankColor =
                    c.rank === 1 ? "text-amber-400 bg-amber-500/10" :
                    c.rank === 2 ? "text-slate-300 bg-slate-400/10" :
                    c.rank === 3 ? "text-orange-400 bg-orange-500/10" : "text-muted-foreground bg-muted/20";
                  const hasAIScore = (c.final_weighted_score > 0 && c.ai_summary) || c.ai_summary?.trim().length > 0;

                  return (
                    <tr
                      key={c.candidate_id}
                      className="border-b border-border/20 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => openCandidateDetail(c.candidate_id)}
                    >
                      <td className="py-3 px-4 align-top">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${rankColor}`}>
                          {c.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                        {c.disqualified && <Badge variant="destructive" className="text-[9px] py-0 px-1 h-3.5 mt-1">DQ</Badge>}
                      </td>
                      <td className="py-3 px-4 align-top max-w-[280px]">
                        {hasAIScore ? (
                          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{c.ai_summary}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">Run &quot;Generate AI Scores&quot; for description</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center align-top">
                        <span className="text-sm font-semibold">{Math.round(c.final_weighted_score || c.test_score || 0)}%</span>
                        <div className="flex gap-0.5 justify-center mt-1" title="Skills | Exp | Proj | Test">
                          <div className="h-1 w-4 rounded-sm bg-blue-500/60" style={{ opacity: (c.skills_score || 0) / 100 }} title={`Skills ${Math.round(c.skills_score)}%`} />
                          <div className="h-1 w-4 rounded-sm bg-emerald-500/60" style={{ opacity: (c.experience_score || 0) / 100 }} title={`Exp ${Math.round(c.experience_score)}%`} />
                          <div className="h-1 w-4 rounded-sm bg-purple-500/60" style={{ opacity: (c.projects_score || 0) / 100 }} title={`Proj ${Math.round(c.projects_score)}%`} />
                          <div className="h-1 w-4 rounded-sm bg-amber-500/60" style={{ opacity: (c.test_score || 0) / 100 }} title={`Test ${Math.round(c.test_score)}%`} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center align-top hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{Math.round(c.skills_score)}</span>
                      </td>
                      <td className="py-3 px-3 text-center align-top hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{Math.round(c.experience_score)}</span>
                      </td>
                      <td className="py-3 px-3 text-center align-top hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{Math.round(c.projects_score)}</span>
                      </td>
                      <td className="py-3 px-3 text-center align-top hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{Math.round(c.test_score)}</span>
                      </td>
                      <td className="py-3 px-3 text-center align-top">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] py-0 px-1.5 h-4 ${
                            c.resume_status === "processed" ? "bg-emerald-500/10 text-emerald-400" :
                            c.resume_status === "processing" ? "bg-amber-500/10 text-amber-400" :
                            "bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {c.resume_status === "processed" ? "Yes" : c.resume_status === "processing" ? "..." : "No"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] px-2 hover:bg-white/5"
                          onClick={(e) => { e.stopPropagation(); openCandidateDetail(c.candidate_id); }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate detail modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-border/50 bg-card p-6 shadow-2xl"
            >
              <CandidateDetailView candidate={selectedCandidate} jobId={selectedJobId} onClose={() => setSelectedCandidate(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================
// CANDIDATE DETAIL VIEW
// =====================
function CandidateDetailView({ candidate, jobId, onClose }: { candidate: CandidateDetail; jobId: string; onClose: () => void }) {
  const scoreForJob = candidate.ai_scores.find((s) => s.job_id === jobId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{candidate.name}</h2>
          <p className="text-sm text-muted-foreground">{candidate.email}</p>
          {candidate.phone && <p className="text-xs text-muted-foreground">{candidate.phone}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs hover:bg-white/5">Close</Button>
      </div>

      {/* AI Summary */}
      {scoreForJob?.ai_summary && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary mb-1">AI Summary</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{scoreForJob.ai_summary}</p>
        </div>
      )}

      {/* Score breakdown */}
      {scoreForJob && (
        <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold">Score Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Overall", value: scoreForJob.final_weighted_score, color: "text-foreground" },
              { label: "Skills (30%)", value: scoreForJob.skills_score, color: "text-blue-400" },
              { label: "Experience (20%)", value: scoreForJob.experience_score, color: "text-emerald-400" },
              { label: "Projects (15%)", value: scoreForJob.projects_score, color: "text-purple-400" },
              { label: "Test (35%)", value: scoreForJob.test_score, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-semibold ${s.color}`}>{Math.round(s.value)}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(100, s.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {candidate.parsed_skills.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {candidate.parsed_skills.map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px] py-0.5 px-2">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Experience timeline */}
      {candidate.parsed_experience.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Experience</h3>
          <div className="space-y-2">
            {candidate.parsed_experience.map((exp, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-muted/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{exp.role}</p>
                  <span className="text-[11px] text-muted-foreground">{exp.years}y</span>
                </div>
                <p className="text-xs text-muted-foreground">{exp.company}</p>
                {exp.description && <p className="text-xs text-foreground/60 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {candidate.parsed_projects.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Projects</h3>
          <div className="space-y-2">
            {candidate.parsed_projects.map((proj, i) => (
              <div key={i} className="rounded-md border border-border/40 bg-muted/10 p-3">
                <p className="text-sm font-medium">{proj.name}</p>
                {proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.tech_stack.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                {proj.description && <p className="text-xs text-foreground/60 mt-1">{proj.description}</p>}
                {proj.impact && <p className="text-xs text-emerald-400/70 mt-1">{proj.impact}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {candidate.parsed_education.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Education</h3>
          <div className="space-y-1">
            {candidate.parsed_education.map((edu, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{edu.degree}</span>
                <span className="text-muted-foreground"> — {edu.institution}</span>
                {edu.year && <span className="text-muted-foreground text-xs"> ({edu.year})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download resume button */}
      {candidate.resume_file_path && (
        <div className="pt-2">
          <a
            href={api.getResumeDownloadUrl(candidate.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" size="sm" className="hover:bg-white/5">
              Download Resume
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
