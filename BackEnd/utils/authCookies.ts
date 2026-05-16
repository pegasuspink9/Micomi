import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken?: string; refreshToken?: string },
) => {
  if (tokens.accessToken) {
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: ACCESS_COOKIE_MAX_AGE_MS,
      path: "/",
    });
  }

  if (tokens.refreshToken) {
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: "/",
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });
};
