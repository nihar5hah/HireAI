import { ParsedJobDescription, GeneratedQuestions } from "./types";

/**
 * Mock AI: Parse a job description to extract structured information.
 * In production, this would call an LLM API.
 */
export function parseJobDescription(description: string): ParsedJobDescription {
  const text = description.toLowerCase();

  // Extract a title from the first line or generate one
  const lines = description.trim().split("\n");
  const title = lines[0].length < 80 ? lines[0].trim() : "Software Engineering Position";

  // Keyword-based skill extraction
  const skillKeywords: Record<string, string[]> = {
    JavaScript: ["javascript", "js", "ecmascript"],
    TypeScript: ["typescript", "ts"],
    React: ["react", "reactjs", "react.js"],
    "Node.js": ["node", "nodejs", "node.js"],
    Python: ["python", "django", "flask", "fastapi"],
    Java: ["java", "spring", "springboot"],
    SQL: ["sql", "mysql", "postgresql", "postgres", "sqlite"],
    AWS: ["aws", "amazon web services", "s3", "ec2", "lambda"],
    Docker: ["docker", "containerization", "containers"],
    Kubernetes: ["kubernetes", "k8s"],
    Git: ["git", "github", "gitlab", "version control"],
    "REST APIs": ["rest", "api", "restful", "apis"],
    GraphQL: ["graphql"],
    MongoDB: ["mongodb", "mongo", "nosql"],
    CSS: ["css", "sass", "scss", "tailwind", "styled-components"],
    HTML: ["html", "html5"],
    "CI/CD": ["ci/cd", "cicd", "jenkins", "github actions", "pipeline"],
    Testing: ["testing", "jest", "mocha", "pytest", "unit test"],
    "System Design": ["system design", "architecture", "scalable", "distributed"],
    "Machine Learning": ["machine learning", "ml", "ai", "deep learning", "neural"],
  };

  const requiredSkills: string[] = [];
  const toolsTechnologies: string[] = [];

  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      requiredSkills.push(skill);
    }
  }

  // If no skills found, add some defaults based on common patterns
  if (requiredSkills.length === 0) {
    requiredSkills.push("Problem Solving", "Communication", "Technical Skills");
  }

  // Extract tools/technologies (subset of skills + extras)
  const toolKeywords = ["git", "docker", "aws", "jira", "slack", "vscode", "linux", "windows", "mac"];
  for (const tool of toolKeywords) {
    if (text.includes(tool)) {
      const formatted = tool.charAt(0).toUpperCase() + tool.slice(1);
      if (!toolsTechnologies.includes(formatted)) {
        toolsTechnologies.push(formatted);
      }
    }
  }
  if (toolsTechnologies.length === 0) {
    toolsTechnologies.push("Git", "VS Code", "Terminal");
  }

  // Detect experience level
  let experienceLevel = "Mid-level";
  if (text.includes("senior") || text.includes("lead") || text.includes("principal") || text.includes("staff")) {
    experienceLevel = "Senior";
  } else if (
    text.includes("junior") ||
    text.includes("entry") ||
    text.includes("intern") ||
    text.includes("graduate")
  ) {
    experienceLevel = "Junior";
  }

  return {
    title,
    required_skills: requiredSkills.slice(0, 6),
    experience_level: experienceLevel,
    tools_technologies: toolsTechnologies.slice(0, 5),
  };
}

/**
 * Mock AI: Generate assessment questions based on parsed JD.
 * In production, this would call an LLM API.
 */
export function generateQuestions(parsed: ParsedJobDescription): GeneratedQuestions {
  const skills = parsed.required_skills;
  const level = parsed.experience_level;

  const difficultyMap: Record<string, string[]> = {
    Junior: ["Easy", "Easy", "Medium", "Easy", "Medium"],
    "Mid-level": ["Easy", "Medium", "Medium", "Medium", "Hard"],
    Senior: ["Medium", "Medium", "Hard", "Hard", "Hard"],
  };
  const difficulties = difficultyMap[level] || difficultyMap["Mid-level"];

  // Generate MCQs based on detected skills
  const mcqTemplates: Record<string, Array<{ q: string; opts: string[]; ans: string }>> = {
    JavaScript: [
      {
        q: "Which of the following is NOT a JavaScript data type?",
        opts: ["String", "Boolean", "Float", "Symbol"],
        ans: "Float",
      },
      {
        q: "What does 'typeof null' return in JavaScript?",
        opts: ["null", "undefined", "object", "boolean"],
        ans: "object",
      },
    ],
    TypeScript: [
      {
        q: "Which keyword is used to define an interface in TypeScript?",
        opts: ["type", "interface", "class", "struct"],
        ans: "interface",
      },
      {
        q: "What is the TypeScript utility type that makes all properties optional?",
        opts: ["Optional<T>", "Partial<T>", "Maybe<T>", "Nullable<T>"],
        ans: "Partial<T>",
      },
    ],
    React: [
      {
        q: "Which hook is used for side effects in React functional components?",
        opts: ["useState", "useEffect", "useContext", "useMemo"],
        ans: "useEffect",
      },
      {
        q: "What is the virtual DOM in React?",
        opts: [
          "A direct copy of the browser DOM",
          "A lightweight JavaScript representation of the real DOM",
          "A server-side rendering technique",
          "A CSS framework",
        ],
        ans: "A lightweight JavaScript representation of the real DOM",
      },
    ],
    "Node.js": [
      {
        q: "Which module in Node.js is used to work with file systems?",
        opts: ["http", "fs", "path", "url"],
        ans: "fs",
      },
      {
        q: "Node.js is based on which JavaScript engine?",
        opts: ["SpiderMonkey", "V8", "Chakra", "JavaScriptCore"],
        ans: "V8",
      },
    ],
    Python: [
      {
        q: "Which of the following is used to define a function in Python?",
        opts: ["function", "func", "def", "define"],
        ans: "def",
      },
      {
        q: "What is the output of 'type([])' in Python?",
        opts: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
        ans: "<class 'list'>",
      },
    ],
    SQL: [
      {
        q: "Which SQL clause is used to filter grouped results?",
        opts: ["WHERE", "HAVING", "FILTER", "GROUP BY"],
        ans: "HAVING",
      },
      {
        q: "What does ACID stand for in database transactions?",
        opts: [
          "Atomicity, Consistency, Isolation, Durability",
          "Addition, Consistency, Isolation, Data",
          "Atomicity, Control, Isolation, Durability",
          "Atomicity, Consistency, Integration, Durability",
        ],
        ans: "Atomicity, Consistency, Isolation, Durability",
      },
    ],
    default: [
      {
        q: "What is the time complexity of binary search?",
        opts: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        ans: "O(log n)",
      },
      {
        q: "Which data structure uses FIFO ordering?",
        opts: ["Stack", "Queue", "Tree", "Graph"],
        ans: "Queue",
      },
      {
        q: "What does REST stand for?",
        opts: [
          "Representational State Transfer",
          "Remote Execution Service Technology",
          "Reliable State Transition",
          "Resource Execution State Transfer",
        ],
        ans: "Representational State Transfer",
      },
      {
        q: "Which HTTP method is idempotent?",
        opts: ["POST", "PATCH", "PUT", "None of the above"],
        ans: "PUT",
      },
      {
        q: "What is the purpose of version control?",
        opts: [
          "Track changes to code over time",
          "Compile code faster",
          "Deploy applications",
          "Monitor server health",
        ],
        ans: "Track changes to code over time",
      },
    ],
  };

  // Collect MCQ candidates
  const mcqPool: Array<{ q: string; opts: string[]; ans: string; skill: string }> = [];
  for (const skill of skills) {
    const templates = mcqTemplates[skill] || [];
    for (const t of templates) {
      mcqPool.push({ ...t, skill });
    }
  }
  // Fill with defaults
  for (const t of mcqTemplates.default) {
    mcqPool.push({ ...t, skill: skills[0] || "General" });
  }

  const selectedMcqs = mcqPool.slice(0, 5);
  while (selectedMcqs.length < 5) {
    selectedMcqs.push({
      q: `General knowledge question ${selectedMcqs.length + 1}: What is a key principle of software engineering?`,
      opts: ["Modularity", "Redundancy", "Complexity", "Obscurity"],
      ans: "Modularity",
      skill: "General",
    });
  }

  const mcqs = selectedMcqs.map((m, i) => ({
    question: m.q,
    options: m.opts,
    correct_answer: m.ans,
    skill: m.skill,
    difficulty: difficulties[i] || "Medium",
  }));

  // Generate subjective questions
  const subjectiveTemplates: Record<string, string[]> = {
    JavaScript: [
      "Explain the difference between 'var', 'let', and 'const' in JavaScript. When would you use each?",
      "Describe how closures work in JavaScript and provide a practical use case.",
    ],
    React: [
      "Explain the React component lifecycle and how hooks have changed state management in functional components.",
      "Compare and contrast server-side rendering (SSR) and client-side rendering (CSR) in React applications.",
    ],
    Python: [
      "Explain the difference between lists and tuples in Python. When would you choose one over the other?",
      "Describe Python's Global Interpreter Lock (GIL) and its implications for multithreading.",
    ],
    "System Design": [
      "Design a URL shortening service like bit.ly. Describe the key components and data flow.",
      "How would you design a real-time notification system that can handle millions of users?",
    ],
    default: [
      "Describe your approach to debugging a complex production issue. Walk through the steps you would take from detection to resolution.",
      "Explain the concept of clean code architecture. What principles do you follow to ensure maintainable and scalable code?",
    ],
  };

  const subjectivePool: Array<{ question: string; skill: string }> = [];
  for (const skill of skills) {
    const templates = subjectiveTemplates[skill] || [];
    for (const q of templates) {
      subjectivePool.push({ question: q, skill });
    }
  }
  for (const q of subjectiveTemplates.default) {
    subjectivePool.push({ question: q, skill: "General" });
  }

  const subjective = subjectivePool.slice(0, 2).map((s) => ({
    question: s.question,
    skill: s.skill,
    difficulty: level === "Senior" ? "Hard" : "Medium",
  }));

  // Generate coding question
  const codingTemplates: Record<string, string> = {
    JavaScript: `Write a JavaScript function called 'groupBy' that takes an array of objects and a key name, and returns an object where the keys are the unique values of that property and the values are arrays of objects with that property value.

Example:
  groupBy([{name: 'Alice', dept: 'Eng'}, {name: 'Bob', dept: 'HR'}, {name: 'Charlie', dept: 'Eng'}], 'dept')
  // Returns: { Eng: [{name: 'Alice', dept: 'Eng'}, {name: 'Charlie', dept: 'Eng'}], HR: [{name: 'Bob', dept: 'HR'}] }`,
    Python: `Write a Python function called 'flatten_dict' that takes a nested dictionary and returns a flattened dictionary with dot-separated keys.

Example:
  flatten_dict({'a': 1, 'b': {'c': 2, 'd': {'e': 3}}})
  # Returns: {'a': 1, 'b.c': 2, 'b.d.e': 3}`,
    TypeScript: `Write a TypeScript function called 'debounce' that takes a function and a delay in milliseconds, and returns a debounced version of that function. The debounced function should delay invoking the provided function until after 'delay' milliseconds have elapsed since the last time it was invoked.

Include proper TypeScript type annotations.`,
    default: `Write a function called 'findPairs' that takes an array of integers and a target sum, and returns all unique pairs of numbers that add up to the target sum.

Example:
  findPairs([1, 2, 3, 4, 5, 6], 7)
  // Returns: [[1, 6], [2, 5], [3, 4]]

Requirements:
- Each pair should be sorted in ascending order
- The result array should not contain duplicate pairs
- Optimize for time complexity`,
  };

  const codingSkill = skills.find((s) => codingTemplates[s]) || "default";
  const codingQuestion = codingTemplates[codingSkill] || codingTemplates.default;

  const coding = [
    {
      question: codingQuestion,
      skill: codingSkill === "default" ? skills[0] || "Problem Solving" : codingSkill,
      difficulty: level === "Junior" ? "Medium" : "Hard",
    },
  ];

  return { mcqs, subjective, coding };
}

/**
 * Mock AI: Score subjective answers.
 * In production, this would call an LLM API for semantic evaluation.
 */
export function scoreSubjectiveAnswer(question: string, answer: string): number {
  if (!answer || answer.trim().length === 0) return 0;

  const wordCount = answer.trim().split(/\s+/).length;
  let score = 0;

  // Length-based scoring (max 40 points)
  if (wordCount >= 100) score += 40;
  else if (wordCount >= 50) score += 30;
  else if (wordCount >= 20) score += 20;
  else score += 10;

  // Keyword relevance scoring (max 35 points)
  const questionKeywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const answerLower = answer.toLowerCase();
  let keywordMatches = 0;
  for (const kw of questionKeywords) {
    if (answerLower.includes(kw)) keywordMatches++;
  }
  const relevanceRatio = questionKeywords.length > 0 ? keywordMatches / questionKeywords.length : 0;
  score += Math.round(relevanceRatio * 35);

  // Structure bonus (max 25 points)
  if (answer.includes("\n") || answer.includes(". ")) score += 10;
  if (answer.includes("example") || answer.includes("e.g.") || answer.includes("for instance")) score += 10;
  if (wordCount >= 30 && relevanceRatio > 0.2) score += 5;

  return Math.min(score, 100);
}

/**
 * Mock AI: Score coding answers.
 * In production, this would run code in a sandbox and check test cases.
 */
export function scoreCodingAnswer(question: string, answer: string): number {
  if (!answer || answer.trim().length === 0) return 0;

  let score = 0;
  const code = answer.trim();

  // Has function definition (max 20 points)
  if (code.includes("function") || code.includes("=>") || code.includes("def ") || code.includes("const ")) {
    score += 20;
  }

  // Code length and complexity (max 30 points)
  const lines = code.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length >= 10) score += 30;
  else if (lines.length >= 5) score += 20;
  else if (lines.length >= 2) score += 10;

  // Has control flow (max 15 points)
  if (code.includes("if") || code.includes("for") || code.includes("while") || code.includes("switch")) {
    score += 15;
  }

  // Has return statement (max 10 points)
  if (code.includes("return")) score += 10;

  // Uses relevant constructs (max 15 points)
  const constructs = ["map", "filter", "reduce", "forEach", "Object", "Array", "Set", "Map", "sort"];
  const usedConstructs = constructs.filter((c) => code.includes(c));
  score += Math.min(usedConstructs.length * 5, 15);

  // Error handling bonus (max 10 points)
  if (code.includes("try") || code.includes("catch") || code.includes("throw") || code.includes("Error")) {
    score += 10;
  }

  return Math.min(score, 100);
}
