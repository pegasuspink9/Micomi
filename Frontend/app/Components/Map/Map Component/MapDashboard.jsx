import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { gameScale } from '../../Responsiveness/gameResponsive';

const { height: screenHeight } = Dimensions.get('window');

// Image mapping based on map_name
const MAP_STATIC_IMAGES = {
  HTML: 'https://micomi-assets.me/Pvp%20Assets/Languages/HTML.png',
  CSS: 'https://micomi-assets.me/Pvp%20Assets/Languages/CSSS.png',
  JavaScript: 'https://micomi-assets.me/Pvp%20Assets/Languages/JS.png',
  Computer: 'https://micomi-assets.me/Pvp%20Assets/Languages/CP.png',
};

const MapDashboard = ({ mapData, onClose, onEnter }) => {
  // Reorder enemies: "is_defeated": true goes first
  const enemies = useMemo(() => {
    const list = mapData?.enemies || [];
    return [...list].sort((a, b) => {
      const aDefeated = Boolean(a?.is_defeated) ? 1 : 0;
      const bDefeated = Boolean(b?.is_defeated) ? 1 : 0;
      return bDefeated - aDefeated; // 1 (true) comes before 0 (false)
    });
  }, [mapData?.enemies]);

  const mapName = mapData?.map_name || 'Unknown';
  const mapDescription = mapData?.description || 'No description available.';
  const isActive = Boolean(mapData?.is_active);

  // Get mapped static image depending on map name, fallback to Computer if unknown
  const mapImageSource = useMemo(() => {
    if (MAP_STATIC_IMAGES[mapName]) {
      return { uri: MAP_STATIC_IMAGES[mapName] };
    }
    return { uri: MAP_STATIC_IMAGES.Computer };
  }, [mapName]);

  return (
    <View style={styles.mapModalOverlay}>
      <View style={styles.mapModalWoodyFrame}>
        <View style={[styles.cornerDot, styles.dotTopLeft]} />
        <View style={[styles.cornerDot, styles.dotTopRight]} />
        <View style={[styles.cornerDot, styles.dotBottomLeft]} />
        <View style={[styles.cornerDot, styles.dotBottomRight]} />

        <View style={styles.woodySlotContent}>
          <View style={styles.mapModalInnerContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.rowSection, styles.rowSplit]}>
                {/* 30% Width Column */}
                <View style={styles.mapVisualColumn}>
                  <Text style={styles.mapNameText} numberOfLines={1}>{mapName}</Text>
                  <View style={styles.mapBox}>
                    <Image
                      source={mapImageSource}
                      style={styles.mapStaticImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* 70% Width Column */}
                <View style={styles.descriptionColumn}>
                  <Text style={styles.sectionLabel}>Description</Text>
                  <View style={styles.descriptionBox}>
                    {/* nestedScrollEnabled is required for ScrollViews inside ScrollViews */}
                    <ScrollView 
                      nestedScrollEnabled={true} 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.descriptionScrollContent}
                    >
                      <Text style={styles.descriptionText}>{mapDescription}</Text>
                    </ScrollView>
                  </View>
                </View>
              </View>

              <View style={styles.rowSection}>
                <Text style={styles.sectionLabel}>Enemies</Text>
                {/* Scrollable Container Fixed to ~3 Rows Minimum */}
                <View style={styles.enemyGridContainer}>
                  <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                    <View style={styles.enemyGrid}>
                      {enemies.map((enemy, index) => {
                        const isDefeated = Boolean(enemy?.is_defeated);
                        const enemySource = enemy?.avatar_enemy
                          ? { uri: enemy.avatar_enemy }
                          : null;
                        const tintColor = isDefeated ? undefined : 'rgba(90, 90, 90, 0.75)';

                        return (
                          <View key={`${enemy?.enemy_name || 'enemy'}-${index}`} style={styles.enemyCard}>
                            <View style={styles.enemyImageWrapper}>
                              {enemySource ? (
                                <Image
                                  source={enemySource}
                                  style={[styles.enemyImage, tintColor ? { tintColor } : null]}
                                  resizeMode="contain"
                                />
                              ) : (
                                <View style={styles.enemyPlaceholder} />
                              )}
                              
                              {/* Conditionally render the name only if the enemy is defeated */}
                              {isDefeated && (
                                <View style={styles.enemyNamePill}>
                                  <Text style={styles.enemyNameText} numberOfLines={1}>
                                    {enemy?.enemy_name || 'Enemy'}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Lessons</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Levels</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Challenges</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.smallButton} onPress={onClose}>
                <Text style={styles.smallButtonText}>Close</Text>
              </TouchableOpacity>
              {isActive ? (
                <TouchableOpacity style={styles.smallButton} onPress={onEnter}>
                  <Text style={styles.smallButtonText}>Enter</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.smallButton, styles.disabledButton]}>
                  <Text style={[styles.smallButtonText, styles.disabledButtonText]}>Locked</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const cardHeight = gameScale(140);

// Reusable 3D inner border styles (Outset effect)
const inner3DWoodBorder = {
  borderWidth: 1.5,
  borderColor: '#d08b4a',       // Light highlight (top/left)
  borderBottomColor: '#2b1100', // Dark shadow (bottom)
  borderRightColor: '#3a1700',  // Dark shadow (right)
  backgroundColor: '#4b2203',
};

const styles = StyleSheet.create({
  mapModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  mapModalWoodyFrame: {
    width: '90%',
    height: screenHeight * 0.78,
    backgroundColor: '#943f02',
    borderRadius: 16,
    padding: 6,
    elevation: 20,
    borderColor: '#c46623',
    borderWidth: 2,
    borderBottomColor: '#4a1e00',
    borderRightColor: '#6e2f01',
  },
  woodySlotContent: {
    flex: 1,
    backgroundColor: '#7c3200',
    borderRadius: 12,
    padding: 4,
  },
  mapModalInnerContainer: {
    flex: 1,
    backgroundColor: '#5e2a05',
    borderRadius: 10,
    padding: gameScale(12),
  },
  scrollContent: {
    paddingBottom: gameScale(56),
  },
  rowSection: {
    marginBottom: gameScale(14),
  },
  rowSplit: {
    flexDirection: 'row',
    gap: gameScale(10),
  },
  mapVisualColumn: {
    flex: 3, // Takes 30% of space
  },
  descriptionColumn: {
    flex: 7, // Takes 70% of space
  },
  mapNameText: {
    fontFamily: 'Grobold',
    color: '#FFD879',
    fontSize: gameScale(14), // Slightly lowered so it easily fits the 30% width
    marginBottom: gameScale(6),
    textAlign: 'left',
  },
  sectionLabel: {
    fontFamily: 'Grobold',
    color: '#FFD879',
    fontSize: gameScale(13),
    marginBottom: gameScale(6),
  },
  mapBox: {
    ...inner3DWoodBorder,
    height: cardHeight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapStaticImage: {
    width: '130%',
    height: '130%',
  },
  descriptionBox: {
    ...inner3DWoodBorder,
    height: cardHeight,
    borderRadius: 12,
    padding: gameScale(8),
  },
  descriptionScrollContent: {
    flexGrow: 1,
    paddingBottom: gameScale(8),
  },
  descriptionText: {
    color: '#fff3d1',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
    lineHeight: gameScale(16),
  },
  enemyGridContainer: {
    height: gameScale(286), // Ensures area for exactly 3 rows minimum
  },
  enemyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gameScale(8),
  },
  enemyCard: {
    width: '30%',
    minWidth: gameScale(86),
  },
  enemyImageWrapper: {
    ...inner3DWoodBorder,
    height: gameScale(90),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  enemyImage: {
    position: 'absolute',
    width: '140%',
    height: '140%', 
    top: '-17.5%',
    left: '-17.5%',
  },
  enemyPlaceholder: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  enemyNamePill: {
    position: 'absolute',
    bottom: 2,
    left: 6,
    right: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  enemyNameText: {
    color: '#ffffff',
    fontFamily: 'Grobold',
    fontSize: gameScale(10),
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: gameScale(8),
    marginBottom: gameScale(8),
  },
  statCard: {
    ...inner3DWoodBorder,
    flex: 1,
    borderRadius: 10,
    paddingVertical: gameScale(8),
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(16),
  },
  statLabel: {
    color: '#ffd9a3',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(10),
  },
  actionButtons: {
    position: 'absolute',
    right: gameScale(12),
    bottom: gameScale(10),
    flexDirection: 'row',
    gap: gameScale(6),
  },
  smallButton: {
    ...inner3DWoodBorder,
    backgroundColor: '#6f2f00',
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(6),
    borderRadius: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(11),
  },
  disabledButton: {
    backgroundColor: '#3d2a1b',
    borderColor: '#5a3b25',
    borderBottomColor: '#20130c',
    borderRightColor: '#281810',
  },
  disabledButtonText: {
    color: '#c3b3a0',
  },
  cornerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4a1e00',
    borderColor: '#c46623',
    borderWidth: 1,
    zIndex: 2,
  },
  dotTopLeft: { top: 6, left: 6 },
  dotTopRight: { top: 6, right: 6 },
  dotBottomLeft: { bottom: 6, left: 6 },
  dotBottomRight: { bottom: 6, right: 6 },
});

export default MapDashboard;