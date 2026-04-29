import { getMessagePool } from "./messageCache";

const seenMessageIdsBySignature = new Map<string, Set<number>>();
const lastMessageIdBySignature = new Map<string, number>();

const buildSignature = (category: string, tags: string[]) =>
  `${category}|${[...tags].sort().join(",")}`;

const pickMessageFromPool = (
  pool: Array<{
    id?: number;
    textTemplate?: string | null;
    audioUrl?: string | null;
  }>,
  signature: string,
) => {
  if (pool.length === 0) return null;

  const seen = seenMessageIdsBySignature.get(signature) ?? new Set<number>();
  let candidates = pool.filter(
    (msg) => typeof msg.id === "number" && !seen.has(msg.id),
  );

  if (candidates.length === 0) {
    seen.clear();
    candidates = [...pool];
  }

  const lastId = lastMessageIdBySignature.get(signature);
  if (candidates.length > 1 && typeof lastId === "number") {
    const withoutLast = candidates.filter((msg) => msg.id !== lastId);
    if (withoutLast.length > 0) {
      candidates = withoutLast;
    }
  }

  const selected =
    candidates[Math.floor(Math.random() * candidates.length)] ?? null;

  if (selected && typeof selected.id === "number") {
    seen.add(selected.id);
    seenMessageIdsBySignature.set(signature, seen);
    lastMessageIdBySignature.set(signature, selected.id);
  }

  return selected;
};

export const generateDynamicMessage = async (
  isCorrect: boolean,
  hintUsed: boolean,
  consecutiveCorrects: number,
  playerHealth: number,
  playerMaxHealth: number,
  elapsed: number,
  enemy_name: string,
  enemyHealth: number,
  isBonusRound: boolean,
  isEnemyScored: boolean = false,
): Promise<{ text: string; audio: string[] }> => {
  const lowHealth = playerHealth <= 50 && playerHealth > 0;
  const enemyLowHealth = enemyHealth <= 30 && enemyHealth > 0;
  const quickAnswer = elapsed < 3;
  const streak = consecutiveCorrects >= 3;

  let category = "";
  const tags: string[] = [];

  if (isEnemyScored) {
    if (playerHealth <= 0) {
      category = "WRONG_LOST";
      tags.push("lost");
    } else if (lowHealth) {
      category = "WRONG_LOW_HEALTH";
      tags.push("low_health");
    } else {
      category = "WRONG_BASE";
    }
  } else if (isCorrect) {
    if (hintUsed) {
      category = "CORRECT_HINT";
      tags.push("hint");
    } else if (isBonusRound) {
      category = "CORRECT_BONUS";
      tags.push("bonus");
    } else if (streak) {
      category = "CORRECT_STREAK";
      tags.push("streak");
    } else if (quickAnswer) {
      category = "CORRECT_QUICK";
      tags.push("quick");
    } else if (lowHealth) {
      category = "CORRECT_LOW_HEALTH";
      tags.push("low_health");
    } else if (enemyLowHealth) {
      category = "CORRECT_FINAL";
      tags.push("final_blow");
    } else {
      category = "CORRECT_BASE";
    }
  } else {
    if (playerHealth <= 0) {
      category = "WRONG_LOST";
      tags.push("lost");
    } else if (isBonusRound) {
      category = "WRONG_BONUS";
      tags.push("bonus");
    } else if (lowHealth) {
      category = "WRONG_LOW_HEALTH";
      tags.push("low_health");
    } else {
      category = "WRONG_BASE";
    }
  }

  let pool = await getMessagePool(category, tags);
  let signature = buildSignature(category, tags);

  if (isEnemyScored && (!pool || pool.length === 0)) {
    const fallbackCategory =
      playerHealth <= 0
        ? "WRONG_LOST"
        : lowHealth
          ? "WRONG_LOW_HEALTH"
          : "WRONG_BASE";
    pool = await getMessagePool(fallbackCategory, tags);
    category = fallbackCategory;
    signature = buildSignature(category, tags);
  }

  if (!pool || pool.length === 0) {
    console.error(
      `[GameMessage] No messages found for category: ${category}, tags: ${tags.join(", ")}`,
    );
    return {
      text: isEnemyScored
        ? "Opponent scored!"
        : isCorrect
          ? "Great job!"
          : "Try again!",
      audio: [],
    };
  }

  const msg = pickMessageFromPool(pool, signature);

  if (!msg || !msg.textTemplate) {
    console.error(
      `[GameMessage] Invalid message selected from pool for category: ${category}`,
    );
    return {
      text: isEnemyScored
        ? "Opponent scored!"
        : isCorrect
          ? "Great job!"
          : "Try again!",
      audio: [],
    };
  }

  const text = msg.textTemplate.replace(/\{enemy\}/gi, enemy_name);

  const audio: string[] = [];
  if (msg.audioUrl) audio.push(msg.audioUrl);

  return { text, audio };
};
