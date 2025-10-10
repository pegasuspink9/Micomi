import { apiService } from './api';

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

  // Transform API data to match component structure
  transformPlayerData: (apiData) => {
    // Get selected character from owned characters
    const selectedCharacter = apiData.ownedCharacters?.find(char => char.is_selected);
    
    // Transform potions data
    const transformedPotions = apiData.ownedPotions?.map(item => ({
      id: item.player_potion_id,
      name: playerService.getPotionDisplayName(item.potion.potion_type),
      count: item.quantity,
      icon: item.potion.potion_url || playerService.getDefaultPotionIcon(item.potion.potion_type),
      color: playerService.getPotionColor(item.potion.potion_type),
      type: item.potion.potion_type,
      description: item.potion.potion_description,
      price: item.potion.potion_price
    })) || [];

    // Transform badges/achievements data - Updated to use API badge_icon
    const transformedBadges = apiData.playerAchievements?.map(achievement => ({
      id: achievement.achievement_id,
      name: achievement.achievement_name,
      description: achievement.description,
      // Use badge_icon from API, fallback to default if null
      icon: achievement.badge_icon || playerService.getDefaultBadgeIcon(achievement.achievement_name),
      earned: achievement.is_owned,
      earnedDate: achievement.earned_at ? new Date(achievement.earned_at).toISOString().split('T')[0] : null,
      conditions: achievement.conditions
    })) || [];

    // Transform quests data
    const transformedQuests = apiData.playerQuests?.map(quest => ({
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
      created_at: quest.created_at
    })) || [];

    return {
      heroSelected: {
        name: selectedCharacter?.character.character_name || "No Character",
        avatar: selectedCharacter?.character.character_image_display || "https://github.com/user-attachments/assets/eced9b8f-eae0-48f5-bc05-d8d5ce018529",
      },
      playerName: apiData.player_name,
      username: `@${apiData.username}`,
      coins: apiData.coins,
      daysLogin: apiData.totalActiveMaps || 0, // Using total active maps as a substitute
      currentStreak: apiData.current_streak,
      expPoints: apiData.exp_points,
      mapsOpened: apiData.totalActiveMaps,
      badges: transformedBadges,
      quests: transformedQuests,
      potions: transformedPotions,
      statsIcons: {
        coins: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        daysLogin: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        currentStreak: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        expPoints: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
        mapsOpened: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd"
      },
      background: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759900156/474821932-3bc21bd9-3cdc-48f5-ac18-dbee09e6368c_1_twmle9.png',
      containerBackground: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg'
    };
  },

  // Helper functions
  getPotionDisplayName: (potionType) => {
    const typeMap = {
      'health': 'Health',
      'freeze': 'Freeze',
      'hint': 'Hint',
      'mana': 'Mana',
      'strength': 'Strength',
      'speed': 'Speed'
    };
    return typeMap[potionType] || potionType.charAt(0).toUpperCase() + potionType.slice(1);
  },

  getPotionColor: (potionType) => {
    const colorMap = {
      'health': '#ff4444',
      'freeze': '#4444ff',
      'hint': '#00ff00',
      'mana': '#4444ff',
      'strength': '#ff8800',
      'speed': '#00ff88'
    };
    return colorMap[potionType] || '#888888';
  },

  getDefaultPotionIcon: (potionType) => {
    const iconMap = {
      'health': "https://github.com/user-attachments/assets/1fb726a5-f63d-44f4-8e33-8d9c961940ff",
      'freeze': "https://github.com/user-attachments/assets/ff2e041c-9f7b-438c-91e6-1f371cfe1966",
      'hint': "https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297",
      'mana': "https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297",
      'strength': "https://github.com/user-attachments/assets/3264eb79-0afd-4987-8c64-6d46b0fc03a0"
    };
    return iconMap[potionType] || "https://github.com/user-attachments/assets/ff2e041c-9f7b-438c-91e6-1f371cfe1966";
  },

  // Updated to provide fallback icons for achievements with null badge_icon
  getDefaultBadgeIcon: (achievementName) => {
    const iconMap = {
      'HTML Hero': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png",
      'CSS Conqueror': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png",
      'JS Juggernaut': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png",
      'Web Wizard': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png",
      'Top 1': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png",
      'Knowledge Keeper': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991977/Knowledge_Keeper_iti1jc.png",
      'Wake and Bake': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991977/Wake_and_Bake_xmqmyd.png",
      'PC Eater': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991975/PC_Eater_wmkvhi.png",
      'Collector': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png",
      'Master Beater': "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991975/PC_Eater_wmkvhi.png"
    };
    return iconMap[achievementName] || "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png";
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