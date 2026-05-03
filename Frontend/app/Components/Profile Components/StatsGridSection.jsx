import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import StatCard from './StatCard';
import ProfileHeroSprite from './ProfileHeroSprite';
import InventoryTabButton from './InventoryTabButton';

const StatsGridSection = ({
  coins,
  currentStreak,
  expPoints,
  mapsOpened,
  statsIcons,
  hero,
  background,
  mode = 'classic',
  playerRankName,
  playerRankImage,
  playerTotalPoints = 0,
  pvpTotalMatches = 0,
  pvpWinRate = 0,
  onModeChange,
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

  const winRateDisplay = `${Number(pvpWinRate || 0)}%`;

  const isRankMode = String(mode).toLowerCase() === 'rank';

  const leftTopStat = isRankMode
    ? {
        icon: null,
        label: 'Rank',
        value: playerRankName || 'Unranked',
        displayValueInIcon: false,
        hideIcon: true,
      }
    : {
        icon: require('../icons/coins.png'),
        label: 'Coins',
        value: formatCompactNumber(coins),
        displayValueInIcon: false,
        hideIcon: false,
      };

  const leftBottomStat = isRankMode
    ? {
        icon: require('../icons/fire.png'),
        label: 'Matches',
        value: formatCompactNumber(pvpTotalMatches),
        displayValueInIcon: false,
        hideIcon: true,
      }
    : {
        icon: require('../icons/fire.png'),
        label: 'Streak',
        value: currentStreak,
        displayValueInIcon: false,
        hideIcon: false,
      };

  const rightTopStat = isRankMode
    ? {
        icon: require('../icons/exp.png'),
        label: 'Points',
        value: formatCompactNumber(playerTotalPoints),
        displayValueInIcon: false,
        hideIcon: true,
      }
    : {
        icon: require('../icons/exp.png'),
        label: 'EXP Points',
        value: formatCompactNumber(expPoints),
        displayValueInIcon: false,
        hideIcon: false,
      };

  const rightBottomStat = isRankMode
    ? {
        icon: require('../icons/map.png'),
        label: 'Win Rate',
        value: winRateDisplay,
        displayValueInIcon: false,
        hideIcon: true,
      }
    : {
        icon: require('../icons/map.png'),
        label: 'Maps',
        value: mapsOpened,
        displayValueInIcon: false,
        hideIcon: false,
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
              icon={leftTopStat.icon}
              label={leftTopStat.label}
              value={leftTopStat.value}
              displayValueInIcon={leftTopStat.displayValueInIcon}
              hideIcon={leftTopStat.hideIcon}
            />
            <StatCard 
              icon={leftBottomStat.icon}
              label={leftBottomStat.label}
              value={leftBottomStat.value}
              displayValueInIcon={leftBottomStat.displayValueInIcon}
              hideIcon={leftBottomStat.hideIcon}
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
              icon={rightTopStat.icon}
              label={rightTopStat.label}
              value={rightTopStat.value}
              displayValueInIcon={rightTopStat.displayValueInIcon}
              hideIcon={rightTopStat.hideIcon}
            />
            <StatCard 
              icon={rightBottomStat.icon}
              label={rightBottomStat.label}
              value={rightBottomStat.value}
              displayValueInIcon={rightBottomStat.displayValueInIcon}
              hideIcon={rightBottomStat.hideIcon}
            />
          </View>
        </ImageBackground>
      </View>
    </View>
  );

  return (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Overview</Text>

      <View style={styles.profileModeTabsContainer}>
        <InventoryTabButton
          label="Classic"
          isActive={!isRankMode}
          onPress={() => onModeChange?.('Classic')}
        />

        <View style={{ width: gameScale(12) }} />

        <InventoryTabButton
          label="Rank"
          isActive={isRankMode}
          onPress={() => onModeChange?.('Rank')}
        />
      </View>

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
  profileModeTabsContainer: {
    flexDirection: 'row',
    borderRadius: gameScale(25),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: gameScale(60),
    paddingVertical: gameScale(6),
    marginBottom: gameScale(14),
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