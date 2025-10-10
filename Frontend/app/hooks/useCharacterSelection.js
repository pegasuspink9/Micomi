import { useState, useEffect, useCallback } from 'react';
import { characterService } from '../services/characterService';

export const useCharacterSelection = (playerId = 11) => { 
  const [charactersData, setCharactersData] = useState({});
  const [selectedHero, setSelectedHero] = useState('');
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
      
      // Set selected hero
      const selectedCharacter = characterService.getSelectedCharacter(transformedData);
      if (selectedCharacter) {
        setSelectedHero(selectedCharacter.character_name);
        console.log(`✅ Selected character found: ${selectedCharacter.character_name}`);
      } else {
        const firstHero = Object.keys(transformedData)[0];
        if (firstHero) {
          setSelectedHero(firstHero);
          console.log(`📍 No selected character, defaulting to: ${firstHero}`);
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

  // Purchase character - This might not be needed for player characters
  const purchaseCharacter = useCallback(async (heroName) => {
    try {
      setPurchasing(true);
      setError(null);
      
      const hero = charactersData[heroName];
      if (!hero) {
        throw new Error('Character not found');
      }

      console.log(`💰 Purchasing character: ${heroName} (character ID: ${hero.character_id})`);
      // Note: You might need to update this endpoint for purchasing player characters
      await characterService.purchaseCharacter(hero.character_id);
      
      // Update local state
      setCharactersData(prevData => ({
        ...prevData,
        [heroName]: { ...prevData[heroName], is_purchased: true }
      }));
      
      console.log(`✅ Character ${heroName} purchased successfully`);
      
      // Reload characters to get updated data
      await loadCharacters();
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error purchasing character:', err);
      throw err;
    } finally {
      setPurchasing(false);
    }
  }, [charactersData, loadCharacters]);

  // Select character - Updated to use correct endpoint with playerId and characterId
  const selectCharacter = useCallback(async (heroName) => {
    try {
      setSelecting(true);
      setError(null);
      
      const hero = charactersData[heroName];
      if (!hero) {
        throw new Error('Character not found');
      }

      if (hero.is_purchased) {
        console.log(`🎯 Selecting character: ${heroName} (Player ID: ${playerId}, Character ID: ${hero.character_id})`);
        // Call API to select character with playerId and characterId
        const response = await characterService.selectCharacter(playerId, hero.character_id);
        
        // Update local state
        setCharactersData(prevData => {
          const newData = { ...prevData };
          Object.keys(newData).forEach(key => {
            newData[key] = { ...newData[key], is_selected: key === heroName };
          });
          return newData;
        });
        
        console.log(`✅ Character ${heroName} selected successfully:`, response.message);
      }
      
      // Update selected hero in state (for display purposes)
      setSelectedHero(heroName);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error selecting character:', err);
      // Still update the display even if API call fails
      setSelectedHero(heroName);
      throw err;
    } finally {
      setSelecting(false);
    }
  }, [charactersData, playerId]);

  // Get current hero data
  const getCurrentHero = useCallback(() => {
    return charactersData[selectedHero] || null;
  }, [charactersData, selectedHero]);

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

  // Check if character is selected
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
    
    // States
    loading,
    error,
    purchasing,
    selecting,
    
    // Actions
    loadCharacters,
    purchaseCharacter,
    selectCharacter,
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