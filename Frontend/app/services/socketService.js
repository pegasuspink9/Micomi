import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

const PLAYER_KEY = 'playerData';
const ACCESS_TOKEN_KEY = 'accessToken';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.playerId = null;
  }

  // Initialize socket connection with auth
  async initialize() {
    if (this.socket) {
      return this.socket;
    }

    try {
      // Get player ID from storage
      const playerData = await AsyncStorage.getItem(PLAYER_KEY);
      const token = apiService?.authToken || (await AsyncStorage.getItem(ACCESS_TOKEN_KEY));

      if (!playerData) {
        console.warn('⚠️ No player data found for socket initialization');
        return null;
      }

      const player = JSON.parse(playerData);
      this.playerId = player?.player_id || player?.playerId;

      if (!this.playerId) {
        console.warn('⚠️ No player ID found for socket initialization');
        return null;
      }

      // Create socket connection
      const baseURL = apiService.baseURL || 'http://localhost:3000';
      this.socket = io(baseURL, {
        auth: {
          token: token || '',
          playerId: this.playerId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Setup event listeners
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      return null;
    }
  }

  // Get socket instance
  getInstance() {
    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  // Check if connected
  isSocketConnected() {
    return this.isConnected && !!this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Auto-initialize on first access
let initPromise = null;
export const getSocket = async () => {
  if (!initPromise) {
    initPromise = socketService.initialize();
  }
  return initPromise;
};

// Export the service
export { socketService };

// Export as default socket for ease of use
export const socket = socketService.socket;
