import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required");
}

export const redis = new Redis(redisUrl, {
  family: 4,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,

  retryStrategy(times) {
    return Math.min(times * 50, 3000);
  },
});

redis.once("connect", () => {
  console.log("[Redis] Successfully connected to Upstash!");
});

redis.on("error", (error: NodeJS.ErrnoException) => {});
