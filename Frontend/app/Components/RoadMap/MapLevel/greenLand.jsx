import { View, StyleSheet, ImageBackground, ScrollView, Dimensions, Image, Animated } from "react-native";
import { useState, useEffect, useRef } from "react";
import levels from "./greenLandData"; 
import LevelButtons from "../RoadMapComponents/Buttons";
import LottieView from "lottie-react-native";
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
import { useLocalSearchParams } from "expo-router";
import { MAP_THEMES, DEFAULT_THEME } from './MapDatas/mapData';

export default function GreenLand() {
  const [backgroundCount, setBackgroundCount] = useState(5);
  const [lessons] = useState(levels || []);

  const bushSwayAnim = useRef(new Animated.Value(0)).current;
  const {mapType} = useLocalSearchParams();


  const getCurrentTheme = () => {
    return MAP_THEMES[mapType] || DEFAULT_THEME;
  }

  const theme = getCurrentTheme();


  useEffect(() => {
    const swayAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bushSwayAnim, {
          toValue: 1,
          duration: 4000, // 3 seconds to swing right
          useNativeDriver: true
        }),
        Animated.timing(bushSwayAnim, {
          toValue: 0,
          duration: 4000, // 5 seconds to swing back left
          useNativeDriver: true
        })
      ])
    );
    
    swayAnimation.start();
    
    return () => swayAnimation.stop();
  }, [bushSwayAnim]);

   const bushTransform = bushSwayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 1]
  });

  const bushTransformRight = bushSwayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 1]
  });
  

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

  const createInfiniteBushes = () => {
  // Your original bush positions - EXACT copy

  const responsive = getResponsiveValues();

  const isLargerThanPhone = screenWidth > 500 || screenHeight > 900;

  const originalBushes = [
    { id: 'bush0', top: 200, zIndex: 5,  right: isLargerThanPhone ? 380 * responsive.heightRatio : 10 * responsive.heightRatio },
    { id: 'bush1', top: 280, zIndex: 5, right: isLargerThanPhone ? 370 * responsive.heightRatio : 12 * responsive.heightRatio },
    { id: 'bush2', top: 380, zIndex: 5, right: isLargerThanPhone ? 350 * responsive.heightRatio : 100 },
    { id: 'bush3', top: 450, zIndex: 5, right: isLargerThanPhone ? 320 * responsive.heightRatio : 170 },
    { id: 'bush4', top: 550, zIndex: 5, right: isLargerThanPhone ? 350 * responsive.heightRatio : 220 },
    { id: 'bush5', top: 650, zIndex: 5, right: isLargerThanPhone ? 408 * responsive.heightRatio : 240 },
    { id: 'bush6', top: 750, zIndex: 5, right: isLargerThanPhone ? 360 * responsive.heightRatio : 80 },
    { id: 'bush11', top: 200, right: isLargerThanPhone ? -190 * responsive.heightRatio : -330, zIndex: 5 },
    { id: 'bush12', top: 300, right: isLargerThanPhone ? -220 * responsive.heightRatio : -350, zIndex: 5 },
    { id: 'bush13', top: 400, right: isLargerThanPhone ? -200 * responsive.heightRatio : -250, zIndex: 5 },
    { id: 'bush14', top: 500, right: isLargerThanPhone ? -230 * responsive.heightRatio : -140, zIndex: 5 },
    { id: 'bush15', top: 600, right: isLargerThanPhone ? -190 * responsive.heightRatio : -160, zIndex: 5 },
    { id: 'bush16', top: 1100, right: isLargerThanPhone ? -240 * responsive.heightRatio : -190, zIndex: 5 },
    { id: 'bush17', top: 700, right: isLargerThanPhone ? -280 * responsive.heightRatio : -280, zIndex: 5 },
  ];

  const contentHeight = calculateContentHeight();
  const patternHeight = 620; 
  const repetitions = Math.ceil(contentHeight / patternHeight) + 5; 
  
  const allBushes = [];
  
  // Duplicate the pattern multiple times
  for (let i = 0; i < repetitions; i++) {
    originalBushes.forEach((bush, index) => {
      allBushes.push({
        ...bush,
        id: `${bush.id}-repeat-${i}`,
        top: bush.top + (i * patternHeight), 
        zIndex: bush.zIndex + i 
      });
    });
  }
  
  return allBushes;
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
        {/* Header Background - Fixed at top */}
        <LottieView 
          source={{ uri: theme.backgrounds.lottieBackground }}
          autoPlay
          style={styles.lottieTopBackground}
          loop={true}
          speed={1.5}
          renderMode = 'HARDWARE'
          cacheComposition = {true}
        />

        <View style={styles.topBackground}>
          <ImageBackground
            source={{ uri: theme.backgrounds.topBackground }}
            style={styles.backgroundImage}
            resizeMode="fill"
          />
        </View>

        
        <Animated.View
          style={{
            transform: [{ translateX: bushTransform }], zIndex: 10
          }}
        >
          {createInfiniteBushes()
          .filter(bush => bush.right >= 0) // Only bushes with positive right values
          .map((bush) => (
            <Image 
              key={bush.id}
              source={{ uri: 'https://github.com/user-attachments/assets/449d431f-1b95-44f1-b1bc-dfaa2cf830a6' }} 
              style={[
                styles.bush,
                {
                  top: bush.top,
                  right: bush.right,
                  zIndex: bush.zIndex + 10 // Higher zIndex
                }
              ]} 
            />
          ))
        }
      </Animated.View>

        <Animated.View 
        style={{
          transform: [{ translateX: bushTransformRight }],
          zIndex: 10
        }}
      >
        {createInfiniteBushes()
          .filter(bush => bush.right < 0) // Only bushes with negative right values
          .map((bush) => (
            <Image 
              key={bush.id}
              source={{ uri: 'https://github.com/user-attachments/assets/449d431f-1b95-44f1-b1bc-dfaa2cf830a6' }} 
              style={[
                styles.bush,
                {
                  top: bush.top,
                  right: bush.right,
                  zIndex: bush.zIndex + 15
                }
              ]} 
            />
          ))
        }
      </Animated.View>


        {/* Repeating Background */}
        <View style={styles.backgroundContainer}>
          {Array.from({ length: backgroundCount }, (_, index) => (
            <ImageBackground
              key={index}
              source={{ uri: theme.backgrounds.repeatingBackground, cache: 'force-cache' }}
              style={[
                styles.backgroundSegment,
                { top: screenHeight + (index * screenHeight) } 
              ]}
              resizeMode="fill"
            />
          ))}
        </View>

        {/* Level Buttons */}
        <View style={styles.levelButtonsContainer}>
          <LevelButtons
            lessons={lessons}
            handleLevelPress={handleLevelPress}
            screenHeight={screenHeight}
            screenWidth={screenWidth}
          />
          
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(2, 94, 30, 0.77)'
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
  // Header background styles
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
  // Repeating background styles
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
  roadmapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,  
    alignItems: 'center', 
  },
  roadmapPath: {
    position: 'absolute',
    width: '72%',
    marginBottom: 1,
    marginTop: 0
  },
  levelButtonsContainer: {
    top: 100,
  },
  bush:{
    position: 'absolute',
    width: 450,
    height: 450,
    top: 150,
    right: 100
  },
  bush0:{
    top: 200,
    right: 10
  },
  bush1:{
    top: 280,
    right: 12
  }, 
  bush2:{
    top: 380,
    right: 100
  },
  bush3:{
    top: 450,
    right: 170
  },
  bush4:{
    top: 550,
    right: 220
  },
  bush5:{
    top: 650,
    right: 240,
  },
  bush6:{
    top: 750,
    right: 80
  },
  bush7:{
    top: 850,
    right: 10
  },
  bush8:{
    top: 900,
    right: 10,
  },
  bush9:{
    top: 1000,
    right: 100,
  },
  bush10:{
    top: 1110,
    right: 200,
  },
  bush11:{
    top: 200,
    right: -330,
  },
  bush12:{
    top: 300,
    right: -300,
  },
  bush13:{
    top: 400,
    right: -250,
  },
  bush14:{
    top: 500,
    right: -140,
  },
  bush15:{
    top:600,
    right: -160,
  },
  bush16: {
    top: 1100,
    right: -190,
  },
  bush17: {
    top: 700,
    right: -280,
  },
  bush18: {
    top: 800,
    right: -290,
  },
  bush19: {
    top: 900,
    right: -270,
  },
  bush20: {
    top: 1010,
    right: -280,
  },
  bush21: {
    top: 1100,
    right: -290,
  }

});