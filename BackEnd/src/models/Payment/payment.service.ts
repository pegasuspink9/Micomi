import { Request, Response } from "express";
import path from "path";
import { successResponse, errorResponse } from "../../../utils/response";
import { google } from "googleapis";
import { prisma } from "../../../prisma/client";
import { VerifyPurchaseBody } from "./payment.types";
import {
  applyCatalogPurchase,
  resolveCatalogItemByProductId,
} from "./payment.fulfillment";

let playDeveloperApi: any = null;

if (process.env.MOCK_IAP !== "true") {
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(__dirname, "credentials.json");
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  playDeveloperApi = google.androidpublisher({
    version: "v3",
    auth: auth,
  });
}

/* POST - Verify Google Play In-App Purchase */
export const verifyPurchase = async (
  req: Request<{}, any, VerifyPurchaseBody & { testPlayerId?: string }>,
  res: Response,
) => {
  // Allow passing testPlayerId in body ONLY during testing to bypass JWT auth in Postman
  const isMock = process.env.MOCK_IAP === "true";
  const playerId =
    (req as any).user?.id || (isMock ? req.body.testPlayerId : undefined);
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

    // 2. Verify with Google Play (MOCK OR REAL)
    let purchaseData;

    if (isMock) {
      console.log(
        `[MOCK_IAP] Simulating Google Play Verification for token: ${purchaseToken}`,
      );

      // Simulate Google 404 Error
      if (purchaseToken === "MOCK_GOOGLE_404") {
        const error: any = new Error("Simulated Google 404 Error");
        error.response = { status: 404 };
        throw error;
      }

      // Simulate Pending state
      if (purchaseToken === "MOCK_PENDING") {
        purchaseData = { purchaseState: 1 }; // 1 = Pending/Cancelled
      } else {
        purchaseData = { purchaseState: 0 }; // 0 = Purchased (Success)
      }

      // Fake network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      // REAL GOOGLE API CALL
      const response = await playDeveloperApi.purchases.products.get({
        packageName: "com.micomi.app",
        productId: productId,
        token: purchaseToken,
      });
      purchaseData = response.data;
    }

    if (purchaseData.purchaseState !== 0) {
      return errorResponse(res, null, "Purchase not complete or pending.", 400);
    }

    // 3. Resolve catalog item using productId (google id or catalog id)
    const catalogItem = resolveCatalogItemByProductId(productId);

    if (!catalogItem) {
      return errorResponse(res, null, "Invalid product ID", 400);
    }

    // 4. Atomic transaction
    const fulfillment = await prisma.$transaction(async (tx) => {
      const result = await applyCatalogPurchase(tx, playerId, catalogItem);

      // Record the transaction
      await tx.purchaseTransaction.create({
        data: {
          player_id: playerId,
          product_id: productId,
          purchase_token: purchaseToken,
          diamonds_added: result.diamondsAdded,
        },
      });

      return result;
    });

    return successResponse(
      res,
      {
        coinsAdded: fulfillment.coinsAdded,
        diamondsAdded: fulfillment.diamondsAdded,
        unlockedMaps: fulfillment.unlockedMaps,
        unlockedCharacters: fulfillment.unlockedCharacters,
        infiniteEnergyMonthlyExpiresAt:
          fulfillment.infiniteEnergyMonthlyExpiresAt,
        infiniteEnergyLifetime: fulfillment.infiniteEnergyLifetime,
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
