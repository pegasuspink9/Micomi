import { Server } from "socket.io";

let socketServer: Server | null = null;

export const setSocketServer = (io: Server) => {
  socketServer = io;
};

export const getSocketServer = (): Server | null => socketServer;
