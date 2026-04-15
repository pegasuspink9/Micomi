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
// INCREASED TO 8000ms: Ensures max ~7.5 requests per minute (Free tier limit is 15 RPM)
const GEMINI_API_DELAY_MS = 8000;

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

const formatAxiosError = (error: unknown): string => {
  const response = (error as any)?.response;
  const status = response?.status;
  const code = response?.data?.error?.status ?? response?.data?.error?.code;
  const message =
    response?.data?.error?.message ??
    (error as Error)?.message ??
    "Unknown Gemini API error";
  const retryAfter = response?.headers?.["retry-after"];

  return [
    `status=${status ?? "n/a"}`,
    code ? `code=${code}` : null,
    retryAfter ? `retry_after=${retryAfter}` : null,
    `message=${message}`,
  ]
    .filter(Boolean)
    .join(" | ");
};

export const parseGeminiApiKeys = (): string[] => {
  const raw = process.env.GEMINI_API_KEY;
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
    .filter((token) => token.length > 0)
    .reverse();
};

const getGeminiModels = (): string[] => {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const fallback = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
  if (!preferred) return fallback;
  return [preferred, ...fallback.filter((model) => model !== preferred)];
};

const shouldTryNextKey = (error: unknown): boolean => {
  const status = (error as any)?.response?.status;
  const rotateOn429 = normalizeBoolean(process.env.GEMINI_ROTATE_ON_429, true);

  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    (status === 429 && rotateOn429) ||
    status >= 500
  );
};

const generateWithGeminiKey = async <T>(
  apiKey: string,
  prompt: string,
): Promise<T> => {
  const models = getGeminiModels();
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const response = await synchronizedGeminiCall(() => {
        console.log(
          `[Gemini API] Requesting ${model} (Key ending in ...${apiKey.slice(-4)})`,
        );
        return axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              responseMimeType: "application/json",
            },
          },
          { headers: { "Content-Type": "application/json" }, timeout: 20000 },
        );
      });

      const rawText =
        response.data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? "")
          .join("\n") ?? "";
      if (!rawText.trim()) throw new Error("Gemini returned an empty response");

      const jsonText = extractJsonObject(rawText);
      return JSON.parse(jsonText) as T;
    } catch (error) {
      lastError = error;
      const status = (error as any)?.response?.status;

      if (status === 404 || status === 503 || status === 500) {
        console.warn(
          `[Gemini API] Model ${model} unavailable (Status ${status}). Trying next model...`,
        );
        continue;
      }
      if (status === 429) {
        console.warn(
          `[Gemini API] Rate limit hit (429) on model ${model}. ${formatAxiosError(error)}`,
        );
        throw error;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("No compatible Gemini model endpoint found");
};

const executeGeminiPromptWithKeyRotation = async <T>(
  prompt: string,
): Promise<T> => {
  const apiKeys = parseGeminiApiKeys();
  if (apiKeys.length === 0) throw new Error("GEMINI_API_KEY is not configured");

  let parsed: T | null = null;
  let lastError: unknown = null;

  for (const key of apiKeys) {
    try {
      parsed = await generateWithGeminiKey<T>(key, prompt);
      return parsed;
    } catch (error) {
      lastError = error;
      const status = (error as any)?.response?.status;
      if (!shouldTryNextKey(error)) {
        if (status === 429)
          console.warn(
            `[Gemini API] 429 appears to be quota-limited for this project/account. Stopping key rotation. ${formatAxiosError(error)}`,
          );
        break;
      }
      console.warn(
        `[Gemini API] Error encountered. Rotating API Key... ${formatAxiosError(error)}`,
      );
    }
  }

  throw (
    lastError ??
    new Error("Failed to generate content with Gemini across all keys.")
  );
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

  // --- AUTO-FIXER & NORMALIZATION ---
  if (typeof payload.question === "string") {
    // 1. Strip out conversational markdown (```css, ```html)
    let rawQuestion = payload.question
      .replace(/```[a-z0-9]*\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    // 2. Extract AI's inline tags e.g., [[answer]]
    const bracketRegex = /\[\[(.*?)\]\]/g;
    const extractedAnswers: string[] = [];
    let match;

    while ((match = bracketRegex.exec(rawQuestion)) !== null) {
      extractedAnswers.push(match[1].trim());
    }

    // 3. If tags exist, completely bypass LLM counting errors by auto-building the arrays
    if (extractedAnswers.length > 0) {
      // Perfectly sync the correct answers
      payload.correct_answer = extractedAnswers;
      // Convert the brackets back into underscores for the frontend
      payload.question = rawQuestion.replace(/\[\[(.*?)\]\]/g, "_");

      let currentOptions = Array.isArray(payload.options)
        ? payload.options
        : [];

      if (extractedAnswers.length >= 5) {
        // Rule: >= 5 items, options are strictly shuffled correct answers
        payload.options = [...extractedAnswers].sort(() => Math.random() - 0.5);
      } else {
        // Rule: < 5 items, grab the AI's distractors and force exactly 5 options
        const correctSet = new Set(extractedAnswers);
        const validDistractors = currentOptions.filter(
          (opt): opt is string =>
            typeof opt === "string" && !correctSet.has(opt),
        );

        let finalOptions = [...extractedAnswers, ...validDistractors];

        // Pad if the AI didn't provide enough distractors
        while (finalOptions.length < 5) {
          finalOptions.push(
            validDistractors.length > 0
              ? validDistractors[
                  Math.floor(Math.random() * validDistractors.length)
                ]
              : "distractor",
          );
        }
        // Trim if the AI provided too many
        if (finalOptions.length > 5) finalOptions = finalOptions.slice(0, 5);

        payload.options = finalOptions.sort(() => Math.random() - 0.5);
      }
    } else {
      // Fallback if AI used underscores anyway
      payload.question = rawQuestion.replace(/_+/g, "_");
    }
  }
  // --- END AUTO-FIXER ---

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

  if (correctAnswer.length >= 5) {
    if (options.length !== correctAnswer.length) {
      throw new Error(
        `Because correct_answer has >= 5 items, 'options' must match it exactly in length. Found ${options.length} options instead of ${correctAnswer.length}.`,
      );
    }
  } else {
    if (options.length < 5) {
      throw new Error(
        `Because correct_answer has < 5 items, 'options' must have a minimum of 5 strings in total (including distractors).`,
      );
    }
  }

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

  return {
    points_reward: pointsReward,
    coins_reward: coinsReward,
    correct_answer: correctAnswer,
    options,
    question: payload.question,
    css_file: cssFile,
    html_file: htmlFile,
  };
};

export const buildGeminiPvpPrompt = (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  recentQuestions: string[] = [],
  curriculumReference: string = "",
): string => {
  const antiDupSection =
    recentQuestions.length === 0
      ? ""
      : `\n=== DUPLICATION GUARD ===\nAvoid generating challenges semantically similar to:\n${recentQuestions
          .slice(0, 10)
          .map((q, idx) => `${idx + 1}. ${q.replace(/\n/g, " ").slice(0, 150)}`)
          .join("\n")}\n`;
  return `You are an expert technical curriculum designer for a competitive PvP coding game.
Your task is to generate exactly 1 "fill-in-the-blank" style challenge.

GENERATE 1 CHALLENGE FOR:
- Category: ${category}
- Difficulty: ${difficulty}

${curriculumReference}

=== SCHEMA AND OUTPUT RULES ===
You must return strictly valid JSON matching this schema:
{
  "points_reward": ${DIFFICULTY_REWARDS[difficulty].points},
  "coins_reward": ${DIFFICULTY_REWARDS[difficulty].coins},
  "correct_answer": ["200", "100", "center"],
  "options": ["200", "100", "center", "50", "left"],
  "question": ".box {\\n  width: [[200]]px;\\n  height: [[100]]px;\\n  text-align: [[center]];\\n}",
  "css_file": null,
  "html_file": null
}

=== FILL-IN-THE-BLANK RULES (CRITICAL) ===
1. DO NOT USE UNDERSCORES. Instead, you MUST wrap the hidden parts of the code in double square brackets: [[ ]].
   - Example: function [[add]](a, b) { return a [[+]] b; }
2. The "correct_answer" array MUST contain the exact words you wrapped in [[ ]] in the same order.
3. ***DYNAMIC OPTIONS RULE***:
   - If your "correct_answer" array contains LESS THAN 5 ITEMS: "options" MUST contain all correct answers PLUS enough realistic distractors to equal exactly 5 items total.
   - If your "correct_answer" array contains 5 OR MORE ITEMS: "options" MUST contain ONLY the exact items from "correct_answer".
4. If Category="HTML" or "Computer", files must be null. If "JavaScript", require html and css files. If "CSS", require html_file.
5. ***PURE CODE ONLY***: The "question" field MUST contain ONLY pure, raw, compilable code. DO NOT include any conversational text, instructions (e.g., "Fill in the blanks..."), or markdown code block syntax (like \`\`\`css).

${antiDupSection}

Generate the JSON object now.`;
};

export const buildGeminiBatchedPrompt = (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  batchSize: number = 5,
  recentQuestions: string[] = [],
  curriculumReference: string = "",
): string => {
  const antiDupSection =
    recentQuestions.length === 0
      ? ""
      : `\n=== DUPLICATION GUARD ===\nAvoid generating challenges semantically similar to:\n${recentQuestions
          .slice(0, 10)
          .map((q, idx) => `${idx + 1}. ${q.replace(/\n/g, " ").slice(0, 150)}`)
          .join("\n")}\n`;
  return `You are an expert technical curriculum designer for a competitive PvP coding game.
Your task is to generate exactly ${batchSize} "fill-in-the-blank" style challenges.

GENERATE ${batchSize} CHALLENGES FOR:
- Category: ${category}
- Difficulty: ${difficulty}

${curriculumReference}

=== SCHEMA AND OUTPUT RULES ===
You must return strictly valid JSON. Return an object with a "challenges" array.
{
  "challenges": [
    {
      "points_reward": ${DIFFICULTY_REWARDS[difficulty].points},
      "coins_reward": ${DIFFICULTY_REWARDS[difficulty].coins},
      "correct_answer": ["const", "add", "+"],
      "options": ["const", "let", "add", "subtract", "+", "-"],
      "question": "[[const]] [[add]] = (a, b) => a [[+]] b;",
      "css_file": null,
      "html_file": null
    }
  ]
}

=== FILL-IN-THE-BLANK RULES (CRITICAL) ===
1. DO NOT USE UNDERSCORES. Instead, you MUST wrap the hidden parts of the code in double square brackets: [[ ]].
   - Example: function [[add]](a, b) { return a [[+]] b; }
2. The "correct_answer" array MUST contain the exact words you wrapped in [[ ]] in the same order.
3. ***DYNAMIC OPTIONS RULE***:
   - If your "correct_answer" array contains LESS THAN 5 ITEMS: "options" MUST contain all correct answers PLUS enough realistic distractors to equal exactly 5 items total.
   - If your "correct_answer" array contains 5 OR MORE ITEMS: "options" MUST contain ONLY the exact items from "correct_answer".
4. If Category="HTML" or "Computer", files must be null. If "JavaScript", require html and css files. If "CSS", require html_file.
5. ***PURE CODE ONLY***: The "question" field MUST contain ONLY pure, raw, compilable code. DO NOT include any conversational text, instructions (e.g., "Fill in the blanks..."), or markdown code block syntax (like \`\`\`css).

${antiDupSection}

Generate the JSON object with the array of ${batchSize} challenges now.`;
};

export const generatePvpChallengeWithGemini = async (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  options?: { maxAttempts?: number; duplicateLookback?: number },
) => {
  const maxAttempts = Math.max(
    1,
    options?.maxAttempts ?? MAX_GENERATION_ATTEMPTS,
  );
  let lastError: unknown = null;

  const existingCurriculumPool = await prisma.challenge.findMany({
    where: { level: { map: { map_name: category } }, question: { not: null } },
    select: { question: true, correct_answer: true },
    take: 100,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let curriculumReference = "";
      if (existingCurriculumPool.length > 0) {
        const randomRef =
          existingCurriculumPool[
            Math.floor(Math.random() * existingCurriculumPool.length)
          ];
        curriculumReference = `=== CURRICULUM REFERENCE ===\nBase your new challenge on the concepts taught in this existing challenge from our database:\n- Original Question Text: ${JSON.stringify(randomRef.question)}\n- Original Correct Answers: ${JSON.stringify(randomRef.correct_answer)}`;
      }

      const recentQuestions = await getRecentQuestions(
        category,
        difficulty,
        options?.duplicateLookback ?? RECENT_QUESTIONS_LOOKBACK,
      );
      const prompt = buildGeminiPvpPrompt(
        category,
        difficulty,
        recentQuestions,
        curriculumReference,
      );

      const parsed =
        await executeGeminiPromptWithKeyRotation<GeneratedPvpChallenge>(prompt);
      const validated = validateChallengeShape(category, difficulty, parsed);

      if (isNearDuplicateQuestion(validated.question, recentQuestions))
        throw new Error(
          `Generated question is too similar to existing ${category} challenges`,
        );

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

      return { category, difficulty, attempt, challenge: created };
    } catch (error) {
      lastError = error;
      if ((error as any)?.code === "P2002")
        console.warn(
          `[Gemini API] Duplicate detected in DB on attempt ${attempt}. Retrying...`,
        );
      else
        console.warn(
          `[Gemini API] Attempt ${attempt} failed: ${(error as Error).message}`,
        );
    }
  }

  throw new Error(
    `Failed to generate a unique PvP challenge after ${maxAttempts} attempts. ${lastError instanceof Error ? lastError.message : ""}`,
  );
};

export const generateBatchedPvpChallenges = async (
  category: PvpChallengeCategory,
  difficulty: PvpChallengeDifficulty,
  batchSize: number = 5,
) => {
  const maxAttempts = 3;
  let lastError: unknown = null;

  const existingCurriculumPool = await prisma.challenge.findMany({
    where: { level: { map: { map_name: category } }, question: { not: null } },
    select: { question: true, correct_answer: true },
    take: 50,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let curriculumReference = "";
      if (existingCurriculumPool.length > 0) {
        const randomRef =
          existingCurriculumPool[
            Math.floor(Math.random() * existingCurriculumPool.length)
          ];
        curriculumReference = `=== CURRICULUM REFERENCE ===\nBase at least one challenge on this concept:\nQuestion: ${JSON.stringify(randomRef.question)}\nAnswers: ${JSON.stringify(randomRef.correct_answer)}`;
      }

      const recentQuestions = await getRecentQuestions(
        category,
        difficulty,
        40,
      );
      const prompt = buildGeminiBatchedPrompt(
        category,
        difficulty,
        batchSize,
        recentQuestions,
        curriculumReference,
      );

      const parsedData = await executeGeminiPromptWithKeyRotation<{
        challenges: unknown[];
      }>(prompt);

      if (!parsedData.challenges || !Array.isArray(parsedData.challenges))
        throw new Error("Invalid format: missing 'challenges' array");

      const validChallengesToInsert = [];
      for (const item of parsedData.challenges) {
        try {
          const validated = validateChallengeShape(category, difficulty, item);
          if (!isNearDuplicateQuestion(validated.question, recentQuestions)) {
            validChallengesToInsert.push({
              topic: category,
              difficulty,
              points_reward: validated.points_reward,
              coins_reward: validated.coins_reward,
              correct_answer: validated.correct_answer,
              options: validated.options,
              question: validated.question,
              css_file: validated.css_file,
              html_file: validated.html_file,
              dedupe_signature:
                buildDedupeSignature(validated.question) || null,
            });
          }
        } catch (validationErr) {
          console.warn(
            "Skipping 1 challenge in batch due to validation error:",
            (validationErr as Error).message,
          );
        }
      }

      if (validChallengesToInsert.length > 0) {
        const created = await prisma.pVPChallenge.createMany({
          data: validChallengesToInsert,
          skipDuplicates: true,
        });
        console.log(
          `Successfully generated and saved ${created.count} ${category} challenges!`,
        );
        return created;
      } else {
        throw new Error("All generated challenges were duplicates or invalid.");
      }
    } catch (error) {
      lastError = error;
      console.warn(
        `[Gemini API] Batch Attempt ${attempt} failed: ${(error as Error).message}`,
      );
    }
  }

  throw lastError ?? new Error("Failed to generate batch after max attempts");
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
    where: {
      created_at: { lt: start },
      last_used_in_match_at: null,
    },
  });
  return deleted.count;
};

export const ensureDailyPvpChallenges = async (options?: {
  perTopicTarget?: number;
  difficulty?: PvpChallengeDifficulty;
  forceResetToday?: boolean;
}) => {
  const perTopicTarget = Math.max(
    5,
    options?.perTopicTarget ?? DEFAULT_DAILY_TOPIC_POOL,
  );
  const difficulty = options?.difficulty ?? "Easy";

  if (options?.forceResetToday) await prisma.pVPChallenge.deleteMany({});
  else await cleanupOldPvpChallenges();

  const summary: any[] = [];

  for (const topic of ALL_CATEGORIES) {
    const existing = await getTodayPvpChallengeCount({ topic, difficulty });
    const missing = Math.max(0, perTopicTarget - existing);
    let generated = 0;

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
        console.error(`  -> Failed generation: ${(error as Error).message}`);
      }
    }

    const final = await getTodayPvpChallengeCount({ topic, difficulty });
    summary.push({
      topic,
      existing,
      generated,
      final,
      missingAfter: Math.max(0, perTopicTarget - final),
    });
  }

  return summary;
};
