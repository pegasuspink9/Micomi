import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import InventoryTabButton from './InventoryTabButton';
import BadgeCard from './BadgeCard';
import PotionCard from './PotionCard';
import PotionDetailModal from '../User Labs/Badge Modal/PotionDetailModal';
import ThemesInventorySection from './ThemesInventorySection';

const InventorySection = ({
  activeTab,
  setActiveTab,
  badges,
  potions,
  themes = [],
  onThemeSelect = () => {},
  onThemePurchase = () => {},
  viewPlayerId
}) => {
  const router = useRouter();
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [isPotionModalVisible, setIsPotionModalVisible] = useState(false);
  const canActOnThemes = !viewPlayerId;
  
  // UPDATED: Sort badges - earned first, then unearned
  const sortedBadges = activeTab === 'Badges' 
    ? [...badges].sort((a, b) => {
        // Earned badges come first (true = 1, false = 0)
        if (a.earned && !b.earned) return -1;
        if (!a.earned && b.earned) return 1;
        return 0;
      })
    : badges;

  const displayItems = activeTab === 'Badges' ? sortedBadges.slice(0, 6) : potions.slice(0, 6);
  const themeItems = themes.slice(0, 6);

  const handleViewAll = () => {
    if (activeTab === 'Badges') {
      router.push({
        pathname: '/Components/User Labs/BadgesView',
        params: viewPlayerId ? { playerId: String(viewPlayerId) } : undefined,
      });
    }
  };

  const handlePotionPress = (potion) => {
    setSelectedPotion(potion);
    setIsPotionModalVisible(true);
  };

  return (
    <View style={styles.inventorySection}>
      <View style={styles.inventoryTabsContainer}>
        <InventoryTabButton 
          label="Badges" 
          isActive={activeTab === 'Badges'} 
          onPress={() => setActiveTab('Badges')} 
        />
        
        <View style={{ width: gameScale(12) }} />

        <InventoryTabButton 
          label="Potions" 
          isActive={activeTab === 'Potions'} 
          onPress={() => setActiveTab('Potions')} 
        />

        <View style={{ width: gameScale(12) }} />

        <InventoryTabButton 
          label="Themes" 
          isActive={activeTab === 'Themes'} 
          onPress={() => setActiveTab('Themes')} 
        />
      </View>

      {activeTab === 'Badges' && (
        <View style={styles.badgesGrid}>
          {displayItems.map((item, index) => {
            const isFirstInRow = index % 3 === 0;
            const isLastInRow = index % 3 === 2;

            return (
              <View key={index} style={styles.badgeGridItem}>
                <View style={[
                  styles.badgeBorderOuter,
                  isFirstInRow && styles.badgeGridItemLeft,
                  isLastInRow && styles.badgeGridItemRight,
                ]}>
                  <View style={[
                    styles.badgeBorderMiddle,
                    isFirstInRow && styles.badgeGridItemLeft,
                    isLastInRow && styles.badgeGridItemRight,
                  ]}>
                    <LinearGradient
                      colors={['#37575fcd', '#477176cd']}
                      style={[
                        styles.badgeContent,
                        isFirstInRow && styles.badgeGridItemLeft,
                        isLastInRow && styles.badgeGridItemRight,
                      ]}
                    >
                      <BadgeCard badge={item} />
                    </LinearGradient>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {activeTab === 'Potions' && (
        <View style={styles.potionsGrid}>
          {displayItems.map((item, index) => {
            const isFirstInRow = index % 3 === 0;
            const isLastInRow = index % 3 === 2;

            return (
              <TouchableOpacity
                key={item.id ?? index}
                style={styles.potionGridItem}
                activeOpacity={0.85}
                onPress={() => handlePotionPress(item)}
              >
                <View style={[
                  styles.potionBorderOuter,
                  isFirstInRow && styles.potionGridItemLeft,
                  isLastInRow && styles.potionGridItemRight,
                ]}>
                  <View style={[
                    styles.potionBorderMiddle,
                    isFirstInRow && styles.potionGridItemLeft,
                    isLastInRow && styles.potionGridItemRight,
                  ]}>
                    <View style={[
                      styles.potionContent,
                      isFirstInRow && styles.potionGridItemLeft,
                      isLastInRow && styles.potionGridItemRight,
                    ]}>
                      <PotionCard potion={item} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activeTab === 'Themes' && (
        <ThemesInventorySection
          themes={themeItems}
          canActOnThemes={canActOnThemes}
          onThemeSelect={onThemeSelect}
          onThemePurchase={onThemePurchase}
        />
      )}

      {activeTab === 'Badges' && (
        <TouchableOpacity onPress={handleViewAll} activeOpacity={0.9} style={styles.bottomViewAllButton}>
          <Text style={styles.bottomViewAllText}>View All {activeTab}</Text>
        </TouchableOpacity>
      )}

      <PotionDetailModal
        visible={isPotionModalVisible}
        potion={selectedPotion}
        onClose={() => {
          setIsPotionModalVisible(false);
          setSelectedPotion(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inventorySection: {
    paddingHorizontal: gameScale(10),
    marginBottom: gameScale(100),
  },
  inventoryTabsContainer: {
    flexDirection: 'row',
    borderRadius: gameScale(25),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(6),
    marginBottom: gameScale(17),
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: gameScale(4),
  },
  badgeGridItem: {
    width: '33.33%',
    marginBottom: gameScale(8),
  },
  badgeBorderOuter: {
    borderWidth: gameScale(1),
    borderColor: '#90bfe1ff', 
    overflow: 'hidden'
  },
  badgeBorderMiddle: {
    borderWidth: gameScale(2),
    borderColor: '#04457eff',
    overflow: 'hidden',
  },
  badgeContent: {
    alignItems: 'center',
    paddingVertical: gameScale(10),
    overflow: 'hidden',
  },
  badgeGridItemLeft: {
    borderTopLeftRadius: gameScale(12),
    borderBottomLeftRadius: gameScale(12),
  },
  badgeGridItemRight: {
    borderTopRightRadius: gameScale(12),
    borderBottomRightRadius: gameScale(12),
  },
  potionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: gameScale(4),
  },
  potionGridItem: {
    width: '33.33%',
    marginTop: gameScale(8)
  },

  potionBorderOuter: {
    backgroundColor: '#8b4513',
    borderWidth: gameScale(2),
    borderTopColor: '#5c2e0f',
    borderLeftColor: '#5c2e0f',
    borderBottomColor: '#5c2e0f',
    borderRightColor: '#5c2e0f',
    padding: gameScale(3),
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    borderRadius: gameScale(15),
  },
  
  potionBorderMiddle: {
    flex: 1,
    backgroundColor: '#654321',
    borderWidth: gameScale(2),
    borderTopColor: '#5c2e0f',
    borderLeftColor: '#5c2e0f',
    borderBottomColor: '#5c2e0f',
    borderRightColor: '#5c2e0f',
    padding: gameScale(2),
    borderRadius: gameScale(15),
    overflow: 'hidden',
  },
  
  potionContent: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  potionGridItemLeft: {
    borderRadius: gameScale(12),
  },
  potionGridItemRight: {
    borderRadius: gameScale(12),
  },
  
  bottomViewAllButton: {
    backgroundColor: 'rgba(45, 64, 102, 0.75)',
    paddingVertical: gameScale(12),
    width: '50%',
    alignSelf: 'center',
    borderColor: '#90bfe1ff',
    borderRadius: gameScale(12),
    borderWidth: gameScale(2),
    alignItems: 'center',
    marginTop: gameScale(20),
  },
  bottomViewAllText: {
    fontFamily: 'MusicVibes',
    fontSize: gameScale(14),
    color: '#ffffff',
  },
});

export default InventorySection;