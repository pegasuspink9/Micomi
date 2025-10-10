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
import {
  SubmitChallengeControllerResult,
  CompletionRewards,
} from "./challenges.types";
 
const prisma = new PrismaClient();

const arraysEqual = (a: string[], b: string[]): boolean => {
  const setA = new Set(a);
  const setB = new Set(b);
  return setA.size === setB.size && [...setA].every((val) => setB.has(val));
};

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
      include: { challenges: true, map: true },
    }),
  ]);
  if (!challenge) throw new Error("Challenge not found");
  if (!level) throw new Error("Level not found");

  const enemy = await prisma.enemy.findFirst({
    where: {
      enemy_map: level.map.map_name,
      enemy_difficulty: level.level_difficulty,
    },
  });
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
      },
    });
  }

  console.log("CHALLENGE SERVICE - Current progress health:");
  console.log("- Player HP from progress:", currentProgress.player_hp);
  console.log("- Enemy HP from progress:", currentProgress.enemy_hp);

  const challengeStart = new Date(currentProgress.challenge_start_time!);
  const now = new Date();
  const elapsed = (now.getTime() - challengeStart.getTime()) / 1000;

  const correctAnswer = challenge.correct_answer as string[];

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
      if (correctAnswer.length > 0) {
        if (challenge.challenge_type === "multiple choice") {
          finalAnswer = [correctAnswer[0]];
        } else if (challenge.challenge_type === "fill in the blank") {
          finalAnswer = [correctAnswer[0]];
        }

        await prisma.playerPotion.update({
          where: { player_potion_id: hintPotion.player_potion_id },
          data: { quantity: hintPotion.quantity - 1 },
        });

        hintUsed = true;
        console.log(
          `- Hint potion activated: revealing only part of the correct answer (${correctAnswer[0]})`
        );
      }
    } else {
      console.log(
        "- Hint requested but no hint potion available; using original answer"
      );
    }
  }

  const isCorrect = arraysEqual(finalAnswer, correctAnswer);

  let wasEverWrong = false;
  if (isCorrect) {
    wasEverWrong = (
      (currentProgress.wrong_challenges as number[]) ?? []
    ).includes(challengeId);
  }

  const isBonusRound =
    currentProgress.enemy_hp <= 0 && currentProgress.player_hp > 0;

  const { updatedProgress, alreadyAnsweredCorrectly } =
    await updateProgressForChallenge(
      currentProgress.progress_id,
      challengeId,
      isCorrect,
      finalAnswer,
      isBonusRound
    );

  let fightResult: any;
  let message: string = "Challenge submitted.";
  let audioResponse: string[] = [];

  if (isCorrect) {
    fightResult = await CombatService.fightEnemy(
      playerId,
      enemy.enemy_id,
      true,
      elapsed,
      challengeId,
      alreadyAnsweredCorrectly,
      wasEverWrong
    );

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
        currentProgress.enemy_hp
    );

    message = text;
    audioResponse = audio;

    if (!hintUsed) {
      await updateQuestProgress(playerId, QuestType.solve_challenge_no_hint, 1);
    }
  } else {
    fightResult = await CombatService.fightEnemy(
      playerId,
      enemy.enemy_id,
      false,
      elapsed,
      challengeId
    );

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
        currentProgress.enemy_hp
    );

    message = text;
    audioResponse = audio;
  }

  const next = await getNextChallengeService(playerId, levelId);
  const nextChallenge = next.nextChallenge;

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

  if (allCompleted && !freshProgress?.is_completed) {
    await prisma.playerProgress.update({
      where: { progress_id: currentProgress.progress_id },
      data: { is_completed: true, completed_at: new Date() },
    });

    completionRewards = {
      feedbackMessage:
        level.feedback_message ?? `You completed Level ${level.level_number}!`,
    };

    nextLevel = await LevelService.unlockNextLevel(
      playerId,
      level.map_id,
      level.level_number
    );
  }

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);

  const rawPlayerOutputs = freshProgress?.player_expected_output;
  const playerOutputs: string[] | null = Array.isArray(rawPlayerOutputs)
    ? (rawPlayerOutputs as string[])
    : null;

  return {
    isCorrect,
    attempts: freshProgress?.attempts ?? updatedProgress.attempts,
    fightResult,
    message,
    nextChallenge,
    audio: audioResponse,
    ...(allCompleted
      ? {
          levelStatus: {
            isCompleted: true,
            showFeedback: true,
            playerHealth:
              fightResult?.charHealth ??
              freshProgress?.player_hp ??
              character.health,
            enemyHealth: fightResult?.enemyHealth ?? enemyMaxHealth,
            coinsEarned: freshProgress?.coins_earned ?? 0,
            totalPointsEarned: freshProgress?.total_points_earned ?? 0,
            totalExpPointsEarned: freshProgress?.total_exp_points_earned ?? 0,
            playerOutputs,
          },
        }
      : null),
    completionRewards,
    nextLevel,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
  };
};

export const getNextChallengeService = async (
  playerId: number,
  levelId: number
) => {
  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: { level: { include: { challenges: true } } },
  });
  if (!progress) throw new Error("Player progress not found");
  if (!progress.level) throw new Error("Level not found");

  return getNextChallengeEasy(progress);
};

const getNextChallengeEasy = async (progress: any) => {
  const { level } = progress;

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const answeredIds = Object.keys(
    (progress.player_answer as Record<string, string[]> | null) ?? {}
  ).map(Number);

  const enemyDefeated = progress.enemy_hp <= 0;
  const playerAlive = progress.player_hp > 0;
  let nextChallenge: Challenge | null = null;

  if (!enemyDefeated) {
    nextChallenge =
      level.challenges.find(
        (c: Challenge) => !answeredIds.includes(c.challenge_id)
      ) || null;

    if (!nextChallenge && wrongChallenges.length > 0) {
      nextChallenge = getNextWrongChallenge(progress, level, wrongChallenges);
    }

    if (!playerAlive) {
      nextChallenge = null;
    }
  } else {
    if (playerAlive) {
      nextChallenge =
        level.challenges.find(
          (c: Challenge) => !answeredIds.includes(c.challenge_id)
        ) || null;

      if (!nextChallenge && wrongChallenges.length > 0) {
        nextChallenge = getNextWrongChallenge(progress, level, wrongChallenges);
      }
    }
  }

  return wrapWithTimer(progress, nextChallenge);
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
    return !arraysEqual(ans, challenge?.correct_answer ?? []);
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

const getNextChallengeHard = async (progress: any) => {
  //for Hard level
  const { level } = progress;

  const wrongChallenges = (progress.wrong_challenges as number[] | null) ?? [];
  const answeredIds = Object.keys(
    (progress.player_answer as Record<string, string[]> | null) ?? {}
  ).map(Number);

  const enemyDefeated = progress.enemy_hp <= 0;
  let nextChallenge: Challenge | null = null;

  if (!enemyDefeated) {
    nextChallenge =
      level.challenges.find(
        (c: Challenge) => !answeredIds.includes(c.challenge_id)
      ) || null;

    if (!nextChallenge && wrongChallenges.length > 0) {
      const firstWrongId = wrongChallenges[0];
      nextChallenge =
        level.challenges.find(
          (c: Challenge) => c.challenge_id === firstWrongId
        ) || null;
    }
  } else {
    if (wrongChallenges.length > 0) {
      const firstWrongId = wrongChallenges.find(
        (id) =>
          !arraysEqual(
            progress.player_answer?.[id.toString()] ?? [],
            level.challenges.find((c: Challenge) => c.challenge_id === id)
              ?.correct_answer ?? []
          )
      );
      if (firstWrongId) {
        nextChallenge =
          level.challenges.find(
            (c: Challenge) => c.challenge_id === firstWrongId
          ) || null;
      }
    }
  }

  return wrapWithTimer(progress, nextChallenge);
};

const wrapWithTimer = async (progress: any, challenge: Challenge | null) => {
  if (!challenge) return { nextChallenge: null };

  const challengeStart = new Date(progress.challenge_start_time!);
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
    nextChallenge: buildChallengeWithTimer(challenge, timeRemaining),
  };
};
