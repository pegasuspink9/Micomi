import { useState, useEffect, useCallback } from 'react';
import { questService } from '../services/questService';
import { Alert } from 'react-native';

export const useQuests = () => {
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
      
      console.log(`📋 Loading quests...`);
      
      const apiData = await questService.getPlayerQuests();
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
  }, []);

  // Claim quest reward
  const claimReward = useCallback(async (questId) => {
    try {
      setClaiming(true);
      setClaimingQuestId(questId);
      setError(null);
      
      console.log(`🎁 Claiming reward for quest ${questId}...`);
      
      const response = await questService.claimQuestReward(questId);
      
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
  }, [loadQuests]);


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