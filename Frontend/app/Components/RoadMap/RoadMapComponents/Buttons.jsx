import { View, Image, StyleSheet, Dimensions, ImageBackground, Pressable, Animated, Text, StatusBar } from 'react-native'; 
import { useEffect, useRef, useState, useMemo } from 'react';
import { gameScale } from '../../Responsiveness/gameResponsive';
import { DEFAULT_THEME } from '../MapLevel/MapDatas/mapData';
import LevelModal from '../../Actual Game/Level Intro and Outro/LevelModal';
import { useLevelData } from '../../../hooks/useLevelData';
import { universalAssetPreloader } from '../../../services/preloader/universalAssetPreloader';
import { useRouter } from 'expo-router'; 

const { height: defaultHeight, width: defaultWidth } = Dimensions.get('window');

const BASE_HEIGHT = 844;
const BASE_WIDTH = 390;
const PATTERN_HEIGHT = 700;
const STONES_PER_PATTERN = 37;

// Star Image URL
const starImage = require('../stars.png');

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
  navigation = null
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const processingPress = useRef(false); 
  const { getLevelPreview } = useLevelData();
  const router = useRouter();
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [levelPreviewData, setLevelPreviewData] = useState(null);

  const getCachedAssetUrl = (url) => {
    return universalAssetPreloader.getCachedAssetPath(url);
  };

 const ICON_IMAGES = useMemo(() => ({
    enemyButton: getCachedAssetUrl(theme?.icons?.enemyButton || DEFAULT_THEME.icons.enemyButton),
    micomiButton: getCachedAssetUrl(theme?.icons?.micomiButton || DEFAULT_THEME.icons.micomiButton),
    shopButton: getCachedAssetUrl(theme?.icons?.shopButton || DEFAULT_THEME.icons.shopButton),
    bossButton: getCachedAssetUrl(theme?.icons?.bossButton || DEFAULT_THEME.icons.bossButton),
  }), [theme?.icons]);

  const BUTTON_IMAGES = useMemo(() => ({
    unlockedButton: getCachedAssetUrl(theme?.buttons?.unlockedButton || DEFAULT_THEME.buttons.unlockedButton),
    lockedButton: getCachedAssetUrl(theme?.buttons?.lockedButton || DEFAULT_THEME.buttons.lockedButton)
  }), [theme?.buttons]);

  const cachedStoneImage = useMemo(() => 
    getCachedAssetUrl(theme?.stones?.stoneImage || DEFAULT_THEME.stones.stoneImage), 
    [theme?.stones?.stoneImage]
  );

  const cachedButtonBackground = useMemo(() => 
    getCachedAssetUrl(theme?.buttons?.buttonBackground), 
    [theme?.buttons?.buttonBackground]
  );

  const cachedCommentBackground = useMemo(() => 
    getCachedAssetUrl(theme?.floatingComment?.commentBackground || DEFAULT_THEME.floatingComment.commentBackground), 
    [theme?.floatingComment?.commentBackground]
  );

  const cachedSignageBackground = useMemo(() => 
    getCachedAssetUrl(theme?.floatingComment?.signageBackground), 
    [theme?.floatingComment?.signageBackground]
  );
  

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
    get signageTop() { return 15 * this.heightRatio; },
    get signageLeft() { return 40 * this.widthRatio; },
    get textSize() { 
      const baseSize = 22;
      let scaleFactor = this.signageScale;
      const scaledSize = baseSize * scaleFactor;
      return Math.max(30, Math.min(scaledSize, 20)); 
    }
  };

  const floatTransform = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, gameScale(-15)] 
  });

  // Handle level button press - show modal instead of direct navigation
   const handleLevelButtonPress = async (level) => {
    if (processingPress.current || modalVisible || level.is_unlocked === false) {
      return;
    }

    processingPress.current = true; 

     console.log('🎮 Level button pressed:', {
      levelId: level.level_id,
      levelNumber: level.level_number,
      levelTitle: level.level_title,
      levelType: level.level_type 
    });

     if (level.level_type === 'micomiButton') {
      console.log('Navigating directly to Micomic for level:', level.level_id);
      router.push(`/Micomic?levelId=${level.level_id}`);
      processingPress.current = false;
      return; 
    }

    // IMMEDIATELY open modal and show the "Robot Shell" while we load backend data
    setSelectedLevelId(level.level_id);
    setLevelPreviewData(null); // Ensure LevelModal sees this as empty and fetches fresh data
    setModalVisible(true);

    try {
      // Background task: trigger asset pre-loading to speed up transition
      universalAssetPreloader.loadCachedAssets('game_animations');
      universalAssetPreloader.loadCachedAssets('game_images');
      universalAssetPreloader.loadCachedAssets('map_theme_assets');

      // The LevelModal component itself will detect !levelData and fetch from backend.
      // We reset processingPress here so the user can click again (if they close the modal).
      processingPress.current = false;
    } catch (error) {
      console.error('Error starting level sequence:', error);
      processingPress.current = false;
    }
  };

const transformPreviewDataWithCache = (data) => {
  if (!data) return data;

  const transformed = { ...data };

  // Transform enemy avatar
  if (transformed.enemy?.enemy_avatar) {
    const cachedPath = universalAssetPreloader.getCachedAssetPath(transformed.enemy.enemy_avatar);
    if (cachedPath !== transformed.enemy.enemy_avatar) {
      console.log(`📦 Buttons: Using cached enemy avatar`);
      transformed.enemy = {
        ...transformed.enemy,
        enemy_avatar: cachedPath
      };
    }
  }

  // Transform character avatar
  if (transformed.character?.character_avatar) {
    const cachedPath = universalAssetPreloader.getCachedAssetPath(transformed.character.character_avatar);
    if (cachedPath !== transformed.character.character_avatar) {
      console.log(`📦 Buttons: Using cached character avatar`);
      transformed.character = {
        ...transformed.character,
        character_avatar: cachedPath
      };
    }
  }

  return transformed;
};

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedLevelId(null);
    setLevelPreviewData(null);
    processingPress.current = false;
  };

  // Handle play button from modal
   const handleModalPlay = (levelData) => {
    console.log('🎮 Play button pressed from modal (fallback):', levelData);
    
    // This is now a fallback - LevelModal should handle navigation directly
    handleModalClose();
    
    if (navigation) {
      navigation.navigate('GamePlay', {
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

  // ✅ Helper to render stars in a curved/arch layout
    const renderStars = (count) => {
    // Configurations for positioning stars in an arc
    const starLayouts = {
      1: [{ translateY: 0, rotate: '0deg', scale: 1.2 }],
      2: [
        { translateY: gameScale(5), rotate: '-10deg', scale: 1 }, 
        { translateY: gameScale(5), rotate: '15deg', scale: 1 }
      ],
      3: [
        { translateY: gameScale(10), rotate: '-25deg', scale: 0.9 }, 
        { translateY: 0, rotate: '0deg', scale: 1.2 }, 
        { translateY: gameScale(10), rotate: '25deg', scale: 0.9 }
      ]
    };

    const layout = starLayouts[count] || [];

    return (
      <View style={styles.starWrapper}>
        {layout.map((style, i) => (
          <Image
            key={i}
            source={starImage} 
            style={[
              styles.starIcon,
              { 
                transform: [
                  { translateY: style.translateY }, 
                  { rotate: style.rotate },
                  { scale: style.scale }
                ] 
              }
            ]}
            resizeMode="contain"
          />
        ))}
      </View>
    );
  };

  console.log('🔥 Rendering buttons for levels:', lessons);

  return (
    <>
      <View style={styles.buttonContainer}>
        {/*  Stones using cached image */}
        {stonePositions.map((position, index) => (
          <Image
            key={`stone-${index}`}
            source={{ uri: cachedStoneImage }}
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
          const isCurrentFocus = level.isCurrentUnlocked === true;

          const starCount = level.playerProgress?.[0]?.stars_earned || 0;
          const hasStars = starCount > 0;

          
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
            },
            isCurrentFocus && styles.currentLevelFocus
          ]}
          onPress={() => handleLevelButtonPress(level)}
          disabled={isLocked}
        >
          {/* ✅ CURRENT FOCUS INDICATOR (Visual Glow) */}
          {isCurrentFocus && (
            <View style={[
              styles.focusIndicator,
              {
                width: responsive.buttonSize * 1.3,
                height: responsive.buttonSize * 1.3,
              }
            ]} />
          )}
              {/*  Button background using cached image */}
              <ImageBackground 
                source={{ uri: cachedButtonBackground }}
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

              {/*  Signage using cached image */}
              {level.level_number && 
               level.level_number !== 'null' && 
               level.level_number.toString().trim() !== '' && 
               level.level_number.toString().trim().toLowerCase() !== 'none' && (
                <ImageBackground
                  source={{ uri: cachedSignageBackground }}
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
                      theme?.floatingComment?.textStyle || {}
                    ]} 
                  >
                    {level.level_number}
                  </Text>
                </ImageBackground>
              )}

              {/* ✅ CONDITIONAL RENDERING: Stars (Static) OR Float Icon (Animated) */}
              {isUnlocked && (
                <View style={styles.floatElementContainer}>
                  {hasStars ? (
                    // 🌟 Render Stars (Static View, no movement)
                    renderStars(starCount)
                  ) : (
                    // 💬 Else render Float Comment (Animated View)
                    <Animated.View
                        style={[
                            styles.floatComment,
                            { transform: [{ translateY: floatTransform }] }
                        ]}
                    >
                        <ImageBackground 
                        source={{ uri: cachedCommentBackground }} 
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
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <LevelModal
        visible={modalVisible}
        onClose={handleModalClose}
        onPlay={handleModalPlay}
        levelId={selectedLevelId}
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
    color: '#ffffffdc',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'MusicVibes',
    marginTop: defaultHeight * -0.045, 
  },
  levelButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  floatElementContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  floatComment: {
    position: 'absolute',
    width: '95%',
    height: '95%',
    top: gameScale(-35),
    alignItems: 'center',
    zIndex: 25,
  },
  unlockedButton: {
    width: '130%',
    height: '130%',
    top: gameScale(-25),
    left: gameScale(-2)
  },
  lockedButton: {
    width: '110%',
    height: '110%',
    top: gameScale(-25),
    left: gameScale(-2)
  },
  floatIcon: {
    width: '80%',
    height: '80%',
    top: gameScale(7),
    opacity: 0.7,
    right: gameScale(2)
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
  },
  currentLevelFocus: {
    zIndex: 30, // Bring to front
    },
  focusIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 68, 0, 0.2)',
    borderRadius: 100,
    zIndex: -1,
    marginTop: -20,
    shadowColor: "#bd0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 2,
    },
  starWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '120%',
    marginTop: gameScale(-138),
  },
  starIcon: {
    width: gameScale(30),
    height: gameScale(25),
    marginHorizontal: gameScale(-5), 
  }
});

