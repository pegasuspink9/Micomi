import { PrismaClient, Challenge, QuestType } from "@prisma/client";
import * as LevelService from "../Levels/levels.service";
import * as CombatService from "../Combat/combat.service";
import * as EnergyService from "../Energy/energy.service";
import { formatTimer } from "../../../helper/dateTimeHelper";
import { updateQuestProgress } from "../../game/Quests/quests.service";
import { updateProgressForChallenge } from "../Combat/special_attack.helper";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";
import { generateDynamicMessage } from "../../../helper/gamePlayMessageHelper";
import { getBaseEnemyHp } from "../Combat/combat.service";
import { getBackgroundForLevel } from "../../../helper/combatBackgroundHelper";
import {
  SubmitChallengeControllerResult,
  CompletionRewards,
} from "./challenges.types";
import { getCardForAttackType } from "../Combat/combat.service";
import { revealAllBlanks } from "../../../helper/revealPotionHelper";

const prisma = new PrismaClient();

type ChallengeDTO = Omit<Challenge, never> & {
  answer?: string[];
};

const multisetEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const reverseString = (str: string): string => str.split("").reverse().join("");

const permuteLetters = (str: string): string => {
  const chars = str.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

const replaceCharWithDollar = (str: string): string => {
  if (str.length === 0) return str;
  const index = Math.floor(Math.random() * str.length);
  return str.substring(0, index) + "$" + str.substring(index + 1);
};

const reverseThreeRandomWords = (text: string): string => {
  if (!text) return "";
  const words = text.split(" ");
  if (words.length <= 3) {
    return words.map(reverseString).join(" ");
  }

  const indices = Array.from({ length: words.length }, (_, i) => i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const targetIndices = indices.slice(0, 3);

  return words
    .map((word, index) =>
      targetIndices.includes(index) ? reverseString(word) : word,
    )
    .join(" ");
};

const keepOnlyBlanks = (text: string): string => {
  if (!text) return "";

  const patterns = [
    /<\/_>/g,
    /<_>/g,

    /"(_+)"/g,
    /'(_+)'/g,
    /`(_+)`/g,
    /\{blank\}/g,
    /\[_+\]/g,
    /_+/g,
  ];

  const occupiedRanges: { start: number; end: number }[] = [];
  const matches: { start: number; end: number; text: string }[] = [];

  for (const regex of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      const isOccupied = occupiedRanges.some(
        (range) => start < range.end && end > range.start,
      );

      if (!isOccupied) {
        matches.push({ start, end, text: match[0] });
        occupiedRanges.push({ start, end });
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);

  let result = "";
  let lastIndex = 0;

  for (const match of matches) {
    const textBefore = text.substring(lastIndex, match.start);
    result += textBefore.replace(/[^\n]/g, "");

    result += match.text;

    lastIndex = match.end;
  }

  const textAfter = text.substring(lastIndex);
  result += textAfter.replace(/[^\n]/g, "");

  return result;
};

const isTimedChallengeType = (type: string) =>
  ["multiple choice", "fill in the blank"].includes(type);

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const buildChallengeWithTimer = (
  challenge: Challenge,
  timeRemaining: number,
) => ({
  ...challenge,
  timeLimit: isTimedChallengeType(challenge.challenge_type)
    ? CHALLENGE_TIME_LIMIT
    : 0,
  timeRemaining: isTimedChallengeType(challenge.challenge_type)
    ? timeRemaining
    : 0,
  timer: isTimedChallengeType(challenge.challenge_type)
    ? formatTimer(timeRemaining)
    : null,
});

const generateMotivationalMessage = (
  wasFirstCompletion: boolean,
  wrongChallengesCount: number,
  totalChallenges: number,
  isBonusRound: boolean,
  playerWon: boolean,
  levelNumber: number,
): string => {
  const random = (messages: string[]) =>
    messages[Math.floor(Math.random() * messages.length)];

  if (!playerWon) {
    const mistakeCount = wrongChallengesCount;

    if (mistakeCount === 0) {
      return random([
        `You were so close to victory in Level ${levelNumber}! Your knowledge was perfect, but the battle was lost. Regroup and try again—you've got this!`,
        `Level ${levelNumber} ended in defeat despite your flawless answers! Sometimes timing matters too. Take a breath and dive back in!`,
        `Not a single wrong answer in Level ${levelNumber}, yet defeat found you! You clearly know your stuff—one more attempt will seal the victory!`,
        `Your knowledge shined bright in Level ${levelNumber} with zero mistakes! The win slipped away this time, but you're absolutely ready for the next round!`,
      ]);
    } else if (mistakeCount === 1) {
      return random([
        `Level ${levelNumber} defeated you this time with just 1 mistake. You're almost there! One more focused attempt and victory will be yours!`,
        `So close! Just 1 slip-up in Level ${levelNumber} led to defeat. You know what to do now—go claim that victory!`,
        `A single mistake in Level ${levelNumber} cost you the win. Shake it off and show this level what you're truly capable of!`,
        `Level ${levelNumber} caught you on 1 error. That's how close you are! Your comeback will be legendary!`,
      ]);
    } else if (mistakeCount <= 3) {
      return random([
        `You made ${mistakeCount} mistakes in Level ${levelNumber} before falling. Don't be discouraged—every mistake is a lesson learned. Come back stronger!`,
        `Level ${levelNumber} proved tough with ${mistakeCount} errors leading to defeat. But now you know the traps—next time, they won't catch you!`,
        `${mistakeCount} mistakes in Level ${levelNumber} this round. Each one teaches you something valuable. You're getting closer with every attempt!`,
        `Defeated in Level ${levelNumber} with ${mistakeCount} missteps. But look at everything you DID get right! Victory is within reach!`,
      ]);
    } else if (mistakeCount <= 5) {
      return random([
        `${mistakeCount} mistakes cost you the battle in Level ${levelNumber}. Take a moment to review, then face this challenge again with renewed determination!`,
        `Level ${levelNumber} wasn't yours this time, with ${mistakeCount} errors along the way. Every warrior needs to study their opponent—now you know!`,
        `${mistakeCount} slips in Level ${levelNumber} led to defeat. Rest, reflect, and return ready to conquer! You've got the potential!`,
        `The challenge of Level ${levelNumber} claimed victory with ${mistakeCount} mistakes on your side. But you're learning fast—the next attempt will be different!`,
      ]);
    } else {
      return random([
        `Level ${levelNumber} proved challenging with ${mistakeCount} mistakes. Remember, even the greatest heroes faced setbacks. Study, practice, and return victorious!`,
        `${mistakeCount} errors in Level ${levelNumber} this round. This level is testing you, but each attempt makes you sharper. Don't give up!`,
        `A tough battle in Level ${levelNumber} with ${mistakeCount} mistakes. Take your time, review the material, and come back when you're ready to dominate!`,
        `Level ${levelNumber} pushed you hard with ${mistakeCount} errors. But you know what? You're still here, still trying. That's what champions do!`,
      ]);
    }
  }

  const mistakeCount = wrongChallengesCount;
  const isPerfect = mistakeCount === 0;

  if (isPerfect && !isBonusRound) {
    if (wasFirstCompletion) {
      return random([
        `PERFECT SCORE! You've conquered Level ${levelNumber} flawlessly on your first try! Your mastery is exceptional—keep this momentum going!`,
        `ABSOLUTE PERFECTION! Level ${levelNumber} defeated on your first attempt without a single error! You're a natural—amazing work!`,
        `FIRST TRY FLAWLESS! Not one mistake in Level ${levelNumber}! Your skill level is off the charts—what an incredible achievement!`,
        `UNSTOPPABLE! Level ${levelNumber} crushed perfectly on your debut! You're setting the bar high—absolutely outstanding performance!`,
      ]);
    } else {
      return random([
        `PERFECT SCORE! You've mastered Level ${levelNumber} without a single mistake! Your skills continue to shine—excellent work!`,
        `FLAWLESS EXECUTION! Zero errors in Level ${levelNumber}! Your persistence has paid off beautifully—you're in the zone!`,
        `100% PERFECTION! Level ${levelNumber} completely dominated! You've truly mastered this material—phenomenal job!`,
        `SPOTLESS VICTORY! Not a single mistake in Level ${levelNumber}! Your dedication shows in every answer—bravo!`,
      ]);
    }
  }

  if (isPerfect && isBonusRound) {
    if (wasFirstCompletion) {
      return random([
        `FLAWLESS VICTORY! You completed Level ${levelNumber} with perfect accuracy AND conquered the bonus round! You're a true champion!`,
        `LEGENDARY PERFORMANCE! First completion of Level ${levelNumber} with ZERO mistakes through the bonus round! Absolutely spectacular!`,
        `PERFECT CHAMPION! Level ${levelNumber} bonus round demolished flawlessly on your first try! You're operating at peak performance!`,
        `ULTIMATE MASTERY! Not a single error through Level ${levelNumber}'s bonus challenge on your first attempt! Pure excellence!`,
      ]);
    } else {
      return random([
        `FLAWLESS VICTORY! Level ${levelNumber} bonus round complete with zero mistakes! Your dedication to perfection is admirable!`,
        `PERFECTION ACHIEVED! The bonus round of Level ${levelNumber} conquered without a single slip! Your consistency is remarkable!`,
        `IMPECCABLE! Level ${levelNumber}'s bonus challenge completed with 100% accuracy! You've reached expert status!`,
        `TOTAL DOMINATION! Zero errors through Level ${levelNumber}'s bonus round! You make difficult look easy!`,
      ]);
    }
  }

  if (isBonusRound) {
    if (mistakeCount <= 2) {
      return random([
        `Great job completing Level ${levelNumber}'s bonus round! ${mistakeCount} ${
          mistakeCount === 1 ? "mistake" : "mistakes"
        } along the way—remember, it's not bad to make mistakes. They help you grow stronger!`,
        `Bonus round conquered in Level ${levelNumber}! Only ${mistakeCount} ${
          mistakeCount === 1 ? "error" : "errors"
        }—that's impressive! You're learning and improving with every challenge!`,
        `Victory in Level ${levelNumber}'s bonus challenge! ${mistakeCount} ${
          mistakeCount === 1 ? "slip" : "slips"
        }, but you pushed through! That's the mark of a determined learner!`,
        `Level ${levelNumber} bonus round complete! Just ${mistakeCount} ${
          mistakeCount === 1 ? "mistake" : "mistakes"
        }—you handled that extra challenge beautifully! Well earned!`,
      ]);
    } else if (mistakeCount === 3) {
      return random([
        `You've conquered Level ${levelNumber}'s bonus round with 3 mistakes. Every challenge overcome makes you wiser. Well done pushing through!`,
        `Bonus round victory in Level ${levelNumber}! Three errors couldn't stop your momentum. Your resilience is impressive!`,
        `Level ${levelNumber}'s bonus challenge completed with 3 mistakes. That shows real determination—you didn't give up!`,
        `Three mistakes in Level ${levelNumber}'s bonus round, but you crossed the finish line! Persistence wins the day!`,
      ]);
    } else {
      return random([
        `Bonus round complete in Level ${levelNumber}! You made ${mistakeCount} mistakes but persevered to victory. Your determination is your greatest strength!`,
        `Level ${levelNumber}'s bonus challenge conquered! ${mistakeCount} errors along the way, but you never quit. That's what matters most!`,
        `Victory in Level ${levelNumber}'s bonus round despite ${mistakeCount} mistakes! Your refusal to give up is truly inspiring!`,
        `You powered through Level ${levelNumber}'s bonus with ${mistakeCount} mistakes. Remember: finishing strong beats starting perfect. Excellent perseverance!`,
      ]);
    }
  }

  if (mistakeCount === 1) {
    return random([
      `Excellent work on Level ${levelNumber}! Just 1 mistake shows your strong grasp of the material. You're on the path to mastery!`,
      `Level ${levelNumber} conquered with only 1 error! That's outstanding accuracy—you really know your stuff!`,
      `Impressive victory in Level ${levelNumber}! A single mistake is practically perfect. You're doing amazing!`,
      `One mistake in Level ${levelNumber} and still victorious! Your understanding is rock solid—keep up this fantastic progress!`,
    ]);
  } else if (mistakeCount <= 3) {
    return random([
      `Well done completing Level ${levelNumber}! With only ${mistakeCount} mistakes, you demonstrated solid understanding. Keep up the great work!`,
      `Victory is yours in Level ${levelNumber}! Just ${mistakeCount} errors shows you're really grasping the concepts. Excellent progress!`,
      `Level ${levelNumber} complete with ${mistakeCount} mistakes! That's a strong performance—you should be proud of this achievement!`,
      `${mistakeCount} mistakes in Level ${levelNumber}, but victory was never in doubt! You're building real expertise here!`,
    ]);
  } else if (mistakeCount <= 5) {
    return random([
      `Victory in Level ${levelNumber}! You made ${mistakeCount} mistakes but learned from each one and succeeded. That's the spirit of a true learner!`,
      `Level ${levelNumber} conquered! ${mistakeCount} errors couldn't hold you back. Each mistake made you smarter, and you finished strong!`,
      `You've beaten Level ${levelNumber} with ${mistakeCount} mistakes along the way. The important thing? You kept going and won!`,
      `Success in Level ${levelNumber}! ${mistakeCount} slips were just speed bumps on your road to victory. Great determination!`,
    ]);
  } else {
    return random([
      `Level ${levelNumber} complete! ${mistakeCount} mistakes couldn't stop your determination. Every error teaches you something valuable—onward to the next challenge!`,
      `You did it! Level ${levelNumber} finished despite ${mistakeCount} errors. Your persistence is admirable—that's how champions are made!`,
      `Victory earned in Level ${levelNumber}! ${mistakeCount} mistakes tested you, but you never gave up. Forward to greater heights!`,
      `Level ${levelNumber} conquered through sheer determination! ${mistakeCount} errors made the victory even sweeter. You're getting stronger with every level!`,
    ]);
  }
};

const micomiImages = {
  Victory: [
    "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb1.png",
    "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb2.png",
    "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb3.png",
  ],
  Defeat: [
    "https://micomi-assets.me/Micomi%20Celebrating/Failed1.png",
    "https://micomi-assets.me/Micomi%20Celebrating/Failed2.png",
    "https://micomi-assets.me/Micomi%20Celebrating/Failed3.png",
  ],
};

const playerMicomiIndex = new Map<
  number,
  { victory: number; defeat: number }
>();

const getRandomMicomiImage = (playerId: number, isVictory: boolean): string => {
  const images = isVictory ? micomiImages.Victory : micomiImages.Defeat;
  const key = isVictory ? "victory" : "defeat";

  let indices = playerMicomiIndex.get(playerId);
  if (!indices) {
    indices = { victory: 0, defeat: 0 };
    playerMicomiIndex.set(playerId, indices);
  }

  const currentIndex = indices[key];
  const image = images[currentIndex];

  indices[key] = (currentIndex + 1) % images.length;

  return image;
};

const calculateStars = (
  wrongChallengesCount: number,
  totalChallenges: number,
): number => {
  if (wrongChallengesCount === 0) {
    return 3;
  }

  const mistakePercentage = (wrongChallengesCount / totalChallenges) * 100;

  if (mistakePercentage <= 20) {
    return 2;
  }

  return 1;
};

export const submitChallengeService = async (
  playerId: number,
  levelId: number,
  challengeId: number,
  answer: string[],
  useHint: boolean = false,
): Promise<
  SubmitChallengeControllerResult & {
    energy?: number;
    timeToNextEnergyRestore?: string | null;
  }
> => {
  const hasEnergy = await EnergyService.hasEnoughEnergy(playerId, 1);
  if (!hasEnergy) {
    const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
    return {
      message: `Not enough energy! Next energy restore in: ${
        energyStatus.timeToNextRestore ?? "N/A"
      }`,
      success: false,
    } as any;
  }

  const [challenge, level] = await Promise.all([
    prisma.challenge.findUnique({ where: { challenge_id: challengeId } }),
    prisma.level.findUnique({
      where: { level_id: levelId },
      include: { challenges: true, map: true, enemy: true },
    }),
  ]);
  if (!challenge)
    return { message: "Challenge not found", success: false } as any;
  if (!level) return { message: "Level not found", success: false } as any;

  const enemy = level.enemy;
  if (!enemy)
    return {
      message: "No enemy found for this level's map + difficulty",
      success: false,
    } as any;

  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    include: {
      ownedCharacters: {
        where: { is_selected: true, is_purchased: true },
        include: { character: true },
      },
    },
  });
  if (!player) return { message: "Player not found", success: false } as any;

  const character = player.ownedCharacters[0]?.character;
  if (!character)
    return { message: "No selected character found", success: false } as any;

  const enemyMaxHealth = getBaseEnemyHp(level);

  let currentProgress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });

  const isReplayingCompletedLevel = currentProgress?.is_completed === true;

  if (!currentProgress) {
    currentProgress = await prisma.playerProgress.create({
      data: {
        player_id: playerId,
        level_id: levelId,
        current_level: level.level_number,
        attempts: 0,
        player_answer: {},
        wrong_challenges: [],
        completed_at: null,
        challenge_start_time: new Date(),
        is_completed: false,
        enemy_hp: enemyMaxHealth,
        player_hp: character.health,
        coins_earned: 0,
        total_points_earned: 0,
        total_exp_points_earned: 0,
        consecutive_corrects: 0,
        consecutive_wrongs: 0,
        wrong_challenges_count: 0,
        has_reversed_curse: false,
        has_boss_shield: false,
        has_force_character_attack_type: false,
      },
    });
  }

  console.log("CHALLENGE SERVICE - Current progress health:");
  console.log("- Player HP from progress:", currentProgress.player_hp);
  console.log("- Enemy HP from progress:", currentProgress.enemy_hp);

  const challengeStart = new Date(currentProgress.challenge_start_time!);
  const now = new Date();
  const elapsed = (now.getTime() - challengeStart.getTime()) / 1000;

  let correctAnswer = challenge.correct_answer as string[];
  const rawCorrectAnswer = [...correctAnswer];

  let effectiveCorrectAnswer = correctAnswer;
  if (currentProgress.has_reversed_curse && enemy.enemy_name === "Boss Darco") {
    effectiveCorrectAnswer = rawCorrectAnswer.map(reverseString);
    console.log(
      `- Reversal curse active for Boss Darco: correct answers reversed for comparison`,
    );
  }

  let finalAnswer = answer;
  let hintUsed = false;

  if (
    currentProgress.has_permuted_ss &&
    enemy.enemy_name === "Boss Pyroformic"
  ) {
    const allMappings = (currentProgress.permutation_mapping as any) || {};
    const mapping = allMappings[challengeId.toString()];

    if (mapping && mapping.original && mapping.permuted) {
      const { original, permuted } = mapping;

      finalAnswer = finalAnswer.map((permutedText) => {
        const index = permuted.findIndex((opt: string) => opt === permutedText);
        return index !== -1 ? original[index] : permutedText;
      });

      console.log(
        `- Permutation SS active: mapped player answer from permuted back to original using stored mapping`,
      );
    } else {
      console.log(
        `- Warning: Permutation mapping not found for challenge ${challengeId}, answer may be incorrect`,
      );
    }
  }

  if (useHint) {
    const hintPotion = await prisma.playerPotion.findFirst({
      where: {
        player_id: playerId,
        quantity: { gt: 0 },
        potion: { potion_type: "Reveal" },
      },
      include: { potion: true },
    });

    if (hintPotion) {
      if (effectiveCorrectAnswer.length > 0) {
        if (challenge.challenge_type === "multiple choice") {
          finalAnswer = [effectiveCorrectAnswer[0]];
        } else if (challenge.challenge_type === "fill in the blank") {
          finalAnswer = [effectiveCorrectAnswer[0]];
        }

        await prisma.playerPotion.update({
          where: { player_potion_id: hintPotion.player_potion_id },
          data: { quantity: hintPotion.quantity - 1 },
        });

        hintUsed = true;
        console.log(
          `- Hint potion activated: revealing only part of the effective correct answer (${effectiveCorrectAnswer[0]})`,
        );
      }
    } else {
      console.log(
        "- Hint requested but no hint potion available; using original answer",
      );
    }
  }

  type PlayerAnswerMap = Record<string, string[]>;

  const answers: PlayerAnswerMap =
    (currentProgress.player_answer as PlayerAnswerMap) ?? {};

  const key = String(challengeId);
  const existingAnswer = answers[key];

  const computedAlreadyAnswered =
    !!existingAnswer &&
    existingAnswer[0] !== "_REVEAL_PENDING_" &&
    !((currentProgress.wrong_challenges ?? []) as number[]).includes(
      challengeId,
    );

  const isRevealConfirmed =
    Array.isArray(existingAnswer) &&
    existingAnswer[0] === "_REVEAL_PENDING_" &&
    finalAnswer.length === 1 &&
    finalAnswer[0] === "Attack";

  const isCorrect = isRevealConfirmed
    ? true
    : multisetEqual(finalAnswer, effectiveCorrectAnswer);

  if (isRevealConfirmed) {
    answers[key] = effectiveCorrectAnswer;

    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: {
        player_answer: answers,
      },
    });
  }

  let wasEverWrong = false;
  if (isCorrect) {
    wasEverWrong = (
      (currentProgress.wrong_challenges as number[]) ?? []
    ).includes(challengeId);
  }

  const isBonusRound =
    currentProgress.enemy_hp <= 0 && currentProgress.player_hp > 0;

  const answeredIdsBefore = Object.keys(
    currentProgress.player_answer ?? {},
  ).map(Number);
  const allChallengeIds = level.challenges.map((c) => c.challenge_id);
  const bonusChallengeIds = allChallengeIds.filter(
    (id) => !answeredIdsBefore.includes(id),
  );

  let characterDamageForCoins: number | undefined = undefined;
  if (isBonusRound && isCorrect) {
    const damageArray = Array.isArray(character.character_damage)
      ? (character.character_damage as number[])
      : [10, 15, 25];

    const correctAnswerLength = Array.isArray(challenge.correct_answer)
      ? challenge.correct_answer.length
      : 1;

    const nextBefore = await getNextChallengeService(playerId, levelId);
    const nextChallengeBefore = nextBefore.nextChallenge;
    const isCompletingBonusCheck = isBonusRound && !nextChallengeBefore;

    const updatedWrongChallengesCheck = (currentProgress.wrong_challenges ??
      []) as number[];
    const bonusAllCorrectCheck = isCompletingBonusCheck
      ? updatedWrongChallengesCheck.length === 0
      : false;

    let damageIndex = 0;

    if (isCompletingBonusCheck && bonusAllCorrectCheck) {
      damageIndex = 3;
    } else if (isCompletingBonusCheck) {
      damageIndex = 2;
    } else if (!wasEverWrong && correctAnswerLength >= 8) {
      damageIndex = 2;
    } else if (!wasEverWrong && correctAnswerLength >= 5) {
      damageIndex = 1;
    }

    characterDamageForCoins = damageArray[damageIndex] ?? 10;

    if (currentProgress.has_strong_effect) {
      characterDamageForCoins *= 2;
    }

    console.log(
      `- Bonus round coins calculation: damage tier ${damageIndex}, base damage ${damageArray[damageIndex]}, final damage for coins: ${characterDamageForCoins}`,
    );
  }

  const { updatedProgress, alreadyAnsweredCorrectly } =
    await updateProgressForChallenge(
      currentProgress.progress_id,
      challengeId,
      isCorrect,
      finalAnswer,
      isBonusRound,
      characterDamageForCoins,
      isRevealConfirmed,
    );

  if (isCorrect && updatedProgress?.consecutive_corrects === 3) {
    if (character.character_name === "Gino") {
      const healAmount = Math.floor(character.health * 0.25);
      const currentHp = updatedProgress.player_hp;
      const newHp = Math.min(character.health, currentHp + healAmount);

      await prisma.playerProgress.update({
        where: { progress_id: currentProgress.progress_id },
        data: { player_hp: newHp },
      });

      updatedProgress.player_hp = newHp;
      console.log(`- Gino's Passive Triggered: Healed ${healAmount} HP`);
    }

    if (character.character_name === "ShiShi") {
      await prisma.playerProgress.update({
        where: { progress_id: currentProgress.progress_id },
        data: { has_freeze_effect: true },
      });

      currentProgress.has_freeze_effect = true;

      console.log(
        `- ShiShi's Passive Triggered: Enemy Frozen! (Safe for next turn)`,
      );
    }

    if (character.character_name === "Ryron") {
      await prisma.playerProgress.update({
        where: { progress_id: currentProgress.progress_id },
        data: { has_ryron_reveal: true },
      });

      currentProgress.has_ryron_reveal = true;

      console.log(
        `- Ryron's Passive Triggered: Next challenge will be auto-revealed!`,
      );
    }

    if (character.character_name === "Leon") {
      await prisma.playerProgress.update({
        where: { progress_id: currentProgress.progress_id },
        data: {
          has_strong_effect: true,
        },
      });

      updatedProgress.has_strong_effect = true;
      console.log(
        `- Leon's Passive Triggered: Next attack will deal double damage`,
      );
    }
  }

  if (
    !updatedProgress ||
    "success" in updatedProgress ||
    !("progress_id" in updatedProgress)
  ) {
    return {
      message: "Failed to update challenge progress",
      success: false,
    } as any;
  }

  const nextBefore = await getNextChallengeService(playerId, levelId);
  const nextChallengeBefore = nextBefore.nextChallenge;
  const isCompletingBonus = isBonusRound && !nextChallengeBefore;

  const updatedWrongChallenges = (updatedProgress?.wrong_challenges ??
    []) as number[];
  const bonusAllCorrect = isCompletingBonus
    ? updatedWrongChallenges.length === 0
    : false;

  let fightResult: any;
  let message: string = "Challenge submitted.";
  let audioResponse: string[] = [];
  let appliedDamage = 0;
  let character_attack_audio: string | null = null;

  if (isCorrect) {
    const baselineState = await CombatService.getCurrentFightState(
      playerId,
      levelId,
      enemy.enemy_id,
    );

    fightResult = await CombatService.handleFight(
      playerId,
      levelId,
      enemy.enemy_id,
      true,
      elapsed,
      challengeId,
      computedAlreadyAnswered,
      wasEverWrong,
      isBonusRound,
      isCompletingBonus,
      bonusChallengeIds.length,
      bonusAllCorrect,
    );

    appliedDamage =
      fightResult.appliedDamage ||
      baselineState.character.character_damage[1] ||
      50;
    console.log(
      `- Character damage displayed on correct answer (doubled if active): ${fightResult.character.character_damage}, applied: ${appliedDamage}`,
    );

    //character attack audio
    if (character.character_name === "Gino") {
      const type = fightResult.character?.character_attack_type;

      switch (type) {
        case "special_attack":
        case "third_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/Final/3rd%20and%204th%20Skill%20Gino.wav";
          break;
        case "second_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/Final/Gino%20Bite.wav";
          break;
        case "basic_attack":
        default:
          character_attack_audio =
            "https://micomi-assets.me/Sounds/Final/Gino_Basic_Attack.wav";
          break;
      }
    } else if (character.character_name === "ShiShi") {
      const type = fightResult.character?.character_attack_type;

      switch (type) {
        case "special_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/Ult.wav.wav";
          break;
        case "third_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/Special.wav.wav";
          break;
        case "second_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/2nd.wav.wav";
          break;
        case "basic_attack":
        default:
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Shi%20Attacks/Basic.mp3.wav";
          break;
      }
    } else if (character.character_name === "Ryron") {
      const type = fightResult.character?.character_attack_type;

      switch (type) {
        case "special_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/Sounds_In%20Game_Ryron%20Attacks_Ult.wav.wav";
          break;
        case "third_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/Ryron_Special.wav";
          break;
        case "second_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/2nd%20Attack.wav";
          break;
        case "basic_attack":
        default:
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Ryron%20Attacks/Sounds_In%20Game_Ryron%20Attacks_Basic.wav.wav";
          break;
      }
    } else if (character.character_name === "Leon") {
      const type = fightResult.character?.character_attack_type;

      switch (type) {
        case "special_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/Sounds_In%20Game_Leon%20Attacks_Ult.mp3.wav";
          break;
        case "third_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/Leon_Special.wav";
          break;
        case "second_attack":
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/2nd.wav";
          break;
        case "basic_attack":
        default:
          character_attack_audio =
            "https://micomi-assets.me/Sounds/In%20Game/Leon%20Attacks/Sounds_In%20Game_Leon%20Attacks_Basic.wav.wav";
          break;
      }
    }

    const { text, audio } = await generateDynamicMessage(
      true,
      hintUsed,
      updatedProgress.consecutive_corrects ?? 0,
      fightResult.character_health ?? character.health,
      character.health,
      elapsed,
      enemy.enemy_name,
      fightResult.enemyHealth ??
        fightResult.enemy?.enemy_health ??
        currentProgress.enemy_hp,
      false,
    );
    message = text;
    audioResponse = audio;

    if (!hintUsed && !isReplayingCompletedLevel) {
      await updateQuestProgress(playerId, QuestType.solve_challenge_no_hint, 1);
      console.log("Quest progress updated - first-time completion");
    } else if (isReplayingCompletedLevel) {
      console.log("Skipping quest update - replaying completed level");
    }
  } else {
    const baselineState = await CombatService.getCurrentFightState(
      playerId,
      levelId,
      enemy.enemy_id,
    );

    fightResult = await CombatService.handleFight(
      playerId,
      levelId,
      enemy.enemy_id,
      false,
      elapsed,
      challengeId,
    );

    if (currentProgress.has_freeze_effect) {
      fightResult.character.character_health =
        baselineState.character.character_health;
      fightResult.character.character_hurt = null;
      fightResult.enemy.enemy_damage = 0;
      fightResult.enemy.enemy_attack = null;
      fightResult.enemy.enemy_run = null;
      console.log(
        "Freeze effect applied on wrong answer: No enemy attack, no damage taken.",
      );
      message = "Frozen enemy can't strike back!";
    } else {
      fightResult.character.character_damage = 0;
    }

    const { text, audio } = await generateDynamicMessage(
      false,
      false,
      0,
      fightResult.charHealth ??
        fightResult.character?.character_health ??
        currentProgress.player_hp,
      character.health,
      elapsed,
      enemy.enemy_name,
      fightResult.enemyHealth ??
        fightResult.enemy?.enemy_health ??
        currentProgress.enemy_hp,
      false,
    );

    message = text;
    audioResponse = audio;
  }

  const next = await getNextChallengeService(playerId, levelId);
  const nextChallenge = next.nextChallenge;

  const nextCorrectAnswerLength = nextChallenge
    ? Array.isArray(nextChallenge.correct_answer)
      ? nextChallenge.correct_answer.length
      : 0
    : 0;

  let card_type: string | null = null;
  let character_attack_card: string | null = null;

  let attackType: string | null = null;

  let character_damage_card: number | null = null;

  const currentAnsweredCount = Object.keys(
    updatedProgress.player_answer ?? {},
  ).length;
  const totalChallenges = level.challenges.length;
  const isLastRemaining =
    updatedWrongChallenges.length === 0 &&
    currentAnsweredCount + 1 === totalChallenges;

  if (nextChallenge) {
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { challenge_start_time: new Date() },
    });
  }

  const freshProgress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: { level: { include: { challenges: true } } },
  });

  console.log("CHALLENGE SERVICE - Fresh progress after combat:");
  console.log("- Player HP:", freshProgress?.player_hp);
  console.log("- Enemy HP:", freshProgress?.enemy_hp);
  console.log("- Fight result enemy health:", fightResult?.enemyHealth);
  console.log("- Fight result player health:", fightResult?.charHealth);

  const playerAnswer =
    (freshProgress?.player_answer as Record<string, string[]>) || {};
  const answeredIds = Object.keys(playerAnswer).map(Number);
  const effectiveAnsweredIds = answeredIds.filter((id) => {
    const ans = playerAnswer[id.toString()];
    return ans && ans[0] !== "_REVEAL_PENDING_";
  });
  const wrongChallengesArr = (freshProgress?.wrong_challenges ??
    []) as number[];
  const allCompleted =
    effectiveAnsweredIds.length === level.challenges.length &&
    wrongChallengesArr.length === 0;

  let completionRewards: CompletionRewards | undefined = undefined;
  let nextLevel: SubmitChallengeControllerResult["nextLevel"] = null;
  const wasFirstCompletion = allCompleted && !freshProgress?.is_completed;

  const playerLost = freshProgress!.player_hp <= 0;

  const isNewBonusRound =
    freshProgress!.enemy_hp <= 0 && freshProgress!.player_hp > 0;

  let is_victory_audio: string | null = null;
  let is_victory_image: string | null = null;
  let stars: number | undefined = undefined;

  if (allCompleted || playerLost) {
    const wrongCount = wrongChallengesArr.length;
    const wasInBonusRound =
      freshProgress!.enemy_hp <= 0 && freshProgress!.player_hp > 0;

    if (playerLost) {
      const motivationalMessage = generateMotivationalMessage(
        false,
        wrongCount,
        totalChallenges,
        wasInBonusRound,
        false,
        level.level_number,
      );

      stars = 0;

      is_victory_audio =
        "https://micomi-assets.me/Sounds/Final/Defeat_Sound.wav";

      is_victory_image = getRandomMicomiImage(playerId, false);

      completionRewards = {
        feedbackMessage: motivationalMessage,
        coinsEarned: 0,
        totalPointsEarned: 0,
        totalExpPointsEarned: 0,
        isVictory: false,
        stars,
      };

      await prisma.playerProgress.update({
        where: { progress_id: currentProgress.progress_id },
        data: {
          player_hp: character.health,
          enemy_hp: enemyMaxHealth,
          player_answer: {},
          wrong_challenges: [],
          attempts: 0,
          coins_earned: 0,
          total_points_earned: 0,
          total_exp_points_earned: 0,
          consecutive_corrects: 0,
          consecutive_wrongs: 0,
          wrong_challenges_count: 0,
          has_strong_effect: false,
          has_freeze_effect: false,
          has_reversed_curse: false,
          has_boss_shield: false,
          is_completed: true,
          completed_at: new Date(),
        },
      });
    } else if (allCompleted) {
      stars = calculateStars(wrongCount, totalChallenges);

      const motivationalMessage = generateMotivationalMessage(
        wasFirstCompletion,
        wrongCount,
        totalChallenges,
        wasInBonusRound,
        true,
        level.level_number,
      );

      is_victory_audio =
        "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";

      is_victory_image = getRandomMicomiImage(playerId, true);

      if (wasFirstCompletion) {
        await prisma.playerProgress.update({
          where: { progress_id: currentProgress.progress_id },
          data: {
            is_completed: true,
            completed_at: new Date(),
            has_strong_effect: false,
            has_freeze_effect: false,
            stars_earned: stars,
          },
        });

        completionRewards = {
          feedbackMessage: motivationalMessage,
          coinsEarned: freshProgress?.coins_earned ?? 0,
          totalPointsEarned: freshProgress?.total_points_earned ?? 0,
          totalExpPointsEarned: freshProgress?.total_exp_points_earned ?? 0,
          isVictory: true,
          stars,
        };

        nextLevel = await LevelService.unlockNextLevel(
          playerId,
          level.map_id,
          level.level_id,
        );
      } else {
        const currentStars = freshProgress?.stars_earned ?? 0;
        const improved = stars > currentStars;

        if (improved) {
          await prisma.playerProgress.update({
            where: { progress_id: currentProgress.progress_id },
            data: {
              stars_earned: stars,
            },
          });
        }

        is_victory_audio =
          "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";

        is_victory_image = getRandomMicomiImage(playerId, true);

        completionRewards = {
          feedbackMessage:
            motivationalMessage +
            "\nAlready completed—no extra rewards. Great practice!",
          coinsEarned: 0,
          totalPointsEarned: 0,
          totalExpPointsEarned: 0,
          isVictory: true,
          stars,
        };
      }
    }
  } else if (
    isNewBonusRound &&
    effectiveAnsweredIds.length === totalChallenges
  ) {
    const wrongCount = wrongChallengesArr.length;
    stars = calculateStars(wrongCount, totalChallenges);

    const motivationalMessage = generateMotivationalMessage(
      wasFirstCompletion,
      wrongCount,
      totalChallenges,
      true,
      true,
      level.level_number,
    );

    is_victory_audio =
      "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";
    is_victory_image = getRandomMicomiImage(playerId, true);

    if (wasFirstCompletion) {
      await prisma.playerProgress.update({
        where: { progress_id: currentProgress.progress_id },
        data: {
          is_completed: true,
          completed_at: new Date(),
          has_strong_effect: false,
          has_freeze_effect: false,
          stars_earned: stars,
        },
      });

      completionRewards = {
        feedbackMessage: motivationalMessage,
        coinsEarned: freshProgress?.coins_earned ?? 0,
        totalPointsEarned: freshProgress?.total_points_earned ?? 0,
        totalExpPointsEarned: freshProgress?.total_exp_points_earned ?? 0,
        isVictory: true,
        stars,
      };

      nextLevel = await LevelService.unlockNextLevel(
        playerId,
        level.map_id,
        level.level_id,
      );
    } else {
      const currentStars = freshProgress?.stars_earned ?? 0;
      const improved = stars > currentStars;

      if (improved) {
        await prisma.playerProgress.update({
          where: { progress_id: currentProgress.progress_id },
          data: {
            stars_earned: stars,
          },
        });
      }

      completionRewards = {
        feedbackMessage:
          motivationalMessage +
          "\nAlready completed—no extra rewards. Great practice!",
        coinsEarned: 0,
        totalPointsEarned: 0,
        totalExpPointsEarned: 0,
        isVictory: true,
        stars,
      };
    }
  }

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  const rawPlayerOutputs = freshProgress?.player_expected_output;
  const playerOutputs: string[] | null = Array.isArray(rawPlayerOutputs)
    ? (rawPlayerOutputs as string[])
    : null;

  const correctAnswerLength = Array.isArray(nextChallenge?.correct_answer)
    ? nextChallenge.correct_answer.length
    : 0;

  const combatBackground = [
    await getBackgroundForLevel(level.map.map_name, level.level_number),
  ];

  const questionType = level.map.map_name;

  let gameplay_audio = "";

  if (level.level_type === "bossButton") {
    gameplay_audio = "https://micomi-assets.me/Sounds/Final/Boss.ogg";
  } else {
    if (questionType === "HTML") {
      gameplay_audio =
        "https://micomi-assets.me/Sounds/Final/Greenland%20Final.mp3";
    } else if (questionType === "CSS") {
      gameplay_audio = "https://micomi-assets.me/Sounds/Final/Lavaland.mp3";
    } else if (questionType === "JavaScript") {
      gameplay_audio = "https://micomi-assets.me/Sounds/Final/Snowland.mp3";
    } else if (questionType === "Computer") {
      gameplay_audio = "https://micomi-assets.me/Sounds/Final/Autumnland.mp3";
    }
  }

  const isLastRemainingChallenge = currentAnsweredCount + 1 === totalChallenges;

  const hasWrongCounts = updatedProgress.wrong_challenges_count > 0;

  if (nextChallenge) {
    const isRetryOfWrong = updatedWrongChallenges.includes(
      nextChallenge.challenge_id,
    );

    if (isRetryOfWrong) {
      attackType = "basic_attack";
    } else if (
      (character.character_name === "Gino" ||
        character.character_name === "Leon" ||
        character.character_name === "ShiShi" ||
        character.character_name === "Ryron") &&
      updatedProgress.consecutive_corrects === 2
    ) {
      attackType = "special_attack";

      let damageIndex = 0;
      if (nextCorrectAnswerLength >= 8) {
        damageIndex = 2;
      } else if (nextCorrectAnswerLength >= 5) {
        damageIndex = 1;
      } else {
        damageIndex = 0;
      }

      const damageArray = Array.isArray(character.character_damage)
        ? (character.character_damage as number[])
        : [10, 15, 25];

      character_damage_card = damageArray[damageIndex] ?? 10;

      if (freshProgress?.has_strong_effect) {
        character_damage_card *= 2;
      }

      const cardInfo = getCardForAttackType(
        character.character_name,
        attackType,
      );
      card_type = cardInfo.card_type;
      character_attack_card = cardInfo.character_attack_card;
    } else if (isLastRemaining && isNewBonusRound) {
      attackType = "special_attack";
    } else if (isLastRemainingChallenge && hasWrongCounts && isNewBonusRound) {
      attackType = "third_attack";
    } else if (nextCorrectAnswerLength >= 8) {
      attackType = "third_attack";
    } else if (nextCorrectAnswerLength >= 5) {
      attackType = "second_attack";
    } else {
      attackType = "basic_attack";
    }

    if (
      !(
        (character.character_name === "Gino" ||
          character.character_name === "Leon" ||
          character.character_name === "ShiShi" ||
          character.character_name === "Ryron") &&
        updatedProgress.consecutive_corrects === 2 &&
        !isRetryOfWrong
      )
    ) {
      const damageIndexMap: Record<string, number> = {
        basic_attack: 0,
        second_attack: 1,
        third_attack: 2,
        special_attack: 2,
      };

      const damageIndex = damageIndexMap[attackType] ?? 0;

      const damageArray = Array.isArray(character.character_damage)
        ? (character.character_damage as number[])
        : [10, 15, 25];

      character_damage_card = damageArray[damageIndex] ?? 10;

      if (freshProgress?.has_strong_effect) {
        character_damage_card *= 2;
      }

      const cardInfo = getCardForAttackType(
        character.character_name,
        attackType,
      );
      card_type = cardInfo.card_type;
      character_attack_card = cardInfo.character_attack_card;
    }
  } else {
    attackType = null;
    card_type = null;
    character_attack_card = null;
    character_damage_card = null;
  }

  if (isBonusRound) {
    const { text, audio } = await generateDynamicMessage(
      true,
      hintUsed,
      updatedProgress.consecutive_corrects ?? 0,
      fightResult.character_health ?? character.health,
      character.health,
      elapsed,
      enemy.enemy_name,
      fightResult.enemyHealth ??
        fightResult.enemy?.enemy_health ??
        currentProgress.enemy_hp,
      true,
    );
    message = text;
    audioResponse = audio;
  }

  const is_correct_audio = isCorrect
    ? "https://micomi-assets.me/Sounds/Final/Correct.wav"
    : "https://micomi-assets.me/Sounds/Final/Wrong_2.wav";

  //enemy attack audio
  let enemy_attack_audio: string | null = null;
  let death_audio: string | null = null;

  if (!isCorrect) {
    enemy_attack_audio =
      "https://micomi-assets.me/Sounds/Final/All%20Universal%20Enemy%20Attack.wav";
  }

  if (fightResult.status !== "in_progress") {
    death_audio = "https://micomi-assets.me/Sounds/Final/All%20Death.wav";
  }

  return {
    isCorrect,
    attempts: freshProgress?.attempts ?? updatedProgress.attempts,
    fightResult,
    message,
    nextChallenge,
    audio: audioResponse,
    levelStatus: {
      isCompleted: allCompleted,
      showFeedback: true,
      playerHealth:
        fightResult?.charHealth ?? freshProgress?.player_hp ?? character.health,
      enemyHealth: fightResult?.enemyHealth ?? enemyMaxHealth,
      coinsEarned: freshProgress?.coins_earned ?? 0,
      totalPointsEarned: freshProgress?.total_points_earned ?? 0,
      totalExpPointsEarned: freshProgress?.total_exp_points_earned ?? 0,
      playerOutputs,
    },
    completionRewards,
    nextLevel,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    correct_answer_length: correctAnswerLength,
    combat_background: combatBackground,
    question_type: questionType,
    is_bonus_round: isBonusRound,
    card: {
      card_type,
      character_attack_card,
      character_damage_card,
    },
    is_correct_audio,
    enemy_attack_audio,
    character_attack_audio,
    death_audio,
    gameplay_audio,
    is_victory_audio,
    is_victory_image,
  };
};

export const getNextChallengeService = async (
  playerId: number,
  levelId: number,
) => {
  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: {
      level: {
        include: {
          challenges: true,
          enemy: true,
        },
      },
    },
  });

  if (!progress)
    return { message: "Player progress not found", success: false } as any;
  if (!progress.level)
    return { message: "Level not found", success: false } as any;

  const level = progress.level;

  if (level.level_difficulty === "hard" || level.level_difficulty === "final") {
    return getNextChallengeHard(progress);
  } else {
    return getNextChallengeEasy(progress);
  }
};

const getNextChallengeEasy = async (progress: any) => {
  const { level } = progress;

  const sortedChallenges = [...level.challenges].sort(
    (a: Challenge, b: Challenge) => a.challenge_id - b.challenge_id,
  );

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const playerAnswer =
    (progress.player_answer as Record<string, string[]>) || {};
  const answeredIds = Object.keys(playerAnswer).map(Number);
  const effectiveAnsweredIds = answeredIds.filter((id) => {
    const ans = playerAnswer[id.toString()];
    return ans && ans[0] !== "_REVEAL_PENDING_";
  });

  const enemyDefeated = progress.enemy_hp <= 0;
  const playerAlive = progress.player_hp > 0;
  let nextChallenge: Challenge | null = null;

  if (!enemyDefeated) {
    nextChallenge =
      sortedChallenges.find(
        (c: Challenge) => !effectiveAnsweredIds.includes(c.challenge_id),
      ) || null;

    if (!nextChallenge && wrongChallenges.length > 0) {
      nextChallenge = getNextWrongChallenge(progress, level, wrongChallenges);
    }

    if (!playerAlive) nextChallenge = null;
  } else {
    if (playerAlive) {
      nextChallenge =
        sortedChallenges.find(
          (c: Challenge) =>
            !effectiveAnsweredIds.includes(c.challenge_id) &&
            !wrongChallenges.includes(c.challenge_id),
        ) || null;
    }
  }

  if (nextChallenge) {
    const challengeKey = nextChallenge.challenge_id.toString();
    const existing = playerAnswer[challengeKey];
    if (existing && existing[0] === "_REVEAL_PENDING_") {
      let effectiveCorrectAnswer = nextChallenge.correct_answer as string[];

      let filledQuestion = nextChallenge.question ?? "";
      const answersToFill = [...effectiveCorrectAnswer];

      const universalBlankRegex = /<_([^>]*)>|<\/_>|\{blank\}|\[_+\]|_+/g;

      filledQuestion = filledQuestion.replace(
        universalBlankRegex,
        (match: string, htmlAttrs?: string) => {
          const nextAnswer = answersToFill.shift();
          if (!nextAnswer) return match;

          if (match.startsWith("<_")) {
            return `<${nextAnswer}${htmlAttrs || ""}>`;
          } else if (match === "</_>") {
            return `</${nextAnswer}>`;
          } else if (match === "{blank}") {
            return nextAnswer;
          } else if (match.startsWith("[")) {
            return nextAnswer;
          } else {
            return nextAnswer;
          }
        },
      );

      nextChallenge = {
        ...(nextChallenge as Challenge),
        question: filledQuestion,
        options: ["Attack"],
        answer: effectiveCorrectAnswer,
      } as ChallengeDTO;
    }
  }

  return wrapWithTimer(progress, nextChallenge, level);
};

const getNextChallengeHard = async (progress: any) => {
  const { level } = progress;

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const playerAnswer =
    (progress.player_answer as Record<string, string[]>) || {};
  const attemptedIds = Object.keys(playerAnswer).map(Number);
  const correctlyAnsweredIds = attemptedIds.filter((id) => {
    const ans = playerAnswer[id.toString()];
    return (
      ans && ans[0] !== "_REVEAL_PENDING_" && !wrongChallenges.includes(id)
    );
  });

  const effectiveAnsweredIds = attemptedIds.filter((id) => {
    const ans = playerAnswer[id.toString()];
    return ans && ans[0] !== "_REVEAL_PENDING_";
  });

  const sortedChallenges = [...level.challenges].sort(
    (a, b) => a.challenge_id - b.challenge_id,
  );

  const playerAlive = progress.player_hp > 0;
  const enemyDefeated = progress.enemy_hp <= 0;
  let nextChallenge: Challenge | null = null;

  if (playerAlive) {
    if (enemyDefeated) {
      nextChallenge =
        sortedChallenges.find(
          (c: Challenge) => !effectiveAnsweredIds.includes(c.challenge_id),
        ) || null;
    } else {
      nextChallenge =
        sortedChallenges.find(
          (c: Challenge) => !correctlyAnsweredIds.includes(c.challenge_id),
        ) || null;
    }
  }

  if (nextChallenge) {
    const challengeKey = nextChallenge.challenge_id.toString();
    const existing = playerAnswer[challengeKey];
    if (existing && existing[0] === "_REVEAL_PENDING_") {
      let effectiveCorrectAnswer = nextChallenge.correct_answer as string[];

      let filledQuestion = nextChallenge.question ?? "";
      const answersToFill = [...effectiveCorrectAnswer];

      const universalBlankRegex = /<_([^>]*)>|<\/_>|\{blank\}|\[_+\]|_+/g;

      filledQuestion = filledQuestion.replace(
        universalBlankRegex,
        (match: string, htmlAttrs?: string) => {
          const nextAnswer = answersToFill.shift();
          if (!nextAnswer) return match;

          if (match.startsWith("<_")) {
            return `<${nextAnswer}${htmlAttrs || ""}>`;
          } else if (match === "</_>") {
            return `</${nextAnswer}>`;
          } else if (match === "{blank}") {
            return nextAnswer;
          } else if (match.startsWith("[")) {
            return nextAnswer;
          } else {
            return nextAnswer;
          }
        },
      );

      nextChallenge = {
        ...(nextChallenge as Challenge),
        question: filledQuestion,
        options: ["Attack"],
        answer: effectiveCorrectAnswer,
      } as ChallengeDTO;
    }
  }

  return wrapWithTimer(progress, nextChallenge, level);
};

function getNextWrongChallenge(
  progress: any,
  level: any,
  wrongChallenges: number[],
) {
  const filteredWrongs = wrongChallenges.filter((id: number) => {
    const ans = progress.player_answer?.[id.toString()] ?? [];
    const challenge = level.challenges.find(
      (c: Challenge) => c.challenge_id === id,
    );
    return !multisetEqual(ans, challenge?.correct_answer ?? []);
  });

  const currentWrongs = [...new Set(filteredWrongs)];
  if (currentWrongs.length === 0) return null;

  const totalChallenges = level.challenges.length;
  const cyclingAttempts = Math.max(0, progress.attempts - totalChallenges);
  const idx = cyclingAttempts % currentWrongs.length;

  const id = currentWrongs[idx];
  const challenge = level.challenges.find(
    (c: Challenge) => c.challenge_id === id,
  );

  return challenge || null;
}

const wrapWithTimer = async (
  progress: any,
  challenge: Challenge | null,
  level: any,
) => {
  if (!challenge) return { nextChallenge: null };

  let modifiedChallenge = { ...challenge };

  if (progress.has_ryron_reveal) {
    let effectiveCorrectAnswer = challenge.correct_answer as string[];

    const revealResult = revealAllBlanks(
      challenge.question ?? "",
      effectiveCorrectAnswer,
    );

    if (!revealResult.success) {
      console.error(
        `Ryron's Passive - Cannot reveal challenge ${challenge.challenge_id}: ${revealResult.error}`,
      );
    } else {
      const filledQuestion = revealResult.filledQuestion;

      const challengeKey = challenge.challenge_id.toString();
      const currentPlayerAnswer =
        progress.player_answer && typeof progress.player_answer === "object"
          ? (progress.player_answer as Record<string, unknown>)
          : {};

      await prisma.playerProgress.update({
        where: {
          player_id_level_id: {
            player_id: progress.player_id,
            level_id: progress.level_id,
          },
        },
        data: {
          player_answer: {
            ...(currentPlayerAnswer as Record<string, unknown>),
            [challengeKey]: ["_REVEAL_PENDING_"],
          } as any,
          has_ryron_reveal: false,
          challenge_start_time: new Date(),
        },
      });

      modifiedChallenge = {
        ...(challenge as Challenge),
        question: filledQuestion,
        options: ["Attack"],
        answer: effectiveCorrectAnswer,
      } as ChallengeDTO;

      console.log(
        `- Ryron's Passive Applied: All blanks revealed for challenge ${challenge.challenge_id}`,
      );

      const timeRemaining = CHALLENGE_TIME_LIMIT;
      const builtChallenge = buildChallengeWithTimer(
        modifiedChallenge,
        timeRemaining,
      );
      return { nextChallenge: builtChallenge };
    }
  }

  if (progress.has_reversed_curse && level.enemy?.enemy_name === "Boss Darco") {
    const options = challenge.options as string[];
    if (Array.isArray(options) && options.length > 0) {
      modifiedChallenge.options = options
        .map(reverseString)
        .sort(() => Math.random() - 0.5);
      console.log(
        "- Reversal curse applied: options strings reversed and jumbled for display",
      );
    }
  } else if (
    progress.has_shuffle_ss &&
    level.enemy?.enemy_name === "Boss Maggmaw"
  ) {
    const options = challenge.options as string[];
    if (Array.isArray(options) && options.length > 0) {
      modifiedChallenge.options = shuffleArray([...options]);
      console.log("- Shuffle SS applied: options shuffled for display");
    }
  } else if (
    progress.has_permuted_ss &&
    level.enemy?.enemy_name === "Boss Pyroformic"
  ) {
    const options = challenge.options as string[];
    if (Array.isArray(options) && options.length > 0) {
      const permutedOptions = options.map(permuteLetters);
      modifiedChallenge.options = permutedOptions;

      const currentMapping = (progress.permutation_mapping as any) || {};
      currentMapping[challenge.challenge_id.toString()] = {
        original: options,
        permuted: permutedOptions,
      };

      await prisma.playerProgress.update({
        where: {
          player_id_level_id: {
            player_id: progress.player_id,
            level_id: progress.level_id,
          },
        },
        data: {
          permutation_mapping: currentMapping,
          challenge_start_time: new Date(),
        },
      });

      console.log(
        "- Permutation SS applied: letters within options shuffled for display and mapping stored",
      );

      const challengeStart = new Date();
      const timeRemaining = CHALLENGE_TIME_LIMIT;
      const builtChallenge = buildChallengeWithTimer(
        modifiedChallenge,
        timeRemaining,
      );
      return { nextChallenge: builtChallenge };
    }
  } else if (
    progress.has_only_blanks_ss &&
    level.enemy?.enemy_name === "King Feanaly"
  ) {
    if (modifiedChallenge.question) {
      modifiedChallenge.question = keepOnlyBlanks(modifiedChallenge.question);
      console.log(
        "- King Feanaly SS applied: Question text removed, leaving only blanks.",
      );
    }
  } else if (
    progress.has_dollar_sign_ss &&
    level.enemy?.enemy_name === "Boss Icycreamero"
  ) {
    const options = challenge.options as string[];
    if (Array.isArray(options) && options.length > 0) {
      modifiedChallenge.options = options.map(replaceCharWithDollar);
      console.log("- Boss Icycreamero SS applied: Added '$' to options.");
    }
  } else if (
    progress.has_reverse_words_ss &&
    level.enemy?.enemy_name === "Boss Scythe"
  ) {
    if (modifiedChallenge.question) {
      modifiedChallenge.question = reverseThreeRandomWords(
        modifiedChallenge.question,
      );
      console.log("- Boss Scythe SS applied: 3 words reversed in question.");
    }
  }

  const challengeStart = new Date(progress.challenge_start_time ?? Date.now());
  const elapsed = (Date.now() - challengeStart.getTime()) / 1000;
  const timeRemaining = Math.max(0, CHALLENGE_TIME_LIMIT - elapsed);

  await prisma.playerProgress.update({
    where: {
      player_id_level_id: {
        player_id: progress.player_id,
        level_id: progress.level_id,
      },
    },
    data: { challenge_start_time: new Date() },
  });

  const builtChallenge = buildChallengeWithTimer(
    modifiedChallenge,
    timeRemaining,
  );

  return {
    nextChallenge: builtChallenge,
  };
};
