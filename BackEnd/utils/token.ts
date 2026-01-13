import jwt from "jsonwebtoken";

interface TokenPayload {
  id: number;
  role: string;
}

interface ResetTokenPayload {
  id: number;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15d", //15m
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
};

export const generateResetToken = (payload: ResetTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_RESET_SECRET!, {
    expiresIn: "1h",
  });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error("Invalid access token");
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const verifyResetToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_RESET_SECRET!);
  } catch (error) {
    throw error;
  }
};
