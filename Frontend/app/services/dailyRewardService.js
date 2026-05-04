import { apiService } from './api';

export const dailyRewardService = {
  getDailyReward: async () => {
    try {
      const response = await apiService.get('/daily-reward');
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch daily reward:', error);
      throw error;
    }
  },

  claimDailyReward: async (rewardId) => {
    try {
      const response = await apiService.post(`/daily-reward/${rewardId}/claim`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to claim daily reward');
      }

      return response;
    } catch (error) {
      console.error(`Failed to claim daily reward ${rewardId}:`, error);
      throw error;
    }
  },
};

export default dailyRewardService;
