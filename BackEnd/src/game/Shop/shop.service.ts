import { PrismaClient, QuestType, Prisma } from "@prisma/client";
import { updateQuestProgress } from "../Quests/quests.service";
import * as CombatService from "../Combat/combat.service";
import * as LevelService from "../Levels/levels.service";
import * as EnergyService from "../Energy/energy.service";
import * as ChallengeService from "../Challenges/challenges.service";
import { SubmitChallengeControllerResult } from "../Challenges/challenges.types";
import { UsePotionErrorResponse } from "./shop.types";
import {
  revealAllBlanks,
  applyRevealPotion,
} from "../../../helper/revealPotionHelper";
import {
  successShopResponse,
  errorShopResponse,
} from "../../../utils/response";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const reverseString = (str: string): string => str.split("").reverse().join("");

type BuyCharacterResult =
  | { success: true; character_name: string; remaining_coins: number }
  | { success: false; message: string };

export const buyCharacter = async (
  playerId: number,
  characterShopId: number,
): Promise<BuyCharacterResult> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { player_id: playerId },
      });
      if (!player) throw new Error("Player not found");

      const charShop = await tx.characterShop.findUnique({
        where: { character_shop_id: characterShopId },
        include: { character: true },
      });
      if (!charShop) throw new Error("Character not found");

      if (Number(player.coins) < Number(charShop.character_price)) {
        throw new Error("Not enough coins");
      }

      const existing = await tx.playerCharacter.findUnique({
        where: {
          player_id_character_id: {
            player_id: playerId,
            character_id: charShop.character.character_id,
          },
        },
      });

      if (existing?.is_purchased) {
        throw new Error("Character already purchased");
      }

      await tx.playerCharacter.updateMany({
        where: { player_id: playerId },
        data: { is_selected: false },
      });

      await tx.playerCharacter.upsert({
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

      const updatedPlayer = await tx.player.update({
        where: { player_id: playerId },
        data: { coins: { decrement: charShop.character_price } },
      });

      return {
        character_name: charShop.character.character_name,
        price: charShop.character_price,
        remaining_coins: updatedPlayer.coins,
      };
    });

    await updateQuestProgress(playerId, QuestType.unlock_character, 1);
    await updateQuestProgress(playerId, QuestType.spend_coins, result.price);

    return {
      success: true,
      character_name: result.character_name,
      remaining_coins: result.remaining_coins,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to purchase character",
    };
  }
};

export const usePotion = async (
  playerId: number,
  levelId: number,
  challengeId: number,
  playerPotionId: number,
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
  let use_potion_effect: string = "";
  let character_current_state: string = "";
  let enemy_current_state: string = "";

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
        use_potion_effect =
          "https://micomi-assets.me/Icons/Potions/Strongeffect.png";
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
        use_potion_effect =
          "https://micomi-assets.me/Icons/Potions/Iceeffect.png";
        console.log(
          `Freeze effect activated (only once): Next enemy attack nullified.`,
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
      use_potion_effect =
        "https://micomi-assets.me/Icons/Potions/Healeffect.png";
      break;
    case "Reveal":
      console.log(`Hint potion consumed for challenge ${challengeId}`);

      const currentNext = await ChallengeService.getNextChallengeService(
        playerId,
        levelId,
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
      const isPending =
        existingAnswer.length > 0 && existingAnswer[0] === "_REVEAL_PENDING_";

      if (isAlreadyHinted || isPending) {
        dynamicMessage = `Full hint already applied or pending confirmation—no extra reveal!`;
      } else {
        const revealResult = revealAllBlanks(
          currentChallenge.question ?? "",
          effectiveCorrectAnswer,
        );

        if (!revealResult.success) {
          throw new Error(
            `Cannot reveal challenge ${challengeId}: ${revealResult.error}`,
          );
        }

        await prisma.playerProgress.update({
          where: { progress_id: progress.progress_id },
          data: {
            player_answer: {
              ...(currentPlayerAnswer as Record<string, unknown>),
              [challengeKey]: ["_REVEAL_PENDING_"],
            } as Prisma.InputJsonValue,
          },
        });

        nextChallengeForHint = {
          ...currentChallenge,
          question: revealResult.filledQuestion,
          options: ["Attack"],
          answer: effectiveCorrectAnswer,
        } as any;

        dynamicMessage = `All blanks revealed: Select "Attack" to confirm and proceed!`;

        console.log(
          `Successfully revealed ${effectiveCorrectAnswer.length} blanks for challenge ${challengeId}`,
        );
      }

      audioResponse = [
        "https://micomi-assets.me/Sounds/In%20Game/Potion%20Sound/Hint%20Potion.wav",
      ];
      usePotionAudio =
        "https://micomi-assets.me/Sounds/Final/All%20Potions.wav";
      use_potion_effect =
        "https://micomi-assets.me/Icons/Potions/Hinteffect.png";
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
    `Post-tx player_hp: ${freshProgressPostTx?.player_hp} (expected: ${maxHealth})`,
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
    enemy?.enemy_id ?? 0,
    potionType,
  );

  if (potionType === "Power" && freshProgressPostTx?.has_strong_effect) {
    const originalDamages = Array.isArray(character.character_damage)
      ? (character.character_damage as number[])
      : [30, 40, 50];
    const doubledDamages = originalDamages.map((d) => d * 2);
    fightResult.character.character_damage = doubledDamages;
    console.log(
      `Backend doubling applied in response: ${originalDamages} → ${doubledDamages}`,
    );
    fightResult.character.character_current_state = "Strong";
    fightResult.character.character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon's%20Muscle.png";
  }

  if (potionType === "Immunity" && freshProgressPostTx?.has_freeze_effect) {
    fightResult.enemy.enemy_damage = 0;
    fightResult.enemy.enemy_attack = null;
    console.log(
      "Backend freeze applied in response: enemy_damage=0, enemy_attack=null",
    );
    fightResult.enemy.enemy_current_state = "Frozen";
    fightResult.enemy.enemy_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Ice%20Overlay.png";
  }

  if (potionType === "Reveal") {
    fightResult.character.character_current_state = "Reveal";
    fightResult.character.character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon's%20Muscle.png";
    console.log("Reveal potion overlay set");
  }

  if (potionType === "Life") {
    fightResult.character.character_current_state = "Revitalize";
    fightResult.character.character_attack_overlay =
      "https://micomi-assets.me/Icons/Miscellaneous/Leon's%20Muscle.png";
    console.log("Life potion overlay set");
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
    levelId,
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

  const playerAnswer =
    (freshProgress?.player_answer as Record<string, string[]>) || {};
  const answeredIds = Object.keys(playerAnswer).map(Number);
  const effectiveAnsweredIds = answeredIds.filter((id) => {
    const ans = playerAnswer[id.toString()];
    return ans && ans[0] !== "_REVEAL_PENDING_";
  });
  const wrongChallengesArr = (freshProgress?.wrong_challenges ??
    []) as number[];
  let allCompleted =
    effectiveAnsweredIds.length ===
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
      level?.level_number ?? 0,
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
    use_potion_effect,
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
    const playerId = (req as any).user.id;
    const potionShopId = Number(req.params.potionShopId);

    if (!potionShopId) {
      return errorShopResponse(res, null, "Potion ID is required", 400);
    }

    const potion = await prisma.potionShop.findUnique({
      where: { potion_shop_id: potionShopId },
    });

    if (!potion) {
      return errorShopResponse(res, null, "Potion not found", 404);
    }

    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!player) {
      return errorShopResponse(res, null, "Player not found", 404);
    }

    if (player.coins < potion.potion_price) {
      return errorShopResponse(res, null, "Not enough coins", 400);
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
      potion.potion_price,
    );

    const updatedPlayerPotion = await prisma.playerPotion.findUnique({
      where: {
        player_id_potion_shop_id: {
          player_id: playerId,
          potion_shop_id: potionShopId,
        },
      },
    });

    return successShopResponse(
      res,
      {
        potion_name: potion.potion_name,
        potion_type: potion.potion_type,
        quantity: updatedPlayerPotion?.quantity ?? 1,
        coins_spent: potion.potion_price,
        remaining_coins: player.coins - potion.potion_price,
      },
      `${potion.potion_name} purchased successfully`,
    );
  } catch (error) {
    console.error(error);
    return errorShopResponse(res, error, "Failed to purchase potion", 500);
  }
};
