import { getMessagePool } from "./messageCache";

export const generateDynamicMessage = async (
  isCorrect: boolean,
  hintUsed: boolean,
  consecutiveCorrects: number,
  playerHealth: number,
  playerMaxHealth: number,
  elapsed: number,
  enemyHealth: number,
  isBonusRound: boolean
): Promise<{ text: string; audio: string[] }> => {
  const lowHealth = playerHealth <= 50 && playerHealth > 0;
  const enemyLowHealth = enemyHealth <= 30 && enemyHealth > 0;
  const quickAnswer = elapsed < 3;
  const streak = consecutiveCorrects >= 3;

  let category = "";
  const tags: string[] = [];

  if (isCorrect) {
    if (hintUsed) {
      category = "CORRECT_HINT";
      tags.push("hint");
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
    } else if (isBonusRound) {
      category = "CORRECT_BONUS";
      tags.push("bonus");
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

  const pool = await getMessagePool(category, tags);

  if (pool.length === 0) {
    return {
      text: `Fight on!`,
      audio: [],
    };
  }

  const msg = pool[Math.floor(Math.random() * pool.length)];

  const text = msg.textTemplate;

  const audio: string[] = [];
  if (msg.audioUrl) audio.push(msg.audioUrl);

  return { text, audio };
};
