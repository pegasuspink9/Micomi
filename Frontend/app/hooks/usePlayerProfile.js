import { useState, useEffect, useCallback } from 'react';
import { playerService } from '../services/playerService';
import { AppState } from 'react-native';
import { characterService } from '../services/characterService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';


export const usePlayerProfile = (playerId = 11) => {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSelectionCheck, setLastSelectionCheck] = useState(0);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsProgress, setAssetsProgress] = useState({ loaded: 0, total: 0, progress: 0 });

  // Load player profile from API
    const loadPlayerProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`👤 Loading player profile for ID: ${playerId}...`);
      
      // First, load cached assets
      await universalAssetPreloader.loadCachedAssets('player_profile');
      
      // Get both player data and character data
      const [apiData, characterData] = await Promise.all([
        playerService.getPlayerProfile(playerId),
        characterService.getPlayerCharacters(playerId)
      ]);
      
      let transformedData = playerService.transformPlayerData(apiData);
      
      // Transform character data to find selected hero
      const transformedCharacters = characterService.transformCharacterData(characterData);
      const selectedHero = characterService.getSelectedCharacter(transformedCharacters);
      
      // Update hero selection if we found a selected character
      if (selectedHero) {
        transformedData.heroSelected = {
          name: selectedHero.character_name,
          avatar: selectedHero.character_image_display
        };
        console.log(`🔄 Updated hero in player data: ${selectedHero.character_name}`);
      }

      // Check if player profile assets are cached
      const cacheStatus = await universalAssetPreloader.arePlayerProfileAssetsCached(transformedData);
      console.log(`📦 Player profile asset cache status:`, cacheStatus);
      
      // If not all assets are cached, download them
      if (!cacheStatus.cached) {
        console.log(`📦 Need to download ${cacheStatus.missing} missing player profile assets`);
        await downloadPlayerProfileAssets(transformedData);
      }
      
      // Transform data to use cached paths
      const dataWithCachedPaths = universalAssetPreloader.transformPlayerDataWithCache(transformedData);
      setPlayerData(dataWithCachedPaths);
      
      console.log('✅ Player profile loaded successfully');
      return dataWithCachedPaths;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load player profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  
  const downloadPlayerProfileAssets = useCallback(async (playerData) => {
    try {
      setAssetsLoading(true);
      setAssetsProgress({ loaded: 0, total: 0, progress: 0 });
      
      console.log('📦 Starting player profile asset download...');
      
      const result = await universalAssetPreloader.downloadPlayerProfileAssets(
        playerData,
        // Overall progress callback
        (progress) => {
          setAssetsProgress({
            loaded: progress.loaded,
            total: progress.total,
            progress: progress.progress,
            successCount: progress.successCount,
            currentAsset: progress.currentAsset
          });
        },
        // Individual asset callback
        (assetProgress) => {
          console.log(`📦 Downloading ${assetProgress.name}: ${Math.round(assetProgress.progress * 100)}%`);
        }
      );
      
      if (result.success) {
        console.log(`✅ Successfully downloaded ${result.downloaded}/${result.total} player profile assets`);
        
        if (result.failedAssets.length > 0) {
          console.warn(`⚠️ Failed to download ${result.failedAssets.length} assets:`, result.failedAssets);
        }
      } else {
        throw new Error('Failed to download player profile assets');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error downloading player profile assets:', error);
      setError(`Failed to download assets: ${error.message}`);
      throw error;
    } finally {
      setAssetsLoading(false);
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
    });
  }, [loadPlayerProfile]);

   useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        checkForCharacterUpdates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [checkForCharacterUpdates]);

    useEffect(() => {
    const interval = setInterval(() => {
      checkForCharacterUpdates();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkForCharacterUpdates]);

  return {
    // Data
    playerData,
    
    // States
    loading,
    error,
    assetsLoading,
    assetsProgress,
    
    // Actions
    loadPlayerProfile,
    clearError,
    downloadPlayerProfileAssets,
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