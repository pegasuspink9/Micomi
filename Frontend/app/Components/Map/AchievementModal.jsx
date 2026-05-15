import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

const AchievementModal = ({ 
  visible, 
  unlockedAchievement, 
  onClose, 
  onViewAchievements 
}) => {
  // ✅ If not visible, render nothing.
  if (!visible) {
    return null;
  }

  if (!unlockedAchievement) {
    return null;
  }

  return (
    // ✅ Full-screen View overlay (matching BadgeDetailModal)
    <TouchableOpacity 
      style={styles.fullScreenOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
        
        <View style={styles.floatingContainer}>
          {/* Header */}
          <Text style={styles.achievementTitle}>New Achievement!</Text>

          {/* Badge Image - No Background Container */}
          <Image
            source={{
              uri: unlockedAchievement?.badge_icon || 'https://via.placeholder.com/150?text=Badge',
            }}
            style={styles.floatingIcon}
            resizeMode="contain"
          />

          {/* Badge Info */}
          <ScrollView 
            style={styles.floatingTextScrollView} 
            contentContainerStyle={{ alignItems: 'center' }} 
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.floatingName}>
              {unlockedAchievement?.achievement_name || 'New Badge Unlocked'}
            </Text>
            <Text style={styles.floatingDescription}>
              {unlockedAchievement?.description || 'You have unlocked a new achievement!'}
            </Text>

            {/* Buttons - Matching BadgeDetailModal styles */}
            <View style={styles.buttonContainer}>
              {/* Close Button */}
              <View style={styles.buttonLayer1}>
                <View style={styles.buttonLayer2}>
                  <TouchableOpacity 
                    style={[styles.buttonLayer3, styles.closeButton]} 
                    activeOpacity={0.8} 
                    onPress={onClose}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* View All Button */}
              <View style={styles.buttonLayer1}>
                <View style={styles.buttonLayer2}>
                  <TouchableOpacity 
                    style={[styles.buttonLayer3, styles.viewButton]} 
                    activeOpacity={0.8} 
                    onPress={onViewAchievements}
                  >
                    <Text style={styles.buttonText}>View Badges</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </ScrollView>
        </View>
        
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.71)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(20),
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  floatingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: gameScale(28),
    fontFamily: 'MusicVibes',
    color: '#ffd879',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  floatingIcon: {
    width: gameScale(250),
    height: gameScale(250),
    marginTop: gameScale(-20),
    marginBottom: gameScale(-20),
  },
  floatingTextScrollView: {
    maxHeight: gameScale(250),
  },
  floatingName: {
    fontSize: gameScale(22),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: gameScale(12),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  floatingDescription: {
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
    color: '#dddddd',
    textAlign: 'center',
    paddingHorizontal: gameScale(10),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: gameScale(20),
    width: '100%',
  },
  buttonLayer1: {
    backgroundColor: '#1a1a1a',
    borderRadius: gameScale(25),
    padding: gameScale(2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    marginHorizontal: gameScale(8),
  },
  buttonLayer2: {
    backgroundColor: '#2a2a2a',
    borderRadius: gameScale(23),
    borderWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 1)',
    borderLeftColor: 'rgba(255, 255, 255, 1)',
    borderBottomColor: 'rgba(255, 255, 255, 1)',
    borderRightColor: 'rgba(255, 255, 255, 1)',
  },
  buttonLayer3: {
    borderRadius: gameScale(22),
    paddingVertical: gameScale(8),
    paddingHorizontal: gameScale(18),
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  viewButton: {
    backgroundColor: '#2b5c2cca', 
  },
  closeButton: {
    backgroundColor: '#757575', 
  },
  buttonText: {
    color: '#ffffffff',
    fontSize: gameScale(12),
    fontFamily: 'MusicVibes'
  },
});

export default AchievementModal;