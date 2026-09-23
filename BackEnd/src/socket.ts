import { Server } from "socket.io";
import { redis } from "../utils/redis";
import { RateLimiterRedis } from "rate-limiter-flexible";

let socketServer: Server | null = null;

export const setSocketServer = (io: Server) => {
  socketServer = io;
};

export const getSocketServer = (): Server | null => socketServer;

export const socketConnectionLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "socket-connection",
  points: 5,
  duration: 60,
});

export const socketEventLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "socket-event",
  points: 30,
  duration: 60,
});
