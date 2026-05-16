import { apiService } from './api';

export const energyService = {
  getEnergyStatus: async () => {
    try {
      const response = await apiService.get('/game/energy/status');

      if (!response) {
        throw new Error('Failed to load energy status');
      }

      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch energy status:', error);
      throw error;
    }
  },
};
