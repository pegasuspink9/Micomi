import { apiService } from './api';

export const questService = {
  // Get all player quests
  getPlayerQuests: async () => {
    try {
      const response = await apiService.get(`/quest/player`);
      console.log('📋 Player quests fetched:', response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch player quests:', error);
      throw error;
    }
  },

  // Claim a completed quest reward
  claimQuestReward: async (questId) => {
    try {
      console.log(`🎁 Claiming quest reward ${questId}...`);
      const response = await apiService.post(`/quest/${questId}/claim`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to claim quest reward');
      }
      
      console.log(`🎁 Quest reward claimed successfully`);
      return response;
    } catch (error) {
      console.error(`Failed to claim quest ${questId}:`, error);
      throw error;
    }
  },


  // Transform quest data for UI
  transformQuestData: (apiData) => {
    return {
      dailyQuests: apiData.dailyQuests || [],
      weeklyQuests: apiData.weeklyQuests || [],
      monthlyQuests: apiData.monthlyQuests || [],
      completedQuests: apiData.completedQuests || [],
      summary: apiData.summary || {
        totalActive: 0,
        totalCompleted: 0,
        totalClaimed: 0,
        dailyCount: 0,
        weeklyCount: 0,
        monthlyCount: 0
      }
    };
  },

  // Format objective type for display (converts snake_case to Title Case)
  formatObjectiveType: (objectiveType) => {
    if (!objectiveType) return 'Quest';
    // Convert snake_case to Title Case (e.g., "earn_exp" -> "Earn Exp")
    return objectiveType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  // Get quest period color
  getQuestPeriodColor: (questPeriod) => {
    const colorMap = {
      'daily': ['#4a90d9', '#2d5a87'],
      'weekly': ['#9b59b6', '#6c3483'],
      'monthly': ['#e67e22', '#a04000']
    };
    return colorMap[questPeriod] || ['#34495e', '#2c3e50'];
  }
};