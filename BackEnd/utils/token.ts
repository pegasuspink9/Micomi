import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return JWT_SECRET;
};

export const generateToken = (payload: object) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });

export const verifyToken = (token: string) => jwt.verify(token, getJwtSecret());
