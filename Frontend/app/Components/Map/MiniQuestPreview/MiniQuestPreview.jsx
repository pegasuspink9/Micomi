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
    outerBg: '#1e3a5f',
    outerBorderTop: '#0d1f33',
    outerBorderBottom: '#2d5a87',
    middleBg: '#152d4a',
    middleBorderTop: '#4a90d9',
    middleBorderBottom: '#0a1929',
    innerBg: 'rgba(74, 144, 217, 0.15)',
    innerBorder: 'rgba(74, 144, 217, 0.3)',
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
            backgroundColor: isCompleted ? '#3d5a3d' : borderColors.outerBg,
            borderTopColor: isCompleted ? '#2d4a2d' : borderColors.outerBorderTop,
            borderLeftColor: isCompleted ? '#2d4a2d' : borderColors.outerBorderTop,
            borderBottomColor: isCompleted ? '#4a6b4a' : borderColors.outerBorderBottom,
            borderRightColor: isCompleted ? '#4a6b4a' : borderColors.outerBorderBottom,
          },
        ]}
      >
        <View
          style={[
            styles.cardBorderMiddle,
            {
              backgroundColor: isCompleted ? '#2d4a2d' : borderColors.middleBg,
              borderTopColor: isCompleted ? '#4CAF50' : borderColors.middleBorderTop,
              borderLeftColor: isCompleted ? '#4CAF50' : borderColors.middleBorderTop,
              borderBottomColor: isCompleted ? '#1a2e1a' : borderColors.middleBorderBottom,
              borderRightColor: isCompleted ? '#1a2e1a' : borderColors.middleBorderBottom,
            },
          ]}
        >
          <View
            style={[
              styles.cardBorderInner,
              {
                backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.15)' : borderColors.innerBg,
                borderColor: isCompleted ? 'rgba(76, 175, 80, 0.3)' : borderColors.innerBorder,
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
        colors={['#1e3a5f', '#0d1f33']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="small" color="#fff" />
      </LinearGradient>
    );
  }

  const availableQuests = getAvailableQuests();

  if (availableQuests.length === 0) {
    return renderCardWrapper(
      <LinearGradient
        colors={['#2d5a2d', '#1a3d1a']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
      colors={['#1e3a5f', '#0d1f33']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
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
    borderWidth: gameScale(1),
    borderRadius: gameScale(12),
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(1) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(2),
    elevation: 8,
    overflow: 'hidden',
  },
  cardBorderMiddle: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(10),
    overflow: 'hidden',
  },
  cardBorderInner: {
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: gameScale(6),
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(10),
    backgroundColor: '#1e3a5f',
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
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(2),
    borderRadius: gameScale(10),
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeText: {
    color: '#FFD700',
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
    height: gameScale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: gameScale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
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
    color: '#FFD700',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tapIndicator: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: gameScale(8),
    fontFamily: 'Grobold',
    textAlign: 'right',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    textAlign: 'center',
    marginBottom: gameScale(4),
  },
  tapText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
});

export default React.memo(MiniQuestPreview);
