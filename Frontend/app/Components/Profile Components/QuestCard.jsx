import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const QuestCard = ({ quest }) => {
  const isComplete = quest.progress >= quest.total;
  const typeColor = quest.type === 'daily' ? '#4CAF50' : 
                   quest.type === 'weekly' ? '#FF9800' : '#2196F3';
  const progressPercentage = (quest.progress / quest.total) * 100;
  
  return (
    <View style={styles.questCardContainer}>
      <View style={styles.questCardShadow} />
      <View style={styles.questCard}>
        <View style={styles.questRewardsSection}>
          <View style={styles.rewardItem}>
            <Image 
              source={{ uri: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd" }}
              style={styles.rewardIcon}
              resizeMode="contain"
            />
            <Text style={styles.rewardAmount}>{quest.reward_coins}</Text>
          </View>
        </View>

        <View style={styles.questInfoSection}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={[styles.questType, { color: typeColor }]}>
            {quest.type.toUpperCase()}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: isComplete ? '#4CAF50' : '#FF9800'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {quest.progress}/{quest.total}
            </Text>
          </View>
        </View>

        <View style={styles.claimSection}>
          <TouchableOpacity 
            style={[
              styles.claimButton,
              { backgroundColor: isComplete ? '#4CAF50' : '#999999' }
            ]}
            disabled={!isComplete}
          >
            <Text style={styles.claimButtonText}>
              {isComplete ? 'Claim' : 'Locked'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  questCardContainer: {
    width: '100%',
    height: gameScale(80),
    borderRadius: gameScale(16),
    marginBottom: gameScale(8),
    position: 'relative',
  },
  questCardShadow: {
    position: 'absolute',
    top: gameScale(4),
    left: gameScale(1),
    right: -gameScale(1),
    bottom: -gameScale(15),
    backgroundColor: 'rgba(218, 218, 218, 1)',
    borderRadius: gameScale(8),
    zIndex: 1,
  },
  questCard: {
    backgroundColor: 'rgba(27, 98, 124, 0.93)',
    borderRadius: gameScale(8),
    padding: gameScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: gameScale(2),
    borderColor: '#dfdfdfff',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 2,
    position: 'relative',
    height: '100%',
  },
  questRewardsSection: {
    width: gameScale(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIcon: {
    width: gameScale(30),
    height: gameScale(30),
    marginBottom: gameScale(2),
  },
  rewardAmount: {
    fontSize: gameScale(12),
    color: '#FFD700',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  questInfoSection: {
    flex: 1,
    paddingHorizontal: gameScale(8),
  },
  questTitle: {
    fontSize: gameScale(14),
    color: '#ffffff',
    fontFamily: 'FunkySign',
    marginBottom: gameScale(2),
  },
  questType: {
    fontSize: gameScale(12),
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    marginBottom: gameScale(4),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarBackground: {
    flex: 1,
    height: gameScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: gameScale(4),
    marginRight: gameScale(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: gameScale(4),
    minWidth: '2%',
  },
  progressText: {
    fontSize: gameScale(12),
    color: '#ffffff',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    minWidth: gameScale(40),
    textAlign: 'right',
  },
  claimSection: {
    width: gameScale(80),
    alignItems: 'center',
  },
  claimButton: {
    paddingHorizontal: gameScale(16),
    paddingVertical: gameScale(8),
    borderRadius: gameScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    fontSize: gameScale(12),
    color: '#ffffff',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
});

export default QuestCard;