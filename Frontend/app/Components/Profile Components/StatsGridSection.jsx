import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import StatCard from './StatCard';
import ProfileHeroSprite from './ProfileHeroSprite';

const StatsGridSection = ({
  coins,
  currentStreak,
  expPoints,
  mapsOpened,
  statsIcons,
  hero,
  background,
  disableHeroPress = false,
  relationButtonMeta,
  onRelationPress,
  relationActionLoading = false,
}) => {
  const router = useRouter();

  const formatCompactNumber = (value) => {
    const numericValue = Number(value || 0);

    if (Math.abs(numericValue) >= 1000000) {
      const millions = numericValue / 1000000;
      const roundedMillions = Math.round(millions * 10) / 10;
      return `${Number.isInteger(roundedMillions) ? roundedMillions.toFixed(0) : roundedMillions}M`;
    }

    if (Math.abs(numericValue) >= 1000) {
      const thousands = numericValue / 1000;
      const roundedThousands = Math.round(thousands * 10) / 10;
      return `${Number.isInteger(roundedThousands) ? roundedThousands.toFixed(0) : roundedThousands}K`;
    }

    return numericValue.toLocaleString();
  };
  
  const handleHeroPress = () => {
    router.push('/Components/CharacterSelection/CharacterSelect');
  };

  const overviewContent = (
    <View style={styles.overviewBorderOuter}>
      <View style={styles.overviewBorderMiddle}>
        <ImageBackground 
          source={{ uri: background }} 
          style={styles.overviewContainer}
        >
          <View style={styles.statColumn}>
            <StatCard 
              icon={require('../icons/coins.png')}
              label="Coins" 
              value={formatCompactNumber(coins)}
            />
            <StatCard 
              icon={require('../icons/fire.png')}
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

            {relationButtonMeta && onRelationPress ? (
              <TouchableOpacity
                style={[styles.relationButton, relationButtonMeta.style]}
                onPress={onRelationPress}
                disabled={relationActionLoading}
                activeOpacity={0.85}
              >
                {relationActionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.relationButtonText}>{relationButtonMeta.label}</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.statColumn}>
            <StatCard 
              icon={require('../icons/exp.png')} 
              label="EXP Points" 
              value={formatCompactNumber(expPoints)}
            />
            <StatCard 
              icon={require('../icons/map.png')} 
              label="Maps" 
              value={mapsOpened}
            />
          </View>
        </ImageBackground>
      </View>
    </View>
  );

  return (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Overview</Text>

      {disableHeroPress ? (
        overviewContent
      ) : (
        <TouchableOpacity onPress={handleHeroPress} activeOpacity={0.8}>
          {overviewContent}
        </TouchableOpacity>
      )}
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
    marginBottom: gameScale(14),
    textShadowColor: '#000000ff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
  relationButton: {
    width: '92%',
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(6),
    position: 'absolute',
    bottom: gameScale(2),
  },
  relationButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(10),
    textAlign: 'center',
  },
});

export default StatsGridSection;