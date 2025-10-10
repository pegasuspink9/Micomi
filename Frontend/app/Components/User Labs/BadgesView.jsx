import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  scale,
  scaleWidth,
  scaleHeight,
  wp,
  hp,
  RESPONSIVE,
  layoutHelpers,
} from '../Responsiveness/gameResponsive';

// Mock extended badges data
const allBadgesData = [
  { id: 1, name: "First Victory", description: "Win your first battle", icon: "https://via.placeholder.com/80x80/FFD700/000000?text=🏆", earned: true, earnedDate: "2024-01-15", rarity: "Common" },
  { id: 2, name: "Streak Master", description: "Login for 10 consecutive days", icon: "https://via.placeholder.com/80x80/FF4444/FFFFFF?text=🔥", earned: true, earnedDate: "2024-01-20", rarity: "Rare" },
  { id: 3, name: "Coin Collector", description: "Collect 10,000 coins", icon: "https://via.placeholder.com/80x80/FFD700/000000?text=💰", earned: false, earnedDate: null, rarity: "Epic" },
  { id: 4, name: "Explorer", description: "Discover 5 new maps", icon: "https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=🗺️", earned: true, earnedDate: "2024-01-25", rarity: "Uncommon" },
  { id: 5, name: "Dragon Slayer", description: "Defeat the Ancient Dragon", icon: "https://via.placeholder.com/80x80/8B0000/FFFFFF?text=🐉", earned: false, earnedDate: null, rarity: "Legendary" },
  { id: 6, name: "Speed Runner", description: "Complete a level under 30 seconds", icon: "https://via.placeholder.com/80x80/00CED1/000000?text=⚡", earned: true, earnedDate: "2024-01-18", rarity: "Rare" },
  { id: 7, name: "Champion", description: "Win 100 battles", icon: "https://via.placeholder.com/80x80/FFD700/000000?text=👑", earned: false, earnedDate: null, rarity: "Epic" },
  { id: 8, name: "Treasure Hunter", description: "Find 50 hidden treasures", icon: "https://via.placeholder.com/80x80/8B4513/FFFFFF?text=📦", earned: true, earnedDate: "2024-01-22", rarity: "Uncommon" },
];

export default function BadgesView() {
  const router = useRouter();

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Common': return '#CCCCCC';
      case 'Uncommon': return '#4CAF50';
      case 'Rare': return '#2196F3';
      case 'Epic': return '#9C27B0';
      case 'Legendary': return '#FF9800';
      default: return '#CCCCCC';
    }
  };

  const earnedBadges = allBadgesData.filter(badge => badge.earned);
  const unearnedBadges = allBadgesData.filter(badge => !badge.earned);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badge Collection</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{earnedBadges.length}/{allBadgesData.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Collection Progress</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(earnedBadges.length / allBadgesData.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((earnedBadges.length / allBadgesData.length) * 100)}% Complete
          </Text>
        </View>

        {/* Earned Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned Badges ({earnedBadges.length})</Text>
          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        </View>

        {/* Unearned Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked Badges ({unearnedBadges.length})</Text>
          <View style={styles.badgesGrid}>
            {unearnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        </View>

        <View style={{ height: layoutHelpers.gap.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const BadgeCard = ({ badge }) => {
  const rarityColor = getRarityColor(badge.rarity);
  
  return (
    <TouchableOpacity style={[
      styles.badgeCard,
      { 
        opacity: badge.earned ? 1 : 0.5,
        borderColor: rarityColor 
      }
    ]}>
      <View style={[styles.rarityBorder, { backgroundColor: rarityColor }]}>
        <Text style={styles.rarityText}>{badge.rarity}</Text>
      </View>
      
      <Image 
        source={{ uri: badge.icon }} 
        style={styles.badgeIcon}
        resizeMode="contain"
      />
      
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
      
      {badge.earned ? (
        <View style={styles.earnedContainer}>
          <Text style={styles.earnedText}>✓ Earned</Text>
          <Text style={styles.earnedDate}>{badge.earnedDate}</Text>
        </View>
      ) : (
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedText}>🔒 Locked</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'Common': return '#CCCCCC';
    case 'Uncommon': return '#4CAF50';
    case 'Rare': return '#2196F3';
    case 'Epic': return '#9C27B0';
    case 'Legendary': return '#FF9800';
    default: return '#CCCCCC';
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md,
  },
  progressSection: {
    marginVertical: layoutHelpers.gap.lg,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: RESPONSIVE.fontSize.lg,
    color: 'white',
    marginBottom: layoutHelpers.gap.sm,
  },
  progressBarContainer: {
    width: '80%',
    height: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scale(6),
    overflow: 'hidden',
    marginBottom: layoutHelpers.gap.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: scale(6),
  },
  progressText: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: layoutHelpers.gap.xl,
  },
  sectionTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: wp(45),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.md,
    marginBottom: layoutHelpers.gap.md,
    borderWidth: 2,
    position: 'relative',
  },
  rarityBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderTopRightRadius: RESPONSIVE.borderRadius.lg,
    borderBottomLeftRadius: RESPONSIVE.borderRadius.md,
  },
  rarityText: {
    fontSize: RESPONSIVE.fontSize.xs,
    color: 'white',
    fontWeight: 'bold',
  },
  badgeIcon: {
    width: scale(60),
    height: scale(60),
    alignSelf: 'center',
    marginBottom: layoutHelpers.gap.sm,
  },
  badgeName: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.xs,
  },
  badgeDescription: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#888',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.sm,
  },
  earnedContainer: {
    alignItems: 'center',
  },
  earnedText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  earnedDate: {
    fontSize: RESPONSIVE.fontSize.xs,
    color: '#888',
  },
  lockedContainer: {
    alignItems: 'center',
  },
  lockedText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#888',
    fontWeight: 'bold',
  },
});