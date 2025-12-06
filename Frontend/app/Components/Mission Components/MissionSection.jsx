import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';
import { useQuests } from '../../hooks/useQuests';
import MissionTabButton from './MissionTabButton';
import QuestCard from './QuestCard';

const MissionSection = ({ playerId = 11 }) => {
  const [activeTab, setActiveTab] = useState('Daily');
  
  const {
    questsData,
    loading,
    error,
    claiming,
    claimingQuestId,
    loadQuests,
    claimReward,
    getDailyQuests,
    getWeeklyQuests,
    getMonthlyQuests,
    getSummary,
    clearError
  } = useQuests(playerId);

  // Get quests based on active tab
  const getActiveQuests = () => {
    switch (activeTab) {
      case 'Daily':
        return getDailyQuests();
      case 'Weekly':
        return getWeeklyQuests();
      case 'Monthly':
        return getMonthlyQuests();
      default:
        return [];
    }
  };

  const handleClaimReward = async (playerQuestId) => {
    try {
      await claimReward(playerQuestId);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading Missions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          clearError();
          loadQuests();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const summary = getSummary();
  const activeQuests = getActiveQuests();

  return (
    <View style={styles.container}>
      {/* Landscape Cover Image with Summary overlaid */}
      <View style={styles.coverContainer}>
        <ImageBackground
          source={require('./Mission Image/Mission.jpeg')}
          style={styles.coverBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.1)', 'transparent', 'rgba(0, 0, 0, 0.6)']}
            style={styles.coverOverlay}
          />
          
          {/* Mission Title on Cover */}
          <View style={styles.coverContent}>
            <Text style={styles.coverTitle}>Missions</Text>
            <Text style={styles.coverSubtitle}>Complete quests to earn rewards!</Text>
          </View>

          {/* Summary Header - Positioned at bottom of cover */}
           <View style={styles.summaryWrapper}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.totalActive || 0}</Text>
                <Text style={styles.summaryLabel}>Active</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.totalCompleted || 0}</Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.totalClaimed || 0}</Text>
                <Text style={styles.summaryLabel}>Claimed</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Main Content with LinearGradient Background */}
      <LinearGradient
        colors={['#0a192f', '#172b4a', '#0a192f']}
        style={styles.contentContainer}
      >
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <MissionTabButton 
            label="Daily" 
            count={summary.dailyCount || 0}
            isActive={activeTab === 'Daily'} 
            onPress={() => setActiveTab('Daily')}
          />
          <MissionTabButton 
            label="Weekly" 
            count={summary.weeklyCount || 0}
            isActive={activeTab === 'Weekly'} 
            onPress={() => setActiveTab('Weekly')}
          />
          <MissionTabButton 
            label="Monthly" 
            count={summary.monthlyCount || 0}
            isActive={activeTab === 'Monthly'} 
            onPress={() => setActiveTab('Monthly')}
          />
        </View>

        {/* Quest List */}
        <ScrollView 
          style={styles.questsScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questsContent}
          removeClippedSubviews={true}
          scrollEventThrottle={20}
          decelerationRate="fast"
          overScrollMode="never"
          bounces={false}
          nestedScrollEnabled={true}
        >
          {activeQuests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} quests available</Text>
            </View>
          ) : (
            <View style={styles.questsGrid}>
              {activeQuests.map((quest, index) => (
                <QuestCard
                  key={quest.player_quest_id || index}
                  quest={quest}
                  onClaim={handleClaimReward}
                  claiming={claiming && claimingQuestId === quest.player_quest_id}
                />
              ))}
            </View>
          )}
          
          <View/>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    marginTop: gameScale(10),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(20),
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    textAlign: 'center',
    marginBottom: gameScale(15),
  },
  retryButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.8)',
    paddingHorizontal: gameScale(25),
    paddingVertical: gameScale(10),
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  retryButtonText: {
    color: 'white',
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
  },
  
  // Landscape Cover Styles
  coverContainer: {
    width: '100%',
    height: gameScale(220),
    overflow: 'hidden',
  },
  coverBackground: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  coverContent: {
    position: 'absolute',
    top: gameScale(15),
    left: gameScale(15),
  },
  coverTitle: {
    fontSize: gameScale(38),
    fontFamily: 'Grobold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  coverSubtitle: {
    fontSize: gameScale(13),
    fontFamily: 'Grobold',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: gameScale(2),
  },
  
  // Summary - Positioned absolutely at bottom of cover
  summaryWrapper: {
    position: 'absolute',
    bottom: gameScale(10),
    left: gameScale(10),
    right: gameScale(10),
  },
    summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: gameScale(12),
    paddingVertical: gameScale(10),
    paddingHorizontal: gameScale(15),
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#FFD700',
    fontSize: gameScale(18),
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: gameScale(9),
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  summaryDivider: {
    width: gameScale(1),
    height: gameScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Main Content Container
  contentContainer: {
    flex: 1,
    paddingHorizontal: gameScale(10),
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: gameScale(15),
    marginBottom: gameScale(15),
    gap: gameScale(8),
  },
  questsScrollView: {
    flex: 1,
  },
  questsContent: {
    paddingBottom: gameScale(20),
  },
  questsGrid: {
    gap: gameScale(12),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: gameScale(50),
  },
  emptyIcon: {
    fontSize: gameScale(40),
    marginBottom: gameScale(10),
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
  },
});

export default MissionSection;