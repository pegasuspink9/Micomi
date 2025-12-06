import { useState, useEffect, useCallback } from 'react';
import { questService } from '../services/questService';

export const useQuests = (playerId = 11) => {
  const [questsData, setQuestsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimingQuestId, setClaimingQuestId] = useState(null);

  // Load quests from API
  const loadQuests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📋 Loading quests for player ID: ${playerId}...`);
      
      const apiData = await questService.getPlayerQuests(playerId);
      const transformedData = questService.transformQuestData(apiData);
      
      setQuestsData(transformedData);
      console.log('✅ Quests loaded successfully');
      
      return transformedData;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load quests:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Claim quest reward
  const claimReward = useCallback(async (playerQuestId) => {
    try {
      setClaiming(true);
      setClaimingQuestId(playerQuestId);
      setError(null);
      
      console.log(`🎁 Claiming reward for quest ${playerQuestId}...`);
      
      const response = await questService.claimQuestReward(playerId, playerQuestId);
      
      // Reload quests to get updated data
      await loadQuests();
      
      console.log('✅ Reward claimed successfully');
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Failed to claim reward:', err);
      throw err;
    } finally {
      setClaiming(false);
      setClaimingQuestId(null);
    }
  }, [playerId, loadQuests]);

  // Get quests by period
  const getDailyQuests = useCallback(() => {
    return questsData?.dailyQuests || [];
  }, [questsData]);

  const getWeeklyQuests = useCallback(() => {
    return questsData?.weeklyQuests || [];
  }, [questsData]);

  const getMonthlyQuests = useCallback(() => {
    return questsData?.monthlyQuests || [];
  }, [questsData]);

  const getCompletedQuests = useCallback(() => {
    return questsData?.completedQuests || [];
  }, [questsData]);

  const getSummary = useCallback(() => {
    return questsData?.summary || {};
  }, [questsData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  return {
    // Data
    questsData,
    
    // States
    loading,
    error,
    claiming,
    claimingQuestId,
    
    // Actions
    loadQuests,
    claimReward,
    clearError,
    
    // Getters
    getDailyQuests,
    getWeeklyQuests,
    getMonthlyQuests,
    getCompletedQuests,
    getSummary,
  };
};

export default useQuests;