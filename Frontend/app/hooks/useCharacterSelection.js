import { useState, useEffect, useCallback } from 'react';
import { characterService } from '../services/characterService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';


export const useCharacterSelection = (playerId = 11) => { 
  const [charactersData, setCharactersData] = useState({});
  const [selectedHero, setSelectedHero] = useState(''); // This is for display/viewing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsProgress, setAssetsProgress] = useState({ loaded: 0, total: 0, progress: 0 });
  
  const loadCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🦸‍♂️ Loading player characters for player ID: ${playerId}...`);
      
      // First, load cached assets
      await universalAssetPreloader.loadCachedAssets('characters');
      
      // Get character data from API
      const apiData = await characterService.getPlayerCharacters(playerId);
      const transformedData = characterService.transformCharacterData(apiData);
      
      // Check if assets are cached
      const cacheStatus = await universalAssetPreloader.areCharacterAssetsCached(transformedData);
      console.log(`📦 Asset cache status:`, cacheStatus);
      
      // If not all assets are cached, download them
      if (!cacheStatus.cached) {
        console.log(`📦 Need to download ${cacheStatus.missing} missing assets`);
        await downloadCharacterAssets(transformedData);
      }
      
      // Transform data to use cached paths
      const dataWithCachedPaths = universalAssetPreloader.transformCharacterDataWithCache(transformedData);
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

   // Force refresh assets
    const refreshAssets = useCallback(async () => {
    if (Object.keys(charactersData).length > 0) {
      console.log('🔄 Refreshing character assets...');
      // Clear current cache and re-download
      await universalAssetPreloader.clearCategoryCache('characters');
      await downloadCharacterAssets(charactersData);
      
      // Reload characters with new cached paths
      await loadCharacters();
    }
  }, [charactersData, downloadCharacterAssets, loadCharacters]);


  // Purchase character
 const purchaseCharacter = useCallback(async (heroName) => {
    try {
      setPurchasing(true);
      setError(null);
      
      const hero = charactersData[heroName];
      if (!hero) {
        throw new Error('Character not found');
      }

      if (hero.is_purchased) {
        throw new Error('Character already purchased');
      }

      console.log(`💰 Purchasing character: ${heroName} (Player ID: ${playerId}, Character Shop ID: ${hero.characterShopId})`);
      
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
  }, [charactersData, playerId, loadCharacters]);
  
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
    
      // Actions
    loadCharacters,
    purchaseCharacter,
    selectCharacter,
    changeDisplayedCharacter,
    downloadCharacterAssets,
    refreshAssets,
    clearError,
    
    
    // Getters
    getPurchasedHeroes,
    getAvailableHeroes,
    getHeroNames,
    isCharacterPurchased,
    isCharacterSelected,
  };
};

export default useCharacterSelection;