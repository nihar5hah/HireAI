# AI Hiring Platform - Demo Walkthrough Script

## 1. Introduction (0:00 - 0:30)
**Visual:** Start on the Landing Page (`http://localhost:3000`).
**Audio/Text:**
"Welcome to the AI Assessment Platform, a tool designed to streamline the hiring process by automatically generating technical assessments from job descriptions and evaluating candidates with AI precision. Today, I'll walk you through the end-to-end flow, from a recruiter creating a job to a candidate taking the test and viewing the results."

## 2. Recruiter Flow: Generating an Assessment (0:30 - 1:30)
**Visual:**
1. Click on the **"Recruiter Dashboard"** link in the navigation bar or the "Get Started" button.
2. You are now on the Job Creation page.
3. In the text area, paste the following Job Description (JD):
   > "We are looking for a Senior React Developer with experience in Next.js, Tailwind CSS, and Node.js. The candidate should be proficient in building responsive UIs, managing state with Context API, and integrating with RESTful APIs. Experience with TypeScript is required."
4. Click the **"Generate Assessment"** button.
5. Watch the loading state as the AI analyzes the JD.
6. Once finished, you will see a new Job Card appear in the "Recent Jobs" list (e.g., "Senior React Developer").
7. Click on the job to view the generated details.
8. Show the **"Assessment Link"** that can be shared with candidates.

**Audio/Text:**
"First, let's look at the Recruiter experience. We simply paste a raw job description into the dashboard. The system's AI analyzes the text to extract key skills like React, Next.js, and TypeScript. With a single click, it generates a tailored assessment containing multiple-choice questions, subjective scenarios, and a practical coding challenge. No manual question bank management is needed."

## 3. Candidate Flow: Taking the Assessment (1:30 - 3:00)
**Visual:**
1. Navigate to the assessment page (simulated by clicking "Take Test" or copying the link to a new tab).
2. Enter Candidate Details:
   - **Name:** John Doe
   - **Email:** john@example.com
3. Click **"Start Assessment"**.
4. **MCQ Section:** Quickly select answers for the 5 multiple-choice questions. Mention that these test theoretical knowledge.
5. **Subjective Section:**
   - *Question:* "Explain how you would handle state management in a large application."
   - *Answer:* Type a brief response like: "I would use React Context for global state and local state for component-specific data. For complex flows, I might consider Redux or Zustand."
6. **Coding Section:**
   - *Challenge:* "Create a simple counter component."
   - *Code:* Type a simple React component:
     ```jsx
     export default function Counter() {
       const [count, setCount] = React.useState(0);
       return <button onClick={() => setCount(count + 1)}>{count}</button>;
     }
     ```
7. Click **"Submit Assessment"**.

**Audio/Text:**
"Now, let's switch to the Candidate view. The candidate creates a profile and starts the timed assessment. The test is divided into three sections: MCQs to check fundamental concepts, Subjective questions to evaluate problem-solving depth, and a live Coding challenge to test practical implementation skills. The platform ensures a comprehensive evaluation of the candidate's abilities."

## 4. Evaluation & Results (3:00 - 4:00)
**Visual:**
1. After submission, the candidate is redirected to a **"Submission Success"** page or directly to the results (depending on configuration).
2. Navigate back to the **"Results & Leaderboard"** page (`http://localhost:3000/results`).
3. Click on the "Senior React Developer" job.
4. Information to highlight:
   - **Leaderboard:** See "John Doe" ranked at the top.
   - **Score Breakdown:** Technical Score, Subjective Score, Coding Score.
   - **AI Feedback:** Mouse over or expand to see the AI's feedback on the subjective answer (e.g., "Correctly identified Context API for state management").

**Audio/Text:**
"Finally, the results are processed instantly. The Recruiter Dashboard updates with a live leaderboard. We can see 'John Doe' has been ranked based on a weighted score of all three sections. The AI even provides detailed feedback on the subjective answers and analyzes the quality of the submitted code, saving recruiters hours of manual grading time."

## 5. Conclusion (4:00 - 4:30)
**Visual:** Return to the Landing Page.
**Audio/Text:**
"This prototype demonstrates how AI can transform hiring by ensuring every candidate is evaluated fairly and strictly based on the specific requirements of the job. Thank you for watching."
