import React from "react";
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
  ImageBackground
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  scale,
  scaleWidth,
  scaleHeight,
  scaleFont,
  wp,
  hp,
  SCREEN,
  RESPONSIVE,
  layoutHelpers,
} from '../Components/Responsiveness/gameResponsive';
import { useRouter } from 'expo-router';

const userData = {
  heroSelected: {
    name: "Gino",
    avatar: "https://github.com/user-attachments/assets/eced9b8f-eae0-48f5-bc05-d8d5ce018529",
  },
  playerName: "DragonSlayer",
  username: "@player123",
  coins: 15420,
  daysLogin: 45,
  currentStreak: 12,
  expPoints: 8750,
  mapsOpened: 8,
  badges: [
    { id: 1, name: "First Victory", icon: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991977/Knowledge_Keeper_iti1jc.png", earned: true },
    { id: 2, name: "Streak Master", icon: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991977/Wake_and_Bake_xmqmyd.png", earned: true },
    { id: 3, name: "Coin Collector", icon: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991975/PC_Eater_wmkvhi.png", earned: false },
    { id: 4, name: "Explorer", icon: "https://res.cloudinary.com/dpbocuozx/image/upload/v1759991976/Collector_ndqhrw.png", earned: true },
  ],
  quests: [
    { id: 1, title: "Complete 5 Battles", progress: 3, total: 5, type: "daily" },
    { id: 2, title: "Defeat Boss Enemy", progress: 1, total: 1, type: "weekly" },
    { id: 3, title: "Collect 1000 Coins", progress: 1000, total: 1000, type: "main" },
  ],
  potions: [
    { id: 1, name: "Health", count: 12, icon: "https://github.com/user-attachments/assets/1fb726a5-f63d-44f4-8e33-8d9c961940ff", color: "#ff4444" },
    { id: 2, name: "Mana", count: 8, icon: "https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297", color: "#4444ff" },
    { id: 3, name: "Strength", count: 3, icon: "https://github.com/user-attachments/assets/3264eb79-0afd-4987-8c64-6d46b0fc03a0", color: "#ff8800" },
  ],
  statsIcons: {
    coins: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
    daysLogin: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
    currentStreak: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
    expPoints: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd",
    mapsOpened: "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd"
  },
  background: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759900156/474821932-3bc21bd9-3cdc-48f5-ac18-dbee09e6368c_1_twmle9.png',
  containerBackground: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg'
};

export default function Practice() {
  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: userData.containerBackground }} style={styles.ImageBackgroundContainer} resizeMode="cover">

      <View style={styles.backgroundOverlay} />
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Selected Header */}
        <HeroSelectedSection hero={userData.heroSelected} />
        
        {/* Player Info Section */}
        <PlayerInfoSection 
          playerName={userData.playerName}
          username={userData.username}
        />
        
        {/* Stats Grid Section */}
        <StatsGridSection 
          coins={userData.coins}
          daysLogin={userData.daysLogin}
          currentStreak={userData.currentStreak}
          expPoints={userData.expPoints}
          mapsOpened={userData.mapsOpened}
        />
        
        {/* Badges Section */}
        <BadgesSection badges={userData.badges} />

        
        {/* Potions Section */}
        <PotionsSection potions={userData.potions} />
        
        {/* Quests Section */}
        <QuestsSection quests={userData.quests} />
        
        
        {/* Bottom Spacing */}
        <View style={{ height: layoutHelpers.gap.xl }} />
      </ScrollView>
    </ImageBackground>
    </View>
  );
}

// Hero Selected Component
const HeroSelectedSection = ({ hero }) => (
  <View style={styles.heroSection}>
    <ImageBackground source={{ uri: userData.background }} style={styles.heroSelectionBackground}>
    <View style={styles.heroContainer}>
      <Image 
        source={{ uri: hero.avatar }} 
        style={styles.heroAvatar}
      />
      <View style={styles.heroInfo}>
        <Text style={styles.heroLabel}>Selected Hero</Text>
        <Text style={styles.heroName}>{hero.name}</Text>
      </View>
    </View>
    </ImageBackground>
  </View>
);

// Player Info Component
const PlayerInfoSection = ({ playerName, username }) => (
  <View style={styles.playerSection}>
    <Text style={styles.playerName}>{playerName}</Text>
    <Text style={styles.username}>{username}</Text>
  </View>
);

// Stats Grid Component
const StatsGridSection = ({ coins, daysLogin, currentStreak, expPoints, mapsOpened }) => (
  <View style={styles.statsSection}>
    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Overview</Text>
    <View style={styles.statsGrid}>
      <StatCard 
        icon={userData.statsIcons.coins}
        label="Coins" 
        value={coins.toLocaleString()} 
      />
    
      <StatCard 
        icon={userData.statsIcons.currentStreak}
        label=" Streak" 
        value={currentStreak} 
      />
      <StatCard 
        icon={userData.statsIcons.expPoints}
        label="EXP Points" 
        value={expPoints.toLocaleString()} 
      />
      <StatCard 
        icon={userData.statsIcons.mapsOpened}
        label="Maps" 
        value={mapsOpened} 
      />
    </View>
  </View>
);

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCardContainer}>
    <View style={styles.statCardShadow} />
    <View style={[styles.statCard]}>
      <View style={styles.statCardTopRow}>
        <Image 
          source={{ uri: icon }} 
          style={styles.statIconImage}
          resizeMode="contain"
        />
        <Text style={styles.statValue}>{value}</Text>
        
      <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  </View>
);

const BadgesSection = ({ badges }) => {
  const router = useRouter();
  
  return (
    <View style={styles.badgesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <TouchableOpacity 
          onPress={() => router.push('/Components/User Labs/BadgesView')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View 
        style={styles.badgesScrollView}
      >
        {badges.slice(0, 3).map((badge) => ( 
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </View>
    </View>
  );
};


const BadgeCard = ({ badge }) => (
  <View style={[
    styles.badgeCard,
    { opacity: badge.earned ? 1 : 0.5 }
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
            <Text style={styles.rewardAmount}>100</Text>
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

const PotionsSection = ({ potions }) => {
  const router = useRouter();
  
  return (
    <View style={styles.potionsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Potions </Text>
        <TouchableOpacity 
          onPress={() => router.push('/Components/User Labs/PotionsView')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.potionsGrid} >
        {potions.slice(0, 4).map((potion) => ( 
          <PotionCard key={potion.id} potion={potion} />
        ))}
      </View>
    </View>
  );
}

const PotionCard = ({ potion }) => {
  const getBackgroundColor = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('health')) return 'rgba(156, 167, 83, 0.66)';
    if (lowerName.includes('mana')) return 'rgba(29, 29, 85, 0.8)'; 
    if (lowerName.includes('strength')) return 'rgba(121, 94, 14, 0.8)'; 
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

const styles = StyleSheet.create({
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
  scrollContainer: {
    flex: 1
  },
  
  // Hero Section Styles
  heroSection: {
    marginTop: layoutHelpers.gap.xl,
    marginBottom: layoutHelpers.gap.lg,
    
  },
  heroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RESPONSIVE.borderRadius.lg,
    borderColor: '#2ee7ffff',
    borderWidth: 2,
    height: scaleHeight(200),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    
  },

  heroSelectionBackground:{
    overflow: 'hidden', 
    borderRadius: RESPONSIVE.borderRadius.lg,
  },
  heroAvatar: {
    width: scaleWidth(200),
    height: scaleWidth(300),
    marginRight: RESPONSIVE.margin.lg,
    position: 'absolute',
    marginTop: scaleHeight(100),
  },
  heroInfo: {
    flex: 1,
    position: 'absolute',
    right: 9
  },
  heroLabel: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ffffffff',
    fontFamily: 'GoldenAge',
    marginBottom: layoutHelpers.gap.xs,
  },
  heroName: {
    fontSize: RESPONSIVE.fontSize.xxl + 40,
    fontFamily: 'GoldenAge',
    color: '#ffffffff',
  },
  
  // Player Info Styles
  playerSection: {
    alignItems: 'flex-start',
    left: layoutHelpers.gap.xl,
    top: scaleHeight(5),
    marginBottom: layoutHelpers.gap.lg,
  },
  playerName: {
    fontSize: RESPONSIVE.fontSize.header,
    fontFamily: 'MusicVibes',
    color: 'white',
    marginBottom: layoutHelpers.gap.xs,
    textShadowColor: '#000000ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    elevation: 0,
  },
  username: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#c2c2c2ff',
    fontFamily: 'DynaPuff',
    marginBottom: layoutHelpers.gap.xl + 2,
  },
  
  // Stats Section Styles
  statsSection: {
    marginBottom: layoutHelpers.gap.xl,
  },


  
  
  sectionTitle: {
    fontSize: RESPONSIVE.fontSize.xxl,
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: layoutHelpers.gap.md,
    textShadowColor: '#000000ff',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: RESPONSIVE.margin.md,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: layoutHelpers.gap.xl + 10,
  },
  statCardContainer: {
    width: wp(40),
    height: scaleHeight(50),
    borderRadius: RESPONSIVE.borderRadius.xl,
    marginBottom: layoutHelpers.gap.xl + 10,
    position: 'relative',
  },

  statCardShadow: {
    position: 'absolute',
    top: scale(4),
    left: scale(1),
    right: -scale(1),
    bottom: -scale(15),
    backgroundColor: 'rgba(218, 218, 218, 1)',
    borderRadius: RESPONSIVE.borderRadius.md,
    zIndex: 1,
  },

  statCard: {
    backgroundColor: 'rgba(27, 98, 124, 0.93)',
    borderRadius: RESPONSIVE.borderRadius.md,
    padding: RESPONSIVE.margin.lg,
    paddingBottom: RESPONSIVE.margin.xl + 10,
    borderWidth: 2,
    borderColor: '#dfdfdfff',

    shadowColor: '#ffffffff',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 2,
    position: 'relative',
  },

   statCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layoutHelpers.gap.md,
  },

  statValue: {
    fontSize: RESPONSIVE.fontSize.xl+ 3,
    fontFamily: 'FunkySign',
    color: '#ffffffff',
    elevation: 5,
    left: scale(45),
    position: 'absolute',
  },
  
   statIconImage: {
    overflow:'hidden',
    position: 'absolute',
    top: -scale(18),
    left: -scale(10),
     width: scaleWidth(60),
    height: scaleWidth(60),
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },

  statLabel: {
    fontSize: RESPONSIVE.fontSize.sm + 2,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'FunkySign',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    elevation: 4,
    position: 'absolute',
    top: 12,
    left: scale(45),
  },
  
  // Badges Section Styles
  badgesSection: {
    padding: layoutHelpers.gap.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: layoutHelpers.gap.md,
  },


  viewAllButton: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderColor: '#2ee7ffff',
  },

  viewAllText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ffffffff',
    fontFamily: 'GoldenAge',
  },


  badgesScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(1, 1, 40, 0.48)',
  },
  badgeCard: {
    alignItems: 'center',
    borderRightWidth: 2,
  },
   badgeIconImage: {
    width: scale(170),
    height: scale(170),
    top: scale(-2),
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'hidden',
  },
  border:{
    width: scale(120), height: scale(120), justifyContent: 'center', alignItems: 'center',
    pointerEvents: 'none',
  },
  badgeName: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'white',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.xs,
  },
  badgeEarned: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  
   questsSection: {
    marginBottom: layoutHelpers.gap.xl,
    padding: layoutHelpers.gap.xl,
  },
  
  
   questCard: {
    backgroundColor: 'rgba(27, 98, 124, 0.93)',
    borderRadius: RESPONSIVE.borderRadius.md,
    padding: RESPONSIVE.margin.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
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
    color: '#ffffff',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    minWidth: scale(40),
    textAlign: 'right',
  },


    questTitle: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#ffffff',
    fontFamily: 'FunkySign',
    marginBottom: layoutHelpers.gap.xs,
  },

  questType: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.sm,
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
    color: '#ffffff',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },



  questCardContainer: {
    width: '100%',
    height: scaleHeight(80),
    borderRadius: RESPONSIVE.borderRadius.xl,
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
    borderRadius: RESPONSIVE.borderRadius.md,
    zIndex: 1,
  },

  

  
  // Potions Section Styles
  potionsSection: {
    marginBottom: layoutHelpers.gap.xl,
    padding: layoutHelpers.gap.xl,
  },
  potionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: layoutHelpers.gap.xl + 20,
  },
  
  potionCard: {
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
    width: wp(20),
    height: scaleHeight(120),
    borderRadius: RESPONSIVE.borderRadius.xl,
    position: 'relative',
  },

   potionCardShadow: {
    position: 'absolute',
    top: scale(4),
    left: scale(1),
    right: -scale(1),
    bottom: -scale(15),
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: RESPONSIVE.borderRadius.md,
    zIndex: 1,
  },

potionIconImage: {
    width: scale(100),
    position: 'absolute',
    height: scale(100),
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 4,
  },


   potionName: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'rgba(53, 53, 53, 1)',
    textAlign: 'center',
    position: 'absolute',
    bottom: -15,
    fontFamily: 'FunkySign',
  },
   potionCount: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4), 
    top: 0,
    position: 'absolute',
    right:0,
  },
  
    potionCountText: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
    fontFamily: 'FunkySign',

  },
});