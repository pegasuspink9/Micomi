import { Request, Response } from "express";
import { verifyRefreshToken, generateAccessToken } from "../utils/token";
import { successResponse, errorResponse } from "../utils/response";

export const refreshAccessToken = (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return errorResponse(res, null, "No refresh token", 401);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken) as any;
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });
    return successResponse(
      res,
      { accessToken: newAccessToken },
      "Access token refreshed"
    );
  } catch {
    return errorResponse(res, null, "Invalid refresh token", 403);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return successResponse(res, null, "Logged out successfully");
};
