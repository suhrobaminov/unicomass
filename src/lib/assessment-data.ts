// 30 Likert questions for Find Your Major.
// Each question maps to one trait; answers 1..5 add points to that trait.
// Some questions can be reverse-scored via `reverse: true`.

export type TraitKey =
  | "mathematics" | "science" | "business" | "technology" | "healthcare"
  | "law" | "psychology" | "art" | "creativity" | "leadership"
  | "communication" | "teamwork" | "independence" | "analytical" | "problem_solving"
  | "curiosity" | "research" | "entrepreneurship" | "design" | "engineering"
  | "helping_people" | "writing" | "public_speaking" | "numbers" | "working_with_people"
  | "attention_detail" | "organization" | "adaptability" | "innovation" | "long_term";

export type Question = {
  id: number;
  trait: TraitKey;
  text: string;
  reverse?: boolean;
};

export const QUESTIONS: Question[] = [
  { id: 1,  trait: "mathematics",       text: "I genuinely enjoy solving math problems, even in my free time." },
  { id: 2,  trait: "science",           text: "I'm fascinated by how the natural world works — biology, chemistry, physics." },
  { id: 3,  trait: "business",          text: "I like reading about companies, markets, and how businesses grow." },
  { id: 4,  trait: "technology",        text: "I love exploring new software, apps, and digital tools." },
  { id: 5,  trait: "healthcare",        text: "I feel drawn to helping people with their physical or mental health." },
  { id: 6,  trait: "law",               text: "Debating rules, ethics, and justice energizes me." },
  { id: 7,  trait: "psychology",        text: "Understanding why people think and behave the way they do fascinates me." },
  { id: 8,  trait: "art",               text: "Making or experiencing art (visual, musical, performing) is important to me." },
  { id: 9,  trait: "creativity",        text: "I often come up with original ideas that surprise people." },
  { id: 10, trait: "leadership",        text: "I naturally take charge when a group needs direction." },
  { id: 11, trait: "communication",     text: "I can explain complex ideas clearly to people who don't share my background." },
  { id: 12, trait: "teamwork",          text: "I do my best work when collaborating with a team." },
  { id: 13, trait: "independence",      text: "I'd rather work independently on my own projects than in a big team.", },
  { id: 14, trait: "analytical",        text: "I like breaking big problems into smaller pieces and analyzing each part." },
  { id: 15, trait: "problem_solving",   text: "I keep working on a difficult problem until I crack it." },
  { id: 16, trait: "curiosity",         text: "I frequently research topics just because I'm curious, not because I have to." },
  { id: 17, trait: "research",          text: "I enjoy digging into academic papers, data, and long-form investigations." },
  { id: 18, trait: "entrepreneurship",  text: "I dream about starting my own company or product." },
  { id: 19, trait: "design",            text: "I care a lot about how things look, feel, and are experienced." },
  { id: 20, trait: "engineering",       text: "I like building physical or mechanical things that work." },
  { id: 21, trait: "helping_people",    text: "A career that directly improves people's lives is essential to me." },
  { id: 22, trait: "writing",           text: "I express myself well through writing — essays, stories, or long-form posts." },
  { id: 23, trait: "public_speaking",   text: "Speaking in front of a crowd feels energizing, not scary." },
  { id: 24, trait: "numbers",           text: "I'm comfortable working with numbers, spreadsheets, and quantitative data." },
  { id: 25, trait: "working_with_people", text: "I get energy from spending my day interacting with other people." },
  { id: 26, trait: "attention_detail",  text: "I notice small mistakes and inconsistencies that others miss." },
  { id: 27, trait: "organization",      text: "I keep my schedule, files, and projects highly organized." },
  { id: 28, trait: "adaptability",      text: "I adjust quickly when plans, tools, or requirements change." },
  { id: 29, trait: "innovation",        text: "I'd rather invent a new approach than perfect an existing one." },
  { id: 30, trait: "long_term",         text: "I have a clear long-term vision for the kind of career I want." },
];

export type Major = {
  slug: string;
  name: string;
  category: "Technology" | "Business" | "Health" | "Engineering" | "Arts & Design" | "Humanities" | "Sciences" | "Social Sciences";
  blurb: string;
  requiredSkills: string[];
  focusSubjects: string[];
  careers: string[];
  salaryUSD: string;
  outlook: "Fast-growing" | "Growing" | "Stable" | "Competitive";
  difficulty: "Moderate" | "Challenging" | "Very Challenging";
  topSchools: string[];
  scholarships: string[];
  // Trait weights 0..5 (higher = more important to this major).
  weights: Partial<Record<TraitKey, number>>;
};

const w = (obj: Partial<Record<TraitKey, number>>) => obj;

export const MAJORS: Major[] = [
  {
    slug: "computer-science",
    name: "Computer Science",
    category: "Technology",
    blurb: "The theory and practice of computation — algorithms, systems, and software that shape the modern world.",
    requiredSkills: ["Logical reasoning", "Programming", "Abstract thinking", "Debugging patience"],
    focusSubjects: ["Discrete Math", "Algorithms", "Data Structures", "Operating Systems"],
    careers: ["Software Engineer", "Systems Architect", "Research Scientist", "Tech Founder"],
    salaryUSD: "$95k – $180k",
    outlook: "Fast-growing",
    difficulty: "Challenging",
    topSchools: ["MIT", "Stanford", "Carnegie Mellon", "UC Berkeley", "ETH Zurich"],
    scholarships: ["Google Lime", "Palantir Future Scholars", "Meta Engineering"],
    weights: w({ mathematics: 5, technology: 5, analytical: 5, problem_solving: 5, curiosity: 4, independence: 3, innovation: 4, engineering: 3, attention_detail: 3 }),
  },
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    category: "Technology",
    blurb: "Building systems that learn, reason, and perceive — from language models to autonomous agents.",
    requiredSkills: ["Linear algebra", "Statistics", "Python", "Research reading"],
    focusSubjects: ["ML", "Probability", "Deep Learning", "Optimization"],
    careers: ["ML Engineer", "AI Researcher", "Applied Scientist", "Robotics Engineer"],
    salaryUSD: "$120k – $250k",
    outlook: "Fast-growing",
    difficulty: "Very Challenging",
    topSchools: ["Stanford", "MIT", "CMU", "Oxford", "Tsinghua"],
    scholarships: ["OpenAI Residency", "DeepMind Scholarship", "NSF GRFP"],
    weights: w({ mathematics: 5, technology: 5, analytical: 5, research: 5, problem_solving: 5, curiosity: 5, innovation: 5, numbers: 4 }),
  },
  {
    slug: "data-science",
    name: "Data Science",
    category: "Technology",
    blurb: "Turning messy data into decisions using statistics, code, and visualization.",
    requiredSkills: ["Statistics", "SQL", "Python/R", "Storytelling with data"],
    focusSubjects: ["Statistics", "Machine Learning", "Databases", "Experimentation"],
    careers: ["Data Scientist", "Analytics Lead", "Quant Analyst", "BI Engineer"],
    salaryUSD: "$90k – $170k",
    outlook: "Fast-growing",
    difficulty: "Challenging",
    topSchools: ["CMU", "Berkeley", "NYU", "Imperial College London"],
    scholarships: ["Data Incubator", "AAUW STEM", "Palantir Scholarship"],
    weights: w({ mathematics: 5, numbers: 5, analytical: 5, technology: 4, research: 4, curiosity: 4, attention_detail: 4, problem_solving: 4 }),
  },
  {
    slug: "software-engineering",
    name: "Software Engineering",
    category: "Technology",
    blurb: "Designing, shipping, and maintaining real-world software at scale.",
    requiredSkills: ["Programming", "System design", "Collaboration", "Testing mindset"],
    focusSubjects: ["Software Design", "Databases", "Distributed Systems", "DevOps"],
    careers: ["Software Engineer", "SRE", "Tech Lead", "Startup CTO"],
    salaryUSD: "$100k – $200k",
    outlook: "Fast-growing",
    difficulty: "Challenging",
    topSchools: ["Waterloo", "CMU", "Georgia Tech", "TU Munich"],
    scholarships: ["ACM Scholarship", "GitHub Campus Experts", "Rewriting the Code"],
    weights: w({ technology: 5, engineering: 4, problem_solving: 5, teamwork: 4, analytical: 4, attention_detail: 4, organization: 3, adaptability: 4 }),
  },
  {
    slug: "computer-engineering",
    name: "Computer Engineering",
    category: "Engineering",
    blurb: "The bridge between hardware and software — chips, embedded systems, and robotics.",
    requiredSkills: ["Circuits", "C/C++", "Systems thinking", "Lab discipline"],
    focusSubjects: ["Digital Logic", "Embedded Systems", "Signals", "Computer Architecture"],
    careers: ["Hardware Engineer", "Embedded Engineer", "Robotics Engineer", "Chip Designer"],
    salaryUSD: "$95k – $170k",
    outlook: "Growing",
    difficulty: "Very Challenging",
    topSchools: ["MIT", "Berkeley", "Georgia Tech", "TU Delft"],
    scholarships: ["IEEE Scholarships", "SWE Scholarship", "SMART Scholarship"],
    weights: w({ engineering: 5, mathematics: 5, technology: 5, problem_solving: 5, attention_detail: 4, analytical: 5, science: 3 }),
  },
  {
    slug: "mechanical-engineering",
    name: "Mechanical Engineering",
    category: "Engineering",
    blurb: "Designing physical systems that move — from prosthetics to spacecraft.",
    requiredSkills: ["Physics", "CAD", "Prototyping", "Numerical methods"],
    focusSubjects: ["Thermodynamics", "Dynamics", "Materials", "Design"],
    careers: ["Design Engineer", "Aerospace Engineer", "Manufacturing Lead"],
    salaryUSD: "$75k – $140k",
    outlook: "Growing",
    difficulty: "Challenging",
    topSchools: ["MIT", "Michigan", "Stanford", "ETH Zurich"],
    scholarships: ["ASME Auxiliary", "SAE Scholarships", "NDSEG"],
    weights: w({ engineering: 5, mathematics: 4, science: 4, problem_solving: 5, analytical: 4, attention_detail: 4, design: 3 }),
  },
  {
    slug: "electrical-engineering",
    name: "Electrical Engineering",
    category: "Engineering",
    blurb: "Power, signals, and circuits — the invisible infrastructure of modern life.",
    requiredSkills: ["Calculus", "Circuit analysis", "Signal processing"],
    focusSubjects: ["Electromagnetism", "Signals & Systems", "Power", "Control"],
    careers: ["Power Engineer", "RF Engineer", "Control Systems Engineer"],
    salaryUSD: "$85k – $150k",
    outlook: "Growing",
    difficulty: "Very Challenging",
    topSchools: ["MIT", "Stanford", "Caltech", "Tsinghua"],
    scholarships: ["IEEE PES", "SMART", "GEM Fellowship"],
    weights: w({ engineering: 5, mathematics: 5, science: 4, analytical: 5, problem_solving: 5, attention_detail: 4 }),
  },
  {
    slug: "business-administration",
    name: "Business Administration",
    category: "Business",
    blurb: "The broad toolkit for running organizations — strategy, operations, and people.",
    requiredSkills: ["Communication", "Analysis", "Leadership", "Judgment"],
    focusSubjects: ["Accounting", "Marketing", "Strategy", "Operations"],
    careers: ["Consultant", "Product Manager", "Operations Lead", "General Manager"],
    salaryUSD: "$70k – $150k",
    outlook: "Stable",
    difficulty: "Moderate",
    topSchools: ["Wharton", "Harvard", "INSEAD", "LSE"],
    scholarships: ["Forte Foundation", "Toigo Fellowship", "Reaching Out MBA"],
    weights: w({ business: 5, leadership: 5, communication: 4, working_with_people: 4, organization: 4, teamwork: 4, long_term: 3 }),
  },
  {
    slug: "finance",
    name: "Finance",
    category: "Business",
    blurb: "How capital, risk, and value flow through markets and companies.",
    requiredSkills: ["Quantitative analysis", "Modeling", "Judgment under uncertainty"],
    focusSubjects: ["Corporate Finance", "Investments", "Econometrics", "Accounting"],
    careers: ["Investment Banker", "Quant", "PE Analyst", "CFO track"],
    salaryUSD: "$95k – $250k+",
    outlook: "Competitive",
    difficulty: "Challenging",
    topSchools: ["Wharton", "NYU Stern", "LSE", "Chicago Booth"],
    scholarships: ["Robert Half", "Jane Street", "Two Sigma Diversity"],
    weights: w({ business: 5, mathematics: 4, numbers: 5, analytical: 5, attention_detail: 4, long_term: 4, organization: 3 }),
  },
  {
    slug: "marketing",
    name: "Marketing",
    category: "Business",
    blurb: "The science and craft of getting the right product to the right people.",
    requiredSkills: ["Storytelling", "Analytics", "Empathy", "Design taste"],
    focusSubjects: ["Consumer Behavior", "Brand", "Digital Marketing", "Analytics"],
    careers: ["Brand Manager", "Growth Marketer", "Product Marketer"],
    salaryUSD: "$65k – $140k",
    outlook: "Growing",
    difficulty: "Moderate",
    topSchools: ["Kellogg", "NYU Stern", "IE Business School"],
    scholarships: ["AMA Foundation", "AAF Most Promising"],
    weights: w({ business: 4, creativity: 5, communication: 5, writing: 4, design: 3, working_with_people: 4, curiosity: 4 }),
  },
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship",
    category: "Business",
    blurb: "Building new ventures — spotting problems, prototyping fast, and shipping to real users.",
    requiredSkills: ["Grit", "Sales", "Prototyping", "Fundraising"],
    focusSubjects: ["Startup Strategy", "Product", "Finance for Founders", "Design Thinking"],
    careers: ["Founder", "Startup Operator", "VC Analyst"],
    salaryUSD: "Highly variable",
    outlook: "Growing",
    difficulty: "Challenging",
    topSchools: ["Babson", "Stanford", "MIT Sloan", "IE"],
    scholarships: ["Thiel Fellowship", "Kairos Society", "Endeavor Scholars"],
    weights: w({ entrepreneurship: 5, leadership: 5, innovation: 5, adaptability: 5, communication: 4, business: 4, independence: 4, long_term: 4 }),
  },
  {
    slug: "medicine",
    name: "Medicine (Pre-Med)",
    category: "Health",
    blurb: "The long, demanding path to becoming a physician — deep science and deep empathy.",
    requiredSkills: ["Biology", "Empathy", "Endurance", "Attention to detail"],
    focusSubjects: ["Biology", "Chemistry", "Physiology", "Biochemistry"],
    careers: ["Physician", "Surgeon", "Medical Researcher"],
    salaryUSD: "$220k – $500k+",
    outlook: "Growing",
    difficulty: "Very Challenging",
    topSchools: ["Harvard", "Johns Hopkins", "Oxford", "Karolinska"],
    scholarships: ["HPSP", "NHSC", "AMA Foundation"],
    weights: w({ healthcare: 5, science: 5, helping_people: 5, attention_detail: 5, analytical: 4, long_term: 5, organization: 4 }),
  },
  {
    slug: "nursing",
    name: "Nursing",
    category: "Health",
    blurb: "Frontline healthcare — clinical skill, patient advocacy, and steady judgment.",
    requiredSkills: ["Empathy", "Clinical reasoning", "Stamina", "Teamwork"],
    focusSubjects: ["Anatomy", "Pharmacology", "Patient Care", "Public Health"],
    careers: ["Registered Nurse", "Nurse Practitioner", "Clinical Educator"],
    salaryUSD: "$75k – $130k",
    outlook: "Fast-growing",
    difficulty: "Challenging",
    topSchools: ["Penn", "Duke", "Johns Hopkins", "King's College London"],
    scholarships: ["Tylenol Future Care", "AACN Scholarships"],
    weights: w({ healthcare: 5, helping_people: 5, working_with_people: 5, teamwork: 4, attention_detail: 4, adaptability: 4 }),
  },
  {
    slug: "psychology",
    name: "Psychology",
    category: "Social Sciences",
    blurb: "The science of the mind and behavior — research, clinical practice, or applied fields.",
    requiredSkills: ["Empathy", "Statistics", "Critical reading", "Interviewing"],
    focusSubjects: ["Cognitive", "Clinical", "Social", "Research Methods"],
    careers: ["Clinical Psychologist", "UX Researcher", "HR Analyst", "Therapist"],
    salaryUSD: "$60k – $130k",
    outlook: "Growing",
    difficulty: "Moderate",
    topSchools: ["Stanford", "UCLA", "Cambridge", "Amsterdam"],
    scholarships: ["APA Minority Fellowship", "Psi Chi Grants"],
    weights: w({ psychology: 5, helping_people: 5, research: 4, curiosity: 4, communication: 4, working_with_people: 4, analytical: 3 }),
  },
  {
    slug: "law",
    name: "Law (Pre-Law)",
    category: "Humanities",
    blurb: "Reading, writing, and arguing with precision. Preparation for law school and policy careers.",
    requiredSkills: ["Reading endurance", "Argumentation", "Writing", "Public speaking"],
    focusSubjects: ["Political Theory", "Ethics", "Constitutional Law", "Rhetoric"],
    careers: ["Attorney", "Judge", "Policy Advisor", "Corporate Counsel"],
    salaryUSD: "$85k – $220k",
    outlook: "Competitive",
    difficulty: "Challenging",
    topSchools: ["Yale", "Harvard", "Stanford", "Oxford"],
    scholarships: ["Rangel Fellowship", "AccessLex"],
    weights: w({ law: 5, writing: 5, public_speaking: 5, communication: 5, analytical: 5, attention_detail: 4, long_term: 3 }),
  },
  {
    slug: "architecture",
    name: "Architecture",
    category: "Arts & Design",
    blurb: "Designing buildings and spaces — where creativity meets engineering and human experience.",
    requiredSkills: ["Drawing", "3D thinking", "Design software", "Endurance"],
    focusSubjects: ["Design Studio", "Structures", "History of Architecture", "Materials"],
    careers: ["Architect", "Urban Designer", "Interior Architect"],
    salaryUSD: "$65k – $130k",
    outlook: "Stable",
    difficulty: "Challenging",
    topSchools: ["Harvard GSD", "MIT", "TU Delft", "AA London"],
    scholarships: ["AIA Scholarships", "NOMA Foundation"],
    weights: w({ design: 5, creativity: 5, art: 4, engineering: 3, mathematics: 3, attention_detail: 4, innovation: 4 }),
  },
  {
    slug: "graphic-design",
    name: "Graphic / Product Design",
    category: "Arts & Design",
    blurb: "Shaping how people see and use things — brand, interfaces, and visual systems.",
    requiredSkills: ["Visual literacy", "Design tools", "Critique", "Empathy"],
    focusSubjects: ["Typography", "UX", "Illustration", "Design Systems"],
    careers: ["Product Designer", "Brand Designer", "Art Director"],
    salaryUSD: "$60k – $140k",
    outlook: "Growing",
    difficulty: "Moderate",
    topSchools: ["RISD", "Parsons", "SVA", "Central Saint Martins"],
    scholarships: ["AIGA Worldstudio", "Adobe Design Circle"],
    weights: w({ design: 5, creativity: 5, art: 4, technology: 3, attention_detail: 4, communication: 3, innovation: 4 }),
  },
  {
    slug: "journalism",
    name: "Journalism & Media",
    category: "Humanities",
    blurb: "Reporting, writing, and telling true stories that inform the public.",
    requiredSkills: ["Writing", "Interviewing", "Curiosity", "Ethics"],
    focusSubjects: ["Reporting", "Media Law", "Data Journalism", "Documentary"],
    careers: ["Reporter", "Editor", "Podcaster", "Investigative Journalist"],
    salaryUSD: "$45k – $110k",
    outlook: "Competitive",
    difficulty: "Moderate",
    topSchools: ["Columbia", "Northwestern Medill", "City University London"],
    scholarships: ["Dow Jones News Fund", "NABJ"],
    weights: w({ writing: 5, communication: 5, curiosity: 5, research: 4, public_speaking: 3, adaptability: 4 }),
  },
  {
    slug: "economics",
    name: "Economics",
    category: "Social Sciences",
    blurb: "How people, firms, and governments make choices — rigorous, quantitative, and broad.",
    requiredSkills: ["Math", "Statistics", "Argumentation", "Modeling"],
    focusSubjects: ["Micro", "Macro", "Econometrics", "Game Theory"],
    careers: ["Economist", "Policy Analyst", "Consultant", "Central Banker"],
    salaryUSD: "$80k – $160k",
    outlook: "Growing",
    difficulty: "Challenging",
    topSchools: ["Chicago", "LSE", "MIT", "Bocconi"],
    scholarships: ["Fed Board Fellowship", "AEA Summer Program"],
    weights: w({ mathematics: 4, numbers: 4, analytical: 5, research: 4, business: 3, long_term: 3, curiosity: 4 }),
  },
  {
    slug: "biology",
    name: "Biology / Life Sciences",
    category: "Sciences",
    blurb: "Life at every scale — molecules, organisms, ecosystems. Foundation for research and medicine.",
    requiredSkills: ["Lab technique", "Reading papers", "Chemistry", "Precision"],
    focusSubjects: ["Cell Biology", "Genetics", "Ecology", "Biochemistry"],
    careers: ["Researcher", "Biotech Scientist", "Genetic Counselor"],
    salaryUSD: "$55k – $120k",
    outlook: "Growing",
    difficulty: "Challenging",
    topSchools: ["MIT", "Cambridge", "UCSF", "Kyoto"],
    scholarships: ["HHMI Gilliam", "NSF GRFP"],
    weights: w({ science: 5, research: 5, curiosity: 5, attention_detail: 5, analytical: 4, healthcare: 3 }),
  },
];

export type AnswerMap = Record<number, 1 | 2 | 3 | 4 | 5>;

// Compute normalized trait scores (0..1) from raw answers.
export function computeTraitScores(answers: AnswerMap): Record<TraitKey, number> {
  const totals: Partial<Record<TraitKey, number>> = {};
  const counts: Partial<Record<TraitKey, number>> = {};
  for (const q of QUESTIONS) {
    const raw = answers[q.id];
    if (!raw) continue;
    const val = q.reverse ? 6 - raw : raw;
    totals[q.trait] = (totals[q.trait] ?? 0) + val;
    counts[q.trait] = (counts[q.trait] ?? 0) + 1;
  }
  const out = {} as Record<TraitKey, number>;
  const allTraits = QUESTIONS.map((q) => q.trait);
  for (const t of allTraits) {
    const total = totals[t] ?? 0;
    const count = counts[t] ?? 1;
    // avg is 1..5 → normalize to 0..1
    out[t] = Math.max(0, Math.min(1, (total / count - 1) / 4));
  }
  return out;
}

// Cosine-like weighted score between user vector and major weights.
export function rankMajors(traits: Record<TraitKey, number>): Array<{ major: Major; score: number }> {
  return MAJORS.map((m) => {
    let dot = 0;
    let magM = 0;
    let magU = 0;
    for (const key of Object.keys(m.weights) as TraitKey[]) {
      const wt = (m.weights[key] ?? 0) / 5; // 0..1
      const uv = traits[key] ?? 0;
      dot += wt * uv;
      magM += wt * wt;
      magU += uv * uv;
    }
    const cos = magM && magU ? dot / (Math.sqrt(magM) * Math.sqrt(magU)) : 0;
    // Amplify a bit for spread, cap at 0.99
    const score = Math.min(0.99, Math.pow(cos, 0.85));
    return { major: m, score };
  }).sort((a, b) => b.score - a.score);
}

// Derive a short profile label from the top traits.
export function deriveProfileLabel(traits: Record<TraitKey, number>): string {
  const entries = Object.entries(traits) as Array<[TraitKey, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 3).map((e) => e[0]);
  const has = (k: TraitKey) => top.includes(k);
  if (has("analytical") && (has("technology") || has("mathematics"))) return "The Analytical Innovator";
  if (has("creativity") && (has("design") || has("art"))) return "The Creative Builder";
  if (has("leadership") && has("business")) return "The Strategic Leader";
  if (has("helping_people") && has("healthcare")) return "The Empathetic Caregiver";
  if (has("research") && has("science")) return "The Curious Investigator";
  if (has("entrepreneurship") && has("innovation")) return "The Visionary Founder";
  if (has("writing") && has("communication")) return "The Persuasive Storyteller";
  return "The Balanced Explorer";
}

export function deriveStrengths(traits: Record<TraitKey, number>): string[] {
  const label: Record<TraitKey, string> = {
    mathematics: "Mathematical Reasoning", science: "Scientific Thinking", business: "Business Acumen",
    technology: "Technical Fluency", healthcare: "Care & Empathy", law: "Ethical Reasoning",
    psychology: "Emotional Insight", art: "Aesthetic Sense", creativity: "Creativity",
    leadership: "Leadership", communication: "Communication", teamwork: "Collaboration",
    independence: "Self-Direction", analytical: "Analytical Thinking", problem_solving: "Problem Solving",
    curiosity: "Intellectual Curiosity", research: "Research Skills", entrepreneurship: "Entrepreneurial Drive",
    design: "Design Thinking", engineering: "Engineering Mindset", helping_people: "Service Orientation",
    writing: "Writing Ability", public_speaking: "Public Speaking", numbers: "Quantitative Skill",
    working_with_people: "Interpersonal Energy", attention_detail: "Attention to Detail",
    organization: "Organization", adaptability: "Adaptability", innovation: "Innovation", long_term: "Long-Term Vision",
  };
  return (Object.entries(traits) as Array<[TraitKey, number]>)
    .filter(([, v]) => v >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => label[k]);
}

export function deriveImprovements(traits: Record<TraitKey, number>): string[] {
  const suggestions: Record<TraitKey, string> = {
    public_speaking: "Join a debate club or Toastmasters to build public speaking confidence.",
    leadership: "Take a lead role on a club or project this semester.",
    writing: "Start a weekly writing habit — essays, newsletters, or long-form posts.",
    research: "Reach out to a professor about a small research assistant role.",
    mathematics: "Work through a competition math or Khan Academy track.",
    technology: "Build a small end-to-end coding project you can demo.",
    entrepreneurship: "Ship a tiny product or side project to real users.",
    working_with_people: "Volunteer somewhere that requires daily interaction.",
    numbers: "Get comfortable with spreadsheets and basic statistics.",
    creativity: "Set aside deliberate time for creative practice each week.",
    // fallbacks for anything else
    mathematics_: "", science: "Try a hands-on lab or citizen-science project.",
    business: "Read one great business case study each week.",
    healthcare: "Shadow a clinician or volunteer at a clinic.",
    law: "Follow a live court case or moot competition.",
    psychology: "Read a foundational psychology text (Kahneman, Duckworth).",
    art: "Commit to one weekly creative session (sketch, music, film).",
    communication: "Explain a hard topic weekly to a non-expert.",
    teamwork: "Join a team-based extracurricular this term.",
    independence: "Take on a self-directed passion project.",
    analytical: "Practice structured problem breakdowns weekly.",
    problem_solving: "Solve one hard puzzle or LeetCode problem daily.",
    curiosity: "Follow up on one new topic per week in depth.",
    design: "Redesign a product you use daily and share the case study.",
    engineering: "Build something physical — Arduino, robotics, or 3D printing.",
    helping_people: "Commit to a consistent volunteering block.",
    attention_detail: "Practice reviewing and editing your own work carefully.",
    organization: "Adopt a real productivity system (calendar + tasks).",
    adaptability: "Take on an unfamiliar role or subject deliberately.",
    innovation: "Prototype a new idea end-to-end this month.",
    long_term: "Write a 5-year vision statement and revisit it monthly.",
  } as Record<string, string>;
  return (Object.entries(traits) as Array<[TraitKey, number]>)
    .filter(([, v]) => v <= 0.45)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([k]) => suggestions[k])
    .filter(Boolean);
}
