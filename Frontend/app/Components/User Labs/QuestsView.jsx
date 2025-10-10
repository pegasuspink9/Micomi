import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  scale,
  wp,
  RESPONSIVE,
  layoutHelpers,
} from '../Responsiveness/gameResponsive';

// Mock extended quests data
const allQuestsData = {
  daily: [
    { id: 1, title: "Complete 5 Battles", description: "Win 5 battles in any game mode", progress: 3, total: 5, reward: "100 Coins", timeLeft: "5h 23m" },
    { id: 2, title: "Collect 500 Coins", description: "Gather coins from battles and treasures", progress: 350, total: 500, reward: "50 EXP", timeLeft: "5h 23m" },
    { id: 3, title: "Use 3 Potions", description: "Consume any type of potions", progress: 1, total: 3, reward: "Health Potion", timeLeft: "5h 23m" },
  ],
  weekly: [
    { id: 4, title: "Defeat Boss Enemy", description: "Defeat any boss in the game", progress: 0, total: 1, reward: "Rare Badge", timeLeft: "3d 12h" },
    { id: 5, title: "Complete 25 Battles", description: "Win 25 battles this week", progress: 12, total: 25, reward: "500 Coins", timeLeft: "3d 12h" },
    { id: 6, title: "Explore 3 New Maps", description: "Discover new areas", progress: 1, total: 3, reward: "Map Fragment", timeLeft: "3d 12h" },
  ],
  main: [
    { id: 7, title: "Collect 1000 Coins", description: "Accumulate 1000 coins total", progress: 750, total: 1000, reward: "Epic Weapon", timeLeft: "No Limit" },
    { id: 8, title: "Reach Level 10", description: "Gain enough EXP to reach level 10", progress: 7, total: 10, reward: "Character Unlock", timeLeft: "No Limit" },
    { id: 9, title: "Master All Skills", description: "Unlock and upgrade all character skills", progress: 4, total: 8, reward: "Legendary Badge", timeLeft: "No Limit" },
  ]
};

export default function QuestsView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('daily');

  const getTypeColor = (type) => {
    switch (type) {
      case 'daily': return '#4CAF50';
      case 'weekly': return '#FF9800';
      case 'main': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const getTotalQuests = () => {
    return Object.values(allQuestsData).flat().length;
  };

  const getCompletedQuests = () => {
    return Object.values(allQuestsData).flat().filter(quest => quest.progress >= quest.total).length;
  };

  return (
    <SafeAreaView style={styles.container}>
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
        {Object.keys(allQuestsData).map((tab) => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({allQuestsData[tab].length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Quest List */}
        <View style={styles.questsList}>
          {allQuestsData[activeTab].map((quest) => (
            <QuestCard key={quest.id} quest={quest} type={activeTab} />
          ))}
        </View>

        <View style={{ height: layoutHelpers.gap.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const QuestCard = ({ quest, type }) => {
  const progressPercentage = (quest.progress / quest.total) * 100;
  const typeColor = getTypeColor(type);
  const isCompleted = quest.progress >= quest.total;
  
  return (
    <TouchableOpacity style={[
      styles.questCard,
      { 
        borderColor: typeColor,
        opacity: isCompleted ? 1 : 0.9 
      }
    ]}>
      {/* Quest Header */}
      <View style={styles.questHeader}>
        <View style={styles.questTitleContainer}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={[styles.questType, { color: typeColor }]}>
            {type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeLeft}>⏱️ {quest.timeLeft}</Text>
        </View>
      </View>

      {/* Quest Description */}
      <Text style={styles.questDescription}>{quest.description}</Text>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Progress: {quest.progress}/{quest.total}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${progressPercentage}%`, 
                backgroundColor: typeColor 
              }
            ]} 
          />
        </View>
      </View>

      {/* Reward Section */}
      <View style={styles.rewardSection}>
        <Text style={styles.rewardLabel}>Reward:</Text>
        <Text style={styles.rewardText}>{quest.reward}</Text>
      </View>

      {/* Completion Status */}
      {isCompleted && (
        <View style={styles.completedOverlay}>
          <Text style={styles.completedText}>✓ COMPLETED</Text>
        </View>
      )}
    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.margin.lg,
    paddingVertical: RESPONSIVE.margin.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: RESPONSIVE.margin.sm,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: RESPONSIVE.fontSize.md,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: RESPONSIVE.fontSize.xl,
    color: 'white',
    fontWeight: 'bold',
  },
  headerStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    borderRadius: RESPONSIVE.borderRadius.md,
  },
  statsText: {
    color: '#FFD700',
    fontSize: RESPONSIVE.fontSize.md,
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
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md,
  },
  questsList: {
    paddingVertical: RESPONSIVE.margin.sm,
  },
  questCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.lg,
    marginBottom: layoutHelpers.gap.md,
    borderWidth: 2,
    position: 'relative',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layoutHelpers.gap.sm,
  },
  questTitleContainer: {
    flex: 1,
  },
  questTitle: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.xs,
  },
  questType: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontWeight: 'bold',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeLeft: {
    fontSize: RESPONSIVE.fontSize.xs,
    color: '#888',
  },
  questDescription: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ccc',
    marginBottom: layoutHelpers.gap.md,
  },
  progressSection: {
    marginBottom: layoutHelpers.gap.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layoutHelpers.gap.xs,
  },
  progressText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'white',
  },
  progressPercentage: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: scale(4),
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#888',
    marginRight: layoutHelpers.gap.sm,
  },
  rewardText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#FFD700',
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
    fontWeight: 'bold',
  },
});