import { View, Image, StyleSheet, Dimensions, ImageBackground, Pressable, Animated, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_THEME } from '../MapLevel/MapDatas/mapData';
import LevelModal from '../../Actual Game/Level Intro and Outro/LevelModal';
import { useLevelData } from '../../../hooks/useLevelData';
import { mapAssetPreloader } from '../../../services/mapAssetPreloader'; 

const { height: defaultHeight, width: defaultWidth } = Dimensions.get('window');

const BASE_HEIGHT = 844;
const BASE_WIDTH = 390;
const PATTERN_HEIGHT = 700;
const STONES_PER_PATTERN = 37;

const BASE_STONE_PATTERN = [
  { top: 220, left: '50%' }, { top: 240, left: '55%' }, { top: 260, left: '60%' }, 
  { top: 280, left: '65%' }, { top: 300, left: '68%' }, { top: 320, left: '69%' }, 
  { top: 340, left: '70%' }, { top: 360, left: '72%' }, { top: 380, left: '72%' }, 
  { top: 400, left: '73%' }, { top: 415, left: '73%' }, { top: 432, left: '72%' }, 
  { top: 452, left: '70%' }, { top: 469, left: '68%' }, { top: 484, left: '65%' }, 
  { top: 502, left: '60%' }, { top: 515, left: '56%' }, { top: 540, left: '50%' }, 
  { top: 560, left: '45%' }, { top: 580, left: '40%' }, { top: 600, left: '34%' }, 
  { top: 614, left: '30%' }, { top: 632, left: '25%' }, { top: 650, left: '20%' }, 
  { top: 670, left: '15%' }, { top: 690, left: '13%' }, { top: 710, left: '12%' }, 
  { top: 730, left: '10%' }, { top: 750, left: '10%' }, { top: 770, left: '10%' },  
  { top: 790, left: '15%' }, { top: 810, left: '20%' }, { top: 830, left: '25%' }, 
  { top: 850, left: '30%' }, { top: 870, left: '35%' }, { top: 890, left: '40%' }, 
  { top: 900, left: '45%' }
];

const BUTTON_PATTERNS = [
  { top: 350, left: '70%' },
  { top: 540, left: '48%' },
  { top: 735, left: '10%' },
  { top: 900, left: '44%' }
];

export default function LevelButtons({ 
  lessons, 
  handleLevelPress, 
  screenHeight = defaultHeight, 
  screenWidth = defaultWidth,
  theme = DEFAULT_THEME,
  playerId = 11,
  navigation = null
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const { getLevelPreview } = useLevelData();
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [levelPreviewData, setLevelPreviewData] = useState(null);

  const getCachedAssetUrl = (url) => {
    return mapAssetPreloader.getCachedAssetPath(url);
  };

 const ICON_IMAGES = {
    enemyButton: getCachedAssetUrl(theme?.icons?.enemyButton || DEFAULT_THEME.icons.enemyButton),
    micomiButton: getCachedAssetUrl(theme?.icons?.micomiButton || DEFAULT_THEME.icons.micomiButton),
    shopButton: getCachedAssetUrl(theme?.icons?.shopButton || DEFAULT_THEME.icons.shopButton),
    bossButton: getCachedAssetUrl(theme?.icons?.bossButton || DEFAULT_THEME.icons.bossButton),
  };


    const BUTTON_IMAGES = {
    unlockedButton: getCachedAssetUrl(theme?.buttons?.unlockedButton || DEFAULT_THEME.buttons.unlockedButton),
    lockedButton: getCachedAssetUrl(theme?.buttons?.lockedButton || DEFAULT_THEME.buttons.lockedButton)
  };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true
        })
      ])
    );
    
    animation.start();
    return () => animation.stop();
  }, [floatAnim]);

  const responsive = {
    heightRatio: screenHeight / BASE_HEIGHT,
    widthRatio: screenWidth / BASE_WIDTH,
    get buttonSize() { return Math.min(100 * this.widthRatio, 100 * this.heightRatio); },
    get stoneSize() { return Math.min(100 * this.widthRatio, 100 * this.heightRatio); },
    get signageScale() { 
      return Math.min(this.widthRatio, this.heightRatio);
    },
    get signageWidth() { return 90 * this.signageScale; },
    get signageHeight() { return 90 * this.signageScale; },
    get signageTop() { return 20 * this.heightRatio; },
    get signageLeft() { return 40 * this.widthRatio; },
    get textSize() { 
      const baseSize = 12;
      let scaleFactor = this.signageScale;
      const scaledSize = baseSize * scaleFactor;
      return Math.max(8, Math.min(scaledSize, 20)); 
    }
  };

  const floatTransform = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15] 
  });

  // Handle level button press - show modal instead of direct navigation
    const handleLevelButtonPress = async (level) => {
    if (level.is_unlocked === false) {
      console.log('Level is locked:', level.level_number);
      return;
    }

    console.log('🎮 Level button pressed:', {
      levelId: level.level_id,
      levelNumber: level.level_number,
      levelTitle: level.level_title
    });

    try {
      // Fetch level preview data
      const previewResponse = await getLevelPreview(level.level_id, playerId);
      
      if (previewResponse.success) {
        setLevelPreviewData(previewResponse.data);
        setSelectedLevelId(level.level_id); // This is the API levelId
        setModalVisible(true);
      } else {
        console.error('Failed to fetch level preview:', previewResponse.error);
        // Fallback: use existing level data for modal
        setLevelPreviewData(level);
        setSelectedLevelId(level.level_id); // Use API levelId
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching level preview:', error);
      // Fallback: use existing level data for modal
      setLevelPreviewData(level);
      setSelectedLevelId(level.level_id); // Use API levelId
      setModalVisible(true);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedLevelId(null);
    setLevelPreviewData(null);
  };

  // Handle play button from modal
   const handleModalPlay = (levelData) => {
    console.log('🎮 Play button pressed from modal (fallback):', levelData);
    
    // This is now a fallback - LevelModal should handle navigation directly
    handleModalClose();
    
    if (navigation) {
      navigation.navigate('GamePlay', {
        playerId: playerId,
        levelId: selectedLevelId, // API levelId
        levelData: levelData
      });
    } else if (handleLevelPress) {
      // Legacy fallback
      const originalLevel = lessons.find(level => level.level_id === selectedLevelId);
      handleLevelPress(originalLevel || levelData);
    }
  };

  const generateStonePositions = () => {
    if (!lessons?.length) return [];
    
    const totalStones = Math.ceil(lessons.length / 4) * STONES_PER_PATTERN;
    const positions = [];
    const patternHeight = PATTERN_HEIGHT * responsive.heightRatio;

    for (let i = 0; i < totalStones; i++) {
      const patternIndex = i % STONES_PER_PATTERN;
      const loopNumber = Math.floor(i / STONES_PER_PATTERN);
      const baseStone = BASE_STONE_PATTERN[patternIndex];
      
      positions.push({
        top: (baseStone.top * responsive.heightRatio) + (loopNumber * patternHeight),
        left: baseStone.left
      });
    }
    return positions;
  };

  const getButtonPosition = (index) => {
    if (index === 0) {
      return {
        top: 200 * responsive.heightRatio,
        left: '45%'
      };
    }

    const patternIndex = (index - 1) % 4;
    const loopNumber = Math.floor((index - 1) / 4);
    const pattern = BUTTON_PATTERNS[patternIndex];
    
    return {
      top: (pattern.top * responsive.heightRatio) + (loopNumber * PATTERN_HEIGHT * responsive.heightRatio),
      left: pattern.left
    };
  };

  const getButtonType = (level) => {
    return level.is_unlocked === false ? 'lockedButton' : 'unlockedButton';
  };
  
  const getIconType = (level) => {
    const levelType = level.level_type;
    
    const typeMap = {
      enemyLevel: 'enemyButton',
      enemyButton: 'enemyButton', 
      micomiButton: 'micomiButton',
      shopButton: 'shopButton',
      bossButton: 'bossButton',
      enemy: 'enemyButton',
      micomi: 'micomiButton',
      shop: 'shopButton',
      boss: 'bossButton'
    };
    
    return typeMap[levelType] || 'enemyButton';
  };

  const stonePositions = generateStonePositions();

  if (!lessons?.length) {
    return (
      <View style={styles.buttonContainer}>
        <Text style={styles.noLessonsText}>Loading levels...</Text>
      </View>
    );
  }   

  console.log('🔥 Rendering buttons for levels:', lessons);

  return (
    <>
       <View style={styles.buttonContainer}>
        {stonePositions.map((position, index) => (
          <Image
            key={`stone-${index}`}
            source={{ uri: getCachedAssetUrl(theme?.stones?.stoneImage || DEFAULT_THEME.stones.stoneImage) }} // ✅ Use cached asset
            style={[
              styles.stones,
              {
                top: position.top,
                left: position.left,
                width: responsive.stoneSize,
                height: responsive.stoneSize,
              }
            ]}
            resizeMode="cover"
          />
        ))}

        {lessons.map((level, index) => {
          const iconType = getIconType(level);
          const buttonType = getButtonType(level);
          const position = getButtonPosition(index);
          
          const isUnlocked = level.is_unlocked === true;
          const isLocked = level.is_unlocked === false;

          console.log(`🎯 Level ${level.level_number}: type=${level.level_type}, unlocked=${level.is_unlocked}, icon=${iconType}, button=${buttonType}`);

          return (
            <Pressable
              key={level.level_id || index}
              style={[
                styles.levelButton,
                {
                  top: position.top,
                  left: position.left,
                  width: responsive.buttonSize,
                  height: responsive.buttonSize,
                }
              ]}
              onPress={() => handleLevelButtonPress(level)}
              disabled={isLocked}
            >
              <ImageBackground 
                source={{ uri: getCachedAssetUrl(theme?.buttons?.buttonBackground) }}
                style={[styles.buttonImageBackground, theme?.buttons?.buttonBackgroundStyle]}
                resizeMode="contain"
              >
                <Image
                  source={{ uri: BUTTON_IMAGES[buttonType] }}
                  style={[
                    isLocked ? styles.lockedButton : styles.unlockedButton, 
                    isLocked 
                      ? theme?.buttons?.lockedButtonStyle || {}
                      : theme?.buttons?.unlockedButtonStyle || {}
                  ]}
                  resizeMode="contain"
                />
              </ImageBackground>

              {level.level_title && 
               level.level_title !== 'null' && 
               level.level_title.toString().trim() !== '' && 
               level.level_title.toString().trim().toLowerCase() !== 'none' && (
                <ImageBackground
                  source={{ uri: getCachedAssetUrl(theme.floatingComment.signageBackground) }}
                  style={[
                    styles.signage,
                    {
                      width: responsive.signageWidth,
                      height: responsive.signageHeight,
                      top: responsive.signageTop,
                      left: responsive.signageLeft,
                    }, 
                    theme?.floatingComment?.signageBackgroundStyle || {}
                  ]}
                  resizeMode="contain"
                >
                  <Text 
                    style={[
                      styles.tagsText, 
                      { fontSize: responsive.textSize }, 
                      theme?.floatingComment.textStyle || {}
                    ]} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true}
                  >
                    {level.level_title}
                  </Text>
                </ImageBackground>
              )}

              {isUnlocked && (
                <Animated.View
                  style={[
                    styles.floatComment,
                    { transform: [{ translateY: floatTransform }] }
                  ]}
                >
                  <ImageBackground 
                    source={{ uri: getCachedAssetUrl(theme?.floatingComment?.commentBackground || DEFAULT_THEME.floatingComment.commentBackground) }} 
                    style={[styles.floatComment, theme?.floatingComment?.commentBackgroundStyle || {}]}
                    resizeMode="contain"
                  >
                    <Image
                      source={{ uri: ICON_IMAGES[iconType] }}
                      style={[styles.floatIcon, theme?.icons?.iconStyles || {}]}
                      resizeMode="contain"
                    />
                  </ImageBackground>
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Level Modal */}
      <LevelModal
        visible={modalVisible}
        onClose={handleModalClose}
        onPlay={handleModalPlay}
        levelId={selectedLevelId}
        playerId={playerId}
        levelData={levelPreviewData}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  signage: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5
  },
  tagsText: {
    color: '#FFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'FunkySign',
    marginTop: -35,
    opacity: 0.8
  },
  levelButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  floatComment: {
    position: 'absolute',
    width: '95%',
    height: '95%',
    top: -35,
    alignItems: 'center',
    zIndex: 25,
  },
  unlockedButton: {
    width: '130%',
    height: '130%',
    top: -25,
    left: -2
  },
  lockedButton: {
    width: '110%',
    height: '110%',
    top: -25,
    left: -2
  },
  floatIcon: {
    width: '80%',
    height: '80%',
    top: 7,
    opacity: 0.7,
    right: 2
  },
  buttonImageBackground: {
    width: '100%', 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noLessonsText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  stones: {
    position: 'absolute',
    zIndex: 2,
  }
});