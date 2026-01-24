import { apiService } from './api';

export const leaderboardService = {
  async getLeaderboard() {
    try {
      const response = await apiService.get('/game/leaderboard');
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch leaderboard data');
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },
};