import React, {useState} from "react";
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator
} from "react-native";

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import ReanimatedAnimated from 'react-native-reanimated'; 


import { SafeAreaView } from 'react-native-safe-area-context';
import AssetDownloadProgress from '../Components/RoadMap/LoadingState/assetDownloadProgress';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { useRouter } from 'expo-router';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import CharacterDisplay from '../Components/Character/CharacterDisplay';

export default function Practice() {
  const playerId = 11; // You can get this from context or props
  const {
    playerData,
    loading,
    error,
    assetsLoading,
    assetsProgress,
    loadPlayerProfile,
    clearError
  } = usePlayerProfile(playerId);

  const [activeTab, setActiveTab] = useState('Profile');
  const [inventoryTab, setInventoryTab] = useState('Badges');


  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

   if (assetsLoading) {
    return (
      <>
        <View style={styles.container}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
            style={styles.ImageBackgroundContainer} 
            resizeMode="cover"
          >
            <View style={styles.backgroundOverlay} />
          </ImageBackground>
        </View>
        <AssetDownloadProgress
          visible={assetsLoading}
          progress={assetsProgress}
          currentAsset={assetsProgress.currentAsset}
        />
      </>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          clearError();
          loadPlayerProfile();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!playerData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No player data available</Text>
      </View>
    );
  }


return (
    <View style={styles.container}>
      <ImageBackground source={require('../ProfileBackground.png')} style={styles.ImageBackgroundContainer} resizeMode="cover">

        <View style={styles.backgroundOverlay} />
        
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* The content below will eventually be conditional based on the activeTab */}
        {activeTab === 'Profile' && (
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Player Info Section */}
            <PlayerInfoSection 
              playerName={playerData.playerName}
              username={playerData.username}
            />
            
            {/* Stats Grid Section */}
            <StatsGridSection 
              coins={playerData.coins}
              currentStreak={playerData.currentStreak}
              expPoints={playerData.expPoints}
              mapsOpened={playerData.mapsOpened}
              statsIcons={playerData.statsIcons}
              hero={playerData.heroSelected}
              background={playerData.background}
            />
            
             <InventorySection 
              activeTab={inventoryTab}
              setActiveTab={setInventoryTab}
              badges={playerData.badges}
              potions={playerData.potions}
            />
            
            {/* Quests Section */}
            <QuestsSection quests={playerData.quests} />
            
            
            {/* Bottom Spacing */}
            <View style={{ height: gameScale(16) }} />
          </ScrollView>
        )}

        {/* Placeholder for Missions content */}
        {activeTab === 'Missions' && (
          <View style={[styles.centered, { flex: 1 }]}>
            <Text style={styles.loadingText}>Missions Content Goes Here</Text>
          </View>
        )}

      </ImageBackground>
    </View>
  );
}

// ✅ ADD New Tabs Component
const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Profile' && styles.activeTab]}
        onPress={() => setActiveTab('Profile')}
      >
        <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>
          Profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Missions' && styles.activeTab]}
        onPress={() => setActiveTab('Missions')}
      >
        <Text style={[styles.tabText, activeTab === 'Missions' && styles.activeTabText]}>
          Missions
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const ProfileHeroSprite = ({ hero }) => {

  console.log(`🦸‍♂️ ProfileHeroSprite using image URL: ${hero.character_image_display}`);

  const SPRITE_COLUMNS = 8;
  const SPRITE_ROWS = 6;
  const TOTAL_FRAMES = 48;
  const FRAME_DURATION = 40; 
  const spriteSize = gameScale(150);

  // Animation value for the current frame
  const frameIndex = useSharedValue(0);

  // Start the animation loop when the component mounts
  React.useEffect(() => {
    cancelAnimation(frameIndex);

    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, {
        duration: FRAME_DURATION * TOTAL_FRAMES,
        easing: Easing.linear,
      }),
      -1, // Loop indefinitely
      false // Don't reverse
    );
    // Clean up the animation on unmount
    return () => cancelAnimation(frameIndex);
  }, [hero]);

  // Animated style to move the sprite sheet
  const spriteAnimatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    const column = currentFrame % SPRITE_COLUMNS;
    const row = Math.floor(currentFrame / SPRITE_COLUMNS);
    
    // Calculate the X and Y offsets to show the correct frame
    const xOffset = -(column * spriteSize);
    const yOffset = -(row * spriteSize);
    
    return {
      transform: [{ translateX: xOffset }, { translateY: yOffset }],
    };
  }, [spriteSize]);

  if (!hero?.character_image_display) {
    return <View style={styles.heroSpriteContainer} />;
  }


  return (
    <View style={styles.heroSpriteContainer}>
      <ReanimatedAnimated.View style={[styles.heroSpriteSheet, spriteAnimatedStyle]}>
        <Image
          source={{ uri: hero.character_image_display }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
      </ReanimatedAnimated.View>
    </View>
  );
};

 


// Player Info Component
const PlayerInfoSection = ({ playerName, username }) => (
  <View style={styles.playerSection}>
    <Text style={styles.playerName}>{playerName}</Text>
    <Text style={styles.username}>{username}</Text>
  </View>
);


// Stats Grid Component
const StatsGridSection = ({ coins, currentStreak, expPoints, mapsOpened, statsIcons, hero, background }) => {
  const router = useRouter();
  
  const handleHeroPress = () => {
    router.push('/Components/CharacterSelection/CharacterSelect');
  };

  return (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Overview</Text>
      
      <TouchableOpacity 
        onPress={handleHeroPress}
        activeOpacity={0.8}
      >
        <ImageBackground 
          source={{ uri: background }} 
          style={styles.heroSelectionBackground}
          imageStyle={{ borderRadius: gameScale(12) }} 
        >
          {/* ✅ REPLACED: The layout is now a three-column structure */}
          <View style={styles.overviewContainer}>
            
            {/* Left Column: Coins & Streak */}
            <View style={styles.statColumn}>
              <StatCard 
                icon={statsIcons.coins}
                label="Coins" 
                value={coins.toLocaleString()}
              />
              <StatCard 
                icon={statsIcons.currentStreak}
                label="Streak" 
                value={currentStreak}
              />
            </View>

            {/* Middle Column: Hero Sprite */}
            <View style={styles.heroColumn}>
              <View style={styles.heroInfo}>
                <Text style={styles.heroLabel}>Selected Hero</Text>
                <Text style={styles.heroName}>{hero.name}</Text>
              </View>
              <ProfileHeroSprite hero={hero} />
            </View>

            {/* Right Column: EXP & Maps */}
            <View style={styles.statColumn}>
              <StatCard 
                icon={statsIcons.expPoints}
                label="EXP Points" 
                value={expPoints.toLocaleString()}
              />
              <StatCard 
                icon={statsIcons.mapsOpened}
                label="Maps" 
                value={mapsOpened}
              />
            </View>

          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

const InventorySection = ({ activeTab, setActiveTab, badges, potions }) => {
  const router = useRouter();
  
  // Determine which data to show based on active tab
  const data = activeTab === 'Badges' ? badges : potions;
  // Limit to 6 items (2 columns * 3 rows)
  const displayItems = data.slice(0, 6);

  const handleViewAll = () => {
    if (activeTab === 'Badges') {
      router.push('/Components/User Labs/BadgesView');
    } else {
      router.push('/Components/User Labs/PotionsView');
    }
  };

  return (
    <View style={styles.inventorySection}>
      {/* Rounded Tab Switcher */}
      <View style={styles.inventoryTabsContainer}>
        <TouchableOpacity 
          style={[styles.inventoryTab, activeTab === 'Badges' && styles.inventoryTabActive]}
          onPress={() => setActiveTab('Badges')}
        >
          <Text style={[styles.inventoryTabText, activeTab === 'Badges' && styles.inventoryTabTextActive]}>
            Badges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.inventoryTab, activeTab === 'Potions' && styles.inventoryTabActive]}
          onPress={() => setActiveTab('Potions')}
        >
          <Text style={[styles.inventoryTabText, activeTab === 'Potions' && styles.inventoryTabTextActive]}>
            Potions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid Content */}
      <View style={styles.inventoryGrid}>
        {displayItems.map((item, index) => (
          <View key={index} style={styles.inventoryGridItem}>
            {activeTab === 'Badges' ? (
              <BadgeCard badge={item} />
            ) : (
              <PotionCard potion={item} />
            )}
          </View>
        ))}
      </View>

      {/* View All Button at Bottom */}
      <TouchableOpacity onPress={handleViewAll} style={styles.bottomViewAllButton}>
        <Text style={styles.bottomViewAllText}>View All {activeTab}</Text>
      </TouchableOpacity>
    </View>
  );
};




// Stat Card Component
const StatCard = ({ icon, label, value }) => (
  <View style={styles.statCardContainer}>
    <View style={styles.statCard}>
      <Image 
        source={{ uri: icon }} 
        style={styles.statIconImage}
        resizeMode="contain"
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);


const BadgeCard = ({ badge }) => (
  <View style={[
    styles.badgeCard,
    { opacity: badge.earned ? 1 : 0.1 }
  ]}>
    <ImageBackground source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760065969/Untitled_design_6_ioccva.png' }} style={styles.border} resizeMode="contain">
    <Image 
      source={{ uri: badge.icon }} 
      style={styles.badgeIconImage}
      resizeMode="contain"
    />
    </ImageBackground>
  </View>
);

const QuestsSection = ({ quests }) => {
  const router = useRouter();
  
  return (
    <View style={styles.questsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quests & Missions</Text>
        <TouchableOpacity 
          onPress={() => router.push('/Components/User Labs/QuestsView')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {quests.slice(0, 2).map((quest) => ( 
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </View>
  );
};

const QuestCard = ({ quest }) => {
  const isComplete = quest.progress >= quest.total;
  const typeColor = quest.type === 'daily' ? '#4CAF50' : 
                   quest.type === 'weekly' ? '#FF9800' : '#2196F3';
  const progressPercentage = (quest.progress / quest.total) * 100;
  
  return (
    <View style={styles.questCardContainer}>
      <View style={styles.questCardShadow} />
      <View style={styles.questCard}>
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
            {quest.type.toUpperCase()}
          </Text>
          
          {/* Progress Bar */}
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

        {/* Claim Button Section - Right */}
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



const PotionCard = ({ potion }) => {
  const getBackgroundColor = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('health')) return 'rgba(106, 119, 21, 0.66)';
    if (lowerName.includes('mana')) return 'rgba(12, 12, 128, 0.8)'; 
    if (lowerName.includes('strength')) return 'rgba(104, 83, 19, 0.8)';
    if (lowerName.includes('freeze')) return 'rgba(12, 12, 131, 0.8)';
    if (lowerName.includes('hint')) return 'rgba(1, 81, 1, 0.8)';
    return 'rgba(156, 39, 176, 0.8)'; 
  };

  return (
    <View style={styles.potionCardContainer}>
      <View style={styles.potionCardShadow} />
      <View style={[styles.potionCard, { backgroundColor: getBackgroundColor(potion.name) }]}>
        <Image 
          source={{ uri: potion.icon }} 
          style={styles.potionIconImage}
          resizeMode="contain"
        />
        <Text style={styles.potionName}>{potion.name}</Text>
        <View style={styles.potionCount}>
          <Text style={styles.potionCountText}>{potion.count}</Text>
        </View>
      </View>
    </View>
  );
};

// ✅ REPLACED: The entire StyleSheet now uses 'gameScale' for perfectly mirrored, responsive UI.
const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: gameScale(14),
    fontFamily: 'Computerfont',
    marginTop: gameScale(20),
  },
  errorText: {
    color: 'red',
    fontSize: gameScale(14),
    fontFamily: 'Computerfont',
    textAlign: 'center',
    marginBottom: gameScale(20),
  },
  retryButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.8)',
    padding: gameScale(15),
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  retryButtonText: {
    color: 'white',
    fontSize: gameScale(12),
    fontFamily: 'Computerfont',
  },

  container: {
    flex: 1
  },
  ImageBackgroundContainer: {
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.54)',
  },

   tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: gameScale(50), // Adjust for status bar height
    paddingBottom: gameScale(10),
    backgroundColor: 'rgba(10, 20, 40, 0.5)', // A subtle background for the tabs
  },

  tab: {
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(10),
    borderBottomWidth: gameScale(3),
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2ee7ff', // A bright color for the active indicator
  },

   tabText: {
    color: '#a0a0a0', // Dim color for inactive tabs
    fontSize: gameScale(16),
    fontFamily: 'GoldenAge',
  },

   activeTabText: {
    color: '#ffffff', // Bright white for the active tab text
  },

  scrollContainer: {
    flex: 1
  },
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: gameScale(12),
    borderColor: '#2ee7ffff',
    borderWidth: gameScale(2),
    height: gameScale(200),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroSelectionBackground: {
    overflow: 'hidden',
    borderRadius: gameScale(12),
  },

   heroSpriteContainer: {
    width: gameScale(150), 
    height: gameScale(150),
    overflow: 'hidden',
  },
  heroSpriteSheet: {
    width: gameScale(150) * 8, 
    height: gameScale(150) * 6,
  },
  heroInfo: {
    alignItems: 'center',
    marginBottom: gameScale(10),
  },
  heroLabel: {
    fontSize: gameScale(12),
    color: '#ffffffff',
    fontFamily: 'GoldenAge',
    marginBottom: gameScale(2),
  },
   heroName: {
    fontSize: gameScale(36),
    fontFamily: 'GoldenAge',
    color: '#ffffffff',
  },
  playerSection: {
    alignItems: 'flex-start',
    left: gameScale(16),
    top: gameScale(5),
    marginBottom: gameScale(12),
  },
  playerName: {
    fontSize: gameScale(28),
    fontFamily: 'MusicVibes',
    color: 'white',
    marginBottom: gameScale(2),
    textShadowColor: '#000000ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    elevation: 0,
  },
  username: {
    fontSize: gameScale(14),
    color: '#c2c2c2ff',
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(18),
  },

  statsSection: {
    marginBottom: gameScale(16),
    paddingHorizontal: gameScale(16),
  },

  inventorySection: {
    paddingHorizontal: gameScale(16),
    marginBottom: gameScale(20),
  },
  inventoryTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 20, 40, 0.5)',
    borderRadius: gameScale(25),
    padding: gameScale(4),
    marginBottom: gameScale(46),
    borderWidth: gameScale(1),
    borderColor: 'rgba(46, 231, 255, 0.3)',
  },
  inventoryTab: {
    flex: 1,
    paddingVertical: gameScale(10),
    alignItems: 'center',
    borderRadius: gameScale(20),
  },
  inventoryTabActive: {
    backgroundColor: '#2ee7ff',
  },
  inventoryTabText: {
    fontFamily: 'GoldenAge',
    fontSize: gameScale(14),
    color: '#a0a0a0',
  },
  inventoryTabTextActive: {
    color: '#000000',
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inventoryGridItem: {
    width: '48%', // 2 Columns
    marginBottom: gameScale(16),
    alignItems: 'center',
  },
  bottomViewAllButton: {
    backgroundColor: 'rgba(10, 20, 40, 0.75)',
    paddingVertical: gameScale(12),
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    borderColor: '#2ee7ff',
    alignItems: 'center',
    marginTop: gameScale(8),
  },
  bottomViewAllText: {
    fontFamily: 'GoldenAge',
    fontSize: gameScale(14),
    color: '#ffffff',
  },

  sectionTitle: {
    fontSize: gameScale(40),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(20),
    textShadowColor: '#000000ff',
  },
   overviewContainer: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(2),
    borderColor: '#2ee7ffff',
    backgroundColor: 'rgba(10, 20, 40, 0.75)',
    padding: gameScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },

  statColumn: {
    width: '28%',
    justifyContent: 'space-between',
  },

   heroColumn: {
    width: '40%',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: gameScale(20), // Adds the requested space at the bottom
  },

  
   characterDisplay: {
    width: gameScale(128),
    height: gameScale(128),
    marginVertical: gameScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // This defines the size of the animated sprite itself.
  characterImage: {
    width: gameScale(128),
    height: gameScale(128),
  },


   statCardContainer: {
    width: '100%',
  },
  
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(27, 98, 124, 0.85)',
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    borderColor: 'rgba(223, 223, 223, 0.7)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: gameScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 10,
  },

  statValue: {
    fontSize: gameScale(24),
    fontFamily: 'FunkySign',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statIconImage: {
    width: gameScale(50),
    height: gameScale(50),
  },
  statLabel: {
    fontSize: gameScale(14),
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Computerfont',
  },

  badgesSection: {
    padding: gameScale(16),
  },


  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: gameScale(8),
  },

  viewAllButton: {
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(6),
    borderColor: '#2ee7ffff',
  },

  viewAllText: {
    fontSize: gameScale(12),
    color: '#ffffffff',
    fontFamily: 'GoldenAge',
  },

  badgesScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderWidth: gameScale(2),
    borderRadius: gameScale(10),
    backgroundColor: 'rgba(1, 1, 40, 0.48)',
  },
  badgeCard: {
    alignItems: 'center',
    width: '100%',
  },
  badgeIconImage: {
    width: gameScale(200), 
    height: gameScale(200),
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'hidden',
  },
  border: {
    width: gameScale(100), // Adjusted size
    height: gameScale(100),
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },

  questsSection: {
    marginBottom: gameScale(16),
    padding: gameScale(16),
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

  potionsSection: {
    marginBottom: gameScale(16),
    padding: gameScale(16),
  },
  potionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(36),
  },

  potionCard: {
    borderRadius: gameScale(8),
    alignItems: 'center',
    justifyContent: 'center',
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

  potionCardContainer: {
    width: gameScale(78), // Corresponds to wp(20)
    height: gameScale(120),
    borderRadius: gameScale(16),
    position: 'relative',
  },

  potionCardShadow: {
    position: 'absolute',
    top: gameScale(4),
    left: gameScale(1),
    right: -gameScale(1),
    bottom: -gameScale(15),
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: gameScale(8),
    zIndex: 1,
  },

  potionIconImage: {
    width: gameScale(100),
    position: 'absolute',
    height: gameScale(100),
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 4,
  },

  potionName: {
    fontSize: gameScale(12),
    color: 'rgba(53, 53, 53, 1)',
    textAlign: 'center',
    position: 'absolute',
    bottom: gameScale(-15),
    fontFamily: 'FunkySign',
  },
  potionCount: {
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(4),
    top: 0,
    position: 'absolute',
    right: 0,
  },

  potionCountText: {
    fontSize: gameScale(14),
    color: 'white',
    fontFamily: 'FunkySign',
  },
});