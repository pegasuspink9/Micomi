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
  timeoutMs = 3000,
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

export async function generateWrongAnswerGuide(
  topic: string,
  question: string,
  wrongAnswer: string[],
  correctAnswer: string[],
): Promise<string> {
  const prompt = `
WHAT:
You are an encouraging gaming AI tutor guiding a player in a competitive multiplayer game. 

WHY:
Your objective is to help the player learn from their mistakes without giving them an unfair competitive advantage. Because this is a PvP environment, you must strictly guide them conceptually rather than handing them the solution.

HOW:
Analyze the provided game data and generate a response formatted EXACTLY like the required output structure below.

Game Data:
  - Topic: ${topic}
  - Question: ${question}
  - Player's Answer: [${wrongAnswer.join(", ")}]
  - Correct Answer: [${correctAnswer.join(", ")}]

CRITICAL RULES: 
- You must NEVER reveal or explicitly state the exact "Correct Answer" in your response.
- Highlight specific keywords or terms using markdown code blocks (like \`this\`).
- Keep the bullet points concise.

REQUIRED OUTPUT STRUCTURE:
There is an error in the answer you submitted:
Error: [State WHAT the incorrect part of their answer was]
   • This error occurs because [Explain WHY the player's answer is wrong].
   • To fix this error, [Give a subtle conceptual hint on HOW to figure out the correct path].
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
            max_tokens: 60,
          }),
        },
        3000,
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
