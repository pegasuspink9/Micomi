import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateToken = (payload: object) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

export const verifyToken = (token: string) => jwt.verify(token, JWT_SECRET);
