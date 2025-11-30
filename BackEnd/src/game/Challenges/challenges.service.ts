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

const prisma = new PrismaClient();

const multisetEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const reverseString = (str: string): string => str.split("").reverse().join("");

const isTimedChallengeType = (type: string) =>
  ["multiple choice", "fill in the blank"].includes(type);

const buildChallengeWithTimer = (
  challenge: Challenge,
  timeRemaining: number
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
  levelNumber: number
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

const getRandomMicomiImage = (isVictory: boolean, seed: string): string => {
  const imageArray = isVictory ? micomiImages.Victory : micomiImages.Defeat;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const index = Math.abs(hash) % imageArray.length;
  return imageArray[index];
};

const calculateStars = (
  wrongChallengesCount: number,
  totalChallenges: number
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
  useHint: boolean = false
): Promise<
  SubmitChallengeControllerResult & {
    energy?: number;
    timeToNextEnergyRestore?: string | null;
  }
> => {
  const hasEnergy = await EnergyService.hasEnoughEnergy(playerId, 1);
  if (!hasEnergy) {
    const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
    throw new Error(
      `Not enough energy! Next energy restore in: ${
        energyStatus.timeToNextRestore ?? "N/A"
      }`
    );
  }

  const [challenge, level] = await Promise.all([
    prisma.challenge.findUnique({ where: { challenge_id: challengeId } }),
    prisma.level.findUnique({
      where: { level_id: levelId },
      include: { challenges: true, map: true, enemy: true },
    }),
  ]);
  if (!challenge) throw new Error("Challenge not found");
  if (!level) throw new Error("Level not found");

  const enemy = level.enemy;
  if (!enemy)
    throw new Error("No enemy found for this level's map + difficulty");

  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    include: {
      ownedCharacters: {
        where: { is_selected: true, is_purchased: true },
        include: { character: true },
      },
    },
  });
  if (!player) throw new Error("Player not found");

  const character = player.ownedCharacters[0]?.character;
  if (!character) throw new Error("No selected character found");

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
  if (
    currentProgress.has_reversed_curse &&
    enemy.enemy_name === "King Grimnir"
  ) {
    effectiveCorrectAnswer = rawCorrectAnswer.map(reverseString);
    console.log(
      `- Reversal curse active for King Grimnir: correct answers reversed for comparison`
    );
  }

  let finalAnswer = answer;
  let hintUsed = false;
  if (useHint) {
    const hintPotion = await prisma.playerPotion.findFirst({
      where: {
        player_id: playerId,
        quantity: { gt: 0 },
        potion: { potion_type: "hint" },
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
          `- Hint potion activated: revealing only part of the effective correct answer (${effectiveCorrectAnswer[0]})`
        );
      }
    } else {
      console.log(
        "- Hint requested but no hint potion available; using original answer"
      );
    }
  }

  const isCorrect = multisetEqual(finalAnswer, effectiveCorrectAnswer);

  let wasEverWrong = false;
  if (isCorrect) {
    wasEverWrong = (
      (currentProgress.wrong_challenges as number[]) ?? []
    ).includes(challengeId);
  }

  const isBonusRound =
    currentProgress.enemy_hp <= 0 && currentProgress.player_hp > 0;

  const answeredIdsBefore = Object.keys(
    currentProgress.player_answer ?? {}
  ).map(Number);
  const allChallengeIds = level.challenges.map((c) => c.challenge_id);
  const bonusChallengeIds = allChallengeIds.filter(
    (id) => !answeredIdsBefore.includes(id)
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
      `- Bonus round coins calculation: damage tier ${damageIndex}, base damage ${damageArray[damageIndex]}, final damage for coins: ${characterDamageForCoins}`
    );
  }

  const { updatedProgress, alreadyAnsweredCorrectly } =
    await updateProgressForChallenge(
      currentProgress.progress_id,
      challengeId,
      isCorrect,
      finalAnswer,
      isBonusRound,
      characterDamageForCoins
    );

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
      enemy.enemy_id
    );

    fightResult = await CombatService.handleFight(
      playerId,
      levelId,
      enemy.enemy_id,
      true,
      elapsed,
      challengeId,
      alreadyAnsweredCorrectly,
      wasEverWrong,
      isBonusRound,
      isCompletingBonus,
      bonusChallengeIds.length,
      bonusAllCorrect
    );

    appliedDamage =
      fightResult.appliedDamage ||
      baselineState.character.character_damage[1] ||
      50;
    console.log(
      `- Character damage displayed on correct answer (doubled if active): ${fightResult.character.character_damage}, applied: ${appliedDamage}`
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
    }

    const { text, audio } = generateDynamicMessage(
      true,
      character.character_name,
      hintUsed,
      updatedProgress.consecutive_corrects ?? 0,
      fightResult.character_health ?? character.health,
      character.health,
      elapsed,
      enemy.enemy_name,
      fightResult.enemyHealth ??
        fightResult.enemy?.enemy_health ??
        currentProgress.enemy_hp,
      false
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
      enemy.enemy_id
    );

    fightResult = await CombatService.handleFight(
      playerId,
      levelId,
      enemy.enemy_id,
      false,
      elapsed,
      challengeId
    );

    if (currentProgress.has_freeze_effect) {
      fightResult.character.character_health =
        baselineState.character.character_health;
      fightResult.character.character_hurt = null;
      fightResult.enemy.enemy_damage = 0;
      fightResult.enemy.enemy_attack = null;
      fightResult.enemy.enemy_run = null;
      console.log(
        "Freeze effect applied on wrong answer: No enemy attack, no damage taken."
      );
      message = "Frozen enemy can't strike back!";
    } else {
      fightResult.character.character_damage = 0;
    }

    const { text, audio } = generateDynamicMessage(
      false,
      character.character_name,
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
      false
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
    updatedProgress.player_answer ?? {}
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

  const answeredIds = Object.keys(freshProgress?.player_answer ?? {}).map(
    Number
  );
  const wrongChallengesArr = (freshProgress?.wrong_challenges ??
    []) as number[];
  const allCompleted =
    answeredIds.length === level.challenges.length &&
    wrongChallengesArr.length === 0;

  let completionRewards: CompletionRewards | undefined = undefined;
  let nextLevel: SubmitChallengeControllerResult["nextLevel"] = null;
  const wasFirstCompletion = allCompleted && !freshProgress?.is_completed;

  const playerLost = freshProgress!.player_hp <= 0;

  let is_victory_audio: string | null = null;
  let is_victory_image: string | null = null;
  let stars: number | undefined = undefined;

  if (allCompleted || playerLost) {
    const wrongCount = freshProgress!.consecutive_wrongs;
    const wasInBonusRound =
      freshProgress!.enemy_hp <= 0 && freshProgress!.player_hp > 0;

    const seed = `${playerId}-${levelId}-${Date.now()}-${Math.random()}`;

    if (playerLost) {
      const motivationalMessage = generateMotivationalMessage(
        false,
        wrongCount,
        totalChallenges,
        wasInBonusRound,
        false,
        level.level_number
      );

      stars = 0;

      is_victory_audio =
        "https://micomi-assets.me/Sounds/Final/Defeat_Sound.wav";

      is_victory_image = getRandomMicomiImage(false, seed);

      completionRewards = {
        feedbackMessage: motivationalMessage,
        coinsEarned: 0,
        totalPointsEarned: 0,
        totalExpPointsEarned: 0,
        isVictory: false,
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
        level.level_number
      );

      is_victory_audio =
        "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";

      is_victory_image = getRandomMicomiImage(true, seed);

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
        };

        nextLevel = await LevelService.unlockNextLevel(
          playerId,
          level.map_id,
          level.level_id
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

        is_victory_image = getRandomMicomiImage(true, seed);

        completionRewards = {
          feedbackMessage:
            motivationalMessage +
            "\nAlready completed—no extra rewards. Great practice!",
          coinsEarned: 0,
          totalPointsEarned: 0,
          totalExpPointsEarned: 0,
          isVictory: true,
        };
      }
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

  if (questionType === "HTML") {
    gameplay_audio = "https://micomi-assets.me/Sounds/Final/Boss.ogg";
  } else if (questionType === "CSS") {
    gameplay_audio = "https://micomi-assets.me/Sounds/Final/Lavaland.mp3";
  } else if (questionType === "JavaScript") {
    gameplay_audio = "https://micomi-assets.me/Sounds/Final/Snowland.mp3";
  } else {
    gameplay_audio = "https://micomi-assets.me/Sounds/Final/Autumnland.mp3";
  }

  const isNewBonusRound =
    freshProgress!.enemy_hp <= 0 && freshProgress!.player_hp > 0;

  const isLastRemainingChallenge = currentAnsweredCount + 1 === totalChallenges;

  const hasConsecutiveWrongs = updatedProgress.consecutive_wrongs > 0;

  if (nextChallenge) {
    const isRetryOfWrong = updatedWrongChallenges.includes(
      nextChallenge.challenge_id
    );

    if (isRetryOfWrong) {
      attackType = "basic_attack";
    } else if (isLastRemaining && isNewBonusRound) {
      attackType = "special_attack";
    } else if (
      isLastRemainingChallenge &&
      hasConsecutiveWrongs &&
      isNewBonusRound
    ) {
      attackType = "third_attack";
    } else if (nextCorrectAnswerLength >= 8) {
      attackType = "third_attack";
    } else if (nextCorrectAnswerLength >= 5) {
      attackType = "second_attack";
    } else {
      attackType = "basic_attack";
    }

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

    const cardInfo = getCardForAttackType(character.character_name, attackType);
    card_type = cardInfo.card_type;
    character_attack_card = cardInfo.character_attack_card;

    console.log(
      `Next challenge card preview: ${attackType}, damage: ${character_damage_card}, answer length: ${nextCorrectAnswerLength}`
    );
  } else {
    attackType = null;
    card_type = null;
    character_attack_card = null;
    character_damage_card = null;
  }

  if (isBonusRound) {
    const { text, audio } = generateDynamicMessage(
      true,
      character.character_name,
      hintUsed,
      updatedProgress.consecutive_corrects ?? 0,
      fightResult.character_health ?? character.health,
      character.health,
      elapsed,
      enemy.enemy_name,
      fightResult.enemyHealth ??
        fightResult.enemy?.enemy_health ??
        currentProgress.enemy_hp,
      true
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
      stars,
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
  levelId: number
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

  if (!progress) throw new Error("Player progress not found");
  if (!progress.level) throw new Error("Level not found");

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
    (a: Challenge, b: Challenge) => a.challenge_id - b.challenge_id
  );

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const answeredIds = Object.keys(
    (progress.player_answer as Record<string, string[]> | null) ?? {}
  ).map(Number);

  const enemyDefeated = progress.enemy_hp <= 0;
  const playerAlive = progress.player_hp > 0;
  let nextChallenge: Challenge | null = null;

  if (!enemyDefeated) {
    nextChallenge =
      sortedChallenges.find(
        (c: Challenge) => !answeredIds.includes(c.challenge_id)
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
            !answeredIds.includes(c.challenge_id) &&
            !wrongChallenges.includes(c.challenge_id)
        ) || null;
    }
  }

  return wrapWithTimer(progress, nextChallenge, level);
};

const getNextChallengeHard = async (progress: any) => {
  const { level } = progress;

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const attemptedIds = Object.keys(
    (progress.player_answer as Record<string, string[]> | null) ?? {}
  ).map(Number);
  const correctlyAnsweredIds = attemptedIds.filter(
    (id) => !wrongChallenges.includes(id)
  );

  const sortedChallenges = [...level.challenges].sort(
    (a, b) => a.challenge_id - b.challenge_id
  );

  const playerAlive = progress.player_hp > 0;
  let nextChallenge: Challenge | null = null;

  if (playerAlive) {
    nextChallenge =
      sortedChallenges.find(
        (c: Challenge) => !correctlyAnsweredIds.includes(c.challenge_id)
      ) || null;
  }

  return wrapWithTimer(progress, nextChallenge, level);
};

function getNextWrongChallenge(
  progress: any,
  level: any,
  wrongChallenges: number[]
) {
  const filteredWrongs = wrongChallenges.filter((id: number) => {
    const ans = progress.player_answer?.[id.toString()] ?? [];
    const challenge = level.challenges.find(
      (c: Challenge) => c.challenge_id === id
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
    (c: Challenge) => c.challenge_id === id
  );

  return challenge || null;
}

const wrapWithTimer = async (
  progress: any,
  challenge: Challenge | null,
  level: any
) => {
  if (!challenge) return { nextChallenge: null };

  let modifiedChallenge = { ...challenge };
  if (
    progress.has_reversed_curse &&
    level.enemy?.enemy_name === "King Grimnir"
  ) {
    const options = challenge.options as string[];
    if (Array.isArray(options) && options.length > 0) {
      modifiedChallenge.options = options
        .map(reverseString)
        .sort(() => Math.random() - 0.5);
      console.log(
        "- Reversal curse applied: options strings reversed and jumbled for display"
      );
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

  return {
    nextChallenge: buildChallengeWithTimer(modifiedChallenge, timeRemaining),
  };
};
