import { apiService } from './api';

export const mapService = {
  getAllMapsWithLevels: async () => {
    try {
      const response = await apiService.get('/map');
      console.log('🗺️ Maps with levels response:', response);
      
      if (response.success && response.data && response.data.data) {
        return response.data.data;
      }
      
      // Fallback for old structure or errors
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch maps with levels:', error);
      throw error;
    }
  },

    getMapWithLevels: async (mapId) => {
    try {
      const response = await apiService.get(`/map/select-map/${mapId}`);
      console.log(`🗺️ Map ${mapId} with levels:`, response);
      
      if (response.success && response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to fetch map ${mapId} with levels:`, error);
      throw error;
    }
  },

  extractLevelsFromMap: (mapData) => {
    if (!mapData || !mapData.levels) {
      console.warn('⚠️ No levels found in map data');
      return [];
    }
    
    console.log(`📋 Extracting ${mapData.levels.length} levels from map: ${mapData.map_name}`);
    return mapData.levels;
  }
};