import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useQuests } from '../../../hooks/useQuests';
import { gameScale } from '../../Responsiveness/gameResponsive';

const { width } = Dimensions.get('window');

const MiniQuestPreview = () => {
  const { questsData, loading, getDailyQuests, getWeeklyQuests, getMonthlyQuests } = useQuests();
  const router = useRouter();
  const [currentQuest, setCurrentQuest] = useState(null);
  const [questIndex, setQuestIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const borderColors = {
    outerBg: '#5a3a1e',
    outerBorderTop: '#3e2208',
    outerBorderBottom: '#8b6b3d',
    middleBg: '#4a2c10',
    middleBorderTop: '#c4904a',
    middleBorderBottom: '#2a1500',
    innerBg: 'rgba(180, 120, 50, 0.15)',
    innerBorder: 'rgba(180, 120, 50, 0.3)',
  };

  const getAvailableQuests = () => {
    const allQuests = [
      ...getDailyQuests(),
      ...getWeeklyQuests(),
      ...getMonthlyQuests(),
    ];

    return allQuests.filter((quest) => !quest.is_completed || !quest.is_claimed);
  };

  useEffect(() => {
    const availableQuests = getAvailableQuests();
    if (availableQuests.length === 0) return;

    setCurrentQuest(availableQuests[0]);

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setQuestIndex((prev) => {
          const nextIndex = (prev + 1) % availableQuests.length;
          setCurrentQuest(availableQuests[nextIndex]);
          return nextIndex;
        });

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [questsData]);

  useEffect(() => {
    const availableQuests = getAvailableQuests();
    if (availableQuests.length > 0 && !currentQuest) {
      setCurrentQuest(availableQuests[0]);
    }
  }, [questsData, currentQuest]);

  const renderCardWrapper = (children, isCompleted = false) => (
    <TouchableOpacity
      onPress={() => router.push('/mission')}
      activeOpacity={0.85}
      style={styles.previewContainer}
    >
      <View
        style={[
          styles.cardBorderOuter,
          {
            backgroundColor: isCompleted ? '#4a6b2a' : borderColors.outerBg,
            borderTopColor: isCompleted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.3)',
            borderLeftColor: isCompleted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.3)',
            borderBottomColor: isCompleted ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.4)',
            borderRightColor: isCompleted ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)',
          },
        ]}
      >
        {/* 3D Corner Dots (Brass Rivets) */}
        <View style={[styles.cornerDot, styles.dotTopLeft]} />
        <View style={[styles.cornerDot, styles.dotTopRight]} />
        <View style={[styles.cornerDot, styles.dotBottomLeft]} />
        <View style={[styles.cornerDot, styles.dotBottomRight]} />

        <View
          style={[
            styles.cardBorderMiddle,
            {
              backgroundColor: isCompleted ? '#3a5a1a' : borderColors.middleBg,
              borderTopColor: isCompleted ? '#6bba30' : borderColors.middleBorderTop,
              borderLeftColor: isCompleted ? '#6bba30' : borderColors.middleBorderTop,
              borderBottomColor: isCompleted ? '#1a3a0a' : borderColors.middleBorderBottom,
              borderRightColor: isCompleted ? '#1a3a0a' : borderColors.middleBorderBottom,
            },
          ]}
        >
          <View
            style={[
              styles.cardBorderInner,
              {
                backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.15)' : borderColors.innerBg,
                borderTopColor: isCompleted ? 'rgba(107,186,48,0.2)' : 'rgba(255,255,255,0.1)',
                borderLeftColor: isCompleted ? 'rgba(107,186,48,0.1)' : 'rgba(255,255,255,0.05)',
                borderBottomColor: isCompleted ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)',
                borderRightColor: isCompleted ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.2)',
              },
            ]}
          >
            {children}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return renderCardWrapper(
      <LinearGradient
        colors={['#6b4420', '#3e2208']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHighlight} />
        <View style={styles.cardShadowOverlay} />
        <ActivityIndicator size="small" color="#fff" />
      </LinearGradient>
    );
  }

  const availableQuests = getAvailableQuests();

  if (availableQuests.length === 0) {
    return renderCardWrapper(
      <LinearGradient
        colors={['#4a6b2a', '#2a4a12']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHighlight} />
        <View style={styles.cardShadowOverlay} />
        <Text style={styles.completedText}>✓ All Complete!</Text>
        <Text style={styles.tapText}>Tap to view missions</Text>
      </LinearGradient>,
      true
    );
  }

  if (!currentQuest) return null;

  const progressPercent =
    currentQuest.progress_percentage ||
    (currentQuest.current_value / currentQuest.target_value) * 100;

  return renderCardWrapper(
    <LinearGradient
      colors={['#6b4420', '#3e2208']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardHighlight} />
      <View style={styles.cardShadowOverlay} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Quest</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{availableQuests.length}</Text>
        </View>
      </View>

      <Animated.View style={[styles.questContent, { opacity: fadeAnim }]}>
        <Text style={styles.questTitle} numberOfLines={1}>
          {currentQuest.title}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuest.current_value}/{currentQuest.target_value}
          </Text>
        </View>

        <View style={styles.rewardsRow}>
          <View style={styles.rewardItemRow}>
            <Image
              source={require('../../icons/points.png')}
              style={styles.rewardIconImage}
              resizeMode="contain"
            />
            <Text style={styles.rewardItem}>{currentQuest.reward_exp}</Text>
          </View>
          <View style={styles.rewardItemRow}>
            <Image
              source={require('../../icons/coins.png')}
              style={styles.rewardIconImage}
              resizeMode="contain"
            />
            <Text style={styles.rewardItem}>{currentQuest.reward_coins}</Text>
          </View>
        </View>
      </Animated.View>

      <Text style={styles.tapIndicator}>Tap for all missions →</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: gameScale(14),
    paddingVertical: gameScale(12),
    marginTop: gameScale(-16),
  },
  cardBorderOuter: {
    width: '100%',
    maxWidth: width * 0.9,
    borderRadius: gameScale(12),
    padding: gameScale(2),
    position: 'relative',
    // Directional borders for 3D effect (PotionShop style)
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 3,
    borderRightWidth: 2,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(6) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(8),
    elevation: 12,
  },
  cardBorderMiddle: {
    padding: gameScale(2),
    borderRadius: gameScale(10),
    overflow: 'hidden',
    // Directional inner borders
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cardBorderInner: {
    borderRadius: gameScale(8),
    overflow: 'hidden',
    // Directional innermost borders
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  gradient: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: gameScale(6),
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(10),
    backgroundColor: '#5a3a1e',
    position: 'relative',
    overflow: 'hidden',
  },
  // --- Highlight & Shadow overlays (PotionShop 3D depth) ---
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: gameScale(6),
    borderTopRightRadius: gameScale(6),
  },
  cardShadowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomLeftRadius: gameScale(6),
    borderBottomRightRadius: gameScale(6),
  },
  // --- 3D Corner Dots (Brass Rivets) ---
  cornerDot: {
    position: 'absolute',
    width: gameScale(6),
    height: gameScale(6),
    borderRadius: gameScale(3),
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: '#8b4513',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    elevation: 2,
  },
  dotTopLeft: {
    top: gameScale(4),
    left: gameScale(4),
  },
  dotTopRight: {
    top: gameScale(4),
    right: gameScale(4),
  },
  dotBottomLeft: {
    bottom: gameScale(4),
    left: gameScale(4),
  },
  dotBottomRight: {
    bottom: gameScale(4),
    right: gameScale(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: gameScale(3),
  },
  headerTitle: {
    color: '#fff',
    marginTop: 0,
    fontFamily: 'Grobold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    backgroundColor: 'rgba(200, 140, 50, 0.35)',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(2),
    borderRadius: gameScale(10),
    borderWidth: 1,
    borderColor: '#d4a24e',
  },
  badgeText: {
    color: '#f0c56e',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
  },
  questContent: {
    marginBottom: gameScale(8),
  },
  questTitle: {
    color: '#f4e7d1',
    fontSize: gameScale(11),
    fontFamily: 'Grobold',
    marginBottom: gameScale(6),
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(8),
    marginBottom: gameScale(6),
  },
  progressBar: {
    flex: 1,
    height: gameScale(8),
    backgroundColor: '#2a1500',
    borderRadius: gameScale(4),
    overflow: 'hidden',
    borderWidth: gameScale(1),
    borderTopColor: '#1a0e00',
    borderLeftColor: '#1a0e00',
    borderBottomColor: '#4a3020',
    borderRightColor: '#4a3020',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c98930',
    borderRadius: gameScale(3),
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: gameScale(9),
    fontFamily: 'Grobold',
    minWidth: gameScale(35),
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: gameScale(15),
  },
  rewardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(4),
  },
  rewardIconImage: {
    width: gameScale(15),
    height: gameScale(15),
  },
  rewardItem: {
    color: '#f0c56e',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
    textShadowColor: '#1a0e00',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tapIndicator: {
    color: 'rgba(240, 220, 180, 0.5)',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
    textAlign: 'right',
  },
  completedText: {
    color: '#6bba30',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    textAlign: 'center',
    marginBottom: gameScale(4),
  },
  tapText: {
    color: 'rgba(240, 220, 180, 0.6)',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
});

export default React.memo(MiniQuestPreview);
