# AI Hiring Assessment Platform

An AI-powered hiring assessment platform that generates tailored technical assessments from job descriptions, evaluates candidates automatically, and provides detailed performance analytics.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, ShadCN UI
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (via better-sqlite3)

## Features

- **Recruiter Dashboard** (`/recruiter`) — Paste a job description, AI extracts skills and generates 8 assessment questions (5 MCQs, 2 subjective, 1 coding)
- **Candidate Assessment** (`/assessment`) — Timed 30-minute assessment with MCQ, subjective, and coding sections
- **Results & Leaderboard** (`/results`) — Detailed score breakdown, skill-wise performance bars, and candidate rankings

## Getting Started

### Backend

1. Create a `.env` file in the `backend` folder with your **Groq** API key (FREE):

```
GROQ_API_KEY=gsk_your-api-key-here
```

Get your free key at [Groq Console](https://console.groq.com) — no credit card required.

2. Start the server:

```bash
cd backend
npm install
npm run dev
```

Runs on http://localhost:3002 (questions generated via Groq AI — free, unique each time)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:3000

## API Endpoints

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
