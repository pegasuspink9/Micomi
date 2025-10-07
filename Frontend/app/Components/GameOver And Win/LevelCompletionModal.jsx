import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  RESPONSIVE 
} from '../Responsiveness/gameResponsive';

const LevelCompletionModal = ({
  visible = false,
  onRetry = null,
  onHome = null,
  onNextLevel = null,
  completionRewards = null,
  nextLevel = null,
  characterName = 'Character',
  enemyName = 'Enemy',
  isLoading = false
}) => {
  console.log('🏆 LevelCompletionModal render:', {
    visible,
    completionRewards,
    nextLevel,
    isLoading
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.victoryTitle}>VICTORY!</Text>
          
          <Text style={styles.defeatMessage}>
            {characterName} defeated {enemyName}!
          </Text>

          {/* ✅ Enhanced feedback message handling */}
          {completionRewards?.feedbackMessage ? (
            <Text style={styles.feedbackMessage}>
              {completionRewards.feedbackMessage}
            </Text>
          ) : (
            <Text style={styles.feedbackMessage}>
              Congratulations! You have completed this level!
            </Text>
          )}

          {/* ✅ Enhanced rewards display with fallback */}
          {completionRewards ? (
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>Rewards Earned:</Text>
              {completionRewards.currentTotalPoints > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardText}>
                    🏆 Total Points: {completionRewards.currentTotalPoints}
                  </Text>
                </View>
              )}
              {completionRewards.currentExpPoints > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardText}>
                    ⭐ Experience: {completionRewards.currentExpPoints}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>Level Completed!</Text>
              <View style={styles.rewardItem}>
                <Text style={styles.rewardText}>
                  🎉 Great job completing this challenge!
                </Text>
              </View>
            </View>
          )}
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Loading next level...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              {nextLevel ? (
                <TouchableOpacity 
                  style={styles.nextLevelButton} 
                  onPress={onNextLevel}
                >
                  <Text style={styles.buttonText}>
                    NEXT LEVEL ({nextLevel.level_number})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.nextLevelButton, styles.disabledButton]} 
                  disabled={true}
                >
                  <Text style={styles.buttonText}>
                    NO MORE LEVELS
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={onRetry}
              >
                <Text style={styles.buttonText}>RETRY</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.homeButton} 
                onPress={onHome}
              >
                <Text style={styles.buttonText}>HOME</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.xl,
    alignItems: 'center',
    width: scaleWidth(320),
    maxHeight: scaleHeight(600),
    borderWidth: scale(2),
    borderColor: '#4CAF50',
  },

  victoryTitle: {
    fontSize: RESPONSIVE.fontSize.header,
    fontFamily: 'DynaPuff',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: RESPONSIVE.margin.lg,
  },

  defeatMessage: {
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: RESPONSIVE.margin.lg,
  },

  feedbackMessage: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: 'DynaPuff',
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: RESPONSIVE.margin.lg,
    lineHeight: scale(20),
  },

  rewardsContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: RESPONSIVE.borderRadius.md,
    padding: RESPONSIVE.margin.md,
    marginBottom: RESPONSIVE.margin.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },

  rewardsTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: 'DynaPuff',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: RESPONSIVE.margin.sm,
    fontWeight: 'bold',
  },

  rewardItem: {
    marginBottom: RESPONSIVE.margin.xs,
  },

  rewardText: {
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
  },

  buttonContainer: {
    width: '100%',
    gap: RESPONSIVE.margin.md,
  },

  nextLevelButton: {
    backgroundColor: '#FF9800',
    paddingVertical: RESPONSIVE.margin.md,
    paddingHorizontal: RESPONSIVE.margin.xl,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },

  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: RESPONSIVE.margin.md,
    paddingHorizontal: RESPONSIVE.margin.xl,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },

  homeButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: RESPONSIVE.margin.md,
    paddingHorizontal: RESPONSIVE.margin.xl,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    fontWeight: 'bold',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE.margin.xl,
  },

  loadingText: {
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: RESPONSIVE.margin.md,
  },

   disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },

});

export default LevelCompletionModal;