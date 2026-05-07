import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/response";
import { google } from "googleapis";
import { prisma } from "../../../prisma/client";
import { VerifyPurchaseBody } from "./payment.types";

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
  keyFile: "../../../credentials.json",
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const playDeveloperApi = google.androidpublisher({
  version: "v3",
  auth: auth,
});

// Diamond packages mapping
export const DIAMOND_PACKAGES: Record<string, number> = {
  diamonds_60: 60,
  diamonds_150: 150,
  diamonds_300: 330,
  diamonds_600: 660,
  diamonds_1200: 1380,
  diamonds_2500: 3000,
  diamonds_5000: 6500,
  diamonds_10000: 13500,
};

// Define your Infinite Energy Product ID exactly as it is in Google Play Console
export const INFINITE_ENERGY_PRODUCT_ID = "infinite_energy_399";

/* POST - Verify Google Play In-App Purchase */
export const verifyPurchase = async (
  req: Request<{}, any, VerifyPurchaseBody>,
  res: Response,
) => {
  const playerId = (req as any).user?.id;
  const { productId, purchaseToken } = req.body;

  if (!productId || !purchaseToken || !playerId) {
    return errorResponse(
      res,
      null,
      "Missing required fields: productId, purchaseToken, or playerId",
      400,
    );
  }

  try {
    // 1. Prevent replay attacks
    const existingTransaction = await prisma.purchaseTransaction.findUnique({
      where: { purchase_token: purchaseToken },
    });

    if (existingTransaction) {
      return errorResponse(res, null, "Purchase already processed", 400);
    }

    // 2. Verify with Google Play
    const response = await playDeveloperApi.purchases.products.get({
      packageName: "com.micomi.app",
      productId: productId,
      token: purchaseToken,
    });

    const purchaseData = response.data;

    if (purchaseData.purchaseState !== 0) {
      return errorResponse(res, null, "Purchase not complete or pending.", 400);
    }

    // 3. Determine what the player bought
    const isInfiniteEnergy = productId === INFINITE_ENERGY_PRODUCT_ID;
    const diamondsToAdd = DIAMOND_PACKAGES[productId] || 0;

    // If it's neither an infinite energy pack nor a valid diamond pack, reject it
    if (!isInfiniteEnergy && diamondsToAdd === 0) {
      return errorResponse(res, null, "Invalid product ID", 400);
    }

    // 4. Atomic transaction
    await prisma.$transaction(async (tx) => {
      // Record the transaction (diamonds_added will just be 0 for the energy pack)
      await tx.purchaseTransaction.create({
        data: {
          player_id: playerId,
          product_id: productId,
          purchase_token: purchaseToken,
          diamonds_added: diamondsToAdd,
        },
      });

      // Prepare the update object based on what was purchased
      const playerUpdateData: any = {};

      if (isInfiniteEnergy) {
        playerUpdateData.has_infinite_energy = true;
      }

      if (diamondsToAdd > 0) {
        playerUpdateData.diamonds = { increment: diamondsToAdd };
      }

      // Update the player
      await tx.player.update({
        where: { player_id: playerId },
        data: playerUpdateData,
      });
    });

    return successResponse(
      res,
      {
        diamondsAdded: diamondsToAdd,
        infiniteEnergyUnlocked: isInfiniteEnergy,
      },
      "Purchase processed successfully!",
    );
  } catch (error: any) {
    console.error("IAP Verification Error:", error);

    if (error.response?.status === 404) {
      return errorResponse(res, null, "Purchase not found on Google Play", 400);
    }

    return errorResponse(res, error, "Failed to verify purchase", 500);
  }
};
