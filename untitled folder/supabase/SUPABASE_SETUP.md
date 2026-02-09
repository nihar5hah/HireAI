# Supabase Setup for HireAI Backend

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose organization, name the project, set password, select region
4. Wait for the project to be created

## 2. Run the Schema

1. In your Supabase project, go to **SQL Editor**
2. Create a new query and paste the contents of `schema.sql`
3. Click **Run** to create all tables and indexes

## 3. Create the Resumes Storage Bucket

1. Go to **Storage** in the Supabase sidebar
2. Click **New bucket**
3. Name: `resumes`
4. Set to **Private** (not public)
5. Click **Create bucket**

## 4. Get Your Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under Project API keys) → `SUPABASE_SERVICE_KEY`

   ⚠️ Never expose the service_role key in frontend code. Use it only in your backend.

## 5. Configure Backend

Add to `backend/.env`:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Also ensure `GROQ_API_KEY` and `JWT_SECRET` are set.

## 6. Start the Backend

```bash
cd backend
npm run dev
```

The backend will connect to Supabase for all data (users, jobs, candidates, submissions, results, AI scores) and use Supabase Storage for resume files.
