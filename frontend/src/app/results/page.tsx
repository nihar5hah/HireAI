"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type ResultDetail, type LeaderboardEntry, type Job } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const resultIdParam = searchParams.get("resultId");
  const jobIdParam = searchParams.get("jobId");

  const [mode, setMode] = useState<"lookup" | "detail" | "leaderboard">(
    resultIdParam ? "detail" : jobIdParam ? "leaderboard" : "lookup"
  );
  const [resultId, setResultId] = useState(resultIdParam || "");
  const [jobId, setJobId] = useState(jobIdParam || "");
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resultIdParam) loadResult(resultIdParam);
    else if (jobIdParam) loadLeaderboard(jobIdParam);
    loadJobs();
  }, [resultIdParam, jobIdParam]);

  const loadJobs = async () => { try { setJobs(await api.getJobs()); } catch {} };
  const loadResult = async (id: string) => {
    setLoading(true); setError("");
    try { const data = await api.getResultDetail(id); setResult(data); setMode("detail"); try { setLeaderboard(await api.getResults(data.job_id)); } catch {} }
    catch (err: any) { setError(err.message || "Failed to load result"); }
    finally { setLoading(false); }
  };
  const loadLeaderboard = async (jId: string) => {
    setLoading(true); setError("");
    try { setLeaderboard(await api.getResults(jId)); setMode("leaderboard"); }
    catch (err: any) { setError(err.message || "Failed to load results"); }
    finally { setLoading(false); }
  };

  const scoreColor = (s: number) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : s >= 40 ? "text-orange-400" : "text-red-400";
  const scoreBg = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : s >= 40 ? "bg-orange-500" : "bg-red-500";

  // Lookup
  if (mode === "lookup") {
    return (
      <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto py-12 px-6 bg-black min-h-screen">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-xl font-semibold tracking-tight mb-1 text-white">Results</h1>
          <p className="text-sm text-gray-400 mb-6">View individual results or leaderboards</p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4 mb-5 hover:border-gray-700 transition-all">
          <div>
            <Label htmlFor="resultId" className="text-xs text-gray-400">Result ID</Label>
            <Textarea id="resultId" placeholder="Paste result ID..." value={resultId} onChange={(e) => setResultId(e.target.value)} rows={1} className="mt-1 font-mono text-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" />
          </div>
          <Button onClick={() => loadResult(resultId)} disabled={loading || !resultId.trim()} size="sm" className="bg-primary hover:bg-primary/90 text-black">
            {loading ? "Loading..." : "View result"}
          </Button>
        </motion.div>

        {jobs.length > 0 && (
          <motion.div custom={2} variants={fadeUp} className="rounded-lg border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-all">
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Assessments</h3>
              <p className="text-xs text-gray-400 mt-0.5">View leaderboard for a specific assessment</p>
            </div>
            <div className="divide-y divide-gray-800">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => { setJobId(job.id); loadLeaderboard(job.id); }}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary/80 transition-colors text-white">{job.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{job.experience_level} · {job.required_skills.slice(0, 3).join(", ")}</p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">→</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {error && <p className="text-sm text-destructive mt-4">{error}</p>}
      </motion.div>
    );
  }

  // Detail
  if (mode === "detail" && result) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => setMode("lookup")} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 block">← Back to results</button>
          <h1 className="text-xl font-semibold tracking-tight">{result.candidate_name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{result.job_title}</p>
        </motion.div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="review">Questions</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="proctor">Proctor</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5 mt-6">
            {result.disqualified && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                <Badge variant="destructive" className="text-xs">DISQUALIFIED</Badge>
                <p className="text-xs text-muted-foreground mt-1.5">Tab switching detected</p>
              </div>
            )}

            {/* Score */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="rounded-lg border border-border/50 bg-card/50 p-8 text-center">
              <div className={`text-5xl font-bold ${result.disqualified ? "text-destructive" : scoreColor(result.total_score)}`}>
                {result.disqualified ? "0" : result.total_score}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Overall score{result.total_candidates > 1 && ` · Rank ${result.rank} of ${result.total_candidates}`}
              </p>
            </motion.div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "MCQ", score: result.mcq_score, weight: "40%" },
                { label: "Subjective", score: result.subjective_score, weight: "30%" },
                { label: "Coding", score: result.coding_score, weight: "30%" },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="rounded-lg border border-border/40 bg-card/30 p-4 text-center">
                  <div className={`text-xl font-bold ${scoreColor(item.score)}`}>{item.score}%</div>
                  <p className="text-[11px] text-muted-foreground mt-1">{item.label} ({item.weight})</p>
                  <Progress value={item.score} className="h-1 mt-2" />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-6">
            <div className="space-y-3">
              {result.question_review?.length ? result.question_review.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-lg border border-border/40 bg-card/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === "mcq" ? "default" : item.type === "subjective" ? "secondary" : "outline"} className="text-[10px] py-0 px-1.5 h-4">{item.type.toUpperCase()}</Badge>
                      <span className="text-[11px] text-muted-foreground">{item.skill}</span>
                    </div>
                    {item.is_correct !== undefined && (
                      <span className={`text-[11px] font-medium ${item.is_correct ? "text-emerald-400" : "text-red-400"}`}>
                        {item.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{idx + 1}. {item.question}</p>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Your answer: </span><span className={item.is_correct === false ? "text-red-400" : ""}>{item.your_answer || "(No answer)"}</span></p>
                    {item.type === "mcq" && item.correct_answer && !item.is_correct && (
                      <p><span className="text-muted-foreground">Correct: </span><span className="text-emerald-400">{item.correct_answer}</span></p>
                    )}
                  </div>
                </motion.div>
              )) : <p className="text-sm text-muted-foreground py-8 text-center">No question review available.</p>}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <div className="rounded-lg border border-border/40 bg-card/30 p-5 space-y-4">
              {Object.entries(result.skill_scores).sort(([, a], [, b]) => b - a).map(([skill, score], i) => (
                <motion.div key={skill} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{skill}</span>
                    <span className={scoreColor(score)}>{score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: "easeOut" as const }}
                      className={`h-full rounded-full ${scoreBg(score)}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="proctor" className="mt-6">
            <div className="rounded-lg border border-border/40 bg-card/30 p-5">
              {result.proctor_snapshots?.length ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {result.proctor_snapshots.map((s, i) => (
                    <div key={s.id} className="space-y-1">
                      <img src={s.image_data} alt={`Snapshot ${i + 1}`} className="w-full aspect-video object-cover rounded-md border border-border/30" />
                      <p className="text-[10px] text-muted-foreground text-center">{new Date(s.captured_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No proctor recordings.</p>}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardTable entries={leaderboard} highlightId={result.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Leaderboard
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => setMode("lookup")} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 block">← Back</button>
        <h1 className="text-xl font-semibold tracking-tight mb-1">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Ranked by overall score</p>
      </motion.div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      <LeaderboardTable entries={leaderboard} />
    </div>
  );
}

function LeaderboardTable({ entries, highlightId }: { entries: LeaderboardEntry[]; highlightId?: string }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No submissions yet.</p>;
  }

  const scoreColor = (s: number) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : s >= 40 ? "text-orange-400" : "text-red-400";

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 divide-y divide-border/30">
      {entries.map((entry, idx) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${highlightId === entry.id ? "bg-primary/5" : ""} ${entry.disqualified ? "opacity-60" : ""}`}
        >
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
            idx === 0 ? "bg-amber-500/15 text-amber-400" : idx === 1 ? "bg-zinc-500/15 text-zinc-300" : idx === 2 ? "bg-orange-500/15 text-orange-400" : "bg-muted text-muted-foreground"
          }`}>
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{entry.candidate_name}</p>
              {entry.disqualified && <Badge variant="destructive" className="text-[9px] py-0 px-1 h-3.5">DQ</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{entry.candidate_email}</p>
          </div>
          <div className="flex items-center gap-5 text-xs shrink-0">
            <div className="hidden sm:block text-center"><p className="text-muted-foreground text-[10px]">MCQ</p><p className="font-medium">{entry.mcq_score}%</p></div>
            <div className="hidden sm:block text-center"><p className="text-muted-foreground text-[10px]">Subj</p><p className="font-medium">{entry.subjective_score}%</p></div>
            <div className="hidden sm:block text-center"><p className="text-muted-foreground text-[10px]">Code</p><p className="font-medium">{entry.coding_score}%</p></div>
            <div className="text-center">
              <p className="text-muted-foreground text-[10px]">Total</p>
              <p className={`text-base font-bold ${scoreColor(entry.total_score)}`}>{entry.total_score}%</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
