import { apiService } from './api';

export const levelService = {
  // Get all levels for a specific map
  getLevelsByMapId: async (mapId) => {
    try {
      const response = await apiService.get(`/api/levels?mapId=${mapId}`);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to fetch levels for map ${mapId}:`, error);
      throw error;
    }
  },

  // Get specific level by ID
  getLevelById: async (levelId) => {
    try {
      const response = await apiService.get(`/api/levels/${levelId}`);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to fetch level ${levelId}:`, error);
      throw error;
    }
  },

  // Update level progress
  updateLevelProgress: async (playerId, levelId, progressData) => {
    try {
      const response = await apiService.post(`/api/levels/${levelId}/progress`, {
        player_id: playerId,
        ...progressData
      });
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to update level progress:`, error);
      throw error;
    }
  },

  // Unlock next level
  unlockNextLevel: async (playerId, mapId, currentLevelNumber) => {
    try {
      const response = await apiService.post(`/api/levels/unlock`, {
        player_id: playerId, 
        map_id: mapId,
        current_level_number: currentLevelNumber
      });
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to unlock next level:`, error);
      throw error;
    }
  }
};