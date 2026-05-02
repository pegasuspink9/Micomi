import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { apiService } from './api';

const PLAYER_KEY = 'playerData';
const ACCESS_TOKEN_KEY = 'accessToken';

const normalizePlayerId = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

class PvpRealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.connectedPlayerId = null;
  }

  async resolvePlayerId(explicitPlayerId = null) {
    const fromArg = normalizePlayerId(explicitPlayerId);
    if (fromArg) {
      return fromArg;
    }

    try {
      const serialized = await AsyncStorage.getItem(PLAYER_KEY);
      if (!serialized) {
        return null;
      }

      const player = JSON.parse(serialized);
      return normalizePlayerId(player?.player_id ?? player?.playerId ?? null);
    } catch (error) {
      console.warn('Failed to resolve player id for PvP realtime:', error);
      return null;
    }
  }

  async resolveToken() {
    if (apiService?.authToken) {
      return apiService.authToken;
    }

    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to read auth token for PvP realtime:', error);
      return null;
    }
  }

  emitLocal(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.warn('PvP realtime listener failed:', error);
      }
    }
  }

  bindMatchEvents() {
    if (!this.socket) {
      return;
    }

    const forward = (eventName) => {
      this.socket.on(eventName, (payload) => {
        this.emitLocal({
          type: 'event',
          event: eventName,
          payload,
          receivedAt: Date.now(),
        });
      });
    };

    forward('pvp:matchmaking-status');
    forward('pvp:match-found');
    forward('pvp:match-update');
    forward('pvp:match-completed');
  }

  async connect(options = {}) {
    const requestedPlayerId = await this.resolvePlayerId(options.playerId);
    if (!requestedPlayerId) {
      return null;
    }

    if (this.socket && this.connectedPlayerId === requestedPlayerId) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.disconnect();

    const token = await this.resolveToken();

    this.socket = io(apiService.baseURL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 300,
      reconnectionDelayMax: 2500,
      auth: token ? { token } : undefined,
    });

    this.connectedPlayerId = requestedPlayerId;

    this.socket.on('connect', () => {
      if (this.socket) {
        this.socket.emit('joinRoom', requestedPlayerId);
      }

      this.emitLocal({
        type: 'connected',
        playerId: requestedPlayerId,
        socketId: this.socket?.id || null,
        receivedAt: Date.now(),
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.emitLocal({
        type: 'disconnected',
        playerId: requestedPlayerId,
        reason,
        receivedAt: Date.now(),
      });
    });

    this.socket.on('connect_error', (error) => {
      this.emitLocal({
        type: 'error',
        playerId: requestedPlayerId,
        error: error?.message || 'socket connection error',
        receivedAt: Date.now(),
      });
    });

    this.bindMatchEvents();

    return this.socket;
  }

  subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect() {
    if (!this.socket) {
      return;
    }

    try {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    } catch (error) {
      console.warn('Failed to disconnect PvP realtime socket:', error);
    }

    this.socket = null;
    this.connectedPlayerId = null;
  }
}

export const pvpRealtimeService = new PvpRealtimeService();

export default pvpRealtimeService;
