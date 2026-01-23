import { useState, useEffect, useCallback } from 'react';
import { playerService } from '../services/playerService';
import { AppState } from 'react-native';
import { characterService } from '../services/characterService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';

export const usePlayerProfile = () => {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSelectionCheck, setLastSelectionCheck] = useState(0);
  const [lastBadgeCheck, setLastBadgeCheck] = useState(0);

  // ✅ Load player profile from API with Map API cache reuse
  const loadPlayerProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`👤 Loading player profile...`);
      
      // ✅ Load cached assets from Map API preload into memory
      await Promise.all([
        universalAssetPreloader.loadCachedAssets('game_images'),
        universalAssetPreloader.loadCachedAssets('game_animations'),
        universalAssetPreloader.loadCachedAssets('map_assets'),
      ]);
      
      // Get player data from API
      const apiData = await playerService.getPlayerProfile();
      
      // Transform API data to our format
      let transformedData = playerService.transformPlayerData(apiData);
      
      // ✅ Check if profile assets are already cached (from Map API preload)
      const cacheStatus = await universalAssetPreloader.areProfileAssetsCachedFromMap(transformedData);
      console.log(`📦 Profile asset cache status:`, cacheStatus);
      
      if (!cacheStatus.cached && cacheStatus.missing > 0) {
        // Only download truly missing assets (most should be cached from Map API)
        console.log(`📦 Need to download ${cacheStatus.missing} missing profile assets`);
        await universalAssetPreloader.downloadMissingProfileAssets(cacheStatus.missingAssets);
      } else {
        console.log(`✅ All ${cacheStatus.total} profile assets already cached from Map API`);
      }
      
      // ✅ Transform data to use cached paths (reusing Map API cache)
      let dataWithCachedPaths = transformedData;
      
      if (typeof universalAssetPreloader.transformProfileDataWithMapCache === 'function') {
        dataWithCachedPaths = universalAssetPreloader.transformProfileDataWithMapCache(transformedData);
      } else {
        // Fallback to existing transform method
        console.warn('⚠️ transformProfileDataWithMapCache not found, using transformPlayerDataWithCache');
        dataWithCachedPaths = universalAssetPreloader.transformPlayerDataWithCache(transformedData);
      }
      
      setPlayerData(dataWithCachedPaths);
      
      console.log('✅ Player profile loaded successfully with cached assets');
      return dataWithCachedPaths;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load player profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForCharacterUpdates = useCallback(async () => {
    try {
      const lastUpdate = await characterService.getLastSelectionUpdate();
      
      if (lastUpdate > lastSelectionCheck) {
        console.log('🔄 Character selection updated, refreshing player data...');
        setLastSelectionCheck(lastUpdate);
        await loadPlayerProfile();
      }
    } catch (error) {
      console.error('Error checking for character updates:', error);
    }
  }, [lastSelectionCheck, loadPlayerProfile]);

  const checkForBadgeUpdates = useCallback(async () => {
    try {
      const lastUpdate = await playerService.getLastBadgeUpdate();
      
      if (lastUpdate > lastBadgeCheck) {
        console.log('🔄 Badge selection updated, refreshing player data...');
        setLastBadgeCheck(lastUpdate);
        await loadPlayerProfile();
      }
    } catch (error) {
      console.error('Error checking for badge updates:', error);
    }
  }, [lastBadgeCheck, loadPlayerProfile]);

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
    loadPlayerProfile().then(() => {
      characterService.getLastSelectionUpdate().then(setLastSelectionCheck);
      playerService.getLastBadgeUpdate().then(setLastBadgeCheck); 
    });
  }, [loadPlayerProfile]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkForCharacterUpdates();
        checkForBadgeUpdates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkForCharacterUpdates, checkForBadgeUpdates]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForCharacterUpdates();
      checkForBadgeUpdates();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkForCharacterUpdates, checkForBadgeUpdates]);

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