interface APIKey {
  value: string;
  isDead: boolean;
  cooldownUntil: number;
}

class APIKeyPool {
  private keys: APIKey[];
  private currentIndex: number = 0;
  private providerName: string;

  constructor(envString: string | undefined, providerName: string) {
    this.providerName = providerName;
    if (!envString) {
      this.keys = [];
    } else {
      this.keys = envString
        .split(",")
        .map((k) => k.replace(/"/g, "").trim())
        .filter((k) => k.length > 0)
        .map((k) => ({ value: k, isDead: false, cooldownUntil: 0 }));
    }
  }

  public getHealthyKey(): APIKey | null {
    const now = Date.now();
    let attempts = 0;

    while (attempts < this.keys.length) {
      const keyObj = this.keys[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;

      if (!keyObj.isDead && keyObj.cooldownUntil <= now) {
        return keyObj;
      }
      attempts++;
    }

    return null;
  }

  public reportFailure(keyObj: APIKey, status: number | null) {
    const now = Date.now();

    if (status === 401 || status === 403 || status === 404) {
      keyObj.isDead = true;
      console.error(
        `[${this.providerName}] Key permanently disabled (Status: ${status}).`,
      );
    } else if (status === 429) {
      keyObj.cooldownUntil = now + 60 * 1000;
      console.warn(
        `[${this.providerName}] Rate Limit hit. Key on cooldown for 60s.`,
      );
    } else {
      keyObj.cooldownUntil = now + 15 * 1000;
      console.warn(
        `[${this.providerName}] Network/Server error (Status: ${status}). Key on cooldown for 15s.`,
      );
    }
  }
}

const groqPool = new APIKeyPool(process.env.GROQ_API_KEY, "Groq");
const geminiPool = new APIKeyPool(process.env.GEMINI_API_KEY, "Gemini");

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 8000,
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

interface ChallengeGuideInput {
  challenge_id: number;
  level_id: number;
  points_reward: number;
  coins_reward: number;
  challenge_type: string;
  correct_answer: unknown;
  question?: string | null;
  css_file?: string | null;
  html_file?: string | null;
  options?: unknown;
}

export async function generateWrongAnswerGuide(
  topic: string,
  question: string,
  wrongAnswer: string[],
  correctAnswer: string[],
): Promise<string> {
  const incorrectParts: string[] = [];
  const intendedParts: string[] = [];

  wrongAnswer.forEach((ans, index) => {
    if (ans !== correctAnswer[index]) {
      incorrectParts.push(ans);
      intendedParts.push(correctAnswer[index] || "");
    }
  });

  const specificWrongText = incorrectParts.join(", ");
  const specificCorrectText = intendedParts.join(", ");
  const fullPlayerAnswerText = wrongAnswer.join(", ");

  const prompt = `
WHAT:
You are an encouraging gaming AI tutor guiding a player for a review. 

WHY:
Your objective is to help the player learn from their mistakes by contrasting what they submitted with what the code/question is actually trying to achieve.

HOW:
Analyze the provided game data and generate a response formatted EXACTLY like the required output structure below. Do not add conversational filler.

Game Data:
  - Topic: "${topic}"
  - Question: "${question}"
  - Player's Full Submission: "${fullPlayerAnswerText}"
  - Specific Incorrect Part(s): "${specificWrongText}"
  - Target Correct Part(s): "${specificCorrectText}"

CRITICAL RULES: 
- You must NEVER reveal or explicitly state the exact "Target Correct Part" ("${specificCorrectText}") in your response.
- Highlight specific keywords or terms using markdown code blocks (like \`this\`).
- Keep the bullet points concise and direct.
- Be highly context-aware: Compare the typical use-case of the specific incorrect part against the actual goal of the question.

REQUIRED OUTPUT STRUCTURE:
There is an error in the answer you submitted:
Error: You used \`${specificWrongText}\`, which is incorrect in this context.

This error occurs because:
- [Explain concisely what \`${specificWrongText}\` actually does or is used for]

The goal here should be:
- [Explain concisely the intended behavior or purpose based on the question context]

How to fix:
- [Give a subtle conceptual hint on the type of element, tag, or concept needed, WITHOUT revealing the exact answer]
`;

  const groqKey = groqPool.getHealthyKey();

  if (groqKey) {
    let status: number | null = null;
    try {
      const response = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
          }),
        },
        8000,
      );

      status = response.status;
      const data = await response.json();

      if (!response.ok) throw new Error(JSON.stringify(data));

      return data.choices[0].message.content.trim();
    } catch (error: any) {
      groqPool.reportFailure(groqKey, status);
      console.warn(
        `[AI Failover] Groq failed, switching to Gemini. Reason:`,
        error.message,
      );
    }
  }

  const geminiKey = geminiPool.getHealthyKey();

  if (geminiKey) {
    let status: number | null = null;
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.value}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 200,
            },
          }),
        },
        3500,
      );

      status = response.status;
      const data = await response.json();

      if (!response.ok || data.error)
        throw new Error(JSON.stringify(data.error || data));

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error: any) {
      geminiPool.reportFailure(geminiKey, status);
      console.error(`[AI Failover] Gemini also failed. Reason:`, error.message);
    }
  }

  return "Oops! That wasn't quite right. Check the correct answer and try again!";
}

export async function generateChallengeGuide(
  challengeData: ChallengeGuideInput,
): Promise<string> {
  const payload = JSON.stringify(challengeData, null, 2);

  const prompt = `You are an expert curriculum designer for a gamified web development platform. Your task is to write a short, beginner-friendly "guide" for HTML/CSS coding challenges based on the challenge data provided.

Strictly adhere to the following rules:

1. Length & Structure: The guide must be EXACTLY two sentences long. 
   - Sentence 1 (Action): Tell the player what they need to do with the specific text or element. Use active verbs like "Wrap the text...", "Enclose...", "Embed...", or "Apply...". 
   - Sentence 2 (Result): Describe the expected visual or structural output/result on the webpage. Start with "The output should be..." or similar phrasing.
2. No Generic Phrases: Do NOT use mechanical phrases like "Fill in the blanks" or "Complete the code". Focus on the semantic action.
3. No Spoon-feeding: Do NOT reveal the exact tags or attributes found in the "correct_answer". Describe them conceptually (e.g., if the answer is "h1", call it "the main heading tags" or "a top-level title").

---

### EXAMPLE 1 (Input)
{
  "challenge_id": 53,
  "level_id": 2,
  "points_reward": 20,
  "coins_reward": 4,
  "challenge_type": "fill in the blank",
  "correct_answer": "[\"h1\", \"h1\"]",
  "question": "<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello Welcome to Micomi!</h1>\n  </body>\n</html>"
}

### EXAMPLE 1 (Output Guide)
Wrap the text "Hello Welcome to Micomi!" using the correct main heading tags. The output should be a large, bold headline that serves as the main title of your webpage.

---

Now, generate ONLY the 2-sentence guide text for the following challenge data. Do not include any introductory or concluding remarks.

### CURRENT CHALLENGE DATA:
${payload}`;

  const groqKey = groqPool.getHealthyKey();

  if (groqKey) {
    let status: number | null = null;
    try {
      const response = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 160,
          }),
        },
        8000,
      );

      status = response.status;
      const data = await response.json();

      if (!response.ok) throw new Error(JSON.stringify(data));

      return data.choices[0].message.content.trim();
    } catch (error: any) {
      groqPool.reportFailure(groqKey, status);
      console.warn(
        `[AI Failover] Groq failed, switching to Gemini. Reason:`,
        error.message,
      );
    }
  }

  const geminiKey = geminiPool.getHealthyKey();

  if (geminiKey) {
    let status: number | null = null;
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.value}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 160,
            },
          }),
        },
        3500,
      );

      status = response.status;
      const data = await response.json();

      if (!response.ok || data.error)
        throw new Error(JSON.stringify(data.error || data));

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error: any) {
      geminiPool.reportFailure(geminiKey, status);
      console.error(`[AI Failover] Gemini also failed. Reason:`, error.message);
    }
  }

  return "Oops! Guide generation failed. Please try again later.";
}
