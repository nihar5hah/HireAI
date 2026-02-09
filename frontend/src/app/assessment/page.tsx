"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { api, type JobWithQuestions } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function AssessmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobIdParam = searchParams.get("jobId");

  const [step, setStep] = useState<"select" | "info" | "assessment" | "submitted" | "eliminated">("select");
  const [jobId, setJobId] = useState(jobIdParam || "");
  const [job, setJob] = useState<JobWithQuestions | null>(null);
  const [candidateName, setCandidateName] = useState(user?.name || "");
  const [candidateEmail, setCandidateEmail] = useState(user?.email || "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultId, setResultId] = useState("");
  const [startTime] = useState(Date.now());
  const [eliminated, setEliminated] = useState(false);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tabSwitchCountRef = useRef(0);
  const lastTabSwitchTimeRef = useRef(0);

  useEffect(() => { if (jobIdParam) loadJob(jobIdParam); }, [jobIdParam]);

  const loadJob = async (id: string) => {
    setLoading(true); setError("");
    try { const data = await api.getJob(id); setJob(data); setJobId(id); setStep("info"); }
    catch (err: any) { setError(err.message || "Failed to load assessment"); }
    finally { setLoading(false); }
  };

  const handleStartAssessment = async () => {
    if (!candidateName.trim() || !candidateEmail.trim()) { setError("Enter your name and email"); return; }
    setError(""); setCameraError(""); setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: "user" }, audio: false });
      streamRef.current = stream; setStep("assessment");
    } catch { setCameraError("Camera access required for this proctored assessment."); }
    finally { setCameraLoading(false); }
  };

  useEffect(() => { if (step === "assessment" && streamRef.current && videoRef.current) videoRef.current.srcObject = streamRef.current; }, [step]);
  useEffect(() => { return () => { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } }; }, []);

  const handleSubmit = useCallback(async (disqualifiedReason = false) => {
    if (submitting) return; setSubmitting(true);
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const result = await api.submitAssessment({ candidate_name: candidateName, candidate_email: candidateEmail, job_id: jobId, answers, time_taken_seconds: timeTaken, disqualified: disqualifiedReason, snapshots: snapshots.slice(-30) });
      setResultId(result.result_id); setStep(disqualifiedReason ? "eliminated" : "submitted");
    } catch (err: any) { setError(err.message || "Failed to submit"); setSubmitting(false); }
  }, [submitting, startTime, candidateName, candidateEmail, jobId, answers, snapshots]);

  useEffect(() => {
    if (step !== "assessment" || eliminated) return;
    const handleTabSwitch = () => {
      const now = Date.now(); if (now - lastTabSwitchTimeRef.current < 2000) return;
      lastTabSwitchTimeRef.current = now; tabSwitchCountRef.current += 1;
      if (tabSwitchCountRef.current === 1) setTabSwitchWarning(true);
      else { setEliminated(true); setStep("eliminated"); handleSubmit(true); }
    };
    const handleVis = () => { if (document.hidden) handleTabSwitch(); };
    const handleBlur = () => handleTabSwitch();
    document.addEventListener("visibilitychange", handleVis); window.addEventListener("blur", handleBlur);
    return () => { document.removeEventListener("visibilitychange", handleVis); window.removeEventListener("blur", handleBlur); };
  }, [step, eliminated, handleSubmit]);

  useEffect(() => {
    if (step !== "assessment") return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const i = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(i);
  }, [step, timeLeft, handleSubmit]);

  useEffect(() => {
    if (step !== "assessment" || !streamRef.current) return;
    const capture = () => {
      const video = videoRef.current; if (!video || video.readyState < 2) return;
      const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 240;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.drawImage(video, 0, 0, 320, 240);
      try { const d = canvas.toDataURL("image/jpeg", 0.6); setSnapshots((p) => [...p.slice(-29), d]); } catch {}
    };
    const t = setTimeout(capture, 2000); const i = setInterval(capture, 30000);
    return () => { clearTimeout(t); clearInterval(i); };
  }, [step]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const mcqs = job?.questions.filter((q) => q.type === "mcq") || [];
  const subjective = job?.questions.filter((q) => q.type === "subjective") || [];
  const coding = job?.questions.filter((q) => q.type === "coding") || [];
  const totalQuestions = job?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;

  // Select
  if (step === "select") {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto py-16 px-6 bg-black min-h-screen">
        <h1 className="text-xl font-semibold tracking-tight mb-1 text-white">Take assessment</h1>
        <p className="text-sm text-gray-400 mb-6">Enter the assessment ID to begin</p>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4">
          <div>
            <Label htmlFor="jobId" className="text-xs text-gray-400">Assessment ID</Label>
            <Textarea id="jobId" placeholder="Paste ID here..." value={jobId} onChange={(e) => setJobId(e.target.value)} rows={1} className="mt-1 font-mono text-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button onClick={() => loadJob(jobId)} disabled={loading || !jobId.trim()} size="sm" className="bg-primary hover:bg-primary/90 text-black">
            {loading ? "Loading..." : "Load assessment"}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Info
  if (step === "info" && job) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-lg mx-auto py-16 px-6 space-y-5 bg-black min-h-screen">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">{job.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{totalQuestions} questions · 30 min · proctored</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-xs text-gray-400">Full name</Label>
              <Textarea id="name" placeholder="John Doe" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} rows={1} className="mt-1 text-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs text-gray-400">Email</Label>
              <Textarea id="email" placeholder="john@example.com" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} rows={1} className="mt-1 text-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" />
            </div>
          </div>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-200/80 font-medium mb-1.5">Anti-cheating rules</p>
            <ul className="text-[11px] text-amber-200/60 space-y-1 list-disc list-inside">
              <li>Webcam required — snapshots captured</li>
              <li>Do not switch tabs or minimize browser</li>
              <li>First switch = warning, second = elimination</li>
            </ul>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{mcqs.length} MCQ</span>
            <span>{subjective.length} Subjective</span>
            <span>{coding.length} Coding</span>
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {cameraError && <p className="text-xs text-red-400">{cameraError}</p>}
        <Button onClick={handleStartAssessment} size="sm" disabled={cameraLoading} className="bg-primary hover:bg-primary/90 text-black">
          {cameraLoading ? "Requesting camera..." : "Start assessment"}
        </Button>
      </motion.div>
    );
  }

  // Eliminated
  if (step === "eliminated") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-sm mx-auto py-20 px-6 text-center space-y-4 bg-black min-h-screen flex flex-col justify-center">
        <div className="h-10 w-10 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-lg">✕</div>
        <h1 className="text-lg font-semibold text-red-400">Eliminated</h1>
        <p className="text-sm text-gray-400">Tab switching detected. Your attempt has been disqualified.</p>
        {resultId && <Button variant="outline" size="sm" onClick={() => router.push(`/results?resultId=${resultId}`)} className="bg-gray-800 border-gray-700 hover:bg-gray-700">View record</Button>}
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-gray-400 hover:text-white">Home</Button>
      </motion.div>
    );
  }

  // Submitted
  if (step === "submitted") {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm mx-auto py-20 px-6 text-center space-y-4 bg-black min-h-screen flex flex-col justify-center">
        <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">✓</div>
        <h1 className="text-lg font-semibold text-white">Submitted</h1>
        <p className="text-sm text-gray-400">Your responses have been recorded, {candidateName}.</p>
        <Button size="sm" onClick={() => router.push(`/results?resultId=${resultId}`)} className="bg-primary hover:bg-primary/90 text-black">View results</Button>
      </motion.div>
    );
  }

  // Assessment
  return (
    <div className="max-w-3xl mx-auto py-6 px-6 bg-black min-h-screen">
      {/* Camera */}
      <div className="fixed top-16 right-4 z-50 w-36 rounded-lg border border-gray-800 bg-gray-900 overflow-hidden shadow-xl">
        <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover" style={{ transform: "scaleX(-1)" }} />
        <div className="px-2 py-1 text-[10px] text-center text-gray-400 bg-gray-800">Proctoring</div>
      </div>

      {/* Tab switch warning */}
      <AnimatePresence>
        {tabSwitchWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-w-sm rounded-xl border border-red-500/30 bg-gray-900 p-6 text-center space-y-3">
              <p className="text-sm font-semibold text-red-400">Tab switch detected</p>
              <p className="text-xs text-gray-400">This is your first warning. Next time you will be eliminated.</p>
              <Button size="sm" onClick={() => setTabSwitchWarning(false)} className="bg-primary hover:bg-primary/90 text-black">Continue</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer */}
      <div className="sticky top-14 z-40 bg-black/80 backdrop-blur-lg border-b border-gray-800 py-3 mb-6 -mx-6 px-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-white">{job?.title}</h2>
            <span className="text-xs text-gray-400">{answeredCount}/{totalQuestions}</span>
          </div>
          <span className={`text-sm font-mono font-semibold ${timeLeft < 300 ? "text-red-400" : "text-white"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <Progress value={(answeredCount / totalQuestions) * 100} className="h-1" />
      </div>

      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="space-y-8">
        {/* MCQ */}
        {mcqs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-primary text-black">MCQ</Badge>
              <span className="text-xs text-gray-400">Multiple choice</span>
            </div>
            <div className="space-y-3">
              {mcqs.map((q, idx) => (
                <motion.div key={q.id} variants={fadeUp} className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 hover:border-gray-700 transition-colors">
                  <div className="flex gap-3">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-semibold mt-0.5">{idx + 1}</span>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium leading-relaxed text-white">{q.question}</p>
                      <RadioGroup
                        value={answers[q.id] ? String(q.options?.indexOf(answers[q.id]) ?? -1) : ""}
                        onValueChange={(val) => { const i = parseInt(val, 10); const opt = q.options?.[i]; if (opt != null) setAnswers((p) => ({ ...p, [q.id]: opt })); }}
                      >
                        {q.options?.map((opt, i) => (
                          <div key={i} className="flex items-center space-x-2 py-1 px-2 -mx-2 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt }))}>
                            <RadioGroupItem value={String(i)} id={`${q.id}-${i}`} />
                            <Label htmlFor={`${q.id}-${i}`} className="text-sm cursor-pointer flex-1 text-gray-300">{opt}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Subjective */}
        {subjective.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">SUBJECTIVE</Badge>
              <span className="text-xs text-muted-foreground">Written answers</span>
            </div>
            <div className="space-y-3">
              {subjective.map((q, idx) => (
                <motion.div key={q.id} variants={fadeUp} className="rounded-lg border border-border/40 bg-card/40 p-4 hover:border-border/60 transition-colors">
                  <div className="flex gap-3">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-semibold mt-0.5">{mcqs.length + idx + 1}</span>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                      <Textarea placeholder="Your answer..." value={answers[q.id] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} rows={5} className="resize-none text-sm bg-muted/20 border-border/40" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Coding */}
        {coding.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">CODING</Badge>
              <span className="text-xs text-muted-foreground">Code challenges</span>
            </div>
            <div className="space-y-3">
              {coding.map((q, idx) => (
                <motion.div key={q.id} variants={fadeUp} className="rounded-lg border border-border/40 bg-card/40 p-4 hover:border-border/60 transition-colors">
                  <div className="flex gap-3">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[11px] font-semibold mt-0.5">{mcqs.length + subjective.length + idx + 1}</span>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{q.question}</p>
                      <Textarea placeholder="// Write your code here..." value={answers[q.id] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} rows={10} className="resize-none font-mono text-sm bg-muted/20 border-border/40" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-end gap-3 pt-4 pb-8">
          {error && <p className="text-xs text-destructive self-center">{error}</p>}
          <Button onClick={() => handleSubmit()} disabled={submitting} size="sm">
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <AssessmentContent />
    </Suspense>
  );
}
