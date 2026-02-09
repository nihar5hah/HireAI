# 🎯 HireAI

> **AI-Powered Technical Hiring Platform**  
> Generate smart assessments instantly. Evaluate candidates fairly. Hire confidently.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

---

## ✨ What is HireAI?

HireAI is a modern hiring platform that uses **AI to generate tailored technical assessments** from job descriptions. Recruiters save hours creating tests, candidates get fair evaluations, and you get data-driven hiring decisions—all in minutes.

**2-minute setup • No credit card • Industry-leading accuracy**

---

## 🚀 Key Features

### 📋 Smart Assessment Generation
- Paste a job description → AI extracts required skills
- Auto-generates 8 diverse questions (MCQs, subjective, coding)
- Questions adapt to role complexity
- Completely free (powered by Groq AI)

### 📊 Real-Time Candidate Evaluation
- 30-minute timed assessments
- Instant AI scoring across multiple dimensions
- Skill-wise performance breakdown
- Automated candidate ranking with leaderboards

### 👥 Recruiter Dashboard
- Create unlimited assessments
- Track all candidates in one place
- Export results and reports
- Team collaboration features

### 🔐 Enterprise-Grade Security
- OAuth 2.0 Google authentication
- Password-protected accounts
- Encrypted data storage
- GDPR and privacy-compliant

---

## 🎬 Screenshots

### Landing Page
Professional hero section with compelling messaging and immediate call-to-action.

![Landing Page](/screenshots/landing-page.png)

### Recruiter Dashboard
Complete hiring workflow with assessment management, candidate tracking, and key metrics at a glance.

![Recruiter Dashboard](/screenshots/recruiter-dashboard.png)

### Candidate Portal
Intuitive interface for candidates to upload resumes, take assessments, and view detailed results.

![Candidate Dashboard](/screenshots/candidate-dashboard.png)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, ShadCN UI |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | OAuth 2.0 (Google), Custom JWT |
| **AI** | Groq API (free, no credit card) |
| **Deployment** | Vercel (Frontend), Render (Backend) |
| **Storage** | Supabase Storage (Resume uploads) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Free Groq API key ([Get one here](https://console.groq.com))
- Supabase account ([Sign up free](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nihar5hah/HireAI.git
   cd HireAI
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   ```
   
   Create `.env`:
   ```env
   GROQ_API_KEY=gsk_your-api-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   JWT_SECRET=your-jwt-secret
   ```
   
   Start:
   ```bash
   npm run dev
   ```
   → Runs on http://localhost:3002

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   ```
   
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```
   
   Start:
   ```bash
   npm run dev
   ```
   → Opens on http://localhost:3000

---

## 📚 API Endpoints

- `POST /api/jobs` — Create a job and generate assessment questions
- `GET /api/jobs` — List all jobs
- `GET /api/jobs/:id` — Get job details with questions
- `POST /api/submissions` — Submit assessment answers and get evaluated
- `GET /api/results/:jobId` — Get leaderboard for a job
- `GET /api/results/detail/:resultId` — Get individual result details

## Project Structure

```
ai-hiring-platform/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server entry
│   │   ├── routes.ts         # API routes
│   │   ├── database.ts       # SQLite setup
│   │   ├── ai-mock.ts        # Mock AI functions
│   │   └── types.ts          # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── recruiter/page.tsx # Recruiter dashboard
│   │   │   ├── assessment/page.tsx# Candidate assessment
│   │   │   └── results/page.tsx   # Results & leaderboard
│   │   ├── components/ui/        # ShadCN components
│   │   └── lib/
│   │       └── api.ts            # API client
│   ├── package.json
│   └── tsconfig.json
└── README.md
```
