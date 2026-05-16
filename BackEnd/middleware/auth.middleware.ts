import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response";
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import { setAuthCookies } from "../utils/authCookies";

interface JwtPayload {
  id: number;
  role: string;
}

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";

const extractAccessToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookies = (req as any).cookies as Record<string, string> | undefined;
  return cookies?.[ACCESS_COOKIE_NAME];
};

const refreshFromCookie = (req: Request, res: Response) => {
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  const refreshToken = cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) return null;

  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!,
  ) as JwtPayload;

  const newAccessToken = generateAccessToken({
    id: decoded.id,
    role: decoded.role,
  });

  const newRefreshToken = generateRefreshToken({
    id: decoded.id,
    role: decoded.role,
  });

  setAuthCookies(res, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });

  res.setHeader("x-access-token", newAccessToken);

  return { id: decoded.id, role: decoded.role } as JwtPayload;
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = extractAccessToken(req);

  if (!token) {
    try {
      const refreshedUser = refreshFromCookie(req, res);
      if (!refreshedUser) {
        return errorResponse(res, null, "No token provided", 401);
      }

      (req as any).user = refreshedUser;
      return next();
    } catch (error) {
      return errorResponse(res, error, "Invalid refresh token", 403);
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (error) {
    const isExpired =
      (error as { name?: string })?.name === "TokenExpiredError";
    if (!isExpired) {
      return errorResponse(res, error, "Invalid token", 403);
    }

    try {
      const refreshedUser = refreshFromCookie(req, res);
      if (!refreshedUser) {
        return errorResponse(res, null, "Refresh token is required", 401);
      }

      (req as any).user = refreshedUser;
      return next();
    } catch (refreshError) {
      return errorResponse(res, refreshError, "Invalid refresh token", 403);
    }
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(req as any).user || (req as any).user.role !== "admin") {
    return errorResponse(res, null, "Admins only", 403);
  }
  next();
};

export const requirePlayer = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(req as any).user || (req as any).user.role !== "player") {
    return errorResponse(res, null, "Players only", 403);
  }
  next();
};
