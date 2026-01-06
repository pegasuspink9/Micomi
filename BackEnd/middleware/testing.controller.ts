import { OAuth2Client } from "google-auth-library";
import { handleGooglePayload } from "./testing";
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import { Response, Request } from "express";

const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

export const googleMobileAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      throw new Error("Invalid token");
    }

    const safePayload = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    const player = await handleGooglePayload(safePayload);

    return res.json({
      success: true,
      token: generateAccessToken({ id: player.player_id, role: "player" }),
      refreshToken: generateRefreshToken({
        id: player.player_id,
        role: "player",
      }),
      player,
    });
  } catch (e) {
    return res.status(401).json({ success: false });
  }
};
