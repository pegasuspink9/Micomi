import { PrismaClient, QuestType } from "@prisma/client";
import { updateQuestProgress } from "../Quests/quests.service";
import { previewLevel } from "../Levels/levels.service";
import * as CombatService from "../Combat/combat.service";
import * as LevelService from "../Levels/levels.service";
import * as EnergyService from "../Energy/energy.service";
import * as ChallengeService from "../Challenges/challenges.service";
import { SubmitChallengeControllerResult } from "../Challenges/challenges.types";

const prisma = new PrismaClient();

const reverseString = (str: string): string => str.split("").reverse().join("");

async function spendCoins(playerId: number, amount: number) {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");
  if (player.coins < amount) throw new Error("Not enough coins");

  await prisma.player.update({
    where: { player_id: playerId },
    data: { coins: { decrement: amount } },
  });

  await updateQuestProgress(playerId, QuestType.spend_coins, amount);
}

export const buyPotion = async (
  playerId: number,
  levelId: number,
  potionId: number
) => {
  const potion = await prisma.potionShop.findUnique({
    where: { potion_shop_id: potionId },
  });
  if (!potion) throw new Error("Potion not found");

  const potionType = potion.potion_type;

  const potionConfig = await prisma.potionShopByLevel.findUnique({
    where: { level_id: levelId },
  });
  if (!potionConfig)
    throw new Error("No potion shop configured for this level");

  const rawLimit =
    potionConfig[
      `${potionType.toLowerCase()}_quantity` as keyof typeof potionConfig
    ] ?? 0;
  const maxAllowed = Number(rawLimit);
  if (maxAllowed === 0) {
    const potionsAvail = potionConfig.potions_avail as string[];
    if (!potionsAvail.includes(potionType)) {
      throw new Error(`${potionType} not available in this level`);
    }
  }

  const playerLevelPotion = await prisma.playerLevelPotion.findUnique({
    where: {
      player_id_level_id_potion_shop_id: {
        player_id: playerId,
        level_id: levelId,
        potion_shop_id: potionId,
      },
    },
  });

  const levelBought = playerLevelPotion?.quantity ?? 0;
  if (levelBought >= maxAllowed) {
    throw new Error(
      `Limit reached: ${maxAllowed} ${potionType} potions for this level`
    );
  }

  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");
  if (player.coins < potion.potion_price) throw new Error("Not enough coins");

  await prisma.$transaction(async (tx) => {
    await tx.playerLevelPotion.upsert({
      where: {
        player_id_level_id_potion_shop_id: {
          player_id: playerId,
          level_id: levelId,
          potion_shop_id: potionId,
        },
      },
      update: { quantity: { increment: 1 } },
      create: {
        player_id: playerId,
        level_id: levelId,
        potion_shop_id: potionId,
        quantity: 1,
      },
    });

    await tx.playerPotion.upsert({
      where: {
        player_id_potion_shop_id: {
          player_id: playerId,
          potion_shop_id: potionId,
        },
      },
      update: { quantity: { increment: 1 } },
      create: {
        player_id: playerId,
        potion_shop_id: potionId,
        quantity: 1,
      },
    });

    await tx.player.update({
      where: { player_id: playerId },
      data: { coins: { decrement: potion.potion_price } },
    });
  });

  await updateQuestProgress(playerId, QuestType.buy_potion, 1);

  return await previewLevel(playerId, levelId);
};

export const buyCharacter = async (
  playerId: number,
  characterShopId: number
) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) throw new Error("Player not found");

  const charShop = await prisma.characterShop.findUnique({
    where: { character_shop_id: characterShopId },
    include: { character: true },
  });
  if (!charShop) throw new Error("Character not found");

  if (player.coins < charShop.character_price)
    throw new Error("Not enough coins");

  const existing = await prisma.playerCharacter.findUnique({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: charShop.character.character_id,
      },
    },
  });

  if (existing?.is_purchased) throw new Error("Character already purchased");

  await prisma.playerCharacter.updateMany({
    where: { player_id: playerId },
    data: { is_selected: false },
  });

  await prisma.playerCharacter.upsert({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: charShop.character.character_id,
      },
    },
    update: { is_purchased: true, is_selected: true },
    create: {
      player_id: playerId,
      character_id: charShop.character.character_id,
      is_purchased: true,
      is_selected: true,
    },
  });

  await prisma.player.update({
    where: { player_id: playerId },
    data: { coins: { decrement: charShop.character_price } },
  });

  await updateQuestProgress(playerId, QuestType.unlock_character, 1);
  await spendCoins(playerId, charShop.character_price);
  await updateQuestProgress(
    playerId,
    QuestType.spend_coins,
    charShop.character_price
  );

  return { message: `${charShop.character.character_name} purchased` };
};

export const usePotion = async (
  playerId: number,
  levelId: number,
  challengeId: number,
  playerPotionId: number
): Promise<SubmitChallengeControllerResult> => {
  const playerPotion = await prisma.playerPotion.findUnique({
    where: { player_potion_id: playerPotionId },
    include: { potion: true },
  });
  if (!playerPotion || playerPotion.quantity <= 0) {
    throw new Error("Invalid or insufficient potion");
  }

  const potionType = playerPotion.potion.potion_type;
  await prisma.playerPotion.update({
    where: { player_potion_id: playerPotionId },
    data: { quantity: { decrement: 1 } },
  });

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress) throw new Error("No active progress for this level");

  const selectedChar = await prisma.playerCharacter.findFirst({
    where: { player_id: playerId, is_selected: true },
    include: { character: true },
  });
  if (!selectedChar) throw new Error("No selected character found");
  const maxHealth = selectedChar.character.health;
  const character = selectedChar.character;

  let updateData: any = {};
  let dynamicMessage = "Potion activated!";
  let audioResponse: string[] = [];

  switch (potionType) {
    case "strong":
      updateData.has_strong_effect = true;
      const currentDamages = Array.isArray(character.character_damage)
        ? (character.character_damage as number[])
        : [30, 40, 50];
      const doubledDamages = currentDamages.map((d) => d * 2);
      await prisma.character.update({
        where: { character_id: character.character_id },
        data: { character_damage: doubledDamages },
      });
      console.log(`Doubled damages: ${currentDamages} → ${doubledDamages}`);
      dynamicMessage = `Strength surges through ${character.character_name}, attacks doubled!`;
      audioResponse = [
        "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353786/All_Potions_h1hdib.wav",
      ];
      break;
    case "freeze":
      updateData.has_freeze_effect = true;
      dynamicMessage = `Enemy frozen, next counterattack nullified!`;
      audioResponse = [
        "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353786/All_Potions_h1hdib.wav",
      ];
      break;
    case "health":
      updateData.player_hp = maxHealth;
      dynamicMessage = `Health fully restored—${character.character_name} feels invigorated!`;
      audioResponse = [
        "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353786/All_Potions_h1hdib.wav",
      ];
      break;
    case "hint":
      console.log(`Hint potion consumed for challenge ${challengeId}`);

      const currentNext = await ChallengeService.getNextChallengeService(
        playerId,
        levelId
      );
      const currentChallenge = currentNext.nextChallenge;
      if (!currentChallenge) throw new Error("No current challenge found");

      let effectiveCorrectAnswer = currentChallenge.correct_answer as string[];
      const rawCorrectAnswer = [...effectiveCorrectAnswer];
      const level = await prisma.level.findUnique({
        where: { level_id: levelId },
        include: { map: true },
      });
      const enemy = await prisma.enemy.findFirst({
        where: {
          enemy_map: level?.map.map_name,
          enemy_difficulty: level?.level_difficulty,
        },
      });
      if (progress.has_reversed_curse && enemy?.enemy_name === "King Grimnir") {
        effectiveCorrectAnswer = rawCorrectAnswer.map(reverseString);
      }

      const revealedHint =
        effectiveCorrectAnswer.length > 0 ? effectiveCorrectAnswer[0] : null;
      const partialPlayerAnswer = revealedHint ? [revealedHint] : [];

      const currentPlayerAnswer =
        progress.player_answer && typeof progress.player_answer === "object"
          ? progress.player_answer
          : {};
      await prisma.playerProgress.update({
        where: { progress_id: progress.progress_id },
        data: {
          player_answer: {
            ...currentPlayerAnswer,
            [currentChallenge.challenge_id.toString()]: partialPlayerAnswer,
          },
        },
      });

      const fightResult = await CombatService.getCurrentFightState(
        playerId,
        levelId,
        enemy?.enemy_id ?? 0
      );

      const adjustedFightResult: any = {
        ...fightResult,
        character: {
          ...fightResult.character,
          character_dies: fightResult.character.character_dies ?? "",
        },
      };

      const freshProgress = await prisma.playerProgress.findUnique({
        where: {
          player_id_level_id: { player_id: playerId, level_id: levelId },
        },
        include: { level: { include: { challenges: true } } },
      });
      const answeredIds = Object.keys(freshProgress?.player_answer ?? {}).map(
        Number
      );
      const wrongChallengesArr = (freshProgress?.wrong_challenges ??
        []) as number[];
      const allCompleted =
        answeredIds.length ===
          (freshProgress?.level?.challenges?.length ?? 0) &&
        wrongChallengesArr.length === 0;
      const rawPlayerOutputs = freshProgress?.player_expected_output;
      const playerOutputs: string[] | null = Array.isArray(rawPlayerOutputs)
        ? (rawPlayerOutputs as string[])
        : null;
      const levelStatus = {
        isCompleted: allCompleted,
        showFeedback: allCompleted && freshProgress?.battle_status === "won",
        playerHealth: adjustedFightResult.character.character_health,
        enemyHealth: adjustedFightResult.enemy.enemy_health,
        coinsEarned: freshProgress?.coins_earned ?? 0,
        totalPointsEarned: freshProgress?.total_points_earned ?? 0,
        totalExpPointsEarned: freshProgress?.total_exp_points_earned ?? 0,
        playerOutputs,
      };

      const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
      const correctAnswerLength = Array.isArray(currentChallenge.correct_answer)
        ? currentChallenge.correct_answer.length
        : 0;

      return {
        isCorrect: null as any,
        attempts: freshProgress?.attempts ?? 0,
        fightResult: adjustedFightResult,
        message: `Hint applied: First blank pre-filled with "${revealedHint}" – Complete the rest!`,
        nextChallenge: {
          ...currentChallenge,
          player_answer: partialPlayerAnswer,
        },
        audio: [
          "https://res.cloudinary.com/dpbocuozx/video/upload/v1760353786/All_Potions_h1hdib.wav",
        ],
        levelStatus,
        completionRewards: undefined,
        nextLevel: null,
        energy: energyStatus.energy,
        timeToNextEnergyRestore: energyStatus.timeToNextRestore,
        correct_answer_length: correctAnswerLength,
        potionType,
        remainingQuantity: playerPotion.quantity - 1,
        appliedImmediately: true,
        revealedHint,
      } as unknown as SubmitChallengeControllerResult;
    default:
      throw new Error(`Unknown potion type: ${potionType}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.playerProgress.update({
      where: { progress_id: progress.progress_id },
      data: updateData,
    });
  });

  const freshProgressPostTx = await prisma.playerProgress.findUnique({
    where: { progress_id: progress.progress_id },
  });
  console.log(
    `Post-tx player_hp: ${freshProgressPostTx?.player_hp} (expected: ${maxHealth})`
  );

  const level = await prisma.level.findUnique({
    where: { level_id: levelId },
    include: {
      map: true,
      challenges: true,
    },
  });
  const enemy = await prisma.enemy.findFirst({
    where: {
      enemy_map: level?.map.map_name,
      enemy_difficulty: level?.level_difficulty,
    },
  });

  const fightResult = await CombatService.getCurrentFightState(
    playerId,
    levelId,
    enemy?.enemy_id ?? 0
  );

  const adjustedFightResult: any = {
    ...fightResult,
    character: {
      ...fightResult.character,
      character_dies: fightResult.character.character_dies ?? "",
    },
  };

  const next = await ChallengeService.getNextChallengeService(
    playerId,
    levelId
  );
  const nextChallenge = next.nextChallenge;

  const freshProgress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
    include: {
      level: {
        include: {
          challenges: true,
        },
      },
    },
  });

  const answeredIds = Object.keys(freshProgress?.player_answer ?? {}).map(
    Number
  );
  const wrongChallengesArr = (freshProgress?.wrong_challenges ??
    []) as number[];
  const allCompleted =
    answeredIds.length === (freshProgress?.level?.challenges?.length ?? 0) &&
    wrongChallengesArr.length === 0;

  const rawPlayerOutputs = freshProgress?.player_expected_output;
  const playerOutputs: string[] | null = Array.isArray(rawPlayerOutputs)
    ? (rawPlayerOutputs as string[])
    : null;

  const levelStatus = {
    isCompleted: allCompleted,
    showFeedback: allCompleted && freshProgress?.battle_status === "won",
    playerHealth: adjustedFightResult.character.character_health,
    enemyHealth: adjustedFightResult.enemy.enemy_health,
    coinsEarned: freshProgress?.coins_earned,
    totalPointsEarned: freshProgress?.total_points_earned,
    totalExpPointsEarned: freshProgress?.total_exp_points_earned,
    playerOutputs,
  };

  let completionRewards: any = undefined;
  let nextLevel: any = null;
  if (allCompleted && freshProgress && !freshProgress.is_completed) {
    await prisma.playerProgress.update({
      where: { progress_id: progress.progress_id },
      data: { is_completed: true, completed_at: new Date() },
    });
    completionRewards = {
      feedbackMessage:
        level?.feedback_message ??
        `Level ${level?.level_number} completed! (Potion-powered!)`,
    };
    nextLevel = await LevelService.unlockNextLevel(
      playerId,
      level?.map_id ?? 0,
      level?.level_number ?? 0
    );
  }

  const energyStatus = await EnergyService.getPlayerEnergyStatus(playerId);
  const correctAnswerLength = Array.isArray(nextChallenge?.correct_answer)
    ? nextChallenge.correct_answer.length
    : 0;

  return {
    isCorrect: null as any,
    attempts: freshProgress?.attempts ?? 0,
    fightResult: adjustedFightResult,
    message: dynamicMessage,
    nextChallenge,
    audio: audioResponse,
    levelStatus,
    completionRewards,
    nextLevel,
    energy: energyStatus.energy,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    correct_answer_length: correctAnswerLength,
    potionType,
    remainingQuantity: playerPotion.quantity - 1,
    appliedImmediately: true,
  } as unknown as SubmitChallengeControllerResult;
};
