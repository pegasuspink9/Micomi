import { useState, useEffect, useCallback } from 'react';
import { playerService } from '../services/playerService';

export const usePlayerProfile = (playerId = 11) => {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load player profile from API
  const loadPlayerProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`👤 Loading player profile for player ID: ${playerId}...`);
      const apiData = await playerService.getPlayerProfile(playerId);
      const transformedData = playerService.transformPlayerData(apiData);
      
      setPlayerData(transformedData);
      console.log('✅ Player profile loaded successfully:', transformedData);
      
      return transformedData;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load player profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Get specific data sections
  const getBadges = useCallback(() => {
    return playerData?.badges || [];
  }, [playerData]);

  const getQuests = useCallback(() => {
    return playerData?.quests || [];
  }, [playerData]);

  const getPotions = useCallback(() => {
    return playerData?.potions || [];
  }, [playerData]);

  const getEarnedBadges = useCallback(() => {
    return playerData?.badges.filter(badge => badge.earned) || [];
  }, [playerData]);

  const getCompletedQuests = useCallback(() => {
    return playerData?.quests.filter(quest => quest.is_completed) || [];
  }, [playerData]);

  const getActiveQuests = useCallback(() => {
    return playerData?.quests.filter(quest => !quest.is_completed) || [];
  }, [playerData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadPlayerProfile();
  }, [loadPlayerProfile]);

  return {
    // Data
    playerData,
    
    // States
    loading,
    error,
    
    // Actions
    loadPlayerProfile,
    clearError,
    
    // Getters
    getBadges,
    getQuests,
    getPotions,
    getEarnedBadges,
    getCompletedQuests,
    getActiveQuests,
  };
};

export default usePlayerProfile;