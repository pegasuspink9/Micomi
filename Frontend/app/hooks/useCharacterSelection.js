import { useState, useEffect, useCallback } from 'react';
import { characterService } from '../services/characterService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';
import {VIDEO_ASSETS} from '../Components/Character/CharacterData';




export const useCharacterSelection = (playerId = 11) => { 
  const [charactersData, setCharactersData] = useState({});
  const [selectedHero, setSelectedHero] = useState(''); // This is for display/viewing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsProgress, setAssetsProgress] = useState({ loaded: 0, total: 0, progress: 0 });
  const [userCoins, setUserCoins] = useState(0);
  
 const loadCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🦸‍♂️ Loading player characters for player ID: ${playerId}...`);
      
      // First, load cached assets (including videos)
      await universalAssetPreloader.loadCachedAssets('characters');
      await universalAssetPreloader.loadCachedAssets('ui_videos'); // ✅ Load video cache
      
      // Get character data from API
      const apiData = await characterService.getPlayerCharacters(playerId);
      const { characters: transformedData, userCoins: fetchedUserCoins } = characterService.transformCharacterData(apiData);
      setUserCoins(fetchedUserCoins);

      // ✅ Check both character assets and video assets cache status
      const characterCacheStatus = await universalAssetPreloader.areCharacterAssetsCached(transformedData);
      const videoCacheStatus = await universalAssetPreloader.areVideoAssetsCached([
        { url: VIDEO_ASSETS.characterSelectBackground, name: 'character_select_background', type: 'video' }
      ]);
      
      console.log(`📦 Character assets cache status:`, characterCacheStatus);
      console.log(`📹 Video assets cache status:`, videoCacheStatus);
      
      // If not all assets are cached, download them
      if (!characterCacheStatus.cached || !videoCacheStatus.cached) {
        console.log(`📦 Need to download missing assets - Characters: ${characterCacheStatus.missing}, Videos: ${videoCacheStatus.missing}`);
        await downloadAllAssets(transformedData);
      }
      
      // Transform data to use cached paths (including videos)
      let dataWithCachedPaths = universalAssetPreloader.transformCharacterDataWithCache(transformedData);
      dataWithCachedPaths = universalAssetPreloader.transformVideoDataWithCache(dataWithCachedPaths);
      
      setCharactersData(dataWithCachedPaths);
      
      // Set the actually selected character from backend for display
      const actuallySelectedCharacter = characterService.getSelectedCharacter(dataWithCachedPaths);
      if (actuallySelectedCharacter) {
        setSelectedHero(actuallySelectedCharacter.character_name);
        console.log(`✅ Actually selected character from backend: ${actuallySelectedCharacter.character_name}`);
      } else {
        const firstHero = Object.keys(dataWithCachedPaths)[0];
        if (firstHero) {
          setSelectedHero(firstHero);
          console.log(`📍 No selected character in backend, showing first for viewing: ${firstHero}`);
        }
      }
      
      return dataWithCachedPaths;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load characters:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const downloadAllAssets = useCallback(async (charactersData) => {
    try {
      setAssetsLoading(true);
      setAssetsProgress({ loaded: 0, total: 0, progress: 0 });
      
      console.log('📦 Starting all assets download (videos + character assets)...');
      
      // ✅ Step 1: Download video assets first (high priority)
      console.log('📹 Step 1: Downloading video assets...');
      const videoAssets = [
        {
          url: VIDEO_ASSETS.characterSelectBackground,
          name: 'character_select_background',
          type: 'video',
          category: 'ui_videos',
          priority: 'high'
        }
      ];
      
      const videoResult = await universalAssetPreloader.downloadVideoAssets(
        videoAssets,
        // Overall video progress (20% of total progress)
        (progress) => {
          setAssetsProgress(prev => ({
            ...prev,
            loaded: progress.loaded,
            total: progress.total + 50, // Estimate total including character assets
            progress: progress.progress * 0.2, // Videos take 20% of total
            currentAsset: { 
              name: 'Background Video', 
              type: 'video',
              progress: progress.progress 
            }
          }));
        },
        // Individual video asset progress
        (assetProgress) => {
          console.log(`📹 Downloading video: ${assetProgress.name} - ${Math.round(assetProgress.progress * 100)}%`);
        }
      );
      
      if (videoResult.success) {
        console.log(`📹 Video download completed: ${videoResult.downloaded}/${videoResult.total}`);
      }
      
      // ✅ Step 2: Download character assets
      console.log('📦 Step 2: Downloading character assets...');
      const characterResult = await universalAssetPreloader.downloadCharacterAssets(
        charactersData,
        // Overall character progress (80% of remaining progress)
        (progress) => {
          setAssetsProgress(prev => ({
            ...prev,
            loaded: (videoResult.downloaded || 0) + progress.loaded,
            total: (videoResult.total || 0) + progress.total,
            progress: 0.2 + (progress.progress * 0.8), // Characters take 80% after videos
            successCount: (videoResult.downloaded || 0) + progress.successCount,
            currentAsset: progress.currentAsset
          }));
        },
        // Individual character asset progress
        (assetProgress) => {
          console.log(`📦 Downloading ${assetProgress.characterName} - ${assetProgress.name}: ${Math.round(assetProgress.progress * 100)}%`);
        }
      );
      
      if (characterResult.success) {
        console.log(`📦 Character assets download completed: ${characterResult.downloaded}/${characterResult.total}`);
        
        if (characterResult.failedAssets.length > 0) {
          console.warn(`⚠️ Failed to download ${characterResult.failedAssets.length} character assets:`, characterResult.failedAssets);
        }
      }
      
      // ✅ Combined result
      const totalDownloaded = (videoResult.downloaded || 0) + (characterResult.downloaded || 0);
      const totalAssets = (videoResult.total || 0) + (characterResult.total || 0);
      
      console.log(`✅ All assets download completed: ${totalDownloaded}/${totalAssets}`);
      
      return {
        success: videoResult.success && characterResult.success,
        videoResult,
        characterResult,
        totalDownloaded,
        totalAssets
      };
      
    } catch (error) {
      console.error('❌ Error downloading all assets:', error);
      setError(`Failed to download assets: ${error.message}`);
      throw error;
    } finally {
      setAssetsLoading(false);
    }
  }, []);




  const downloadCharacterAssets = useCallback(async (charactersData) => {
    try {
      setAssetsLoading(true);
      setAssetsProgress({ loaded: 0, total: 0, progress: 0 });
      
      console.log('📦 Starting character asset download...');
      
      const result = await universalAssetPreloader.downloadCharacterAssets(
        charactersData,
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
          console.log(`📦 Downloading ${assetProgress.characterName} - ${assetProgress.name}: ${Math.round(assetProgress.progress * 100)}%`);
        }
      );
      
      if (result.success) {
        console.log(`✅ Successfully downloaded ${result.downloaded}/${result.total} character assets`);
        
        if (result.failedAssets.length > 0) {
          console.warn(`⚠️ Failed to download ${result.failedAssets.length} assets:`, result.failedAssets);
        }
      } else {
        throw new Error('Failed to download character assets');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error downloading character assets:', error);
      setError(`Failed to download assets: ${error.message}`);
      throw error;
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  const refreshAssets = useCallback(async () => {
    if (Object.keys(charactersData).length > 0) {
      console.log('🔄 Refreshing all assets (videos + characters)...');
      
      // Clear both character and video caches
      await universalAssetPreloader.clearCategoryCache('characters');
      await universalAssetPreloader.clearCategoryCache('ui_videos');
      
      // Re-download all assets
      await downloadAllAssets(charactersData);
      
      // Reload characters with new cached paths
      await loadCharacters();
    }
  }, [charactersData, downloadAllAssets, loadCharacters]);

   const downloadVideoAssets = useCallback(async () => {
    try {
      setAssetsLoading(true);
      
      const videoAssets = [
        {
          url: VIDEO_ASSETS.characterSelectBackground,
          name: 'character_select_background',
          type: 'video',
          category: 'ui_videos',
          priority: 'high'
        }
      ];
      
      const result = await universalAssetPreloader.downloadVideoAssets(
        videoAssets,
        (progress) => {
          setAssetsProgress({
            loaded: progress.loaded,
            total: progress.total,
            progress: progress.progress,
            currentAsset: { name: 'Background Video', type: 'video' }
          });
        }
      );
      
      return result;
    } catch (error) {
      console.error('❌ Error downloading video assets:', error);
      throw error;
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  const isVideoAssetCached = useCallback(async () => {
    const videoCacheStatus = await universalAssetPreloader.areVideoAssetsCached([
      { url: VIDEO_ASSETS.characterSelectBackground, name: 'character_select_background', type: 'video' }
    ]);
    return videoCacheStatus.cached;
  }, []);


  const purchaseCharacter = useCallback(async (heroToPurchase) => { // ✅ CHANGED: Expects the full hero object now
    try {
      setPurchasing(true);
      setError(null);
      
      // ✅ CHANGED: No need to look up the hero, we receive the full object directly.
      const hero = heroToPurchase;
      if (!hero) {
        throw new Error('Character not found');
      }

      if (hero.is_purchased) {
        throw new Error('Character already purchased');
      }

      console.log(`💰 Purchasing character: ${hero.character_name} (Player ID: ${playerId}, Character Shop ID: ${hero.characterShopId})`);
      
      const response = await characterService.purchaseCharacter(playerId, hero.characterShopId);
      
      console.log(`✅ Purchase successful:`, response);
      
      // Reload characters to get updated data from server
      await loadCharacters();
      
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error purchasing character:', err);
      throw err;
    } finally {
      setPurchasing(false);
    }
  }, [playerId, loadCharacters]);
  
  // Select character - This actually calls the API and updates backend
  const selectCharacter = useCallback(async (heroName) => {
    try {
      setSelecting(true);
      setError(null);
      
      const hero = charactersData[heroName];
      if (!hero) {
        throw new Error('Character not found');
      }

      if (!hero.is_purchased) {
        throw new Error('Character must be purchased first');
      }

      if (hero.is_selected) {
        throw new Error('Character is already selected');
      }

      console.log(`🎯 Selecting character: ${heroName} (Player ID: ${playerId}, Character ID: ${hero.character_id})`);
      
      // Call API to select character
      const response = await characterService.selectCharacter(playerId, hero.character_id);
      
      console.log(`✅ Character ${heroName} selected successfully:`, response);
      
      // Reload characters to get updated selection state from server
      await loadCharacters();
      
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error selecting character:', err);
      throw err;
    } finally {
      setSelecting(false);
    }
  }, [charactersData, playerId, loadCharacters]);

  // Change displayed character (for viewing, not selecting)
  const changeDisplayedCharacter = useCallback((heroName) => {
    if (charactersData[heroName]) {
      setSelectedHero(heroName);
      console.log(`👁️ Changed displayed character to: ${heroName}`);
    }
  }, [charactersData]);

  // Get current hero data (what's being displayed)
  const getCurrentHero = useCallback(() => {
    return charactersData[selectedHero] || null;
  }, [charactersData, selectedHero]);

  // Get actually selected hero from backend
  const getActuallySelectedHero = useCallback(() => {
    return characterService.getSelectedCharacter(charactersData);
  }, [charactersData]);

  // Get purchased heroes
  const getPurchasedHeroes = useCallback(() => {
    return characterService.getPurchasedCharacters(charactersData);
  }, [charactersData]);

  // Get available heroes
  const getAvailableHeroes = useCallback(() => {
    return characterService.getAvailableCharacters(charactersData);
  }, [charactersData]);

  // Get hero names
  const getHeroNames = useCallback(() => {
    return Object.keys(charactersData);
  }, [charactersData]);

  // Check if character is purchased
  const isCharacterPurchased = useCallback((heroName) => {
    const hero = charactersData[heroName];
    return hero ? hero.is_purchased : false;
  }, [charactersData]);

  // Check if character is actually selected in backend
  const isCharacterSelected = useCallback((heroName) => {
    const hero = charactersData[heroName];
    return hero ? hero.is_selected : false;
  }, [charactersData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  return {
    // Data
    charactersData,
    selectedHero, 
    currentHero: getCurrentHero(),
    actuallySelectedHero: getActuallySelectedHero(), 
    
    // States
    loading,
    error,
    purchasing,
    selecting,
    assetsLoading,
    assetsProgress, 
    userCoins,    
      // Actions
    loadCharacters,
    purchaseCharacter,
    selectCharacter,
    changeDisplayedCharacter,
    downloadCharacterAssets,
    downloadAllAssets, 
    downloadVideoAssets,
    refreshAssets,
    clearError,
    
    
    // Getters
    getPurchasedHeroes,
    getAvailableHeroes,
    getHeroNames,
    isCharacterPurchased,
    isCharacterSelected,
    isVideoAssetCached,
  };
};

export default useCharacterSelection;