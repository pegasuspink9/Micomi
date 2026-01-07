import axios from "axios";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { successResponse, errorResponse } from "../utils/response";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { updateQuestProgress } from "../src/game/Quests/quests.service";
import { checkAchievements } from "../src/game/Achievements/achievements.service";
import {
  findOrCreateOAuthPlayer,
  updatePlayerActivity,
} from "../src/models/Player/player.service";
import { QuestType } from "@prisma/client";

const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

async function handleLoginSideEffects(playerId: number) {
  const updatedPlayer = await updatePlayerActivity(playerId);
  if (updatedPlayer) {
    await updateQuestProgress(playerId, QuestType.login_days, 1);
    await checkAchievements(playerId);
  }
  return updatedPlayer;
}

export const googleMobileAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return errorResponse(res, null, "ID token required", 400);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email)
      return errorResponse(res, null, "Invalid token", 401);

    const player = await findOrCreateOAuthPlayer({
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || "Player",
    });

    const updatedPlayer = await handleLoginSideEffects(player.player_id);

    const accessToken = generateAccessToken({
      id: player.player_id,
      role: "player",
    });
    const refreshToken = generateRefreshToken({
      id: player.player_id,
      role: "player",
    });

    return successResponse(
      res,
      {
        token: accessToken,
        refreshToken,
        player: {
          id: player.player_id,
          email: player.email,
          player_name: player.player_name,
          days_logged_in: updatedPlayer?.days_logged_in,
          current_streak: updatedPlayer?.current_streak,
          longest_streak: updatedPlayer?.longest_streak,
        },
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return errorResponse(res, error, "Authentication failed", 500);
  }
};

interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
}

export const facebookMobileAuth = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken)
      return errorResponse(res, null, "Access token required", 400);

    const fbUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`;

    let fbProfile: FacebookProfile;
    try {
      const { data } = await axios.get<FacebookProfile>(fbUrl);
      fbProfile = data;
    } catch (apiError) {
      return errorResponse(res, apiError, "Invalid Facebook token", 401);
    }

    if (!fbProfile || !fbProfile.id) {
      return errorResponse(
        res,
        null,
        "Failed to retrieve Facebook profile",
        401
      );
    }

    const emailToUse =
      fbProfile.email || `fb_${fbProfile.id}@facebook.placeholder`;

    const player = await findOrCreateOAuthPlayer({
      provider: "facebook",
      providerId: fbProfile.id,
      email: emailToUse,
      name: fbProfile.name || "Player",
    });

    const updatedPlayer = await handleLoginSideEffects(player.player_id);

    const jwtAccessToken = generateAccessToken({
      id: player.player_id,
      role: "player",
    });
    const refreshToken = generateRefreshToken({
      id: player.player_id,
      role: "player",
    });

    return successResponse(
      res,
      {
        token: jwtAccessToken,
        refreshToken,
        player: {
          id: player.player_id,
          email: player.email,
          player_name: player.player_name,
          days_logged_in: updatedPlayer?.days_logged_in,
          current_streak: updatedPlayer?.current_streak,
          longest_streak: updatedPlayer?.longest_streak,
        },
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Facebook auth error:", error);
    return errorResponse(res, error, "Authentication failed", 500);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, null, "Refresh token is required", 401);
    }

    const decoded = verifyRefreshToken(refreshToken) as any;

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    return successResponse(
      res,
      {
        token: newAccessToken,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    return errorResponse(res, error, "Invalid or expired refresh token", 403);
  }
};
