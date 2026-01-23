import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import {
  scale,
  wp,
  RESPONSIVE,
  layoutHelpers,
} from '../Responsiveness/gameResponsive';
import AssetDownloadProgress from '../RoadMap/LoadingState/assetDownloadProgress';

export default function QuestsView() {
  const router = useRouter();
  const { playerData, loading, assetsLoading, assetsProgress } = usePlayerProfile();
  const [activeTab, setActiveTab] = useState('daily');

  if (assetsLoading) {
    return (
      <>
        <SafeAreaView style={styles.container}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
            style={styles.backgroundContainer} 
            resizeMode="cover"
          >
            <View style={styles.backgroundOverlay} />
          </ImageBackground>
        </SafeAreaView>
        <AssetDownloadProgress
          visible={assetsLoading}
          progress={assetsProgress}
          currentAsset={assetsProgress.currentAsset}
        />
      </>
    );
  }

  if (loading || !playerData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading quests...</Text>
      </SafeAreaView>
    );
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'daily': return '#4CAF50';
      case 'weekly': return '#FF9800';
      case 'main': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  // Group quests by type
  const questsByType = {
    daily: playerData.quests.filter(quest => quest.type === 'daily'),
    weekly: playerData.quests.filter(quest => quest.type === 'weekly'),
    main: playerData.quests.filter(quest => quest.type === 'main')
  };

  const getTotalQuests = () => {
    return playerData.quests.length;
  };

  const getCompletedQuests = () => {
    return playerData.quests.filter(quest => quest.is_completed).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={{ uri: playerData.containerBackground }} style={styles.backgroundContainer} resizeMode="cover">
        <View style={styles.backgroundOverlay} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quests & Missions</Text>
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{getCompletedQuests()}/{getTotalQuests()}</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {Object.keys(questsByType).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                { 
                  backgroundColor: activeTab === tab ? getTypeColor(tab) : 'rgba(255, 255, 255, 0.1)',
                  borderColor: getTypeColor(tab)
                }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? 'white' : getTypeColor(tab) }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({questsByType[tab].length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Quest List */}
          <View style={styles.questsList}>
            {questsByType[activeTab].map((quest) => (
              <QuestCard key={quest.id} quest={quest} type={activeTab} />
            ))}
          </View>

          <View style={{ height: layoutHelpers.gap.xl }} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const QuestCard = ({ quest, type }) => {
  const progressPercentage = (quest.progress / quest.total) * 100;
  const typeColor = getTypeColor(type);
  const isCompleted = quest.is_completed;
  
  return (
    <View style={styles.questCardContainer}>
      <View style={styles.questCardShadow} />
      <View style={[
        styles.questCard,
        { 
          borderColor: typeColor,
          opacity: isCompleted ? 1 : 0.9 
        }
      ]}>
        {/* Rewards Section - Left */}
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

        {/* Quest Info Section - Middle */}
        <View style={styles.questInfoSection}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={[styles.questType, { color: typeColor }]}>
            {type.toUpperCase()}
          </Text>
          <Text style={styles.questDescription}>{quest.description}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: isCompleted ? '#4CAF50' : typeColor
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {quest.progress}/{quest.total}
            </Text>
          </View>
        </View>

        {/* Claim Button Section - Right */}
        <View style={styles.claimSection}>
          <TouchableOpacity 
            style={[
              styles.claimButton,
              { backgroundColor: isCompleted ? '#4CAF50' : '#666' }
            ]}
            disabled={!isCompleted}
          >
            <Text style={styles.claimButtonText}>
              {isCompleted ? (quest.is_claimed ? 'Claimed' : 'Claim') : 'Locked'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Completion Status */}
        {isCompleted && (
          <View style={styles.completedOverlay}>
            <Text style={styles.completedText}>✓ COMPLETED</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getTypeColor = (type) => {
  switch (type) {
    case 'daily': return '#4CAF50';
    case 'weekly': return '#FF9800';
    case 'main': return '#2196F3';
    default: return '#4CAF50';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.54)', 
  },
  loadingText: {
    color: 'white',
    fontSize: RESPONSIVE.fontSize.md,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.margin.lg,
    paddingVertical: RESPONSIVE.margin.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    padding: RESPONSIVE.margin.sm,
  },
  backButtonText: {
    color: '#2ee7ffff',
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'GoldenAge',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: RESPONSIVE.fontSize.xl,
    color: 'white',
    fontFamily: 'MusicVibes',
    fontWeight: 'bold',
  },
  headerStats: {
    backgroundColor: 'rgba(46, 231, 255, 0.2)',
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    borderColor: '#2ee7ffff',
  },
  statsText: {
    color: '#2ee7ffff',
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    paddingVertical: RESPONSIVE.margin.sm,
    marginHorizontal: RESPONSIVE.margin.xs,
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md,
  },
  questsList: {
    paddingVertical: RESPONSIVE.margin.sm,
  },
  questCardContainer: {
    width: '100%',
    marginBottom: layoutHelpers.gap.md,
    position: 'relative',
  },
  questCardShadow: {
    position: 'absolute',
    top: scale(4),
    left: scale(1),
    right: -scale(1),
    bottom: -scale(15),
    backgroundColor: 'rgba(218, 218, 218, 1)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    zIndex: 1,
  },
  questCard: {
    backgroundColor: 'rgba(27, 98, 124, 0.93)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.lg,
    borderWidth: 2,
    borderColor: '#dfdfdfff',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 2,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  questRewardsSection: {
    width: scale(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIcon: {
    width: scale(30),
    height: scale(30),
    marginBottom: layoutHelpers.gap.xs,
  },
  rewardAmount: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#FFD700',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  questInfoSection: {
    flex: 1,
    paddingHorizontal: layoutHelpers.gap.md,
  },
  questTitle: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.xs,
  },
  questType: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.xs,
  },
  questDescription: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ccc',
    fontFamily: 'DynaPuff',
    marginBottom: layoutHelpers.gap.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarBackground: {
    flex: 1,
    height: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: scale(4),
    marginRight: layoutHelpers.gap.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: scale(4),
    minWidth: '2%',
  },
  progressText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'white',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    minWidth: scale(40),
    textAlign: 'right',
  },
  claimSection: {
    width: scale(80),
    alignItems: 'center',
  },
  claimButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'white',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    borderTopRightRadius: RESPONSIVE.borderRadius.lg,
    borderBottomLeftRadius: RESPONSIVE.borderRadius.lg,
  },
  completedText: {
    fontSize: RESPONSIVE.fontSize.xs,
    color: 'white',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
});