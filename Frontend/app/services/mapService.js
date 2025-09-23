import { apiService } from './api';

export const mapService = {
  // Get all maps with their levels
  getAllMapsWithLevels: async () => {
    try {
      const response = await apiService.get('/map');
      console.log('🗺️ Maps with levels response:', response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch maps with levels:', error);
      throw error;
    }
  },

  // Get specific map with its levels - CORRECT ENDPOINT
  getMapWithLevels: async (mapId) => {
    try {
      const response = await apiService.get(`/map/select-map/${mapId}`);
      console.log(`🗺️ Map ${mapId} with levels:`, response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to fetch map ${mapId} with levels:`, error);
      throw error;
    }
  },

  // Extract levels from map data
  extractLevelsFromMap: (mapData) => {
    if (!mapData || !mapData.levels) {
      console.warn('⚠️ No levels found in map data');
      return [];
    }
    
    console.log(`📋 Extracting ${mapData.levels.length} levels from map: ${mapData.map_name}`);
    return mapData.levels;
  }
};