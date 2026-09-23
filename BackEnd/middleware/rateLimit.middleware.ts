import { Request, Response, RequestHandler } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore, RedisReply } from "rate-limit-redis";
import { redis } from "../utils/redis";

const rejected: RequestHandler = (_req, res) => {
  res.setHeader("Retry-After", "60");
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

const createStore = (prefix: string) => {
  return new RedisStore({
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      return (await redis.call(args[0], ...args.slice(1))) as RedisReply;
    },
    prefix,
  });
};

const customKeyGenerator = (req: Request, _res: Response) => {
  const userId = (req as Request & { user?: { id?: number } }).user?.id;
  return userId
    ? `player:${userId}`
    : `ip:${ipKeyGenerator(req.ip || "127.0.0.1")}`;
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  store: createStore("rl:global:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  store: createStore("rl:auth:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  store: createStore("rl:oauth:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: customKeyGenerator,
  store: createStore("rl:refresh:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  store: createStore("rl:pw_reset:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const passwordResetEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  store: createStore("rl:pw_reset_email:"),
  keyGenerator: (req, _res) => {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    return `password-reset-email:${email || ipKeyGenerator(req.ip || "127.0.0.1")}`;
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const purchaseLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  keyGenerator: customKeyGenerator,
  store: createStore("rl:purchase:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const gameplayLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: customKeyGenerator,
  store: createStore("rl:gameplay:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});

export const socialLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: customKeyGenerator,
  store: createStore("rl:social:"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rejected,
});
