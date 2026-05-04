import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import InventoryTabButton from './InventoryTabButton';
import BadgeCard from './BadgeCard';
import PotionCard from './PotionCard';

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
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);
  const [themeActionLoading, setThemeActionLoading] = useState(false);
  const [themeActionError, setThemeActionError] = useState(null);
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

  const data = activeTab === 'Badges' ? sortedBadges : activeTab === 'Potions' ? potions : themes;
  const displayItems = data.slice(0, 6);

  const handleViewAll = () => {
    if (activeTab === 'Badges') {
      router.push({
        pathname: '/Components/User Labs/BadgesView',
        params: viewPlayerId ? { playerId: String(viewPlayerId) } : undefined,
      });
    } else if (activeTab === 'Potions') {
      router.push({
        pathname: '/Components/User Labs/PotionsView',
        params: viewPlayerId ? { playerId: String(viewPlayerId) } : undefined,
      });
    }
  };

  const handleThemePress = async (theme) => {
    if (!canActOnThemes) return;

    if (theme.isOwned) {
      setThemeActionLoading(true);
      setThemeActionError(null);
      try {
        await onThemeSelect(theme.theme_id);
      } catch (error) {
        console.error('Failed to select theme:', error);
      } finally {
        setThemeActionLoading(false);
      }
      return;
    }

    setPendingTheme(theme);
    setThemeActionError(null);
    setIsThemeModalVisible(true);
  };

  const closeThemeModal = () => {
    setIsThemeModalVisible(false);
    setPendingTheme(null);
    setThemeActionError(null);
  };

  const confirmThemePurchase = async () => {
    if (!pendingTheme) return;
    setThemeActionLoading(true);
    setThemeActionError(null);
    try {
      const result = await onThemePurchase(pendingTheme.theme_id);
      if (result?.success === false) {
        setThemeActionError(result?.error || 'Purchase failed');
        return;
      }
      setIsThemeModalVisible(false);
      setPendingTheme(null);
    } catch (error) {
      setThemeActionError(error?.message || 'Purchase failed');
    } finally {
      setThemeActionLoading(false);
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

      {activeTab === 'Themes' && (
        <View style={styles.themesGrid}>
          {displayItems.map((theme, index) => {
            const isFirstInRow = index % 3 === 0;
            const isLastInRow = index % 3 === 2;

            return (
              <TouchableOpacity
                key={theme.theme_id ?? index}
                activeOpacity={0.8}
                onPress={() => handleThemePress(theme)}
                disabled={themeActionLoading || !canActOnThemes}
                style={styles.themeGridItem}
              >
                <View style={styles.themeCard}>
                  <View
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: theme.theme_color || '#1f2937' },
                      !theme.isOwned && styles.themeSwatchLocked,
                      theme.isSelected && styles.themeSwatchSelected,
                      isFirstInRow && styles.themeGridItemLeft,
                      isLastInRow && styles.themeGridItemRight,
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeName,
                      !theme.isOwned && styles.themeNameLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {theme.theme_name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activeTab !== 'Themes' && (
        <TouchableOpacity onPress={handleViewAll} activeOpacity={0.9} style={styles.bottomViewAllButton}>
          <Text style={styles.bottomViewAllText}>View All {activeTab}</Text>
        </TouchableOpacity>
      )}

      <Modal
        transparent
        visible={isThemeModalVisible}
        animationType="fade"
        onRequestClose={closeThemeModal}
      >
        <View style={styles.themeModalOverlay}>
          <View style={styles.themeModalContent}>
            <Text style={styles.themeModalTitle}>Purchase Theme</Text>
            <View style={styles.themeModalPreview}>
              <View
                style={[
                  styles.themeModalSwatch,
                  { backgroundColor: pendingTheme?.theme_color || '#1f2937' },
                ]}
              />
              <Text style={styles.themeModalName}>{pendingTheme?.theme_name || 'Theme'}</Text>
              <Text style={styles.themeModalPrice}>Price: {pendingTheme?.price ?? 0} coins</Text>
            </View>

            {!!themeActionError && (
              <Text style={styles.themeModalError}>{themeActionError}</Text>
            )}

            <View style={styles.themeModalButtons}>
              <TouchableOpacity
                style={[styles.themeModalButton, styles.themeModalCancel]}
                onPress={closeThemeModal}
                disabled={themeActionLoading}
              >
                <Text style={styles.themeModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeModalButton, styles.themeModalBuy]}
                onPress={confirmThemePurchase}
                disabled={themeActionLoading}
              >
                {themeActionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.themeModalButtonText}>Buy with coins</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: gameScale(4),
  },
  themeGridItem: {
    width: '33.33%',
    marginTop: gameScale(8),
    alignItems: 'center',
  },
  themeCard: {
    alignItems: 'center',
    width: '100%',
  },
  themeSwatch: {
    width: gameScale(40),
    height: gameScale(40),
    borderRadius: gameScale(6),
    borderWidth: gameScale(2),
    borderColor: '#0b1729',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  themeSwatchLocked: {
    opacity: 0.4,
  },
  themeSwatchSelected: {
    borderColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOpacity: 0.8,
  },
  themeName: {
    marginTop: gameScale(6),
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    color: '#f8fafc',
    textAlign: 'center',
    maxWidth: gameScale(60),
  },
  themeNameLocked: {
    color: 'rgba(248, 250, 252, 0.5)',
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
  themeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: gameScale(20),
  },
  themeModalContent: {
    width: '100%',
    maxWidth: gameScale(280),
    backgroundColor: '#0b1b2b',
    borderRadius: gameScale(16),
    padding: gameScale(20),
    borderWidth: gameScale(2),
    borderColor: '#1f3b5c',
  },
  themeModalTitle: {
    fontSize: gameScale(16),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: gameScale(12),
  },
  themeModalPreview: {
    alignItems: 'center',
    marginBottom: gameScale(12),
  },
  themeModalSwatch: {
    width: gameScale(64),
    height: gameScale(64),
    borderRadius: gameScale(10),
    borderWidth: gameScale(2),
    borderColor: '#1f3b5c',
    marginBottom: gameScale(8),
  },
  themeModalName: {
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  themeModalPrice: {
    marginTop: gameScale(4),
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    color: '#94a3b8',
    textAlign: 'center',
  },
  themeModalError: {
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    color: '#f87171',
    textAlign: 'center',
    marginBottom: gameScale(8),
  },
  themeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeModalButton: {
    flex: 1,
    paddingVertical: gameScale(10),
    borderRadius: gameScale(10),
    alignItems: 'center',
    borderWidth: gameScale(2),
  },
  themeModalCancel: {
    backgroundColor: '#1f2937',
    borderColor: '#334155',
    marginRight: gameScale(10),
  },
  themeModalBuy: {
    backgroundColor: '#0ea5a4',
    borderColor: '#14b8a6',
  },
  themeModalButtonText: {
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    color: '#ffffff',
  },
});

export default InventorySection;