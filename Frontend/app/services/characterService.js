import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const characterService = {
  // Get player characters
  getPlayerCharacters: async (playerId) => {
    try {
      const response = await apiService.get(`/shop/player-characters/${playerId}`);
      console.log('🦸‍♂️ Player characters fetched:', response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch player characters:', error);
      throw error;
    }
  },

  
 purchaseCharacter: async (playerId, characterShopId) => {
    try {
      const response = await apiService.post(`/game/buy-character/${playerId}`, {
        characterShopId: characterShopId
      });
      console.log(`💰 Character purchase response for Player ID ${playerId}, Character Shop ID ${characterShopId}:`, response);

      if (response.data && typeof response.data.message === 'string') {
          if (response.data.message === "Not enough coins" || 
              response.data.message === "Character already purchased") {
            // Treat these as application-level errors to be displayed in the modal
            throw new Error(response.data.message);
          }
      }
      
      if (!response.success) {
        throw new Error(response.message || 'The purchase could not be completed due to an API error.');
      }
      return response.data;

    } catch (error) {
      let errorMessage = 'An unexpected error occurred during purchase.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message; 
      } else if (error.message) {
        errorMessage = error.message; 
      }
      
      console.log(`Purchase API result: "${errorMessage}"`);
      throw new Error(errorMessage); // Re-throw with the extracted message
    }
  },
  
    // Select character
    selectCharacter: async (playerId, characterId) => {
    try {
      const response = await apiService.post(`/shop/select-character/${playerId}/${characterId}`);
      console.log(`✅ Character selection response for Player ID ${playerId}, Character ID ${characterId}:`, response);
      
      if (response.success) {
        await AsyncStorage.setItem('character_selection_updated', Date.now().toString());
        console.log('💾 Character selection saved to storage');
      }
      
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to select character:', error);
      throw error;
    }
  },

    getLastSelectionUpdate: async () => {
    try {
      const timestamp = await AsyncStorage.getItem('character_selection_updated');
      return timestamp ? parseInt(timestamp) : 0;
    } catch (error) {
      console.error('Failed to get selection update time:', error);
      return 0;
    }
  },

  // Transform API data to match component structure - FIXED to use correct is_purchased field
  transformCharacterData: (apiData) => {

     if (!apiData || apiData.length === 0) {
      return { characters: {}, userCoins: 0 };
    }

    const userCoins = apiData[0]?.player?.coins || 0;
    const transformedData = {};
    
    apiData.forEach(item => {
      const character = item.character;
      const heroName = character.character_name;
      
      if (!heroName) return; // Skip if a character has no name

      transformedData[heroName] = {
        character_id: character.character_id,
        player_character_id: item.player_character_id,
        character_name: character.character_name,
        character_type: character.character_type,
        roleIcon: characterService.getRoleIcon(character.character_type),
        health: character.health,
        character_damage: Array.isArray(character.character_damage) ? 
          Math.round(character.character_damage.reduce((a, b) => a + b, 0) / character.character_damage.length) : 
          character.character_damage,
        character_price: item.character_price, 
        character_avatar: character.character_avatar,
        damageIcon: characterService.getDamageIcon(character.character_type),
        character_image_display: character.character_image_display,
        character_hero_lottie: character.hero_lottie,
        heroLottieStyle: {
          width: 375 * 1.4,
          height: 812 * 1.4,
        },
        is_purchased: item.is_purchased, // Correctly uses top-level item status
        is_selected: item.is_selected,   // Correctly uses top-level item status
        weapon_name: character.weapon_name,
        weapon_skill: character.weapon_skill,
        character_attacks: character.character_attacks || [],
        character_run: character.character_run,
        character_dies: character.character_dies,
        character_hurt: character.character_hurt,
        avatar_image: character.avatar_image,
        characterShopId: item.character_shop_id,
        character_image_select: character.character_image_select,
      };
    });
    
    // Return both the characters and the user's coins.
    return { characters: transformedData, userCoins };
  },

  // Get role icon based on character type
  getRoleIcon: (characterType) => {
    const roleIcons = {
      "Assasin": "https://micomi-assets.me/Icons%20Shop/473984818-d95f6009-ac83-4c34-a486-96b332bf39e4.png",
      "Assassin": "https://micomi-assets.me/Icons%20Shop/473984818-d95f6009-ac83-4c34-a486-96b332bf39e4.png",
      "Tank": "https://micomi-assets.me/Icons%20Shop/473993721-36859900-5dc8-45b3-91e6-fb3820f215e1.png",
      "Mage": "https://micomi-assets.me/Icons%20Shop/473975865-927e2303-ecb2-4009-b64e-1160758f3c1b.png",
      "Marksman": "https://micomi-assets.me/Icons%20Shop/473999709-38e408df-acdc-4d46-abcc-29bb6f28ab59.png",
    };
    return roleIcons[characterType] || roleIcons["Assasin"];
  },

  // Get damage icon based on character type
  getDamageIcon: (characterType) => {
    const damageIcons = {
      "Assasin": "https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Icons%20Shop/fighterIcon.png",
      "Assassin": "https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Icons%20Shop/fighterIcon.png",
      "Tank": "https://micomi-assets.me/Icons%20Shop/tankIcon.png",
      "Mage": "https://micomi-assets.me/Icons%20Shop/mageIcon.png",
      "Marksman": "https://micomi-assets.me/Icons%20Shop/marksmanIcon.png",
    };
    return damageIcons[characterType] || damageIcons["Assasin"];
  },

  // Helper functions
  getSelectedCharacter: (charactersData) => {
    return Object.values(charactersData).find(hero => hero.is_selected);
  },

  getPurchasedCharacters: (charactersData) => {
    return Object.values(charactersData).filter(hero => hero.is_purchased);
  },

  getAvailableCharacters: (charactersData) => {
    return Object.values(charactersData).filter(hero => !hero.is_purchased);
  }
};