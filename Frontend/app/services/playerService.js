import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const playerService = {
  // Get player profile data
  getPlayerProfile: async (playerId) => {
    try {
      const response = await apiService.get(`/player/profile/${playerId}`);
      console.log('👤 Player profile fetched:', response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch player profile:', error);
      throw error;
    }
  },

  selectBadge: async (playerId, achievementId) => {
    try {
      console.log(`🎖️ Selecting badge ${achievementId} for player ${playerId}...`);
      
      const response = await apiService.post(`/game/select-badge/${playerId}/${achievementId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to select badge');
      }
      
      await AsyncStorage.setItem('badge_selection_updated', Date.now().toString());
      console.log('💾 Badge selection update saved to storage');

      console.log(`🎖️ Badge ${achievementId} selected successfully`);
      return response;
    } catch (error) {
      console.error(`Failed to select badge ${achievementId}:`, error);
      throw error;
    }
  },

  getLastBadgeUpdate: async () => {
    try {
      const timestamp = await AsyncStorage.getItem('badge_selection_updated');
      return timestamp ? parseInt(timestamp) : 0;
    } catch (error) {
      console.error('Failed to get badge selection update time:', error);
      return 0;
    }
  },

  //  UPDATED: Include all raw URLs for cache transformation
  transformPlayerData: (apiData) => {
    const selectedCharacter = apiData.ownedCharacters?.find(char => char.is_selected);

    const selectedBadge = apiData.selectedBadge ? {
      achievement_id: apiData.selectedBadge.achievement_id,
      achievement_name: apiData.selectedBadge.achievement_name,
      description: apiData.selectedBadge.description,
      landscape_image: apiData.selectedBadge.landscape_image, //  Raw URL for cache lookup
      earned_at: apiData.selectedBadge.earned_at
    } : null;
    
    //  Transform potions with raw URLs
    const transformedPotions = apiData.ownedPotions?.map(item => ({
      id: item.player_potion_id,
      name: playerService.getPotionDisplayName(item.potion.potion_type),
      count: item.quantity,
      icon: item.potion.potion_url, //  Raw URL for cache lookup
      color: playerService.getPotionColor(item.potion.potion_type),
      type: item.potion.potion_type,
      description: item.potion.potion_description,
      price: item.potion.potion_price
    })) || [];

    //  Transform badges with raw URLs from API
    const transformedBadges = apiData.playerAchievements?.map(achievement => ({
      id: achievement.achievement_id,
      name: achievement.achievement_name,
      description: achievement.description,
      icon: achievement.badge_icon, //  Raw URL for cache lookup
      landscape_image: achievement.landscape_image, //  Raw URL for cache lookup
      earned: achievement.is_owned,
      earnedDate: achievement.earned_at ? new Date(achievement.earned_at).toISOString().split('T')[0] : null,
      conditions: achievement.conditions
    })) || [];

    // Transform quests data
    const transformedQuests = playerService.transformQuests(apiData.quests);

    return {
      heroSelected: {
        name: selectedCharacter?.character.character_name || "No Character",
        character_image_display: selectedCharacter?.character.character_image_display || "https://github.com/user-attachments/assets/eced9b8f-eae0-48f5-bc05-d8d5ce018529",
      },
      playerName: apiData.player_name,
      username: apiData.username, 
      selectedBadge: selectedBadge,
      playerLevel: apiData.player_level,
      coins: apiData.coins,
      daysLogin: apiData.totalActiveMaps || 0,
      currentStreak: apiData.current_streak,
      expPoints: apiData.exp_points,
      mapsOpened: apiData.totalActiveMaps,
      badges: transformedBadges,
      quests: transformedQuests,
      potions: transformedPotions,
      //  Raw URLs for stats icons (same as Map API)
      statsIcons: {
        coins: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        daysLogin: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        currentStreak: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        expPoints: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        mapsOpened: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd"
      },
      //  Raw URLs for backgrounds
      background: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759900156/474821932-3bc21bd9-3cdc-48f5-ac18-dbee09e6368c_1_twmle9.png',
      containerBackground: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg'
    };
  },

  //  NEW: Transform quests from API structure
  transformQuests: (questsData) => {
    if (!questsData) return [];
    
    const allQuests = [
      ...(questsData.dailyQuests || []),
      ...(questsData.weeklyQuests || []),
      ...(questsData.monthlyQuests || [])
    ];

    return allQuests.map(quest => ({
      id: quest.quest_id,
      title: quest.title,
      description: quest.description,
      progress: quest.current_value,
      total: quest.target_value,
      type: playerService.getQuestType(quest.objective_type),
      reward_coins: quest.reward_coins,
      reward_exp: quest.reward_exp,
      is_completed: quest.is_completed,
      is_claimed: quest.is_claimed,
      created_at: quest.created_at,
      quest_period: quest.quest_period
    }));
  },

  // Helper functions (unchanged)
  getPotionDisplayName: (potionType) => {
    const typeMap = {
      'health': 'Health',
      'freeze': 'Freeze',
      'hint': 'Hint',
      'mana': 'Mana',
      'strength': 'Strength',
      'strong': 'Strong',
      'speed': 'Speed'
    };
    return typeMap[potionType] || potionType.charAt(0).toUpperCase() + potionType.slice(1);
  },

  getPotionColor: (potionType) => {
    const colorMap = {
      'health': '#ff4444',
      'freeze': '#4444ffb4',
      'hint': '#054d0571',
      'mana': '#4444ff',
      'strength': '#ff8800',
      'strong': '#ff8800',
      'speed': '#00ff88'
    };
    return colorMap[potionType] || '#888888';
  },

  getDefaultPotionIcon: (potionType) => {
    const iconMap = {
      'health': "https://micomi-assets.me/Icons/Potions/health.png",
      'freeze': "https://micomi-assets.me/Icons/Potions/ice.png",
      'hint': "https://micomi-assets.me/Icons/Potions/hint.png",
      'strong': "https://micomi-assets.me/Icons/Potions/strong.png",
      'mana': "https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297",
      'strength': "https://github.com/user-attachments/assets/3264eb79-0afd-4987-8c64-6d46b0fc03a0"
    };
    return iconMap[potionType] || "https://github.com/user-attachments/assets/ff2e041c-9f7b-438c-91e6-1f371cfe1966";
  },

  getDefaultBadgeIcon: (achievementName) => {
    // Now using actual URLs from API, this is just fallback
    return "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png";
  },

  getQuestType: (objectiveType) => {
    const typeMap = {
      'defeat_enemy': 'daily',
      'defeat_boss': 'weekly',
      'buy_potion': 'daily',
      'unlock_character': 'main',
      'complete_lesson': 'daily',
      'solve_challenge': 'daily',
      'earn_exp': 'weekly',
      'spend_coins': 'daily',
      'reach_level': 'main',
      'login_days': 'daily',
      'use_potion': 'daily'
    };
    return typeMap[objectiveType] || 'daily';
  }
};