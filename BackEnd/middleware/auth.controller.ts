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
import { differenceInCalendarDays } from "date-fns";
import * as PlayerService from "../src/models/Player/player.service";

const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

async function handleLoginSideEffects(playerId: number) {
  // 1. Fetch the player BEFORE updating to check the previous last_active date
  // We use the PlayerService you already imported to get the data
  const player = await PlayerService.getPlayerById(playerId);

  if (!player) return null;

  const now = new Date();
  const lastActive = player.last_active
    ? new Date(player.last_active)
    : new Date(0);

  const daysDiff = differenceInCalendarDays(now, lastActive);

  const updatedPlayer = await updatePlayerActivity(playerId);

  if (updatedPlayer && daysDiff >= 1) {
    await updateQuestProgress(playerId, QuestType.login_days, 1);
    await checkAchievements(playerId);
    console.log(
      `📅 New day detected for player ${playerId}. Login quest updated.`,
    );
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
      "Login successful",
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
        401,
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
      "Login successful",
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

    await handleLoginSideEffects(decoded.id);

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    return successResponse(
      res,
      {
        token: newAccessToken,
      },
      "Token refreshed successfully",
    );
  } catch (error) {
    return errorResponse(res, error, "Invalid or expired refresh token", 403);
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, null, "Email is required", 400);
    }

    await PlayerService.requestPasswordReset(email);

    return successResponse(
      res,
      null,
      "If an account exists with this email, a password reset link has been sent.",
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(res, error, "Failed to process request", 500);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, null, "Token and new password required", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(
        res,
        null,
        "Password must be at least 6 characters",
        400,
      );
    }

    await PlayerService.resetPassword(token, newPassword);

    return successResponse(
      res,
      null,
      "Password has been successfully reset. You can now login.",
    );
  } catch (error: any) {
    return errorResponse(
      res,
      error,
      error.message || "Failed to reset password",
      400,
    );
  }
};
