import { apiService } from './api';

export const mapService = {
  getAllMapsWithLevels: async () => {
    try {
      const response = await apiService.get('/map/11');
      console.log('🗺️ Maps with levels response:', response);
      
      if (response.success && response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch maps with levels:', error);
      throw error;
    }
  },

  getMapWithLevels: async (mapId) => {
    try {
      const response = await apiService.post(`/map/select-map/11/${mapId}`);
      console.log(`🗺️ Map ${mapId} with levels FULL response:`, JSON.stringify(response, null, 2));
      
      if (response.success && response.data && response.data.map) {
        const mapData = response.data.map;
        console.log(`🗺️ Extracted map data:`, JSON.stringify(mapData, null, 2));
        console.log(`🗺️ Map has ${mapData.levels?.length || 0} levels`);
        return mapData;
      }
      
      console.error('❌ Unexpected response structure:', response);
      return null;
    } catch (error) { 
      console.error(`Failed to fetch map ${mapId} with levels:`, error);
      throw error;
    }
  },

  extractLevelsFromMap: (mapData) => {
    console.log('🔍 Extracting levels from mapData:', mapData);
    
    if (!mapData) {
      console.warn('⚠️ mapData is null or undefined');
      return [];
    }
    
    if (!mapData.levels) {
      console.warn('⚠️ No levels property found in map data. Keys:', Object.keys(mapData));
      return [];
    }
    
    if (!Array.isArray(mapData.levels)) {
      console.warn('⚠️ levels is not an array:', typeof mapData.levels);
      return [];
    }
    
    console.log(`📋 Extracting ${mapData.levels.length} levels from map: ${mapData.map_name}`);
    return mapData.levels;
  }
};