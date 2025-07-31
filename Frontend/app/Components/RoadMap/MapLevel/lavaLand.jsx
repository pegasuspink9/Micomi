import { View, StyleSheet, ImageBackground, ScrollView, Dimensions } from "react-native";
import { useState } from "react";
import levels from "./greenLandData"; 
import LevelButtons from "../RoadMapComponents/Buttons";
import LottieView from "lottie-react-native";
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
import { useLocalSearchParams } from "expo-router";
import { MAP_THEMES, DEFAULT_THEME } from './MapDatas/mapData';

export default function LavaLand() {
  const [backgroundCount, setBackgroundCount] = useState(5);
  const [lessons] = useState(levels || []);

  const { mapType } = useLocalSearchParams();
  
  // GET current theme from mapData
  const getCurrentTheme = () => {
    return MAP_THEMES[mapType] || DEFAULT_THEME;
  };

  const theme = getCurrentTheme();

  console.log('Current map type:', mapType);
  console.log('Using theme:', theme);
  console.log('Total lessons:', lessons.length);
  console.log('Screen dimensions:', { screenHeight, screenWidth });
  
  // Screen Size Calculation
  const getResponsiveValues = () => {
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
  };
  
  const calculateContentHeight = () => {
    if (lessons.length === 0) return screenHeight * 2;
    
    const responsive = getResponsiveValues();
    
    const lastIndex = lessons.length - 1;
    let lastButtonTop;

    // First button (index 0) - special case
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
  };
  
  const handleScroll = ({ nativeEvent }) => {
    const { contentOffset } = nativeEvent;
    const currentScreen = Math.floor(contentOffset.y / screenHeight);
    const neededBackgrounds = currentScreen + 20;
   
    if (neededBackgrounds > backgroundCount) {
      setBackgroundCount(Math.max(neededBackgrounds, 15));
    }
  };

  const handleLevelPress = (level) => {
    console.log('Level pressed:', level);
  };

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
        {/* DYNAMIC Header Background from mapData */}
        <LottieView 
          source={{ uri: theme.backgrounds.lottieBackground }}
          autoPlay
          style={styles.lottieTopBackground}
          loop={true}
          speed={1.5}
          renderMode='HARDWARE'
          cacheComposition={true}
        />

        <View style={[
          styles.topBackground,
          {
            marginTop: theme?.backgrounds?.backgroundPosition?.marginTop || 0 // USE dynamic marginTop
          }
        ]}>
          <ImageBackground
            source={{ uri: theme.backgrounds.topBackground }}
            style={styles.backgroundImage}
            resizeMode="fill"
          />
        </View>

        {/* DYNAMIC Repeating Background from mapData */}
        <View style={styles.backgroundContainer}>
          {Array.from({ length: backgroundCount }, (_, index) => (
            <ImageBackground
              key={index}
              source={{ uri: theme.backgrounds.repeatingBackground, cache: 'force-cache' }}
              style={[
                styles.backgroundSegment,
                { top: screenHeight + (index * screenHeight)},
                { marginTop: theme?.backgrounds?.backgroundPosition?.marginTop || 0 }
              ]}
              resizeMode="fill"
            />
          ))}
        </View>

        {/* Level Buttons with Theme */}
        <View style={styles.levelButtonsContainer}>
          <LevelButtons
            lessons={lessons}
            handleLevelPress={handleLevelPress}
            screenHeight={screenHeight}
            screenWidth={screenWidth}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  );
}

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
});