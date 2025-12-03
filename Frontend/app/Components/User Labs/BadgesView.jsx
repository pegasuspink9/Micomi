import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import AssetDownloadProgress from '../../Components/RoadMap/LoadingState/assetDownloadProgress';
import { gameScale } from '../Responsiveness/gameResponsive';
import BadgeDetailModal from './Badge Modal/BadgeDetailModal';

export default function BadgesView() {
  const router = useRouter();
  const playerId = 11;
  const { playerData, loading, assetsLoading, assetsProgress, loadPlayerProfile } = usePlayerProfile(playerId);


  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedGradient, setSelectedGradient] = useState(['#8B4513', '#be874fff']);
  const [modalVisible, setModalVisible] = useState(false);

  const getRandomPastelGradient = (index) => {
        const pastelGradients = [
      ['#8B4513', '#be874fff'], // Brown/Peru
      ['#20613cff', '#266944ff'], // Sea Green/Medium Sea Green
      ['#443268ff', '#6c3978ff'], // Medium Purple/Medium Orchid
      ['#774052ff', '#764867ff'], // Pale Violet Red/Medium Violet Red
      ['#1b3448ff', '#213435ff'], // Steel Blue/Cadet Blue
      ['#3f1a1aff', '#6f4537ff'], // Indian Red/Dark Salmon
      ['#541c6fff', '#5d2b69ff'], // Dark Orchid/Medium Orchid
      ['#104e4bff', '#276b69ff'], // Light Sea Green/Medium Turquoise
      ['#315f4fff', '#212d21ff'], // Medium Aquamarine/Dark Sea Green
      ['#763f39ff', '#824949ff'], // Salmon/Light Coral
      ['#342d65ff', '#3b3171ff'], // Slate Blue/Medium Slate Blue
    ];
    
    return pastelGradients[index % pastelGradients.length];
  };

  const getProgressColor = (percentage) => {
    if (percentage < 33) {
      return ['#CD5C5C', '#E9967A']; // Red gradient (low progress)
    } else if (percentage < 66) {
      return ['#FFD700', '#FFA500']; // Gold/Orange gradient (medium progress)
    } else {
      return ['#2E8B57', '#3CB371']; // Green gradient (high progress)
    }
  };

  const handleBadgeApplied = async (badge) => {
    console.log(`🎖️ Badge "${badge.name}" was applied, refreshing profile...`);
    await loadPlayerProfile();
  };

  const handleBadgePress = (badge, gradientColors) => {
    setSelectedBadge(badge);
    setSelectedGradient(gradientColors);
    setModalVisible(true);
  };


  if (assetsLoading) {
    return (
      <>
        <SafeAreaView style={styles.container}>
          {/* Dark bluish gradient background for loading */}
          <LinearGradient
            colors={['#000000ff', '#1a2d4a', '#0f2137', '#000000ff', '#000000ff']}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            style={styles.backgroundContainer}
          >
            <View style={styles.backgroundOverlay} />
          </LinearGradient>
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
        <Text style={styles.loadingText}>Loading badges...</Text>
      </SafeAreaView>
    );
  }

  const earnedBadges = playerData.badges.filter(badge => badge.earned);
  const unearnedBadges = playerData.badges.filter(badge => !badge.earned);
  const progressPercentage = Math.round((earnedBadges.length / playerData.badges.length) * 100);
  const progressColors = getProgressColor(progressPercentage);

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark bluish gradient background */}
      <LinearGradient
         colors={['#1e1d1dff', '#1a2d4a', '#0f2137', '#1a2d4a', '#1a2d4a']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
        style={styles.backgroundContainer}
      >
        <View style={styles.backgroundOverlay} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.9}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Badge Collection</Text>
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{earnedBadges.length}/{playerData.badges.length}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Collection Progress</Text>
            
            <View style={styles.progressBarLayer1}>
              <View style={styles.progressBarLayer2}>
                <View style={styles.progressBarLayer3}>
                  <LinearGradient
                    colors={progressColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBar,
                      { width: `${progressPercentage}%` }
                    ]}
                  />
                </View>
              </View>
            </View>
            <Text style={styles.progressText}>
              {progressPercentage}% Complete
            </Text>
          </View>

          {/* Earned Badges */}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earned Badges ({earnedBadges.length})</Text>
            <View style={styles.badgesGrid}>
              {earnedBadges.map((badge, index) => {
                const isFirstInRow = index % 2 === 0;
                const isLastInRow = index % 2 === 1;
                const gradientColors = getRandomPastelGradient(index);

                return (
                  <TouchableOpacity 
                    key={badge.id} 
                    style={styles.badgeGridItem}
                    activeOpacity={0.8}
                    onPress={() => handleBadgePress(badge, gradientColors)} 
                  >
                    <View style={[
                      styles.badgeBorderOuter,
                      isFirstInRow && styles.badgeGridItemLeft,
                      isLastInRow && styles.badgeGridItemRight,
                    ]}>
                      <View style={[
                        styles.badgeBorderMiddle,
                        isFirstInRow && styles.badgeGridItemLeft,
                        isLastInRow && styles.badgeGridItemRight,
                      ]}>
                        <LinearGradient
                          colors={gradientColors}
                          style={[
                            styles.badgeContent,
                            isFirstInRow && styles.badgeGridItemLeft,
                            isLastInRow && styles.badgeGridItemRight,
                          ]}
                        >
                          <BadgeCard badge={badge} />
                        </LinearGradient>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Unearned Badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locked Badges ({unearnedBadges.length})</Text>
            <View style={styles.badgesGrid}>
              {unearnedBadges.map((badge, index) => {
                const isFirstInRow = index % 2 === 0;
                const isLastInRow = index % 2 === 1;
                const gradientColors = getRandomPastelGradient(index + earnedBadges.length);

                return (
                  <TouchableOpacity
                    key={badge.id} 
                    style={styles.badgeGridItem}
                    activeOpacity={0.8}
                    onPress={() => handleBadgePress(badge, gradientColors)}
                  >
                    <View style={[
                      styles.badgeBorderOuter,
                      isFirstInRow && styles.badgeGridItemLeft,
                      isLastInRow && styles.badgeGridItemRight,
                    ]}>
                      <View style={[
                        styles.badgeBorderMiddle,
                        isFirstInRow && styles.badgeGridItemLeft,
                        isLastInRow && styles.badgeGridItemRight,
                      ]}>
                        <LinearGradient
                          colors={gradientColors}
                          style={[
                            styles.badgeContent,
                            isFirstInRow && styles.badgeGridItemLeft,
                            isLastInRow && styles.badgeGridItemRight,
                          ]}
                        >
                          <BadgeCard badge={badge} />
                        </LinearGradient>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: gameScale(20) }} />
        </ScrollView>
      </LinearGradient>

       <BadgeDetailModal
        visible={modalVisible}
        badge={selectedBadge}
        gradientColors={selectedGradient}
        onClose={() => setModalVisible(false)}
        playerId={playerId}
        onBadgeApplied={handleBadgeApplied}
      />
    </SafeAreaView>
  );
}

const BadgeCard = ({ badge }) => {
  return (
    <View style={styles.badgeCard}>
      <View style={styles.badgeIconContainer}>
        <Image 
          source={{ uri: badge.icon }} 
          style={[
            styles.badgeIconImage,
            { opacity: badge.earned ? 1 : 0.5 },
            !badge.earned && { tintColor: 'rgba(0, 0, 0, 0.7)' }
          ]}
          resizeMode="contain"
        />
      </View>
      
      {/* Centered Separator Line */}
      <View style={styles.separator} />
      
      {/* Lower 30% for the Text */}
      <View style={styles.badgeTextContainer}>
        <Text 
          style={styles.badgeDescription} 
          numberOfLines={2} // Max 2 lines for description
          ellipsizeMode="tail"
        >
          {badge.description}
        </Text>
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
  },
  loadingText: {
    color: 'white',
    fontSize: gameScale(14),
    textAlign: 'center',
    marginTop: gameScale(50),
    fontFamily: 'Computerfont',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: gameScale(16),
    paddingVertical: gameScale(12),
    borderBottomWidth: gameScale(1),
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    padding: gameScale(8),
  },
  backButtonText: {
    color: '#ffffffff',
    fontSize: gameScale(14),
    fontFamily: 'MusicVibes',
    borderWidth: gameScale(1),
    borderColor: '#ffffffff',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(4),
    borderRadius: gameScale(6),
  },
  headerTitle: {
    fontSize: gameScale(20),
    color: 'white',
    fontFamily: 'MusicVibes',
  },
  headerStats: {
    backgroundColor: 'rgba(4, 71, 86, 1)',
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(6),
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: '#ffffffff',
  },
  statsText: {
    color: '#ffffffff',
    fontSize: gameScale(14),
    fontFamily: 'MusicVibes'
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: gameScale(12),
  },
  progressSection: {
    marginVertical: gameScale(16),
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: gameScale(16),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(8),
  },

  progressBarLayer1: {
    width: '80%',
    height: gameScale(20),
    backgroundColor: '#1a1a1a',
    borderRadius: gameScale(20),
    padding: gameScale(2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },

  progressBarLayer2: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: gameScale(18),
    padding: gameScale(2),
    borderWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

   progressBarLayer3: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: gameScale(16),
    overflow: 'hidden',
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },

   progressBar: {
    height: '100%',
    borderRadius: gameScale(16),
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },

  progressText: {
    fontSize: gameScale(16),
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
    marginTop: gameScale(8),
  },

  section: {
    marginBottom: gameScale(24),
  },
  sectionTitle: {
    fontSize: gameScale(17),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(18),
    marginLeft: gameScale(10),
    textShadowColor: '#000000ff',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
  
  //  COPIED AND MODIFIED: Badge grid styles from InventorySection
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  badgeGridItem: {
    width: '50%',
    paddingHorizontal: gameScale(4),
    marginBottom: gameScale(8),
  },
  badgeBorderOuter: {
    borderWidth: gameScale(2),
    borderColor: '#050505ff', 
    overflow: 'hidden'
  },
  badgeBorderMiddle: {
    borderWidth: gameScale(2),
    borderColor: '#ffffffff',
    overflow: 'hidden',
  },
  badgeContent: {
    alignItems: 'center',
    overflow: 'hidden',
    height: gameScale(220), 
    borderColor: '#000000ff',
    borderWidth: gameScale(1),
  },
  badgeGridItemLeft: {
    borderRadius: gameScale(12),
  },
  badgeGridItemRight: {
    borderRadius: gameScale(12),
  },
  
  // Badge card styles
   badgeCard: {
    width: '100%',
    height: '100%',
  },

   badgeIconContainer: {
    flex: 0.80, 
    width: '100%',
    backgroundColor: 'rgba(0, 100, 124, 0.2)', 
    padding: gameScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeIconImage: {
    width: gameScale(150),
    height: gameScale(150),
  },

  separator: {
    height: gameScale(2),
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'center',
  },
  badgeTextContainer: {
    flex: 0.2, 
    width: '100%',
    backgroundColor: 'rgba(4, 69, 126, 0.2)',
    paddingVertical: gameScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDescription: {
    fontSize: gameScale(11),
    color: '#dfdfdfff',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    paddingHorizontal: gameScale(10),
    lineHeight: gameScale(15),
    textShadowColor: '#000000ff',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
  earnedContainer: {
    alignItems: 'center',
  },
  lockedContainer: {
    alignItems: 'center',
  },
});