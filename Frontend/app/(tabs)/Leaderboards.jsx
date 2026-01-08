import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  FlatList, 
  Dimensions,
  ImageBackground // Import ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { gameScale } from '../Components/Responsiveness/gameResponsive';

const { width } = Dimensions.get('window');

// --- Mock Data ---
const LEADERBOARD_DATA = [
  { id: '1', rank: 1, name: 'Blucheez42', clan: 'Supervillains', score: 12500, avatar: 'https://scontent.fceb1-3.fna.fbcdn.net/v/t39.30808-6/455857027_1540335636836837_965310929657794007_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGYD_C3tJS2SDWckzjErw683pCaAClZ6JPekJoAKVnok0uemnybwmyQ9E3lTOydzaQUqJMGQDFcg8voM3zzi4Ne&_nc_ohc=rQBUNQi4CNAQ7kNvwFyEylq&_nc_oc=AdmHxk2y2-sRuG4JD-LrN8VTm_9BWE0dZ3mANqjfRohG149BildKnpX-_-in978ling&_nc_zt=23&_nc_ht=scontent.fceb1-3.fna&_nc_gid=vGPx2c4o72z5u4SusNjDpQ&oh=00_AfozGZyFLNJC7nbPCIv7RGWJ0XYjxMPEhNIdW5_YRsK_6A&oe=696566EB', reward: 'gold_chest' },
  { id: '2', rank: 2, name: 'ShellYeah', clan: '', score: 11200, avatar: 'https://scontent.fceb1-5.fna.fbcdn.net/v/t39.30808-1/520214698_3190472601120542_4599990013785983579_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=102&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeHJrPZm1khjlAR2IORLshnL51_MjOsVQ8rnX8yM6xVDygC_bVzGxY9QDu1oLadM2A4iZUM-LOl-kYGfohrsqAl6&_nc_ohc=VcOfvqy6WyMQ7kNvwFMNxGg&_nc_oc=AdkKcFFf2HZnfiRtDfBm3ce3s-7GGuNcfvT6xRGQH_L9nuQf905q2oAKnfPEPEG4T-Q&_nc_zt=24&_nc_ht=scontent.fceb1-5.fna&_nc_gid=fzk1ineGbOwBAoW5KNoT4w&oh=00_AfoAArQkGstEgb6BTvzpw7CImC7lJaJM-ExjgGAYLK6uwg&oe=696571B0', reward: 'silver_chest' },
  { id: '3', rank: 3, name: 'gou', clan: '', score: 10500, avatar: 'https://scontent.fceb1-3.fna.fbcdn.net/v/t39.30808-1/571353641_24579140221781342_4390920867548760325_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=104&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeE7t7LP-xnpMVpyUfWvvH0EhVF43tIqPTGFUXje0io9McjvLtCm-T6rjmsjh3ZnN0VoPVHBzcBEyFFNcWT82POc&_nc_ohc=1xIb2X1SOssQ7kNvwGzN9wT&_nc_oc=AdkY6cNCMRQE4Nw8zh7EKAnBjc_KEv4hENTZNnzsc7os1CsaDtOUug_jcafYHRJ76Ho&_nc_zt=24&_nc_ht=scontent.fceb1-3.fna&_nc_gid=mHlcM1GAnRrwiWzP3CTV0w&oh=00_Afq409YkecwLvEZvijoKdoWAmBKPvVBIpQeIwKqX3ByDZg&oe=696577EF', reward: 'bronze_chest' },
  { id: '4', rank: 4, name: 'yes', clan: '', score: 9800, avatar: 'https://scontent.fceb1-5.fna.fbcdn.net/v/t39.30808-1/569201410_2303089013526701_4644154701113805937_n.jpg?stp=c0.0.472.472a_dst-jpg_s200x200_tt6&_nc_cat=110&ccb=1-7&_nc_sid=e99d92&_nc_eui2=AeEyfbewRIABK_G1WXruflX1Y4tUhYTNqY5ji1SFhM2pjmhKoNi3xdNoP9w201W5Aof9AeJjbJKxZjO2leK5eWtU&_nc_ohc=myJhFBglip8Q7kNvwFA6vv0&_nc_oc=Adlvnm0c7itGEhXsmcy-rjLkJ8ibiMHpsPvdQIyprGksadlxnjIlGvpyCz3p9GB7Oxk&_nc_zt=24&_nc_ht=scontent.fceb1-5.fna&_nc_gid=YaSzLbbpYpejFYfY-MQmeg&oh=00_AfplrFMKwKWdGDjO-q73ULeKo3hvAT0knUPhCNxhtW0Pew&oe=696551F4', reward: 'orb' },
  { id: '5', rank: 5, name: 'tayyib afd', clan: 'HÜMARI DÜNIYA', score: 9200, avatar: 'https://scontent.fceb1-5.fna.fbcdn.net/v/t39.30808-1/473012846_1616173266442229_2722726231397780187_n.jpg?stp=c0.11.720.720a_dst-jpg_s200x200_tt6&_nc_cat=110&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeGDlDA-rg3rgo7Dub6MJph2iwoN0g1aabOLCg3SDVpps1msVSevLeLqj2BvAqk83YBKgEpWVjVviinXAlZHSQ5x&_nc_ohc=1VWP4KA47l0Q7kNvwH6GLY8&_nc_oc=Admwkk9G2f72NNiE6ysTOsxYvVgfhQoNGuHoyJzS_acYat3p4iMfJeifg7fT4rbQTgo&_nc_zt=24&_nc_ht=scontent.fceb1-5.fna&_nc_gid=M-58a9ct99uvFo7uCGuBww&oh=00_AfoYM_hKv1r1O3tunlirHu5T_Kq_pex0Fs71Qcx2JaiwLg&oe=69656860', reward: 'orb' },
  { id: '6', rank: 6, name: 'Nan', clan: '', score: 8750, avatar: 'https://micomi-assets.me/Icons/Potions/strong.png', reward: 'orb' },
  { id: '7', rank: 7, name: 'Player 7', clan: 'Micomi Tribe', score: 8100, avatar: 'https://micomi-assets.me/Hero%20Selection%20Components/shi_entrance.png', reward: 'orb' },
  { id: '8', rank: 8, name: 'Player 8', clan: 'Micomi Tribe', score: 7500, avatar: 'https://micomi-assets.me/Hero%20Selection%20Components/shi_entrance.png', reward: 'orb' },
];

export default function Leaderboards() {
  
  const topThree = LEADERBOARD_DATA.slice(0, 3);

  const getRankTheme = (rank) => {
    if (rank === 1) { // Gold (Darkened)
      return {
        outerBg: '#8B6508', outerBorderTop: '#FDB931', outerBorderBottom: '#5D4037',
        middleBg: '#a2770aff', middleBorderTop: '#FFD700', middleBorderBottom: '#3E2723',
        innerBg: 'rgba(255, 215, 0, 0.1)', innerBorder: 'rgba(255, 215, 0, 0.4)',
        gradient: ['#b8860b', '#8b6508'],
        text: '#FFF',
        accentColors: ['rgba(255, 217, 0, 1)', 'transparent'],
        // Avatar borders for Rank 1
        avatarOuterBg: '#B8860B', avatarOuterBorderTop: '#FFD700', avatarOuterBorderBottom: '#8B6508',
        avatarMiddleBg: '#FFD700', avatarMiddleBorderTop: '#FFFF8D', avatarMiddleBorderBottom: '#B8860B',
        avatarInnerBg: 'rgba(255, 215, 0, 0.2)', avatarInnerBorder: 'rgba(255, 215, 0, 0.6)',
        rankBackgroundUri: 'https://micomi-assets.me/Icons/Ribbon/3_20260108_181928_0002.png'
      };
    }
    if (rank === 2) { // Silver (Darkened)
      return {
        outerBg: '#596a6b', outerBorderTop: '#bdc3c7', outerBorderBottom: '#2c3e50',
        middleBg: '#bbbbbbff', middleBorderTop: '#ecf0f1', middleBorderBottom: '#34495e',
        innerBg: 'rgba(189, 195, 199, 0.1)', innerBorder: 'rgba(189, 195, 199, 0.4)',
        gradient: ['#7f8c8d', '#556061'],
        text: '#FFF',
        accentColors: ['rgba(255,255,255,0.6)', 'transparent'],
        // Avatar borders for Rank 2
        avatarOuterBg: '#7f8c8d', avatarOuterBorderTop: '#ecf0f1', avatarOuterBorderBottom: '#596a6b',
        avatarMiddleBg: '#bdc3c7', avatarMiddleBorderTop: '#FFFFFF', avatarMiddleBorderBottom: '#7f8c8d',
        avatarInnerBg: 'rgba(189, 195, 199, 0.2)', avatarInnerBorder: 'rgba(189, 195, 199, 0.6)',
        rankBackgroundUri: 'https://micomi-assets.me/Icons/Ribbon/2_20260108_181928_0001.png'
      };
    }
    if (rank === 3) { // Bronze
      return {
        outerBg: '#7e3119ff', outerBorderTop: '#A1887F', outerBorderBottom: '#3E2723',
        middleBg: '#9f6c59ff', middleBorderTop: '#D7CCC8', middleBorderBottom: '#4E342E',
        innerBg: 'rgba(141, 110, 99, 0.1)', innerBorder: 'rgba(141, 110, 99, 0.4)',
        gradient: ['#8B4513', '#5D4037'],
        text: '#FFF',
        accentColors: ['rgba(205,127,50,0.6)', 'transparent'],
        // Avatar borders for Rank 3
        avatarOuterBg: '#8B4513', avatarOuterBorderTop: '#D2B48C', avatarOuterBorderBottom: '#5D4037',
        avatarMiddleBg: '#CD7F32', avatarMiddleBorderTop: '#F4A460', avatarMiddleBorderBottom: '#8B4513',
        avatarInnerBg: 'rgba(205, 127, 50, 0.2)', avatarInnerBorder: 'rgba(205, 127, 50, 0.6)',
        rankBackgroundUri: 'https://micomi-assets.me/Icons/Ribbon/1_20260108_181928_0000.png',
      };
    }
    // Default (Deep Blue/Slate)
    return {
      outerBg: '#1e3a5f', outerBorderTop: '#4a90d9', outerBorderBottom: '#0a1929',
      middleBg: '#152d4a', middleBorderTop: '#5a9fd4', middleBorderBottom: '#0f2536',
      innerBg: 'rgba(74, 144, 217, 0.15)', innerBorder: 'rgba(74, 144, 217, 0.3)',
      gradient: ['#0d294dff', '#09284bff'],
      text: '#FFF',
      accentColors: ['rgba(74,144,217,0.6)', 'transparent'],
      // Avatar borders for Default
      avatarOuterBg: '#1e3a5f', avatarOuterBorderTop: '#4a90d9', avatarOuterBorderBottom: '#0a1929',
      avatarMiddleBg: '#152d4a', avatarMiddleBorderTop: '#5a9fd4', avatarMiddleBorderBottom: '#0f2536',
      avatarInnerBg: 'rgba(74, 144, 217, 0.15)', avatarInnerBorder: 'rgba(74, 144, 217, 0.3)',
    };
  };

  const renderLeaderboardItem = ({ item }) => {
    const theme = getRankTheme(item.rank);

    return (
      <View style={[
        styles.card3DOuter,
        {
          backgroundColor: theme.outerBg,
          borderTopColor: theme.outerBorderTop,
          borderLeftColor: theme.outerBorderTop,
          borderBottomColor: theme.outerBorderBottom,
          borderRightColor: theme.outerBorderBottom,
        }
      ]}>
        <View style={[
          styles.card3DMiddle,
          {
            backgroundColor: theme.middleBg,
            borderTopColor: theme.middleBorderTop,
            borderLeftColor: theme.middleBorderTop,
            borderBottomColor: theme.middleBorderBottom,
            borderRightColor: theme.middleBorderBottom,
          }
        ]}>
          <View style={[
            styles.card3DInner,
            {
              backgroundColor: theme.innerBg,
              borderColor: theme.innerBorder,
            }
          ]}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.cardContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {/* Curly/Curved Decorative Gradients */}
              <View style={styles.cornerTopRight}>
                <LinearGradient 
                  colors={theme.accentColors} 
                  style={styles.cornerGradient} 
                  start={{x:1, y:0}} end={{x:0, y:1}}
                />
              </View>
              <View style={styles.cornerBottomLeft}>
                <LinearGradient 
                  colors={theme.accentColors} 
                  style={styles.cornerGradient} 
                   start={{x:0, y:1}} end={{x:1, y:0}}
                />
              </View>

              {/* Rank Badge */}
              <View style={styles.rankContainer}>
                {item.rank <= 3 ? (
                  <ImageBackground source={{ uri: theme.rankBackgroundUri }} style={[styles.rankBadge, styles[`rank${item.rank}`]]} resizeMode="contain">
                    <Text style={[styles.rankTextTop, { color: theme.rankColor || '#ffffffff' }]}>{item.rank}</Text>
                  </ImageBackground>
                ) : (
                  <Text style={[styles.rankTextPlain, { color: '#ccc' }]}>{item.rank}</Text>
                )}
              </View>

              {/* Avatar */}
              <View style={styles.cardAvatarContainer}>
                <View style={[
                    styles.avatarBorderOuter, 
                    { 
                        backgroundColor: theme.avatarOuterBg,
                        borderTopColor: theme.avatarOuterBorderTop,
                        borderLeftColor: theme.avatarOuterBorderTop,
                        borderBottomColor: theme.avatarOuterBorderBottom,
                        borderRightColor: theme.avatarOuterBorderBottom,
                    }
                ]}>
                    <View style={[
                        styles.avatarBorderMiddle, 
                        { 
                            backgroundColor: theme.avatarMiddleBg,
                            borderTopColor: theme.avatarMiddleBorderTop,
                            borderLeftColor: theme.avatarMiddleBorderTop,
                            borderBottomColor: theme.avatarMiddleBorderBottom,
                            borderRightColor: theme.avatarMiddleBorderBottom,
                        }
                    ]}>
                        <View style={[
                            styles.avatarBorderInner,
                            {
                                backgroundColor: theme.avatarInnerBg,
                                borderColor: theme.avatarInnerBorder,
                            }
                        ]}>
                            <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
                        </View>
                    </View>
                </View>
              </View>

              {/* Name & Clan */}
              <View style={styles.infoContainer}>
                <Text style={[styles.cardName, { color: theme.text }]}>{item.name}</Text>
                {item.clan ? <Text style={[styles.cardClan, { color: 'rgba(255,255,255,0.7)' }]}>{item.clan}</Text> : null}
              </View>

              {/* Score Pill */}
              <View style={styles.scoreContainer}>
                <LinearGradient 
                  colors={['rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)']} 
                  style={styles.scorePill}
                >
                  <Image source={require('../Components/icons/points.png')} style={styles.scoreIcon}/>
                  <Text style={[styles.scoreText, { color: '#fff' }]}>{item.score}</Text>
                </LinearGradient>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* --- TOP SECTION (30%) --- */}
      <View style={styles.topSection}>
        <ImageBackground
          source={require('../Components/icons/leaderboardbackground.jpeg')} // Local image background
          style={styles.topBackground}
          resizeMode="contain" // Ensure the image covers the area
        >
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <Image source={{ uri: 'https://micomi-assets.me/Icons/leaderboard/20260108_200223_0000.png' }} style={styles.headerImage} />
          </View>

          {/* Podium Area */}
          <View style={styles.podiumContainer}>
            {/* 2nd Place (Left) */}
            {topThree[1] && (
                <View style={[styles.podiumColumn, styles.podiumSecond]}>
                    <View style={styles.podiumAvatarContainer}>
                        <View style={[
                            styles.avatarBorderOuterLarge, 
                            { 
                                backgroundColor: getRankTheme(topThree[1].rank).avatarOuterBg,
                                borderTopColor: getRankTheme(topThree[1].rank).avatarOuterBorderTop,
                                borderLeftColor: getRankTheme(topThree[1].rank).avatarOuterBorderTop,
                                borderBottomColor: getRankTheme(topThree[1].rank).avatarOuterBorderBottom,
                                borderRightColor: getRankTheme(topThree[1].rank).avatarOuterBorderBottom,
                            }
                        ]}>
                            <View style={[
                                styles.avatarBorderMiddleLarge, 
                                { 
                                    backgroundColor: getRankTheme(topThree[1].rank).avatarMiddleBg,
                                    borderTopColor: getRankTheme(topThree[1].rank).avatarMiddleBorderTop,
                                    borderLeftColor: getRankTheme(topThree[1].rank).avatarMiddleBorderTop,
                                    borderBottomColor: getRankTheme(topThree[1].rank).avatarMiddleBorderBottom,
                                    borderRightColor: getRankTheme(topThree[1].rank).avatarMiddleBorderBottom,
                                }
                            ]}>
                                <View style={[
                                    styles.avatarBorderInnerLarge,
                                    {
                                        backgroundColor: getRankTheme(topThree[1].rank).avatarInnerBg,
                                        borderColor: getRankTheme(topThree[1].rank).avatarInnerBorder,
                                    }
                                ]}>
                                    <Image source={{ uri: topThree[1].avatar }} style={styles.podiumAvatar} />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.podiumName}>{topThree[1].name}</Text>
                    </View>
                </View>
            )}

            {/* 1st Place (Center - Highest) */}
            {topThree[0] && (
                <View style={[styles.podiumColumn, styles.podiumFirst]}>
                    <View style={styles.podiumAvatarContainer}>
                        <View style={styles.crownContainer}><FontAwesome5 name="crown" size={20} color="rgba(238, 179, 51, 1)" /></View>
                        <View style={[
                            styles.avatarBorderOuterExtraLarge, 
                            { 
                                backgroundColor: getRankTheme(topThree[0].rank).avatarOuterBg,
                                borderTopColor: getRankTheme(topThree[0].rank).avatarOuterBorderTop,
                                borderLeftColor: getRankTheme(topThree[0].rank).avatarOuterBorderTop,
                                borderBottomColor: getRankTheme(topThree[0].rank).avatarOuterBorderBottom,
                                borderRightColor: getRankTheme(topThree[0].rank).avatarOuterBorderBottom,
                            }
                        ]}>
                            <View style={[
                                styles.avatarBorderMiddleExtraLarge, 
                                { 
                                    backgroundColor: getRankTheme(topThree[0].rank).avatarMiddleBg,
                                    borderTopColor: getRankTheme(topThree[0].rank).avatarMiddleBorderTop,
                                    borderLeftColor: getRankTheme(topThree[0].rank).avatarMiddleBorderTop,
                                    borderBottomColor: getRankTheme(topThree[0].rank).avatarMiddleBorderBottom,
                                    borderRightColor: getRankTheme(topThree[0].rank).avatarMiddleBorderBottom,
                                }
                            ]}>
                                <View style={[
                                    styles.avatarBorderInnerExtraLarge,
                                    {
                                        backgroundColor: getRankTheme(topThree[0].rank).avatarInnerBg,
                                        borderColor: getRankTheme(topThree[0].rank).avatarInnerBorder,
                                    }
                                ]}>
                                    <Image source={{ uri: topThree[0].avatar }} style={styles.podiumAvatarLarge} />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.podiumName}>{topThree[0].name}</Text>
                    </View>
                </View>
            )}

            {/* 3rd Place (Right) */}
            {topThree[2] && (
                <View style={[styles.podiumColumn, styles.podiumThird]}>
                    <View style={styles.podiumAvatarContainer}>
                        <View style={[
                            styles.avatarBorderOuterLarge, 
                            { 
                                backgroundColor: getRankTheme(topThree[2].rank).avatarOuterBg,
                                borderTopColor: getRankTheme(topThree[2].rank).avatarOuterBorderTop,
                                borderLeftColor: getRankTheme(topThree[2].rank).avatarOuterBorderTop,
                                borderBottomColor: getRankTheme(topThree[2].rank).avatarOuterBorderBottom,
                                borderRightColor: getRankTheme(topThree[2].rank).avatarOuterBorderBottom,
                            }
                        ]}>
                            <View style={[
                                styles.avatarBorderMiddleLarge, 
                                { 
                                    backgroundColor: getRankTheme(topThree[2].rank).avatarMiddleBg,
                                    borderTopColor: getRankTheme(topThree[2].rank).avatarMiddleBorderTop,
                                    borderLeftColor: getRankTheme(topThree[2].rank).avatarMiddleBorderTop,
                                    borderBottomColor: getRankTheme(topThree[2].rank).avatarMiddleBorderBottom,
                                    borderRightColor: getRankTheme(topThree[2].rank).avatarMiddleBorderBottom,
                                }
                            ]}>
                                <View style={[
                                    styles.avatarBorderInnerLarge,
                                    {
                                        backgroundColor: getRankTheme(topThree[2].rank).avatarInnerBg,
                                        borderColor: getRankTheme(topThree[2].rank).avatarInnerBorder,
                                    }
                                ]}>
                                    <Image source={{ uri: topThree[2].avatar }} style={styles.podiumAvatar} />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.podiumName}>{topThree[2].name}</Text>
                    </View>
                </View>
            )}
          </View>
        </ImageBackground>
      </View>

  {/* Progress Bar Strip */}
      <View style={styles.progressBarStrip}>
        <Text style={styles.currentRankText}>Your Current Rank: 10th</Text>
      </View>
      {/* --- BOTTOM SECTION (70%) --- */}
      <View style={styles.bottomSection}>
        <LinearGradient
          colors={['#2e003e', '#1a0b2e']} // Deep purple list background
          style={styles.listBackground}
        >
          <FlatList
            data={LEADERBOARD_DATA}
            keyExtractor={(item) => item.id}
            renderItem={renderLeaderboardItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </LinearGradient>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  
  // --- TOP SECTION ---
  topSection: {
    flex: 0.38, 
    width: '100%',
  },
  topBackground: {
    width: gameScale(420),
    height: gameScale(420),
    alignSelf: 'center',
    marginTop: -gameScale(50),
  },
  headerBanner: {
    position: 'absolute',
    top: gameScale(70),
    alignItems: 'center',
    marginBottom: gameScale(10),
    width: '100%',
  },
  headerImage: {
    width: gameScale(350),
    height: gameScale(70),
    resizeMode: 'contain',
    borderRadius: gameScale(20),
  },
  
  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flex: 1,
    marginBottom: gameScale(103),
    gap: gameScale(5)
  },
  podiumColumn: {
    alignItems: 'center',
    width: width * 0.28,
  },
  podiumAvatarContainer: {
    alignItems: 'center',
    marginBottom: gameScale(5),
    
  },
  crownContainer: {
    marginBottom: -gameScale(5),
    zIndex: 10,
  },
  podiumAvatar: {
    width: gameScale(40),
    height: gameScale(40),
    borderRadius: gameScale(20),
  },
  podiumAvatarLarge: {
    width: gameScale(55),
    height: gameScale(55),
    borderRadius: gameScale(27.5),
  },
  podiumName: {
    color: '#000000ff',
    fontSize: gameScale(15),
    paddingHorizontal: 4,
    fontFamily: 'Grobold',
    borderRadius: gameScale(5),
    borderRightWidth: gameScale(1),
    borderLeftWidth: gameScale(1),
    borderColor: '#000000ff',
    textAlign: 'center',
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: gameScale(5),
    borderTopRightRadius: gameScale(5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
  },
  podiumRank: {
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowRadius: 2,
  },
  podiumSecond: { zIndex: 1 },
  podiumFirst: { zIndex: 2, marginBottom: gameScale(70) },
  podiumThird: { zIndex: 0, marginBottom: gameScale(-6) },

  // Progress Bar
   progressBarStrip: {
    width: '100%',
    height: gameScale(40),
    backgroundColor: '#077fa3ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gameScale(20),
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffffff',
  },
   currentRankText: {
    color: 'white',
    fontSize: gameScale(16),
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
    },
  progressBarContainer: {
    flex: 1,
    height: gameScale(20),
    backgroundColor: '#2a2a2a',
    borderRadius: gameScale(10),
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#111',
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'white',
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },

  // --- BOTTOM SECTION ---
  bottomSection: {
    flex: 0.62, 
    width: '100%',
  },
  listBackground: {
    flex: 1,
  },
  listContent: {
    padding: gameScale(10),
    paddingBottom: gameScale(50),
  },

  // 3D Card Styles
  card3DOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    shadowColor: '#000',
    shadowOffset: { width: gameScale(2), height: gameScale(3) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(4),
    elevation: 5,
    overflow: 'hidden',
    borderRadius: gameScale(10),
    marginBottom: gameScale(8),
  },
  card3DMiddle: {
    flex: 1,
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(10),
    overflow: 'hidden',
  },
  card3DInner: {
    flex: 1,
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gameScale(10),
    minHeight: gameScale(55),
    position: 'relative',
  },
  
  // Decorative Corners
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: gameScale(100),
    height: gameScale(30),
    borderBottomLeftRadius: gameScale(30),
    overflow: 'hidden',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: gameScale(100),
    height: gameScale(30),
    borderTopRightRadius: gameScale(30),
    overflow: 'hidden',
  },
  cornerGradient: {
    flex: 1,
  },

  // Columns
  rankContainer: {
    width: '10%',
    alignItems: 'center',
    justifyContent: 'center',

  },
  rankBadge: {
    width: gameScale(69),
    height: gameScale(69),
    position: 'absolute',
    top: -gameScale(32),
    justifyContent: 'center',
    alignItems: 'center'
  },
  rankTextTop: {
    fontSize: gameScale(18),
    marginTop: -gameScale(20),
    fontFamily: 'Grobold',
    textShadowColor: 'black',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
    textShadowColor: 'rgba(0, 0, 0, 1)',
  },
  rankTextPlain: {
    fontSize: gameScale(20),
    fontFamily: 'Grobold',
    
    textShadowColor: 'black',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
    textShadowColor: 'rgba(0, 0, 0, 1)',
  },
  
  cardAvatarContainer: {
    width: '18%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatar: {
    width: gameScale(35),
    height: gameScale(35),
    borderRadius: gameScale(16),
    // borderWidth: 1, // Removed, handled by 3D border
    // borderColor: 'rgba(255,255,255,0.5)', // Removed, handled by 3D border
  },
  
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: gameScale(5),
  },
  cardName: {
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    textShadowColor: 'black',
    textShadowRadius: 1,
  },
  cardClan: {
    fontSize: gameScale(9),
    fontFamily: 'Computerfont',
  },
  
  scoreContainer: {
    width: '20%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: gameScale(5)
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(2),
    borderRadius: gameScale(8),
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scoreText:{
  fontSize:gameScale(10),
  fontFamily: 'Grobold',
  },
    // New 3D Avatar Border Styles (for card avatars)
  avatarBorderOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(1.5) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(2),
    elevation: 3,
  },
  avatarBorderMiddle: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(18),
    overflow: 'hidden',
  },
  avatarBorderInner: {
    borderRadius: gameScale(16),
    borderWidth: gameScale(1),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // New 3D Avatar Border Styles (for podium avatars - large)
  avatarBorderOuterLarge: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(22),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1.5), height: gameScale(2) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(3),
    elevation: 4,
  },
  avatarBorderMiddleLarge: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(20),
    overflow: 'hidden',
  },
  avatarBorderInnerLarge: {
    borderRadius: gameScale(18),
    borderWidth: gameScale(1),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // New 3D Avatar Border Styles (for podium avatars - extra large, rank 1)
  avatarBorderOuterExtraLarge: {
    borderWidth: gameScale(1.5),
    padding: gameScale(1.5),
    borderRadius: gameScale(30),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(2), height: gameScale(2.5) },
    shadowOpacity: 0.7,
    shadowRadius: gameScale(4),
    elevation: 6,
  },
  avatarBorderMiddleExtraLarge: {
    borderWidth: gameScale(1.5),
    padding: gameScale(1.5),
    borderRadius: gameScale(28.5),
    overflow: 'hidden',
  },
  avatarBorderInnerExtraLarge: {
    borderRadius: gameScale(27),
    borderWidth: gameScale(1.5),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreIcon: {
    width: gameScale(12),
    height: gameScale(12),
    resizeMode: 'contain',
  },
});