import React, { useMemo, useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ImageBackground, ScrollView, Dimensions, Text } from "react-native";
import LevelButtons from "../RoadMapComponents/Buttons";
import LottieView from "lottie-react-native";
import { useLocalSearchParams } from "expo-router";
import { MAP_THEMES, DEFAULT_THEME } from './MapDatas/mapData';
import { useMapData } from '../../../hooks/useMapData';
import BushAnimations from '../RoadMapComponents/MapSpecialAnimations/Bush Effect/bushAnimation';
import PopAnimations from '../RoadMapComponents/MapSpecialAnimations/Lava Effect/lavaPopAnimation';
import SnowAndAutumnAnimations from "../RoadMapComponents/MapSpecialAnimations/Snow And Autumn Effect/snowAndAutumnFall";
import { useNavigation } from '@react-navigation/native';
import { universalAssetPreloader } from '../../../services/preloader/universalAssetPreloader';
import { useFocusEffect } from '@react-navigation/native'; 
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function UniversalMapLevel() {

   const navigation = useNavigation();

  const [backgroundCount, setBackgroundCount] = useState(5);
  
  const { mapName, mapId } = useLocalSearchParams();

  const { levels, mapInfo, loading, error, refetch } = useMapData(mapId);

  const getCurrentTheme = () => {
    return MAP_THEMES[mapName] || DEFAULT_THEME;
  };

  const theme = useMemo(() => {
    const baseTheme = MAP_THEMES[mapName] || DEFAULT_THEME;
    
    // Transform theme URLs to cached paths
    return {
      ...baseTheme,
      backgrounds: baseTheme.backgrounds ? {
        ...baseTheme.backgrounds,
        topBackground: universalAssetPreloader.getCachedAssetPath(baseTheme.backgrounds.topBackground),
        repeatingBackground: universalAssetPreloader.getCachedAssetPath(baseTheme.backgrounds.repeatingBackground),
        lottieBackground: baseTheme.backgrounds.lottieBackground, // Keep lottie as-is
      } : baseTheme.backgrounds,
      buttons: baseTheme.buttons ? {
        ...baseTheme.buttons,
        unlockedButton: universalAssetPreloader.getCachedAssetPath(baseTheme.buttons.unlockedButton),
        lockedButton: universalAssetPreloader.getCachedAssetPath(baseTheme.buttons.lockedButton),
        buttonBackground: universalAssetPreloader.getCachedAssetPath(baseTheme.buttons.buttonBackground),
      } : baseTheme.buttons,
      stones: baseTheme.stones ? {
        ...baseTheme.stones,
        stoneImage: universalAssetPreloader.getCachedAssetPath(baseTheme.stones.stoneImage),
      } : baseTheme.stones,
      floatingComment: baseTheme.floatingComment ? {
        ...baseTheme.floatingComment,
        commentBackground: universalAssetPreloader.getCachedAssetPath(baseTheme.floatingComment.commentBackground),
        signageBackground: universalAssetPreloader.getCachedAssetPath(baseTheme.floatingComment.signageBackground),
      } : baseTheme.floatingComment,
      icons: baseTheme.icons ? {
        ...baseTheme.icons,
        enemyButton: universalAssetPreloader.getCachedAssetPath(baseTheme.icons.enemyButton),
        micomiButton: universalAssetPreloader.getCachedAssetPath(baseTheme.icons.micomiButton),
        shopButton: universalAssetPreloader.getCachedAssetPath(baseTheme.icons.shopButton),
        bossButton: universalAssetPreloader.getCachedAssetPath(baseTheme.icons.bossButton),
      } : baseTheme.icons,
      colors: baseTheme.colors,
    };
  }, [mapName]);

   useEffect(() => {
    const loadCachedAssets = async () => {
      await universalAssetPreloader.loadCachedAssets('map_theme_assets');
    };
    loadCachedAssets();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('🗺️ UniversalMapLevel focused. Refetching map data...');
      refetch(); // Trigger data refetch
      return () => {
        // Optional: Perform cleanup if needed when the screen loses focus
        console.log('🗺️ UniversalMapLevel unfocused.');
      };
    }, [refetch]) // Dependency array includes refetch to ensure it's up-to-date
  );

  useFocusEffect(
  React.useCallback(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch((error) => {
        console.log('Failed to hide navigation bar:', error);
      });
    }
  }, [])
  );


  // Log the levels for debugging
  console.log('🎮 Levels loaded for map:', mapName, 'Count:', levels.length);
  console.log('🗺️ Map info:', mapInfo);

  // Extract all URIs that need to be preloaded
  const allUris = useMemo(() => {
    const uris = [];
    
    // Theme background URIs
    if (theme.backgrounds?.topBackground) {
      uris.push(theme.backgrounds.topBackground);
    }
    
    if (theme.backgrounds?.repeatingBackground) {
      uris.push(theme.backgrounds.repeatingBackground);
    }
    
    // Level button URIs from levels (changed from lessons)
    levels.forEach(level => {
      if (level.image) uris.push(level.image);
      if (level.icon) uris.push(level.icon);
      if (level.backgroundImage) uris.push(level.backgroundImage);
      if (level.completedImage) uris.push(level.completedImage);
    });

    // Remove duplicates
    return [...new Set(uris.filter(Boolean))];
  }, [theme, levels]); // Changed from lessons to levels

  // Use the image loader hook
  // const { allLoaded, loadingProgress } = useImageLoader(allUris, mapName);

  // Memoized functions to prevent re-renders
  const getResponsiveValues = useCallback(() => {
    const baseHeight = 844;
    const heightRatio = screenHeight / baseHeight;
    
    return {
      baseTop: 200 * heightRatio,
      loopSpacing: 700 * heightRatio, 
      buttonSpacing: 130 * heightRatio,
      roadmapHeight: screenHeight * 1.45,
      roadmapSpacing: screenHeight * 1.2,
      heightRatio,
    };
  }, []);
  
  const calculateContentHeight = useCallback(() => {
    if (levels.length === 0) return screenHeight * 2; 
    
    const responsive = getResponsiveValues();
    
    const lastIndex = levels.length - 1; 
    let lastButtonTop;

    if (lastIndex === 0) {
      lastButtonTop = 200 * responsive.heightRatio;
    } 
    else {
      const fourButtonPositions = [
        { top: 350 * responsive.heightRatio },  
        { top: 540 * responsive.heightRatio },  
        { top: 735 * responsive.heightRatio },  
        { top: 900 * responsive.heightRatio }, 
      ];

      const patternIndex = (lastIndex - 1) % 4; 
      const loopNumber = Math.floor((lastIndex - 1) / 4); 

      const verticalOffset = loopNumber * 680 * responsive.heightRatio;
      lastButtonTop = fourButtonPositions[patternIndex].top + verticalOffset;
    }
    
    return lastButtonTop + (500 * responsive.heightRatio);
  }, [levels, getResponsiveValues]); // Changed from lessons to levels
  
  const handleScroll = useCallback(({ nativeEvent }) => {
    const { contentOffset } = nativeEvent;
    const currentScreen = Math.floor(contentOffset.y / screenHeight);
    const neededBackgrounds = currentScreen + 20;
   
    if (neededBackgrounds > backgroundCount) {
      setBackgroundCount(Math.max(neededBackgrounds, 15));
    }
  }, [backgroundCount]);

  const handleLevelPress = useCallback((level) => {
    console.log('🎯 Level pressed:', {
      level_id: level.level_id,
      level_number: level.level_number,
      level_name: level.levelName,
      type: level.type,
      is_unlocked: level.is_unlocked
    });
    
  }, []);

  const renderMapSpecificContent = useCallback(() => {
    switch(mapName) {
      case 'HTML':
        // return (
        //   <BushAnimations 
        //     mapName={mapName}
        //     calculateContentHeight={calculateContentHeight}
        //     getResponsiveValues={getResponsiveValues}
        //   />
        // );
      case 'CSS':
        return (
          <PopAnimations 
            mapName={mapName}
            calculateContentHeight={calculateContentHeight}
            getResponsiveValues={getResponsiveValues}
          />
        );
      case 'JavaScript':
        return null;
      case 'Computer':
        return (
          <View style={styles.autumnEffects}>
            {/* ADD Computer/Autumn specific effects here */}
          </View>
        );
      default:
        return null;
    }
  }, [mapName, calculateContentHeight, getResponsiveValues]);

  // Memoized background segments
  const backgroundSegments = useMemo(() => 
    Array.from({ length: backgroundCount }, (_, index) => (
      <ImageBackground
        key={index}
        source={{ 
          uri: theme.backgrounds.repeatingBackground, 
          cache: 'force-cache' 
        }}
        style={[
          styles.backgroundSegment,
          { top: screenHeight + (index * screenHeight)},
          { marginTop: theme?.backgrounds?.topBackgroundPosition?.marginTop || 0 }
        ]}
        resizeMode="fill"
      />
    )), [backgroundCount, theme.backgrounds.repeatingBackground, theme?.backgrounds?.topBackgroundPosition?.marginTop]
  );
  

  // Show loading screen while levels are loading
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading {mapName} levels...</Text>
      </View>
    );
  }

  if (error && levels.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Failed to load levels for {mapName}</Text>
        <Text style={{ color: '#fff', fontSize: 14, marginTop: 10 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.container }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          { minHeight: calculateContentHeight() }
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
      >
        {/* Lottie Background (not cached - loaded from URL) */}
        <LottieView 
          source={{ uri: theme.backgrounds.lottieBackground }}
          autoPlay
          style={[
            styles.lottieTopBackground,
            {
              top: theme?.backgrounds?.positions?.lottieTop || -250,
              left: theme?.backgrounds?.positions?.lottieLeft || 0,
              width: theme?.backgrounds?.positions?.lottieWidth || '120%',
            }, 
            theme?.backgrounds?.lottieBackgroundStyle
          ]}
          loop={true}
          speed={1.5}
          renderMode='HARDWARE'
          cacheComposition={true}
        />

        {/*  Top Background using cached URL */}
        <View style={[
            styles.topBackground,
            { marginTop: theme?.backgrounds?.backgroundPosition?.marginTop || 0 }
        ]}>
          <ImageBackground
              source={{ 
                uri: theme.backgrounds.topBackground,
                cache: 'force-cache'
              }}
              style={styles.backgroundImage}
              resizeMode="fill"
          />
        </View>
        
        {renderMapSpecificContent()}

        {/*  Repeating Background using cached URLs */}
        <View style={styles.backgroundContainer}>
          {backgroundSegments}
        </View>

        {/*  Level Buttons with cached theme */}
        <View style={styles.levelButtonsContainer}>
          <LevelButtons
            lessons={levels} 
            handleLevelPress={handleLevelPress}
            screenHeight={screenHeight}
            screenWidth={screenWidth}
            theme={theme}
            mapType={mapName}
            navigation={navigation}
          />
        </View>
      </ScrollView>

      <SnowAndAutumnAnimations mapName={mapName} />
    </View>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  lottieTopBackground: {
    position: 'absolute',
    top: -250,
    width: '120%',
    height: screenHeight,
    zIndex: 1,
    alignSelf: 'center',
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: screenHeight,
    zIndex: 1,
    opacity: 1 
  },
  backgroundImage: {
    width: '100%',
    height: '100%', 
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  backgroundSegment: {
    position: 'absolute',
    width: '100%',
    height: screenHeight,
  },
  levelButtonsContainer: {
    top: 100,
  },
  fixedSnowEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20, 
    pointerEvents: 'none', 
  },
  fixedSnowLottieStyle: {
    width: '100%',
    height: '100%',
    zIndex: 100,
  },
  autumnEffects: {
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
});