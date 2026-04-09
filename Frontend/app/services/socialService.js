import { apiService } from './api';

const getPlayerFromRelation = (item) => {
  if (!item) return null;
  return item.player || item.following || item.follower || null;
};

const normalizeRelationPlayers = (list = []) => {
  return list
    .map((item) => {
      const player = getPlayerFromRelation(item);
      if (!player) return null;

      return {
        followId: item.follow_id || null,
        createdAt: item.created_at || null,
        playerId: player.player_id,
        playerName: player.player_name || 'Unknown',
        username: player.username || '',
        playerAvatar: player.player_avatar || null,
        level: player.level || player.player_level || 1,
        lastActive: player.last_active || null,
      };
    })
    .filter(Boolean);
};

export const socialService = {
  getFollowing: async () => {
    try {
      const response = await apiService.get('/social/following');
      const data = response?.success ? response.data : response?.data || [];
      return normalizeRelationPlayers(data || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
      throw error;
    }
  },

  getFollowers: async () => {
    try {
      const response = await apiService.get('/social/followers');
      const data = response?.success ? response.data : response?.data || [];
      return normalizeRelationPlayers(data || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
      throw error;
    }
  },

  getFollowersByPlayer: async (playerId) => {
    try {
      const response = await apiService.get(`/social/followers/${playerId}`);
      const data = response?.success ? response.data : response?.data || [];
      return normalizeRelationPlayers(data || []);
    } catch (error) {
      console.error(`Failed to fetch followers for player ${playerId}:`, error);
      throw error;
    }
  },

  getFollowingByPlayer: async (playerId) => {
    try {
      const response = await apiService.get(`/social/following/${playerId}`);
      const data = response?.success ? response.data : response?.data || [];
      return normalizeRelationPlayers(data || []);
    } catch (error) {
      console.error(`Failed to fetch following for player ${playerId}:`, error);
      throw error;
    }
  },

  searchPlayers: async ({ username, page = 1, limit = 20 }) => {
    try {
      const query = encodeURIComponent(username || '');
      const response = await apiService.get(
        `/player/search?username=${query}&page=${page}&limit=${limit}`
      );

      const payload = response?.success ? response.data : response?.data;
      return {
        query: payload?.query || username || '',
        page: payload?.page || page,
        limit: payload?.limit || limit,
        total: payload?.total || 0,
        totalPages: payload?.totalPages || 1,
        players: payload?.players || [],
      };
    } catch (error) {
      console.error('Failed to search players:', error);
      throw error;
    }
  },

  followPlayer: async (playerId) => {
    try {
      const response = await apiService.post(`/social/follow/${playerId}`);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to follow player');
      }
      return response;
    } catch (error) {
      console.error(`Failed to follow player ${playerId}:`, error);
      throw error;
    }
  },

  unfollowPlayer: async (playerId) => {
    try {
      const response = await apiService.delete(`/social/follow/${playerId}`);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to unfollow player');
      }
      return response;
    } catch (error) {
      console.error(`Failed to unfollow player ${playerId}:`, error);
      throw error;
    }
  },

  followBackPlayer: async (playerId) => {
    try {
      const response = await apiService.post(`/social/follow-back/${playerId}`);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to follow back player');
      }
      return response;
    } catch (error) {
      console.error(`Failed to follow back player ${playerId}:`, error);
      throw error;
    }
  },

  getPublicProfile: async (playerId) => {
    try {
      const response = await apiService.get(`/social/profile/${playerId}`);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to fetch public profile');
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch public profile ${playerId}:`, error);
      throw error;
    }
  },

  getRecommendations: async () => {
    try {
      const response = await apiService.get('/social/recommendations');
      const data = response?.success ? response.data : response?.data || [];
      return (data || []).map((player) => ({
        player_id: player.player_id,
        username: player.username || '',
        player_name: player.player_name || 'Unknown',
        player_avatar: player.player_avatar || null,
        level: player.level || 1,
      }));
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      throw error;
    }
  },
};

export default socialService;
