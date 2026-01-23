import { apiService } from './api';

export const levelService = {
  // Get all levels for a specific map
  getLevelsByMapId: async (mapId) => {
    try {
      const response = await apiService.get(`/levels?mapId=${mapId}`);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to fetch levels for map ${mapId}:`, error);
      throw error;
    }
  },


  // Get specific level by ID
  getLevelById: async (levelId) => {
    try {
      const response = await apiService.get(`/levels/${levelId}`);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to fetch level ${levelId}:`, error);
      throw error;
    }
  },

  getLevelPreview: async (levelId) => {
    try {
      const response = await apiService.get(`/game/entryLevel/${levelId}/preview`);
      return response; 
    } catch (error) {
      console.error(`Failed to fetch level preview ${levelId}:`, error);
      throw error;
    }
  },

  buyPotion: async (levelId, potionId) => {
    try {
      console.log(`🛒 Attempting to buy potion ${potionId} in level ${levelId}`);
      
      const response = await apiService.post(`/game/entryLevel/${levelId}/preview/buy-potion/${potionId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to buy potion');
      }
      
      console.log(`🛒 Potion purchase successful:`, response);
      return response;
    } catch (error) {
      console.error(`Failed to buy potion ${potionId}:`, error);
      throw error;
    }
  },


  // Update level progress
  updateLevelProgress: async (levelId, progressData) => {
    try {
      const response = await apiService.post(`/api/levels/${levelId}/progress`, {
        ...progressData
      });
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to update level progress:`, error);
      throw error;
    }
  },

  // Unlock next level
  unlockNextLevel: async (mapId, currentLevelNumber) => {
    try {
      const response = await apiService.post(`/api/levels/unlock`, {
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