"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, type ResultDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
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

function CandidateResultsContent() {
  const { user } = useAuth();
  const [resultId, setResultId] = useState("");
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scoreColor = (s: number) => s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : s >= 40 ? "text-orange-400" : "text-red-400";

  const loadResult = async () => {
    if (!resultId.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await api.getResultDetail(resultId.trim());
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Result not found");
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto py-12 px-6 bg-black min-h-screen">
      <motion.div custom={0} variants={fadeUp} className="mb-8">
        <Link href="/candidate" className="text-xs text-gray-400 hover:text-white transition-colors mb-3 block">← Back</Link>
        <h1 className="text-xl font-semibold tracking-tight text-white">My Results</h1>
        <p className="text-sm text-gray-400 mt-1">Look up your assessment results</p>
      </motion.div>

      {/* Lookup */}
      <motion.div custom={1} variants={fadeUp} className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4 mb-6 hover:border-gray-700 transition-all">
        <div>
          <Label htmlFor="rid" className="text-xs text-gray-400">Result ID</Label>
          <Textarea
            id="rid"
            placeholder="Paste your result ID..."
            value={resultId}
            onChange={(e) => { setResultId(e.target.value); setResult(null); setError(""); }}
            rows={1}
            className="mt-1 font-mono text-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button onClick={loadResult} disabled={loading || !resultId.trim()} size="sm" className="bg-primary hover:bg-primary/90 text-black">
          {loading ? "Loading..." : "View result"}
        </Button>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Overview */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 text-center hover:border-gray-700 transition-all">
            {result.disqualified && (
              <div className="mb-3">
                <Badge variant="destructive" className="text-xs bg-red-500/20 text-red-400">DISQUALIFIED</Badge>
              </div>
            )}
            <div className={`text-4xl font-bold ${result.disqualified ? "text-red-400" : scoreColor(result.total_score)}`}>
              {result.disqualified ? "0" : result.total_score}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Overall score · {result.job_title}
              {result.total_candidates > 1 && ` · Rank ${result.rank}/${result.total_candidates}`}
            </p>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "MCQ", score: result.mcq_score },
              { label: "Subjective", score: result.subjective_score },
              { label: "Coding", score: result.coding_score },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/40 bg-card/30 p-3 text-center">
                <div className={`text-lg font-bold ${scoreColor(item.score)}`}>{item.score}%</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.label}</p>
                <Progress value={item.score} className="h-1 mt-1.5" />
              </div>
            ))}
          </div>

          {/* Skills */}
          {Object.keys(result.skill_scores).length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card/30 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Skills</h3>
              {Object.entries(result.skill_scores).sort(([, a], [, b]) => b - a).map(([skill, score]) => (
                <div key={skill} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{skill}</span>
                    <span className={scoreColor(score)}>{score}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div className={`h-full rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Question review */}
          {result.question_review && result.question_review.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card/30 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Question Review</h3>
              {result.question_review.map((item, idx) => (
                <div key={item.id} className="rounded-md border border-border/30 bg-muted/10 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === "mcq" ? "default" : item.type === "subjective" ? "secondary" : "outline"} className="text-[10px] py-0 px-1.5 h-4">{item.type.toUpperCase()}</Badge>
                      <span className="text-[11px] text-muted-foreground">{item.skill}</span>
                    </div>
                    {item.is_correct !== undefined && (
                      <span className={`text-[11px] font-medium ${item.is_correct ? "text-emerald-400" : "text-red-400"}`}>{item.is_correct ? "Correct" : "Incorrect"}</span>
                    )}
                  </div>
                  <p className="text-xs">{idx + 1}. {item.question}</p>
                  <p className="text-[11px] text-muted-foreground">Your answer: {item.your_answer || "(none)"}</p>
                  {item.type === "mcq" && !item.is_correct && item.correct_answer && (
                    <p className="text-[11px] text-emerald-400">Correct: {item.correct_answer}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link href="/results?resultId=${resultId}" className="text-xs text-primary hover:underline">
            View full detailed report →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CandidateResultsPage() {
  return (
    <CandidateGuard>
      <CandidateResultsContent />
    </CandidateGuard>
  );
}
