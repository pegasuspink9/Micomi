import { apiService } from './api';

export const characterService = {
  // Get player characters - Updated endpoint
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

  // Purchase character - Updated to use correct endpoint
  purchaseCharacter: async (playerId, characterShopId) => {
    try {
      const response = await apiService.post(`/game/buy-character/${playerId}`, {
        characterShopId: characterShopId
      });
      console.log(`💰 Character purchase response for Player ID ${playerId}, Character Shop ID ${characterShopId}:`, response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to purchase character:', error);
      throw error;
    }
  },
  
  // Select character
  selectCharacter: async (playerId, characterId) => {
    try {
      const response = await apiService.post(`/shop/select-character/${playerId}/${characterId}`);
      console.log(`✅ Character selection response for Player ID ${playerId}, Character ID ${characterId}:`, response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to select character:', error);
      throw error;
    }
  },

  // Transform API data to match component structure - Updated for new response format
  transformCharacterData: (apiData) => {
    const transformedData = {};
    
    apiData.forEach(item => {
      const character = item.character;
      const heroName = character.character_name;
      
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
        character_price: character.character_price || 0, // Add character price from API
        character_avatar: character.character_avatar,
        damageIcon: characterService.getDamageIcon(character.character_type),
        character_image_display: character.character_image_display,
        character_hero_lottie: character.hero_lottie,
        heroLottieStyle: {
          width: 375 * 1.4, // screenWidth * 1.4
          height: 812 * 1.4, // screenHeight * 1.4
        },
        is_purchased: item.is_purchased,
        is_selected: item.is_selected,
        weapon_name: character.weapon_name,
        weapon_skill: character.weapon_skill,
        user_coins: character.user_coins,
        character_attacks: character.character_attacks || [],
        character_run: character.character_run,
        character_dies: character.character_dies,
        character_hurt: character.character_hurt,
        avatar_image: character.avatar_image,
        // Store characterShopId for purchase (same as character_id based on your requirement)
        characterShopId: character.character_id
      };
    });
    
    return transformedData;
  },

  // Get role icon based on character type
  getRoleIcon: (characterType) => {
    const roleIcons = {
      "Assasin": "https://github.com/user-attachments/assets/d95f6009-ac83-4c34-a486-96b332bf39e4",
      "Assassin": "https://github.com/user-attachments/assets/d95f6009-ac83-4c34-a486-96b332bf39e4",
      "Tank": "https://github.com/user-attachments/assets/36859900-5dc8-45b3-91e6-fb3820f215e1",
      "Mage": "https://github.com/user-attachments/assets/927e2303-ecb2-4009-b64e-1160758f3c1b",
      "Marksman": "https://github.com/user-attachments/assets/38e408df-acdc-4d46-abcc-29bb6f28ab59",
      "Archer": "https://github.com/user-attachments/assets/38e408df-acdc-4d46-abcc-29bb6f28ab59"
    };
    return roleIcons[characterType] || roleIcons["Assasin"];
  },

  // Get damage icon based on character type
  getDamageIcon: (characterType) => {
    const damageIcons = {
      "Assasin": "https://github.com/user-attachments/assets/cbb414c2-500e-46be-ab09-fcc8fb7c636e",
      "Assassin": "https://github.com/user-attachments/assets/cbb414c2-500e-46be-ab09-fcc8fb7c636e",
      "Tank": "https://github.com/user-attachments/assets/d2ad1452-beaf-4e76-b263-99f407002354",
      "Mage": "https://github.com/user-attachments/assets/595c45b0-d3e4-48f6-acd6-983542c128ec",
      "Marksman": "https://github.com/user-attachments/assets/f41a9cf8-f03d-418a-8d33-af113d326d91",
      "Archer": "https://github.com/user-attachments/assets/f41a9cf8-f03d-418a-8d33-af113d326d91"
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