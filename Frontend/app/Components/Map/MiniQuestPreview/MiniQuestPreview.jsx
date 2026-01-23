import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useQuests } from '../../../hooks/useQuests';
import { gameScale } from '../../Responsiveness/gameResponsive';
import MissionSection from '../../Mission Components/MissionSection';

const { width } = Dimensions.get('window');

const MiniQuestPreview = () => {
  const { questsData, loading, getDailyQuests, getWeeklyQuests, getMonthlyQuests } = useQuests();
  const [currentQuest, setCurrentQuest] = useState(null);
  const [questIndex, setQuestIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [missionModalVisible, setMissionModalVisible] = useState(false);

  // Border colors matching QuestCard daily theme (blue)
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

  // Get all incomplete/unclaimable quests
  const getAvailableQuests = () => {
    if (!questsData) return [];
    
    const allQuests = [
      ...getDailyQuests(),
      ...getWeeklyQuests(),
      ...getMonthlyQuests()
    ];
    
    // Filter to only show quests that are not yet complete or not yet claimed
    return allQuests.filter(quest => !quest.is_completed || !quest.is_claimed);
  };

  // Rotate through quests every 3 seconds
  useEffect(() => {
    const availableQuests = getAvailableQuests();
    if (availableQuests.length === 0) return;

    // Set initial quest
    setCurrentQuest(availableQuests[0]);

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change quest
        setQuestIndex(prev => {
          const nextIndex = (prev + 1) % availableQuests.length;
          setCurrentQuest(availableQuests[nextIndex]);
          return nextIndex;
        });
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [questsData]);

  // Update current quest when questsData changes
  useEffect(() => {
    const availableQuests = getAvailableQuests();
    if (availableQuests.length > 0 && !currentQuest) {
      setCurrentQuest(availableQuests[0]);
    }
  }, [questsData]);

  // Render the 3-layer cabinet border wrapper
  const renderCardWrapper = (children, isCompleted = false) => (
    <TouchableOpacity onPress={() => setMissionModalVisible(true)} activeOpacity={0.8}>
      <View style={[
        styles.cardBorderOuter,
        {
          backgroundColor: isCompleted ? '#3d5a3d' : borderColors.outerBg,
          borderTopColor: isCompleted ? '#2d4a2d' : borderColors.outerBorderTop,
          borderLeftColor: isCompleted ? '#2d4a2d' : borderColors.outerBorderTop,
          borderBottomColor: isCompleted ? '#4a6b4a' : borderColors.outerBorderBottom,
          borderRightColor: isCompleted ? '#4a6b4a' : borderColors.outerBorderBottom,
        }
      ]}>
        <View style={[
          styles.cardBorderMiddle,
          {
            backgroundColor: isCompleted ? '#2d4a2d' : borderColors.middleBg,
            borderTopColor: isCompleted ? '#4CAF50' : borderColors.middleBorderTop,
            borderLeftColor: isCompleted ? '#4CAF50' : borderColors.middleBorderTop,
            borderBottomColor: isCompleted ? '#1a2e1a' : borderColors.middleBorderBottom,
            borderRightColor: isCompleted ? '#1a2e1a' : borderColors.middleBorderBottom,
          }
        ]}>
          <View style={[
            styles.cardBorderInner,
            {
              backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.15)' : borderColors.innerBg,
              borderColor: isCompleted ? 'rgba(76, 175, 80, 0.3)' : borderColors.innerBorder,
            }
          ]}>
            {children}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        {renderCardWrapper(
          <LinearGradient
            colors={['#1e3a5f', '#0d1f33']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ActivityIndicator size="small" color="#fff" />
          </LinearGradient>
        )}
        <MissionModal 
          visible={missionModalVisible} 
          onClose={() => setMissionModalVisible(false)}
        />
      </>
    );
  }

  const availableQuests = getAvailableQuests();
  
  if (availableQuests.length === 0) {
    return (
      <>
        {renderCardWrapper(
          <LinearGradient
            colors={['#2d5a2d', '#1a3d1a']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.completedText}>✓ All Complete!</Text>
            <Text style={styles.tapText}>Tap to view missions</Text>
          </LinearGradient>,
          true // isCompleted
        )}
        <MissionModal 
          visible={missionModalVisible} 
          onClose={() => setMissionModalVisible(false)}
        />
      </>
    );
  }

  if (!currentQuest) return null;

  const progressPercent = currentQuest.progress_percentage || 
    (currentQuest.current_value / currentQuest.target_value * 100);

  return (
    <>
      {renderCardWrapper(
        <LinearGradient
          colors={['#1e3a5f', '#0d1f33']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Daily Quest</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{availableQuests.length}</Text>
            </View>
          </View>

          {/* Quest Content - Animated */}
          <Animated.View style={[styles.questContent, { opacity: fadeAnim }]}>
            <Text style={styles.questTitle} numberOfLines={1}>
              {currentQuest.title}
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(progressPercent, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {currentQuest.current_value}/{currentQuest.target_value}
              </Text>
            </View>

            {/* Rewards */}
            <View style={styles.rewardsRow}>
              <Text style={styles.rewardItem}>⭐ {currentQuest.reward_exp}</Text>
              <Text style={styles.rewardItem}>🪙 {currentQuest.reward_coins}</Text>
            </View>
          </Animated.View>

          {/* Tap indicator */}
          <Text style={styles.tapIndicator}>Tap for all missions →</Text>
        </LinearGradient>
      )}

      {/* Mission Modal */}
      <MissionModal 
        visible={missionModalVisible} 
        onClose={() => setMissionModalVisible(false)}
      />
    </>
  );
};

// Mission Modal Component
const MissionModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        {/* 3-Layer Cabinet Border */}
        <View style={modalStyles.modalBorderOuter}>
          <View style={modalStyles.modalBorderMiddle}>
            <View style={modalStyles.modalBorderInner}>
              <View style={modalStyles.container}>
                {/* Close Button */}
                <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
                  <Text style={modalStyles.closeText}>✕</Text>
                </TouchableOpacity>
                
                {/* Mission Section Content */}
                <MissionSection />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // 3-Layer Cabinet Border Styles (matching QuestCard)
  cardBorderOuter: {
    width: width * 0.9,
    alignSelf: 'center',
    borderWidth: gameScale(1),
    borderRadius: gameScale(12),
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(1) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(2),
    elevation: 8,
    overflow: 'hidden',
    marginTop: gameScale(-16)
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
    padding: gameScale(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: gameScale(3),
  },
  headerTitle: {
    color: '#fff',
    fontSize: gameScale(12),
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(10),
  },
  // 3-Layer Cabinet Border for Modal
  modalBorderOuter: {
    width: '100%',
    maxHeight: '90%',
    borderWidth: gameScale(1),
    borderRadius: gameScale(16),
    backgroundColor: '#1e3a5f',
    borderTopColor: '#0d1f33',
    borderLeftColor: '#0d1f33',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(8) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(12),
    elevation: 15,
    overflow: 'hidden',
  },
  modalBorderMiddle: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(14),
    backgroundColor: '#152d4a',
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
  },
  modalBorderInner: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderColor: 'rgba(74, 144, 217, 0.3)',
  },
  container: {
    backgroundColor: '#0a192f',
    borderRadius: gameScale(10),
    overflow: 'hidden',
    minHeight: gameScale(700), 
  },
  closeButton: {
    position: 'absolute',
    top: gameScale(12),
    right: gameScale(12),
    zIndex: 100,
    backgroundColor: 'rgba(152, 5, 5, 0.77)',
    width: gameScale(32),
    height: gameScale(32),
    borderRadius: gameScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeText: {
    color: '#ffffffff',
    fontSize: gameScale(16),
    fontFamily: 'Grobold',
  },
});

export default MiniQuestPreview;