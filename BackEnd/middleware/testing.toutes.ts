import express from "express";
import { handleGooglePayload } from "./testing";
import { generateAccessToken, generateRefreshToken } from "../utils/token";

const router = express.Router();

console.log("NODE_ENV:", process.env.NODE_ENV);

if (process.env.NODE_ENV === "development") {
  router.post("/google/mock", async (req, res) => {
    const mockPayload = {
      sub: "mock-google-id-123",
      email: "mockuser@gmail.com",
      name: "Mock User",
    };

    const player = await handleGooglePayload(mockPayload);

    return res.json({
      success: true,
      token: generateAccessToken({ id: player.player_id, role: "player" }),
      refreshToken: generateRefreshToken({
        id: player.player_id,
        role: "player",
      }),
      player,
    });
  });
}

export default router;
