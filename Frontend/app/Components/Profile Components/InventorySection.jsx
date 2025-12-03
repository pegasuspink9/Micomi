import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import InventoryTabButton from './InventoryTabButton';
import BadgeCard from './BadgeCard';
import PotionCard from './PotionCard';

const InventorySection = ({ activeTab, setActiveTab, badges, potions }) => {
  const router = useRouter();
  
  // UPDATED: Sort badges - earned first, then unearned
  const sortedBadges = activeTab === 'Badges' 
    ? [...badges].sort((a, b) => {
        // Earned badges come first (true = 1, false = 0)
        if (a.earned && !b.earned) return -1;
        if (!a.earned && b.earned) return 1;
        return 0;
      })
    : badges;

  const data = activeTab === 'Badges' ? sortedBadges : potions;
  const displayItems = data.slice(0, 6);

  const handleViewAll = () => {
    if (activeTab === 'Badges') {
      router.push('/Components/User Labs/BadgesView');
    } else {
      router.push('/Components/User Labs/PotionsView');
    }
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
              <View key={index} style={styles.potionGridItem}>
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
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity onPress={handleViewAll} activeOpacity={0.9} style={styles.bottomViewAllButton}>
        <Text style={styles.bottomViewAllText}>View All {activeTab}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inventorySection: {
    paddingHorizontal: gameScale(10),
    marginBottom: gameScale(40),
  },
  inventoryTabsContainer: {
    flexDirection: 'row',
    borderRadius: gameScale(25),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: gameScale(50),
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