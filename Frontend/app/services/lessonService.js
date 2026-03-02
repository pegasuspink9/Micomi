import { apiService } from './api';

export const lessonService = {
  getModuleLanguages: async () => {
    try {
      const response = await apiService.get('/module/languages');
      if (response && response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching module languages:', error);
      throw error;
    }
  },
  
  getModuleTitles: async (mapId) => {
    try {
      const response = await apiService.post(`/module/languages/${mapId}`);
      if (response && response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching module titles:', error);
      throw error;
    }
  },

  
    getModuleContent: async (moduleId) => {
    try {
      const response = await apiService.post(`/module/languages/map/${moduleId}`);
      if (response && response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching module content:', error);
      throw error;
    }
  }


  
};