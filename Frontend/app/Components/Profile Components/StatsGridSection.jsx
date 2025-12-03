import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import StatCard from './StatCard';
import ProfileHeroSprite from './ProfileHeroSprite';

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
        <View style={styles.overviewBorderOuter}>
          <View style={styles.overviewBorderMiddle}>
            <ImageBackground 
              source={{ uri: background }} 
              style={styles.overviewContainer}
            >
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

              <View style={styles.heroColumn}>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroLabel}>Selected Hero</Text>
                  <Text style={styles.heroName}>{hero.name}</Text>
                </View>
                <ProfileHeroSprite hero={hero} />
              </View>

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
            </ImageBackground> 
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: gameScale(10),
    paddingHorizontal: gameScale(16),
  },
  sectionTitle: {
    fontSize: gameScale(35),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(10),
    textShadowColor: '#000000ff',
  },
  overviewBorderOuter: {
    borderRadius: gameScale(18), 
    borderWidth: gameScale(3),
    borderColor: '#03325bff', 
    margin: gameScale(2), 
  },
  overviewBorderMiddle: {
    borderRadius: gameScale(15), 
    borderWidth: gameScale(3),
    borderColor: '#01476dff',
  },
  overviewContainer: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(3),
    borderColor: '#015c73ff',
    padding: gameScale(5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  statColumn: {
    width: '28%',
    justifyContent: 'space-between',
  },
  heroColumn: {
    width: '40%',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: gameScale(20),
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
});

export default StatsGridSection;