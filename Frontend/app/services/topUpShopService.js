import { apiService } from './api';

export const topUpShopService = {
  getCatalog: async () => {
    try {
      const response = await apiService.get('/shop/catalog');

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to fetch top up shop catalog');
      }

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch top up shop catalog:', error);
      throw error;
    }
  },
};
