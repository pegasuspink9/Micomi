import { PrismaClient, QuestType, Prisma } from "@prisma/client";
import { updateQuestProgress } from "../Quests/quests.service";
import { previewLevel } from "../Levels/levels.service";
import * as CombatService from "../Combat/combat.service";
import * as LevelService from "../Levels/levels.service";
import * as EnergyService from "../Energy/energy.service";
import * as ChallengeService from "../Challenges/challenges.service";
import { SubmitChallengeControllerResult } from "../Challenges/challenges.types";
import { UsePotionErrorResponse } from "./shop.types";
import { successResponse, errorResponse } from "../../../utils/response";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const reverseString = (str: string): string => str.split("").reverse().join("");

async function spendCoins(playerId: number, amount: number) {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) return { message: "Player not found", success: false };
  if (player.coins < amount) return { message: "Not enough coins" };

  if (player.coins < amount)
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
  if (!potion) return { message: "Potion not found", success: false };

  const potionType = potion.potion_type;

  const potionConfig = await prisma.potionShopByLevel.findUnique({
    where: { level_id: levelId },
  });
  if (!potionConfig)
    return {
      message: "No potion shop configured for this level",
      success: false,
    };

  // Map potion types to their database field names
  const potionTypeFieldMap: { [key: string]: string } = {
    Life: "health_quantity",
    Power: "strong_quantity",
    Immunity: "freeze_quantity",
    Reveal: "hint_quantity",
  };

  const fieldName =
    potionTypeFieldMap[potionType] || `${potionType.toLowerCase()}_quantity`;
  const rawLimit = potionConfig[fieldName as keyof typeof potionConfig] ?? 0;
  const maxAllowed = Number(rawLimit);

  // Check if potion type is available
  const potionsAvail = potionConfig.potions_avail as string[];
  if (!potionsAvail.includes(potionType)) {
    throw new Error(`${potionType} not available in this level`);
  }

  // Enforce the purchase limit for this level
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
  if (!player) return { message: "Player not found", success: false };
  if (player.coins < potion.potion_price)
    return { message: "Not enough coins" };

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
  if (!player) return { message: "Player not found" };

  const charShop = await prisma.characterShop.findUnique({
    where: { character_shop_id: characterShopId },
    include: { character: true },
  });
  if (!charShop) return { message: "Character not found" };

  if (player.coins < charShop.character_price)
    return { message: "Not enough coins" };

  const existing = await prisma.playerCharacter.findUnique({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: charShop.character.character_id,
      },
    },
  });

  if (existing?.is_purchased) return { message: "Character already purchased" };

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
): Promise<SubmitChallengeControllerResult | UsePotionErrorResponse> => {
  const playerPotion = await prisma.playerPotion.findUnique({
    where: { player_potion_id: playerPotionId },
    include: { potion: true },
  });
  if (!playerPotion || playerPotion.quantity <= 0) {
    return { message: "Invalid or insufficient potion", success: false };
  }

  const potionType = playerPotion.potion.potion_type;
  await prisma.playerPotion.update({
    where: { player_potion_id: playerPotionId },
    data: { quantity: { decrement: 1 } },
  });

  const progress = await prisma.playerProgress.findUnique({
    where: { player_id_level_id: { player_id: playerId, level_id: levelId } },
  });
  if (!progress)
    return { message: "No active progress for this level", success: false };

  const selectedChar = await prisma.playerCharacter.findFirst({
    where: { player_id: playerId, is_selected: true },
    include: { character: true },
  });
  if (!selectedChar)
    return { message: "No selected character found", success: false };
  const maxHealth = selectedChar.character.health;
  const character = selectedChar.character;

  let updateData: any = {};
  let dynamicMessage = "Potion activated!";
  let audioResponse: string[] = [];
  let usePotionAudio: string = "";

  let nextChallengeForHint: any = null;

  switch (potionType) {
    case "Power":
      if (!progress.has_strong_effect) {
        updateData.has_strong_effect = true;
        const currentDamages = Array.isArray(character.character_damage)
          ? (character.character_damage as number[])
          : [30, 40, 50];
        console.log(`Strong effect activated (only once): ${currentDamages}`);
        dynamicMessage = `Strength surges through ${character.character_name}, attacks doubled!`;
        audioResponse = [
          "https://micomi-assets.me/Sounds/In%20Game/Potion%20Sound/Strong%20Potion.wav",
        ];
        usePotionAudio =
          "https://micomi-assets.me/Sounds/Final/All%20Potions.wav";
      } else {
        dynamicMessage = `${character.character_name} already empowered—no extra surge!`;
      }
      break;
    case "Immunity":
      if (!progress.has_freeze_effect) {
        updateData.has_freeze_effect = true;
        dynamicMessage = `Enemy frozen, next counterattack nullified!`;
        audioResponse = [
          "https://micomi-assets.me/Sounds/In%20Game/Potion%20Sound/Freeze%20Potion.wav",
        ];
        usePotionAudio =
          "https://micomi-assets.me/Sounds/Final/All%20Potions.wav";
        console.log(
          `Freeze effect activated (only once): Next enemy attack nullified.`
        );
      } else {
        dynamicMessage = `Already frozen—no extra chill!`;
      }
      break;
    case "Life":
      updateData.player_hp = maxHealth;
      dynamicMessage = `Health fully restored—${character.character_name} feels invigorated!`;
      audioResponse = [
        "https://micomi-assets.me/Sounds/In%20Game/Potion%20Sound/Health%20Potion.wav",
      ];
      usePotionAudio =
        "https://micomi-assets.me/Sounds/Final/All%20Potions.wav";

      break;
    case "Reveal":
      console.log(`Hint potion consumed for challenge ${challengeId}`);

      const currentNext = await ChallengeService.getNextChallengeService(
        playerId,
        levelId
      );
      let currentChallenge = currentNext.nextChallenge;
      if (!currentChallenge) throw new Error("No current challenge found");

      let effectiveCorrectAnswer = currentChallenge.correct_answer as string[];
      const rawCorrectAnswer = [...effectiveCorrectAnswer];
      const level = await prisma.level.findUnique({
        where: { level_id: levelId },
        include: { enemy: true },
      });

      const enemy = await prisma.enemy.findUnique({
        where: { enemy_id: level?.enemy_id ?? 0 },
      });

      if (progress.has_reversed_curse && enemy?.enemy_name === "Boss Darco") {
        effectiveCorrectAnswer = rawCorrectAnswer.map(reverseString);
      }

      const challengeKey = currentChallenge.challenge_id.toString();
      const currentPlayerAnswer =
        progress.player_answer && typeof progress.player_answer === "object"
          ? (progress.player_answer as Record<string, unknown>)
          : {};
      const existingAnswer =
        (currentPlayerAnswer[challengeKey] as string[] | undefined) ?? [];
      const isAlreadyHinted =
        existingAnswer.length >= effectiveCorrectAnswer.length;

      if (isAlreadyHinted) {
        dynamicMessage = `Full hint already applied to this challenge—no extra reveal!`;
      } else {
        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: {
            player_answer: {
              ...(currentPlayerAnswer as Record<string, unknown>),
              [challengeKey]: effectiveCorrectAnswer,
            } as Prisma.InputJsonValue,
          },
        });

        let filledQuestion = currentChallenge.question ?? "";
        const missingTagsOnly = effectiveCorrectAnswer.slice(
          -filledQuestion.split(/<_|<\/_>/).length + 1
        );
        filledQuestion = filledQuestion.replace(
          /<_( ?[^>]*?)>/g,
          (match: string, attrs: string) =>
            `<${missingTagsOnly.shift()}${attrs}>`
        );
        filledQuestion = filledQuestion.replace(
          /<\/_>/g,
          () => `</${missingTagsOnly.shift()}>`
        );

        nextChallengeForHint = {
          ...currentChallenge,
          question: filledQuestion,
          options: ["Attack"],
          answer: effectiveCorrectAnswer,
        } as any;
        dynamicMessage = `All blanks revealed: Select "Attack" to confirm and proceed!`;
      }

      audioResponse = [
        "https://micomi-assets.me/Sounds/In%20Game/Potion%20Sound/Hint%20Potion.wav",
      ];
      usePotionAudio =
        "https://micomi-assets.me/Sounds/Final/All%20Potions.wav";
      break;
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
      enemy: true,
    },
  });

  const enemy = await prisma.enemy.findUnique({
    where: { enemy_id: level?.enemy_id ?? 0 },
  });

  let fightResult = await CombatService.getCurrentFightState(
    playerId,
    levelId,
    enemy?.enemy_id ?? 0
  );

  if (potionType === "Power" && freshProgressPostTx?.has_strong_effect) {
    const originalDamages = Array.isArray(character.character_damage)
      ? (character.character_damage as number[])
      : [30, 40, 50];
    const doubledDamages = originalDamages.map((d) => d * 2);
    fightResult.character.character_damage = doubledDamages;
    console.log(
      `Backend doubling applied in response: ${originalDamages} → ${doubledDamages}`
    );
  }

  if (potionType === "Immunity" && freshProgressPostTx?.has_freeze_effect) {
    fightResult.enemy.enemy_damage = 0;
    fightResult.enemy.enemy_attack = null;
    console.log(
      "Backend freeze applied in response: enemy_damage=0, enemy_attack=null"
    );
  }

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
  let nextChallenge = next.nextChallenge ?? null;

  let freshProgress = await prisma.playerProgress.findUnique({
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
  let allCompleted =
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
      data: {
        is_completed: true,
        completed_at: new Date(),
        has_strong_effect: false,
        has_freeze_effect: false,
      },
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
  const correctAnswerLength =
    nextChallenge && Array.isArray(nextChallenge.correct_answer)
      ? nextChallenge.correct_answer.length
      : 0;

  const finalNextChallenge =
    potionType === "Reveal" ? nextChallengeForHint : nextChallenge;

  await updateQuestProgress(playerId, QuestType.use_potion, 1);

  return {
    isCorrect: null as any,
    attempts: freshProgress?.attempts ?? 0,
    fightResult: adjustedFightResult,
    message: dynamicMessage,
    nextChallenge: finalNextChallenge,
    audio: audioResponse,
    use_potion_audio: usePotionAudio,
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

//Buy Potion in Shop
export const buyPotionInShop = async (req: Request, res: Response) => {
  try {
    const playerId = Number(req.params.playerId);
    const potionShopId = Number(req.params.potionShopId);

    if (!potionShopId) {
      return errorResponse(res, null, "Potion ID is required", 400);
    }

    const potion = await prisma.potionShop.findUnique({
      where: { potion_shop_id: potionShopId },
    });

    if (!potion) {
      return errorResponse(res, null, "Potion not found", 404);
    }

    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!player) {
      return errorResponse(res, null, "Player not found", 404);
    }

    if (player.coins < potion.potion_price) {
      return errorResponse(res, null, "Not enough coins", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.playerPotion.upsert({
        where: {
          player_id_potion_shop_id: {
            player_id: playerId,
            potion_shop_id: potionShopId,
          },
        },
        update: { quantity: { increment: 1 } },
        create: {
          player_id: playerId,
          potion_shop_id: potionShopId,
          quantity: 1,
        },
      });

      await tx.player.update({
        where: { player_id: playerId },
        data: { coins: { decrement: potion.potion_price } },
      });
    });

    await updateQuestProgress(playerId, QuestType.buy_potion, 1);
    await updateQuestProgress(
      playerId,
      QuestType.spend_coins,
      potion.potion_price
    );

    const updatedPlayerPotion = await prisma.playerPotion.findUnique({
      where: {
        player_id_potion_shop_id: {
          player_id: playerId,
          potion_shop_id: potionShopId,
        },
      },
    });

    return successResponse(
      res,
      {
        potion_name: potion.potion_name,
        potion_type: potion.potion_type,
        quantity: updatedPlayerPotion?.quantity ?? 1,
        coins_spent: potion.potion_price,
        remaining_coins: player.coins - potion.potion_price,
      },
      `${potion.potion_name} purchased successfully`
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, null, "Failed to purchase potion", 500);
  }
};
