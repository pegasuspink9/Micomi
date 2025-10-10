import { useState, useEffect, useCallback } from 'react';
import { characterService } from '../services/characterService';

export const useCharacterSelection = (playerId = 11) => { 
  const [charactersData, setCharactersData] = useState({});
  const [selectedHero, setSelectedHero] = useState(''); // This is for display/viewing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const loadCharacters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🦸‍♂️ Loading player characters for player ID: ${playerId}...`);
      const apiData = await characterService.getPlayerCharacters(playerId);
      const transformedData = characterService.transformCharacterData(apiData);
      
      setCharactersData(transformedData);
      
      // Set the actually selected character from backend for display
      const actuallySelectedCharacter = characterService.getSelectedCharacter(transformedData);
      if (actuallySelectedCharacter) {
        setSelectedHero(actuallySelectedCharacter.character_name);
        console.log(`✅ Actually selected character from backend: ${actuallySelectedCharacter.character_name}`);
      } else {
        // If no character is selected in backend, show first available for viewing
        const firstHero = Object.keys(transformedData)[0];
        if (firstHero) {
          setSelectedHero(firstHero);
          console.log(`📍 No selected character in backend, showing first for viewing: ${firstHero}`);
        }
      }
      
      return transformedData;
    } catch (err) {
      setError(err.message);
      console.error('Failed to load characters:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

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
    selectedHero, // This is what's being displayed/viewed
    currentHero: getCurrentHero(),
    actuallySelectedHero: getActuallySelectedHero(), // This is what's actually selected in backend
    
    // States
    loading,
    error,
    purchasing,
    selecting,
    
    // Actions
    loadCharacters,
    purchaseCharacter,
    selectCharacter, // This calls the API to actually select
    changeDisplayedCharacter, // This just changes what's being viewed
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