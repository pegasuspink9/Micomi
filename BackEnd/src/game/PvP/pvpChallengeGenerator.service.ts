import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type PvpChallengeCategory = "HTML" | "CSS" | "JavaScript" | "Computer";
export type PvpChallengeDifficulty = "Easy" | "Medium" | "Hard";

interface GeneratedPvpChallenge {
  points_reward: number;
  coins_reward: number;
  correct_answer: string[];
  options: string[];
  question: string;
  css_file: string | null;
  html_file: string | null;
}

const ALL_CATEGORIES: PvpChallengeCategory[] = [
  "HTML",
  "CSS",
  "JavaScript",
  "Computer",
];
const DIFFICULTY_ROTATION: PvpChallengeDifficulty[] = [
  "Easy",
  "Easy",
  "Medium",
  "Hard",
];
const DIFFICULTY_REWARDS: Record<
  PvpChallengeDifficulty,
  { points: number; coins: number }
> = {
  Easy: { points: 10, coins: 2 },
  Medium: { points: 20, coins: 5 },
  Hard: { points: 30, coins: 10 },
};

const MAX_GENERATION_ATTEMPTS = 5;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.84;
const RECENT_QUESTIONS_LOOKBACK = 60;
const DEFAULT_DAILY_TOPIC_POOL = 12;

// --- GLOBAL MUTEX FOR GEMINI RATE LIMITING ---
let geminiMutex = Promise.resolve();
const GEMINI_API_DELAY_MS = 5000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const synchronizedGeminiCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  let resolveMutex: () => void;
  const nextMutex = new Promise<void>((res) => {
    resolveMutex = res;
  });
  const currentMutex = geminiMutex;
  geminiMutex = currentMutex.then(() => nextMutex);

  try {
    await currentMutex;
    await delay(GEMINI_API_DELAY_MS);
    return await fn();
  } finally {
    resolveMutex!();
  }
};
// ---------------------------------------------

const getUtcDayBounds = (value = new Date()) => {
  const start = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const normalizeBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const normalizeInteger = (value: string | undefined, fallback: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.floor(numeric);
};

const parseGeminiApiKeys = (): string[] => {
  const raw = process.env.GEMINI_API_KEY;
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
    .filter((token) => token.length > 0);
};

const getGeminiModels = (): string[] => {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const fallback = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];
  if (!preferred) return fallback;
  return [preferred, ...fallback.filter((model) => model !== preferred)];
};

const shouldTryNextKey = (error: unknown): boolean => {
  const status = (error as any)?.response?.status;
  return status === 400 || status === 401 || status === 403 || status === 429;
};

const generateWithGeminiKey = async (
  apiKey: string,
  prompt: string,
): Promise<GeneratedPvpChallenge> => {
  const models = getGeminiModels();
  let lastError: unknown = null;

  for (const model of models) {
    try {
      console.log(`[Gemini API] Requesting ${model}...`);

      const response = await synchronizedGeminiCall(() =>
        axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              responseMimeType: "application/json",
            },
          },
          { headers: { "Content-Type": "application/json" }, timeout: 15000 },
        ),
      );

      const rawText =
        response.data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? "")
          .join("\n") ?? "";
      if (!rawText.trim()) throw new Error("Gemini returned an empty response");

      const jsonText = extractJsonObject(rawText);
      return JSON.parse(jsonText) as GeneratedPvpChallenge;
    } catch (error) {
      lastError = error;
      const status = (error as any)?.response?.status;

      if (status === 404 || status === 503) {
        console.warn(
          `[Gemini API] Model ${model} unavailable (Status ${status}). Trying next model...`,
        );
        continue;
      }

      if (status === 429) {
        console.warn(`[Gemini API] Rate limit hit (429) on model ${model}.`);
        throw error;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("No compatible Gemini model endpoint found");
};

const extractJsonObject = (rawText: string): string => {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first)
    throw new Error("Gemini returned an invalid JSON payload");
  return cleaned.slice(first, last + 1);
};

const countQuestionBlanks = (question: string): number => {
  return (question.match(/_+/g) ?? []).length;
};

const normalizeQuestionForSimilarity = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9_<>/#\-:\.;,\(\)\[\]\{\}\"' ]/g, "")
    .trim();
};

const buildBigrams = (value: string): Set<string> => {
  const normalized = normalizeQuestionForSimilarity(value);
  if (normalized.length <= 2) return new Set([normalized]);
  const grams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++)
    grams.add(normalized.slice(i, i + 2));
  return grams;
};

const diceSimilarity = (left: string, right: string): number => {
  const leftSet = buildBigrams(left);
  const rightSet = buildBigrams(right);
  if (leftSet.size === 0 || rightSet.size === 0) return 0;
  let intersection = 0;
  for (const gram of leftSet) if (rightSet.has(gram)) intersection += 1;
  return (2 * intersection) / (leftSet.size + rightSet.size);
};

const buildDedupeSignature = (question: string): string => {
  return normalizeQuestionForSimilarity(question)
    .replace(/\s+/g, "")
    .slice(0, 180);
};

const isNearDuplicateQuestion = (
  candidateQuestion: string,
  previousQuestions: string[],
): boolean => {
  return previousQuestions.some(
    (existing) =>
      diceSimilarity(candidateQuestion, existing) >=
      DUPLICATE_SIMILARITY_THRESHOLD,
  );
};

const getRecentQuestions = async (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  lookback = RECENT_QUESTIONS_LOOKBACK,
): Promise<string[]> => {
  const recentRows = await prisma.pVPChallenge.findMany({
    where: { topic: category, difficulty, question: { not: null } },
    select: { question: true },
    orderBy: { created_at: "desc" },
    take: Math.max(5, lookback),
  });
  return recentRows
    .map((row) => row.question)
    .filter((value): value is string => typeof value === "string");
};

const validateChallengeShape = (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  value: unknown,
): GeneratedPvpChallenge => {
  if (!value || typeof value !== "object")
    throw new Error("Generated payload is not a JSON object");
  const payload = value as Record<string, unknown>;

  const pointsReward = Number(payload.points_reward);
  const coinsReward = Number(payload.coins_reward);

  if (!Number.isInteger(pointsReward) || !Number.isInteger(coinsReward))
    throw new Error("points_reward and coins_reward must be integers");

  const expected = DIFFICULTY_REWARDS[difficulty];
  if (pointsReward !== expected.points || coinsReward !== expected.coins)
    throw new Error(
      `Reward mismatch for ${difficulty}. Expected points=${expected.points}, coins=${expected.coins}.`,
    );

  if (
    !Array.isArray(payload.correct_answer) ||
    !payload.correct_answer.every((item) => typeof item === "string")
  )
    throw new Error("correct_answer must be an array of strings");
  if (
    !Array.isArray(payload.options) ||
    !payload.options.every((item) => typeof item === "string")
  )
    throw new Error("options must be an array of strings");

  const correctAnswer = payload.correct_answer;
  const options = payload.options;

  // Ensure options has at least 5 distractor items TOTAL
  if (options.length < 5)
    throw new Error("options must have a minimum of 5 strings in total");

  if (
    typeof payload.question !== "string" ||
    payload.question.trim().length === 0
  )
    throw new Error("question must be a non-empty string");

  const blankCount = countQuestionBlanks(payload.question);
  if (blankCount !== correctAnswer.length)
    throw new Error(
      `Blank count mismatch: question has ${blankCount} blanks but correct_answer has ${correctAnswer.length} items`,
    );

  const fileKeys = ["css_file", "html_file"] as const;
  for (const key of fileKeys) {
    const raw = payload[key];
    if (raw !== null && typeof raw !== "string")
      throw new Error(`${key} must be a string or null`);
  }

  const cssFile = payload.css_file as string | null;
  const htmlFile = payload.html_file as string | null;

  if (category === "HTML" && (htmlFile !== null || cssFile !== null))
    throw new Error("HTML category must keep html_file and css_file null");
  if (category === "CSS" && (!htmlFile || cssFile !== null))
    throw new Error(
      "CSS category requires html_file and css_file must be null",
    );
  if (category === "JavaScript" && (!htmlFile || !cssFile))
    throw new Error("JavaScript category requires html_file and css_file");
  if (category === "Computer" && (htmlFile !== null || cssFile !== null))
    throw new Error("Computer category must keep html_file and css_file null");

  const normalizedQuestion = payload.question.replace(/_+/g, "_");

  return {
    points_reward: pointsReward,
    coins_reward: coinsReward,
    correct_answer: correctAnswer,
    options,
    question: normalizedQuestion,
    css_file: cssFile,
    html_file: htmlFile,
  };
};

export const buildGeminiPvpPrompt = (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  recentQuestions: string[] = [],
): string => {
  const antiDupSection =
    recentQuestions.length === 0
      ? ""
      : `\n=== DUPLICATION GUARD ===\nAvoid generating a challenge that is semantically similar to any of these recent prompts:\n${recentQuestions
          .slice(0, 8)
          .map((q, idx) => `${idx + 1}. ${q.replace(/\n/g, " ").slice(0, 220)}`)
          .join("\n")}\n`;

  let exampleJson = "";
  if (category === "HTML") {
    exampleJson = `{
      "points_reward": 10,
      "coins_reward": 2,
      "correct_answer": ["h1", "h1"],
      "options": ["h1", "p", "div", "section", "h1", "p"],
      "question": "<!DOCTYPE html>\\n<html>\\n  <head>\\n    <title>My Page</title>\\n  </head>\\n  <body>\\n    <_>Hello Welcome to Micomi!</_>\\n  </body>\\n</html>\\n",
      "css_file": null,
      "html_file": null
    }`;
  } else if (category === "CSS") {
    exampleJson = `{
      "points_reward": 10,
      "coins_reward": 2,
      "correct_answer": ["max", "height", "auto", "radius", "box", "rgba", "transition", "hover", "scale", "center"],
      "options": ["max", "height", "auto", "radius", "box", "rgba", "transition", "hover", "scale", "center"],
      "question": ".banner-img {\\n    _-width: 100%;\\n    _: _;\\n}\\n\\n.rounded-img {\\n    border-_: 12px;\\n}\\n\\n.shadow-img {\\n    _-shadow: 0 4px 15px _(0, 0, 0, 0.5);\\n}\\n\\n.hover-img {\\n    _: transform 0.3s ease; \\n}\\n\\n.hover-img:_ {\\n    transform: _(1.05); \\n    cursor: pointer;\\n}\\n\\n.banner-container {\\n    padding: 20px;\\n    text-align: _;\\n    background-color: #0b0d17;\\n    color: white;\\n}",
      "css_file": null,
      "html_file": "<!DOCTYPE html>\\n<html>\\n<head>\\n    <title>Interstellar Voyager</title>\\n    <link rel=\\"stylesheet\\" href=\\"style.css\\">\\n</head>\\n<body>\\n    <div class=\\"banner-container\\">\\n        <img src=\\"https://images-assets.nasa.gov/image/PIA01384/PIA01384~medium.jpg\\" \\n             class=\\"banner-img shadow-img rounded-img hover-img\\" \\n             alt=\\"The ringed planet Saturn\\">\\n        \\n        <div class=\\"banner-content\\">\\n            <h2 class=\\"banner-title\\">Beyond the Kuiper Belt</h2>\\n            <p class=\\"banner-caption\\">Witness the majesty of the Gas Giants</p>\\n            \\n            <a href=\\"#explore\\" class=\\"fancy-button\\">\\n                🪐 LAUNCH MISSION\\n            </a>\\n        </div>\\n    </div>\\n</body>\\n</html>"
    }`;
  } else if (category === "JavaScript") {
    exampleJson = `{
      "points_reward": 10,
      "coins_reward": 2,
      "correct_answer": ["let", "innerHTML"],
      "options": ["innerHTML", "let", "const", "var", "textContext", "getElementById"],
      "question": "function greetUser() {\\n _ characterName = \\"Leon the Brave\\";\\n let role = \\"Guardian of the North\\";\\n \\n let message = \\"Welcome, \\" + characterName + \\". Your role is: \\" + role;\\n \\n document.getElementById(\\"outputArea\\")._ = message;\\n}",
      "css_file": ".character-card {\\n background: #f0faff;\\n border: 2px solid #b3e5fc;\\n padding: 20px;\\n border-radius: 12px;\\n text-align: center;\\n box-shadow: 0 4px 10px rgba(0,0,0,0.05);\\n max-width: 300px;\\n margin: 20px auto;\\n}\\n#outputArea {\\n font-weight: bold;\\n color: #0288d1;\\n margin: 15px 0;\\n}",
      "html_file": "<!DOCTYPE html>\\n<html>\\n<head>\\n<title>Snowland Log</title>\\n<link rel=\\"stylesheet\\" href=\\"style.css\\">\\n</head>\\n<body>\\n <div class=\\"character-card\\">\\n <h2>Expedition Member</h2>\\n <div id=\\"outputArea\\">Waiting for identification...</div>\\n <button onclick=\\"greetUser()\\">Identify Hero</button>\\n </div>\\n <script src=\\"script.js\\"></script>\\n</body>\\n</html>"
    }`;
  } else if (category === "Computer") {
    exampleJson = `{
      "points_reward": 10,
      "coins_reward": 2,
      "correct_answer": ["G", "P", "U"],
      "options": ["P", "U", "G", "A", "R", "M", "S", "U", "P"],
      "question": "Which component improves graphics and gaming performance? _ _ _",
      "css_file": null,
      "html_file": null
    }`;
  }

  return `You are an expert technical curriculum designer for a competitive PvP coding game.
Your task is to generate a "fill-in-the-blank" style challenge in strictly valid JSON format.

GENERATE 1 CHALLENGE FOR:
- Category: ${category}
- Difficulty: ${difficulty}

=== SCHEMA AND OUTPUT RULES ===
You must return a single valid JSON object matching this exact structure. Do not include markdown code fences.

{
  "points_reward": <integer based on difficulty: Easy=10, Medium=20, Hard=30>,
  "coins_reward": <integer based on difficulty: Easy=2, Medium=5, Hard=10>,
  "correct_answer": [<array of strings>],
  "options": [<array of strings>],
  "question": "<string containing the challenge code/text with blanks>",
  "css_file": <string or null>,
  "html_file": <string or null>
}

=== FILL-IN-THE-BLANK RULES ===
1. You must use a single underscore "_" to represent a blank space. Do NOT use multiple underscores for a single blank (use "_", not "___").
2. CRITICAL: The exact number of "_" in the "question" string MUST perfectly match the number of items in the "correct_answer" array. The answers must be in the exact order they appear in the text.
3. The "options" array must contain all items from "correct_answer" and be shuffled. There must be a minimum of 5 options total. If the answer array has less than 5 items, create distractor strings to make it 5+ strings in total.
4. Properly escape all strings (e.g., use \\n for newlines, and escape quotes like \\").

=== CATEGORY SPECIFIC RULES ===
Depending on the Category, populate the fields as follows:

If Category is "HTML":
- "question": MUST contain a COMPLETE, full HTML document (<!DOCTYPE html><html><head>...</head><body>...</body></html>) with "_" blanks inside tags, attributes, or text. Do NOT just output short snippets.
- "html_file" and "css_file" MUST both be null.

If Category is "CSS":
- "question": Contains full CSS code blocks with "_" blanks (blank out properties, values, or selectors).
- "html_file": MUST contain a COMPLETE, visually interesting HTML document (<!DOCTYPE html>...) that relies on and gives context to the CSS.
- "css_file" MUST be null.

If Category is "JavaScript":
- "question": Contains JavaScript code with "_" blanks (blank out keywords, DOM methods, or variables).
- "html_file": MUST contain a COMPLETE, working HTML document providing context.
- "css_file": MUST contain basic valid CSS styling for the HTML.

If Category is "Computer":
- "question": Contains a trivia sentence about computer hardware/software with "_" blanks. IF THE ANSWER IS AN ACRONYM (like GPU, RAM, CPU), YOU MUST USE SEPARATE BLANKS FOR EACH LETTER separated by a space (e.g., "_ _ _" for GPU).
- "html_file" and "css_file" MUST both be null.

=== STRICT EXAMPLES TO FOLLOW ===
Your output for a ${category} challenge MUST look exactly like this standard format:
${exampleJson}

${antiDupSection}

Generate the JSON object now.`;
};

const generateAndValidateWithKeys = async (
  prompt: string,
  apiKeys: string[],
): Promise<GeneratedPvpChallenge> => {
  let parsed: GeneratedPvpChallenge | null = null;
  let lastError: unknown = null;

  for (const key of apiKeys) {
    try {
      parsed = await generateWithGeminiKey(key, prompt);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (!shouldTryNextKey(error)) break;

      const status = (error as any)?.response?.status;
      if (status === 429 && apiKeys.length > 1) {
        console.warn("[Gemini API] 429 hit. Rotating API Key...");
      }
    }
  }

  if (lastError || parsed === null)
    throw (
      lastError ?? new Error("Failed to generate a PvP challenge with Gemini")
    );
  return parsed;
};

export const generatePvpChallengeWithGemini = async (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  options?: { maxAttempts?: number; duplicateLookback?: number },
) => {
  const apiKeys = parseGeminiApiKeys();
  if (apiKeys.length === 0) throw new Error("GEMINI_API_KEY is not configured");

  const maxAttempts = Math.max(
    1,
    options?.maxAttempts ?? MAX_GENERATION_ATTEMPTS,
  );
  const duplicateLookback = Math.max(
    5,
    options?.duplicateLookback ?? RECENT_QUESTIONS_LOOKBACK,
  );
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const recentQuestions = await getRecentQuestions(
        category,
        difficulty,
        duplicateLookback,
      );
      const prompt = buildGeminiPvpPrompt(
        category,
        difficulty,
        recentQuestions,
      );

      const parsed = await generateAndValidateWithKeys(prompt, apiKeys);
      const validated = validateChallengeShape(category, difficulty, parsed);

      if (isNearDuplicateQuestion(validated.question, recentQuestions)) {
        throw new Error(
          `Generated question is too similar to existing ${category} challenges`,
        );
      }

      const dedupeSignature = buildDedupeSignature(validated.question);
      const created = await prisma.pVPChallenge.create({
        data: {
          topic: category,
          difficulty,
          points_reward: validated.points_reward,
          coins_reward: validated.coins_reward,
          correct_answer: validated.correct_answer,
          options: validated.options,
          question: validated.question,
          css_file: validated.css_file,
          html_file: validated.html_file,
          dedupe_signature: dedupeSignature || null,
        },
      });

      return { category, difficulty, attempt, prompt, challenge: created };
    } catch (error) {
      lastError = error;
      const status = (error as any)?.response?.status;

      if ((error as any)?.code === "P2002") {
        console.warn(
          `[Gemini API] Duplicate detected on attempt ${attempt}. Retrying...`,
        );
      } else {
        console.warn(
          `[Gemini API] Error on attempt ${attempt}: ${(error as Error).message}`,
        );
      }

      if (status === 429) {
        console.warn(
          `[Gemini API] Quota exhausted! Sleeping for 30 SECONDS before retry...`,
        );
        await delay(30000);
      }
    }
  }

  const suffix =
    lastError instanceof Error ? ` Last error: ${lastError.message}` : "";
  throw new Error(
    `Failed to generate a unique PvP challenge after ${maxAttempts} attempts.${suffix}`,
  );
};

export const getPvpChallenges = async (limit = 50) => {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  return prisma.pVPChallenge.findMany({
    orderBy: { pvp_challenge_id: "desc" },
    take: safeLimit,
  });
};

export const autoGeneratePvpChallengesTopUp = async (options?: {
  targetPoolSize?: number;
  maxCreatePerRun?: number;
  topic?: PvpChallengeCategory;
  difficulty?: PvpChallengeDifficulty;
}) => {
  const targetPoolSize = Math.max(1, options?.targetPoolSize ?? 60);
  const maxCreatePerRun = Math.max(1, options?.maxCreatePerRun ?? 20);

  const currentCount = await prisma.pVPChallenge.count();
  if (currentCount >= targetPoolSize) {
    return {
      skipped: true,
      reason: "pool_target_met",
      currentCount,
      targetPoolSize,
      generated: 0,
      failed: 0,
    };
  }

  const toGenerate = Math.min(targetPoolSize - currentCount, maxCreatePerRun);
  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < toGenerate; i++) {
    const category =
      options?.topic ??
      ALL_CATEGORIES[(currentCount + i) % ALL_CATEGORIES.length];
    const difficulty =
      options?.difficulty ??
      DIFFICULTY_ROTATION[(currentCount + i) % DIFFICULTY_ROTATION.length];
    try {
      await generatePvpChallengeWithGemini(category, difficulty);
      generated += 1;
    } catch (error) {
      failed += 1;
      const message = (error as Error).message || "Unknown Gemini error";
      errors.push(`[${category}/${difficulty}] ${message}`);
      await delay(15000);
    }
  }

  return {
    skipped: false,
    currentCount,
    targetPoolSize,
    attempted: toGenerate,
    generated,
    failed,
    errors,
  };
};

export const runAutoPvpChallengeGenerationFromEnv = async () => {
  const enabled = normalizeBoolean(process.env.PVP_AUTO_GENERATE_ENABLED, true);
  if (!enabled) return { skipped: true, reason: "auto_generation_disabled" };

  const targetPoolSize = normalizeInteger(
    process.env.PVP_AUTO_GENERATE_TARGET_POOL,
    60,
  );
  const maxCreatePerRun = normalizeInteger(
    process.env.PVP_AUTO_GENERATE_MAX_PER_RUN,
    20,
  );

  return autoGeneratePvpChallengesTopUp({ targetPoolSize, maxCreatePerRun });
};

export const getTodayPvpChallengeCount = async (options?: {
  topic?: PvpChallengeCategory;
  difficulty?: PvpChallengeDifficulty;
}) => {
  const { start, end } = getUtcDayBounds();
  return prisma.pVPChallenge.count({
    where: {
      ...(options?.topic ? { topic: options.topic } : {}),
      ...(options?.difficulty ? { difficulty: options.difficulty } : {}),
      created_at: { gte: start, lt: end },
    },
  });
};

export const cleanupOldPvpChallenges = async () => {
  const { start } = getUtcDayBounds();
  const deleted = await prisma.pVPChallenge.deleteMany({
    where: { created_at: { lt: start } },
  });
  return deleted.count;
};

export const ensureDailyPvpChallenges = async (options?: {
  perTopicTarget?: number;
  difficulty?: PvpChallengeDifficulty;
  forceResetToday?: boolean;
}) => {
  const apiKeys = parseGeminiApiKeys();
  if (apiKeys.length === 0)
    throw new Error("GEMINI_API_KEY is not configured for PvP daily seeding");

  const perTopicTarget = Math.max(
    5,
    options?.perTopicTarget ?? DEFAULT_DAILY_TOPIC_POOL,
  );
  const difficulty = options?.difficulty ?? "Easy";

  if (options?.forceResetToday) {
    await prisma.pVPChallenge.deleteMany({});
  } else {
    await cleanupOldPvpChallenges();
  }

  const summary: Array<{
    topic: PvpChallengeCategory;
    existing: number;
    generated: number;
    final: number;
    missingAfter: number;
    lastError: string | null;
    target: number;
  }> = [];

  for (const topic of ALL_CATEGORIES) {
    const existing = await getTodayPvpChallengeCount({ topic, difficulty });
    const missing = Math.max(0, perTopicTarget - existing);
    let generated = 0;
    let lastError: string | null = null;

    console.log(
      `[Daily PvP] Topic: ${topic} | Difficulty: ${difficulty} | Existing: ${existing} | Missing: ${missing}`,
    );

    for (let i = 0; i < missing; i++) {
      try {
        console.log(`  -> Generating ${i + 1}/${missing} for ${topic}...`);
        await generatePvpChallengeWithGemini(topic, difficulty, {
          maxAttempts: 3,
          duplicateLookback: 80,
        });
        generated += 1;
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : "Unknown Gemini generation error";
        console.error(`  -> Failed generation: ${lastError}`);
        console.log(
          "  -> Sleeping for 15 seconds before proceeding to next challenge...",
        );
        await delay(15000);
      }
    }

    const final = await getTodayPvpChallengeCount({ topic, difficulty });
    summary.push({
      topic,
      existing,
      generated,
      final,
      missingAfter: Math.max(0, perTopicTarget - final),
      lastError,
      target: perTopicTarget,
    });
  }

  return summary;
};
