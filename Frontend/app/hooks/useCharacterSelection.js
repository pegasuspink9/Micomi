import { useState, useEffect, useCallback } from 'react';
import { characterService } from '../services/characterService';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';

export const useCharacterSelection = (playerId = 11) => { 
  const [charactersData, setCharactersData] = useState({});
  const [selectedHero, setSelectedHero] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  
  const loadCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🦸‍♂️ Loading player characters for player ID: ${playerId}...`);
      
      // ✅ Load ALL cached assets from Map API preload into memory
      console.log('📦 Loading cached assets into memory...');
      await Promise.all([
        universalAssetPreloader.loadCachedAssets('game_animations'),
        universalAssetPreloader.loadCachedAssets('game_images'),
        universalAssetPreloader.loadCachedAssets('characters'),
        universalAssetPreloader.loadCachedAssets('ui_videos'),
        universalAssetPreloader.loadCachedAssets('character_select_ui'),
      ]);
      
      // Get character data from API
      const apiData = await characterService.getPlayerCharacters(playerId);
      const { characters: transformedData, userCoins: fetchedUserCoins } = characterService.transformCharacterData(apiData);
      setUserCoins(fetchedUserCoins);

      // ✅ Transform data to use cached paths (everything should already be cached from Map API preload)
      const dataWithCachedPaths = universalAssetPreloader.transformCharacterShopDataWithMapCache(transformedData);
      
      setCharactersData(dataWithCachedPaths);
      
      // Set the actually selected character from backend for display
      const actuallySelectedCharacter = characterService.getSelectedCharacter(dataWithCachedPaths);
      if (actuallySelectedCharacter) {
        setSelectedHero(actuallySelectedCharacter.character_name);
        console.log(`✅ Selected character from backend: ${actuallySelectedCharacter.character_name}`);
      } else {
        const firstHero = Object.keys(dataWithCachedPaths)[0];
        if (firstHero) {
          setSelectedHero(firstHero);
          console.log(`📍 No selected character, showing first: ${firstHero}`);
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

  const purchaseCharacter = useCallback(async (heroToPurchase) => {
    try {
      setPurchasing(true);
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
      
      await loadCharacters();
      
      return response;
    } catch (err) {
      console.log('Purchase transaction info:', err.message);
      throw err;
    } finally {
      setPurchasing(false);
    }
  }, [playerId, loadCharacters]);
  
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
      
      const response = await characterService.selectCharacter(playerId, hero.character_id);
      
      console.log(`✅ Character ${heroName} selected successfully:`, response);
      
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

  const changeDisplayedCharacter = useCallback((heroName) => {
    if (charactersData[heroName]) {
      setSelectedHero(heroName);
      console.log(`👁️ Changed displayed character to: ${heroName}`);
    }
  }, [charactersData]);

  const getCurrentHero = useCallback(() => {
    return charactersData[selectedHero] || null;
  }, [charactersData, selectedHero]);

  const getActuallySelectedHero = useCallback(() => {
    return characterService.getSelectedCharacter(charactersData);
  }, [charactersData]);

  const getPurchasedHeroes = useCallback(() => {
    return characterService.getPurchasedCharacters(charactersData);
  }, [charactersData]);

  const getAvailableHeroes = useCallback(() => {
    return characterService.getAvailableCharacters(charactersData);
  }, [charactersData]);

  const getHeroNames = useCallback(() => {
    return Object.keys(charactersData);
  }, [charactersData]);

  const isCharacterPurchased = useCallback((heroName) => {
    const hero = charactersData[heroName];
    return hero ? hero.is_purchased : false;
  }, [charactersData]);

  const isCharacterSelected = useCallback((heroName) => {
    const hero = charactersData[heroName];
    return hero ? hero.is_selected : false;
  }, [charactersData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  return {
    charactersData,
    selectedHero, 
    currentHero: getCurrentHero(),
    actuallySelectedHero: getActuallySelectedHero(), 
    
    loading,
    error,
    purchasing,
    selecting,
    userCoins,    
    
    loadCharacters,
    purchaseCharacter,
    selectCharacter,
    changeDisplayedCharacter,
    clearError,
    
    getPurchasedHeroes,
    getAvailableHeroes,
    getHeroNames,
    isCharacterPurchased,
    isCharacterSelected,
  };
};

export default useCharacterSelection;