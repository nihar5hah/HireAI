# AI Hiring Platform - Full Production Screenplay

This is a word-for-word script for your video recording. Follow the **Visual** instructions for what to do on screen, and read the **Audio** lines clearly.

---

### **Scene 1: Introduction**
**Time:** 0:00 - 0:25
**Setup:** Open browser to `http://localhost:3000`. Mouse cursor hidden or roughly in the center.

**Visual:**
1.  Start on the Home Page.
2.  Slowly scroll down to the "How It Works" section.
3.  Scroll back up to the top.

**Audio:**
"Hello, and welcome. Today, I’m excited to demonstrate the AI Hiring Assessment Platform—a next-generation tool designed to eliminate unqualified job applications and streamline the technical hiring process. Unlike traditional platforms, our system uses Artificial Intelligence to generate role-specific assessments directly from your job descriptions, ensuring every candidate is evaluated fairly and accurately."

---

### **Scene 2: Recruiter Workflow**
**Time:** 0:25 - 1:15
**Setup:** Mouse over "Recruiter Dashboard".

**Visual:**
1.  Click **"Recruiter Dashboard"**.
2.  Click into the text area labeled "Job Description".
3.  Paste the following text (copy this beforehand):
    > *We are looking for a Senior React Developer with experience in Next.js, Tailwind CSS, and Node.js. The candidate must be proficient in the Context API and performance optimization.*
4.  Pause for 1 second.
5.  Click the blue **"Generate Assessment"** button.
6.  Wait for the loading spinner to complete.
7.  New job card appears: "Senior React Developer".
8.  Click on the card to expand it.
9.  Highlight/hover over the "Skills" tags (React, Next.js, Node.js).
10. Click the **"Copy Link"** button (or "View Assessment").

**Audio:**
"Let’s start with the Recruiter experience. Traditionally, creating a technical test takes hours. With our platform, you simply paste the Job Description into the dashboard. Watch as I input a requirement for a Senior React Developer. I click 'Generate', and within seconds, the AI analyzes the text, extracts key skills like Next.js and Tailwind, and automatically constructs a relevant assessment. It’s that fast."

---

### **Scene 3: Candidate Assessment**
**Time:** 1:15 - 2:45
**Setup:** You are now on the Assessment Page (or opened the link in a new tab).

**Visual:**
1.  **Form:** Enter Name: `Alex Dev`. Email: `alex@example.com`.
2.  Click **"Start Assessment"**.
3.  **MCQ Section:**
    *   Q1: Select Option A.
    *   Q2: Select Option B.
    *   Q3: Select Option C.
    *   (Do this at a moderate pace, don't rush).
4.  Scroll down to **Subjective Question**.
5.  **Type:** "I optimize performance by using React.memo to prevent unnecessary re-renders and lazy loading components handling large datasets." (Type this out or slow paste).
6.  Scroll down to **Coding Challenge**.
7.  **Type:**
    ```javascript
    function Button({ label }) {
      return <button className="p-4 bg-blue-500 text-white">{label}</button>;
    }
    ```
8.  Click **"Submit Assessment"**.

**Audio:**
"Now, let’s see the Candidate's perspective. The candidate, Alex, receives the unique link and starts the test. The assessment is divided into three parts. First, AI-generated Multiple Choice Questions to test theoretical knowledge. Second, a Subjective section where the candidate explains their approach to real-world scenarios. And finally, a Coding Challenge to verify hands-on skills. The intuitive interface ensures candidates can focus entirely on demonstrating their expertise."

---

### **Scene 4: AI Evaluation & Leaderboard**
**Time:** 2:45 - 3:45
**Setup:** Navigate to `http://localhost:3000/results`.

**Visual:**
1.  Click **"Results"** in the top navigation.
2.  Select the **"Senior React Developer"** job from the list.
3.  See "Alex Dev" at the top of the leaderboard with a score (e.g., 85%).
4.  Click on "Alex Dev" to open the detailed report.
5.  Scroll to the **"Subjective Evaluation"** section.
6.  Hover over the AI feedback text (e.g., "Good understanding of optimization...").
7.  Scroll to the **"Code Quality"** section.

**Audio:**
"Once submitted, the evaluation is instant. Back in the Results Dashboard, we see a real-time leaderboard. Alex is ranked at the top with a weighted score. But it goes deeper than just a number—click on the candidate, and you get a comprehensive report. Look here: the AI has graded the subjective answer, highlighting strong points about 'lazy loading,' and analyzed the code snippet for syntax and best practices. This automated insight saves recruiters hours of manual review."

---

### **Scene 5: Conclusion**
**Time:** 3:45 - 4:15
**Setup:** Return to the Landing Page or stay on the Report.

**Visual:**
1.  Navigate back to the **Home Page**.
2.  Leave the screen static on the hero section.

**Audio:**
"In summary, this AI Hiring Platform bridges the gap between job requirements and candidate skills. It ensures fairness, reduces bias, and drastically cuts down time-to-hire. Thank you for watching this demonstration of the future of recruitment."

---
