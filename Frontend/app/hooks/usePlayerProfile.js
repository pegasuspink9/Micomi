import { useState, useEffect, useCallback } from 'react';
import { playerService } from '../services/playerService';
import { AppState } from 'react-native';
import { characterService } from '../services/characterService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';
import { useAuth } from './useAuth';

export const usePlayerProfile = (options = {}) => {
  const { lightweight = false } = options;
  const { user } = useAuth();
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSelectionCheck, setLastSelectionCheck] = useState(0);
  const [lastBadgeCheck, setLastBadgeCheck] = useState(0);
  const [availableAvatars, setAvailableAvatars] = useState([]); // New state
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);

  // Sync state and clear playerData instantly on logout
  useEffect(() => {
    if (!user) {
      setPlayerData(null);
      setLoading(false);
    }
  }, [user]);

  const attachThemesToProfile = useCallback((baseData, themesPayload) => {
    const themes = themesPayload?.themes || [];
    const diamonds = themesPayload?.diamonds ?? baseData?.diamonds ?? 0;
    return {
      ...baseData,
      themes,
      diamonds,
    };
  }, [attachThemesToProfile]);

  // ✅ Load player profile from API with Map API cache reuse
  const loadPlayerProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return null;
    }
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
      let themesPayload = null;

      try {
        themesPayload = await playerService.getThemes();
      } catch (themesError) {
        console.error('Failed to load themes:', themesError);
      }

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

      const mergedData = attachThemesToProfile(dataWithCachedPaths, themesPayload);
      setPlayerData(mergedData);

      fetchAvailableAvatars();


      console.log('✅ Player profile loaded successfully with cached assets');
      return mergedData;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load player profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPlayerData = useCallback(async () => {
    if (!user) return null;
    try {
      const apiData = await playerService.getPlayerProfile();
      let transformedData = playerService.transformPlayerData(apiData);

      let themesPayload = null;
      try {
        themesPayload = await playerService.getThemes();
      } catch (themesError) {
        console.error('Failed to load themes:', themesError);
      }

      let dataWithCachedPaths = transformedData;
      if (typeof universalAssetPreloader.transformProfileDataWithMapCache === 'function') {
        dataWithCachedPaths = universalAssetPreloader.transformProfileDataWithMapCache(transformedData);
      } else {
        dataWithCachedPaths = universalAssetPreloader.transformPlayerDataWithCache(transformedData);
      }

      const mergedData = attachThemesToProfile(dataWithCachedPaths, themesPayload);
      setPlayerData(mergedData);
      return mergedData;
    } catch (err) {
      console.error('Silent refresh failed:', err);
    }
  }, [attachThemesToProfile]);

  const loadPlayerHeader = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return null;
    }
    try {
      setLoading(true);
      setError(null);

      const apiData = await playerService.getPlayerProfileHeader();
      const transformedData = playerService.transformPlayerHeaderData(apiData);

      setPlayerData(transformedData);
      return transformedData;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load player profile header:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshPlayerHeader = useCallback(async () => {
    if (!user) return null;
    try {
      const apiData = await playerService.getPlayerProfileHeader();
      const transformedData = playerService.transformPlayerHeaderData(apiData);
      setPlayerData(transformedData);
      return transformedData;
    } catch (err) {
      console.error('Silent header refresh failed:', err);
    }
  }, [user]);

  const fetchAvailableAvatars = useCallback(async () => {
    try {
      const avatars = await playerService.getAvailableAvatars();
      setAvailableAvatars(avatars);
    } catch (err) {
      console.error('Failed to fetch avatars:', err);
    }
  }, []);

  const updateAvatar = useCallback(async (avatarId) => {
    try {
      setIsSelectingAvatar(true);
      await playerService.selectAvatar(avatarId);
      await loadPlayerProfile(); // Refresh profile to show new avatar
      return { success: true };
    } catch (err) {
      console.error('Update avatar failed:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSelectingAvatar(false);
    }
  }, [loadPlayerProfile]);

  const updateProfile = useCallback(async (payload) => {
    try {
      const result = await playerService.updatePlayerProfile(payload);
      // Refresh local data after successful update
      await loadPlayerProfile();
      return { success: true, data: result };
    } catch (err) {
      console.error('Update profile failed:', err);
      return { success: false, error: err.message };
    }
  }, [loadPlayerProfile]);

  const refreshThemes = useCallback(async () => {
    try {
      const themesPayload = await playerService.getThemes();
      setPlayerData((prev) => {
        if (!prev) return prev;
        return attachThemesToProfile(prev, themesPayload);
      });
      return themesPayload;
    } catch (err) {
      console.error('Failed to refresh themes:', err);
      return null;
    }
  }, [attachThemesToProfile]);

  const selectTheme = useCallback(async (themeId) => {
    try {
      await playerService.selectTheme(themeId);
      await refreshThemes();
      return { success: true };
    } catch (err) {
      console.error('Select theme failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshThemes]);

  const purchaseTheme = useCallback(async (themeId) => {
    try {
      await playerService.purchaseTheme(themeId);
      await refreshThemes();
      return { success: true };
    } catch (err) {
      console.error('Purchase theme failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshThemes]);


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

  const getThemes = useCallback(() => {
    return playerData?.themes || [];
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

  const checkEmailExists = useCallback(async (email) => {
    try {
      const players = await playerService.getAllPlayers();
      const emailExists = players.some(
        (player) => player.email?.toLowerCase() === email.toLowerCase()
      );
      return emailExists;
    } catch (error) {
      console.error('Failed to check email existence:', error);
      throw error;
    }
  }, []);

  const checkIdentifierExists = useCallback(async (identifier) => {
    try {
      const players = await playerService.getAllPlayers();
      const normalizedIdentifier = identifier.toLowerCase();

      return players.some(
        (player) =>
          player.email?.toLowerCase() === normalizedIdentifier ||
          player.username?.toLowerCase() === normalizedIdentifier
      );
    } catch (error) {
      console.error('Failed to check identifier existence:', error);
      throw error;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!user || lightweight) return;
    loadPlayerProfile().then(() => {
      characterService.getLastSelectionUpdate().then(setLastSelectionCheck);
      playerService.getLastBadgeUpdate().then(setLastBadgeCheck);
    });
  }, [loadPlayerProfile, user, lightweight]);

  useEffect(() => {
    if (!user || !playerData || lightweight) return;
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkForCharacterUpdates();
        checkForBadgeUpdates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkForCharacterUpdates, checkForBadgeUpdates, user, playerData, lightweight]);

  useEffect(() => {
    if (!user || !playerData || lightweight) return;
    const interval = setInterval(() => {
      checkForCharacterUpdates();
      checkForBadgeUpdates();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkForCharacterUpdates, checkForBadgeUpdates, user, playerData, lightweight]);

  return {
    // Data
    playerData,
    availableAvatars,
    // States
    loading,
    error,
    isSelectingAvatar,

    // Actions
    loadPlayerProfile,
    loadPlayerHeader,
    refreshPlayerHeader,
    updateAvatar,
    updateProfile,
    clearError,
    refreshPlayerData,
    refreshThemes,
    selectTheme,
    purchaseTheme,
    checkEmailExists,
    checkIdentifierExists,

    // Getters
    getBadges,
    getQuests,
    getPotions,
    getThemes,
    getEarnedBadges,
    getCompletedQuests,
    getActiveQuests,
  };
};

export default usePlayerProfile;