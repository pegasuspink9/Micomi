import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const ThemesInventorySection = ({
  themes = [],
  canActOnThemes = true,
  onThemeSelect = () => {},
  onThemePurchase = () => {},
}) => {
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);
  const [themeActionLoading, setThemeActionLoading] = useState(false);
  const [themeActionError, setThemeActionError] = useState(null);

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
      closeThemeModal();
    } catch (error) {
      setThemeActionError(error?.message || 'Purchase failed');
    } finally {
      setThemeActionLoading(false);
    }
  };

  return (
    <>
      <View style={styles.themesGrid}>
        {themes.map((theme, index) => {
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
                    styles.themeSwatchOuterBorder,
                    !theme.isOwned && styles.themeSwatchLocked,
                    theme.isSelected && styles.themeSwatchSelected,
                    isFirstInRow && styles.themeGridItemLeft,
                    isLastInRow && styles.themeGridItemRight,
                  ]}
                >
                  <View style={styles.themeSwatchInnerBorder}>
                    <View
                      style={[
                        styles.themeSwatch,
                        { backgroundColor: theme.theme_color || '#1f2937' },
                      ]}
                    />
                  </View>
                </View>
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
              <Text style={styles.themeModalPrice}>Price: {pendingTheme?.price ?? 0} diamonds</Text>
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
                  <Text style={styles.themeModalButtonText}>Buy with diamonds</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: gameScale(4),
  },
  themeGridItem: {
    width: '20.33%',
    marginTop: gameScale(8),
    alignItems: 'center',
  },
  themeCard: {
    alignItems: 'center',
    width: '100%',
  },
  themeSwatchOuterBorder: {
    borderWidth: gameScale(1.5),
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: gameScale(5),
    padding: gameScale(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeSwatchInnerBorder: {
    borderWidth: gameScale(0.5),
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: gameScale(5),
    padding: gameScale(0),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  themeSwatch: {
    width: gameScale(40),
    height: gameScale(40),
    borderRadius: gameScale(5),
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
  },
  themeGridItemLeft: {
    borderRadius: gameScale(12),
  },
  themeGridItemRight: {
    borderRadius: gameScale(12),
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

export default ThemesInventorySection;
