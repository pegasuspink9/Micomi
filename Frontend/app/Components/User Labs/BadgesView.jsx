import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import {
  scale,
  scaleWidth,
  scaleHeight,
  wp,
  hp,
  RESPONSIVE,
  layoutHelpers,
} from '../Responsiveness/gameResponsive';

export default function BadgesView() {
  const router = useRouter();
  const playerId = 11;
  const { playerData, loading } = usePlayerProfile(playerId);

  if (loading || !playerData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading badges...</Text>
      </SafeAreaView>
    );
  }

  const earnedBadges = playerData.badges.filter(badge => badge.earned);
  const unearnedBadges = playerData.badges.filter(badge => !badge.earned);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={{ uri: playerData.containerBackground }} style={styles.backgroundContainer} resizeMode="cover">
        <View style={styles.backgroundOverlay} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Badge Collection</Text>
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{earnedBadges.length}/{playerData.badges.length}</Text>
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
                  { width: `${(earnedBadges.length / playerData.badges.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((earnedBadges.length / playerData.badges.length) * 100)}% Complete
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
      </ImageBackground>
    </SafeAreaView>
  );
}

const BadgeCard = ({ badge }) => {
  return (
    <View style={[
      styles.badgeCard,
      { opacity: badge.earned ? 1 : 0.5 }
    ]}>
      <View style={styles.badgeCardShadow} />
      <View style={styles.badgeCardContent}>
        <ImageBackground 
          source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760065969/Untitled_design_6_ioccva.png' }} 
          style={styles.border} 
          resizeMode="contain"
        >
          <Image 
            source={{ uri: badge.icon }} 
            style={styles.badgeIconImage}
            resizeMode="contain"
          />
        </ImageBackground>
        
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>
        
        {badge.earned ? (
          <View style={styles.earnedContainer}>
            <Text style={styles.earnedText}>✓ Earned</Text>
            {badge.earnedDate && (
              <Text style={styles.earnedDate}>{badge.earnedDate}</Text>
            )}
          </View>
        ) : (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedText}>🔒 Locked</Text>
          </View>
        )}
      </View>
    </View>
  );
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
    fontFamily: 'MusicVibes',
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
    backgroundColor: '#2ee7ffff',
    borderRadius: scale(6),
  },
  progressText: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#2ee7ffff',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: layoutHelpers.gap.xl,
  },
  sectionTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    color: 'white',
    fontFamily: 'MusicVibes',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.md,
    textShadowColor: '#000000ff',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: wp(45),
    marginBottom: layoutHelpers.gap.md,
    position: 'relative',
  },
  badgeCardShadow: {
    position: 'absolute',
    top: scale(4),
    left: scale(1),
    right: -scale(1),
    bottom: -scale(15),
    backgroundColor: 'rgba(218, 218, 218, 1)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    zIndex: 1,
  },
  badgeCardContent: {
    backgroundColor: 'rgba(27, 98, 124, 0.93)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.md,
    borderWidth: 2,
    borderColor: '#dfdfdfff',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 2,
    position: 'relative',
    alignItems: 'center',
  },
  border: {
    width: scale(80), 
    height: scale(80), 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: layoutHelpers.gap.sm,
  },
  badgeIconImage: {
    width: scale(120),
    height: scale(120),
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeName: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.xs,
  },
  badgeDescription: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ccc',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.sm,
  },
  earnedContainer: {
    alignItems: 'center',
  },
  earnedText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#4CAF50',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  earnedDate: {
    fontSize: RESPONSIVE.fontSize.xs,
    color: '#888',
    fontFamily: 'DynaPuff',
  },
  lockedContainer: {
    alignItems: 'center',
  },
  lockedText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#888',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
});