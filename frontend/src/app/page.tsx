"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Upload, Zap, Trophy, Code2, Brain, Lock, Gauge } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Home() {
  return (
    <div className="flex flex-col bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] pt-20 pb-20 px-6 lg:px-8 flex items-center">
        {/* Background Gradient Orbs */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-sm">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-primary/80">AI-POWERED ASSESSMENTS</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Don't Hire
                <br />
                Resumes.
                <br />
                Hire
                <span className="text-primary block">Proven Reality.</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                Skip PDF files and gut feelings. Instantly generates job-specific assessments from descriptions. Evaluate candidates with proctored tests and AI scoring.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login?tab=register">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-black font-semibold h-12 px-8 rounded-lg transition-all"
                >
                  Start Free Assessment ↗
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm text-gray-400">
              <span>✓ AI-Powered Scoring</span>
              <span>✓ 2-min setup</span>
            </div>
          </motion.div>

          {/* Right - Terminal/Code Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-b from-slate-900/50 to-black border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-gray-500 ml-4">assessment-results.ai</span>
              </div>

              {/* Terminal Content */}
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-blue-400">
                  <span>→</span>
                  <span>analyze_profile("candidate_001")</span>
                </div>

                <div className="pl-4 space-y-2">
                  <div className="text-gray-500">
                    <span className="text-orange-400">JAVASCRIPT</span>
                    <span className="text-gray-600"> & </span>
                    <span className="text-orange-400">REACT EXPERTISE</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">●</span>
                    <span className="text-primary">Score: 94/100</span>
                    <span className="text-gray-500">[████████░░]</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">●</span>
                    <span className="text-gray-300">3 years experience</span>
                  </div>

                  <div className="text-red-400 mt-3">
                    ! Warning: Weak in System Design
                  </div>
                </div>

                <div className="text-primary pt-2">&gt; assessment_complete</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-8 border-t border-gray-800">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8"
        >
          {[
            { value: "48%", label: "More Applications per Job" },
            { value: "22h", label: "Saved per hiring round" },
            { value: "3x", label: "Faster hiring" },
            { value: "Zero", label: "False candidates" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <h2 className="text-4xl font-bold">
            The Resume is Dead.
            <br />
            <span className="text-gray-400">Stop Trusting PDF Files.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            In the age of AI, resumes tell you nothing. HireAI changes the game by creating uncheatable, role-specific technical tests that prove what candidates actually know.
          </p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 pt-8"
          >
            {[
              "Keyword stuffing doesn't work",
              "Evaluate real problem-solving skills",
              "Catch overqualified & underqualified candidates early",
            ].map((text, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-300">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">
              From Job Description to Leaderboard in Minutes
            </h2>
            <p className="text-gray-400">
              Three simple steps to better hiring decisions
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Upload, title: "Upload JD", desc: "Paste job description" },
              { icon: Zap, title: "AI Generates Test", desc: "MCQs, coding, system design" },
              { icon: Trophy, title: "Rank & Interview", desc: "View leaderboard instantly" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-lime-400/0 to-lime-400/0 group-hover:from-lime-400/5 group-hover:to-blue-400/5 rounded-2xl transition-all" />
                <div className="relative bg-gray-900/50 border border-gray-800 group-hover:border-gray-700 rounded-2xl p-8 text-center space-y-4 transition-all">
                  <item.icon className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <h2 className="text-4xl font-bold text-center">
            The Assessment Engine
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Code2,
                title: "Practical Coding",
                desc: "Real-world problem solving with multiple languages supported",
              },
              {
                icon: Brain,
                title: "System Design",
                desc: "Evaluate architectural thinking and scalability knowledge",
              },
              {
                icon: Lock,
                title: "Subjective Logic",
                desc: "AI-graded open-ended questions for nuanced evaluation",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
              >
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Role Coverage */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl font-bold">Built for Every Technical Role</h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {["Full Stack", "Data Science", "DevOps", "Backend", "Frontend", "Mobile", "ML Engineer"].map((role, i) => (
              <motion.button
                key={i}
                variants={itemVariants}
                className="px-6 py-2 border border-gray-700 hover:border-primary/50 text-gray-300 hover:text-primary rounded-full transition-all text-sm"
              >
                {role}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12"
        >
          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-3xl font-bold">Enterprise-Grade Security</h2>
            <ul className="space-y-4">
              {[
                "End-to-end encrypted assessments",
                "GDPR & SOC 2 compliant",
                "Zero-knowledge architecture",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-3xl font-bold">Fairness & Explainability</h2>
            <ul className="space-y-4">
              {[
                "Bias-free evaluation algorithms",
                "Transparent scoring methodology",
                "Candidate-facing feedback reports",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-8 border-t border-gray-800 bg-gradient-to-b from-black to-gray-900/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl font-bold">
            Ready to Hire Proven Reality?
          </h2>
          <p className="text-gray-400 text-lg">
            Create your first assessment in under 2 minutes. No credit card required.
          </p>
          <Link href="/login?tab=register">
            <Button className="bg-primary hover:bg-primary/90 text-black font-semibold h-12 px-8 rounded-lg transition-all text-lg">
              Get Started Free ↗
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
