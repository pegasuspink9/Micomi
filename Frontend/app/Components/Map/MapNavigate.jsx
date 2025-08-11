import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { map } from './mapData';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');


const LEVEL_SELECTOR_IMAGES = {
  'HTML': 'https://github.com/user-attachments/assets/f1ade869-bb35-4864-a796-2a964749f83b',
  'CSS': 'https://github.com/user-attachments/assets/b20d16ef-7374-4eae-b87e-ec9d61171071',
  'JavaScript': 'https://github.com/user-attachments/assets/570e2a1e-a6cb-4f7f-bdfd-54920f810694',
  'Computer': 'https://github.com/user-attachments/assets/8ab0728b-8988-46dd-8ad7-395abc4ba273'
};


export default function MapNavigate({ onMapChange }) {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
  if (onMapChange) {
    onMapChange(map[currentMapIndex].name);
  }
}, [currentMapIndex, onMapChange]);

  const handlePrevious = () => {
    setCurrentMapIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : map.length - 1);
  };

  const handleNext = () => {
    setCurrentMapIndex(prevIndex => prevIndex < map.length - 1 ? prevIndex + 1 : 0);
  };

    const handleIslandClick = () => {
    if (map[currentMapIndex].unlocked) {
      const currentMap = map[currentMapIndex].name;
      
      router.push({
        pathname: '/Components/RoadMap/roadMapLandPage',
        params: { 
          mapName: currentMap,
          mapType: currentMap // ADD: Pass the map type
        }
      })
    };
  };

  return (
    <View style={styles.scrollContent}>
      {/* Floating Island */}
      <View style={styles.mapWrapper}>
        <TouchableOpacity 
          style={styles.island}
          onPress={handleIslandClick}
          disabled={!map[currentMapIndex].unlocked}
        >
            <LottieView
            source={map[currentMapIndex].image}
            style={styles.islandImage}
            autoPlay
            loop
            speed={map[currentMapIndex].unlocked ? 1 : 0}
            resizeMode='contain'
            cacheComposition={true}
            renderMode='HARDWARE'
          />

          {!map[currentMapIndex].unlocked && (
            <Image
              source={{ uri: 'https://github.com/user-attachments/assets/e8a1b478-91d3-44c9-8a59-4bc46db4d1c0'}}
              style={styles.lockedOverlay}
              resizeMode='contain'
            />
          )}

          {/* Add visual feedback for clickable islands */}
          {map[currentMapIndex].unlocked && (
            <View style={styles.clickIndicator}>
              <Text style={styles.clickText}>Tap to Enter</Text>
            </View>
          )}
      </TouchableOpacity>

        

       <View style={styles.levelSelector}>
          <TouchableOpacity 
            style={[styles.navArrow, currentMapIndex === 0 && styles.disabledArrow]} 
            onPress={handlePrevious}
            disabled={currentMapIndex === 0}
          >
            <Image source={{uri: 'https://github.com/user-attachments/assets/5f2b8e72-f49e-4f06-8b76-40b580289d54'}} style={[styles.arrowImage, styles.flippedHorizontal]} />
          </TouchableOpacity>
          
          <ImageBackground
            source={{uri: LEVEL_SELECTOR_IMAGES[map[currentMapIndex].name]}}
            style={styles.levelSelectorImage}
            resizeMode="contain"
          >
          <View style={[
            styles.currentLevel
          ]}>
            <Text style={styles.currentLevelText} numberOfLines={1} adjustsFontSizeToFit={true} >{map[currentMapIndex].name}</Text>
           
          </View>
          </ImageBackground>
          
          <TouchableOpacity 
            style={[styles.navArrow, currentMapIndex === map.length - 1 && styles.disabledArrow]} 
            onPress={handleNext}
            disabled={currentMapIndex === map.length - 1}
          >
            <Image source={{uri: 'https://github.com/user-attachments/assets/5f2b8e72-f49e-4f06-8b76-40b580289d54'}} style={styles.arrowImage} />
          </TouchableOpacity>
        </View>
      </View>
   </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  mapWrapper: {
    flex: 1,
    alignItems: 'center',
    maxHeight: height * 1,
    paddingVertical: 20,
  },
  island: {
    position: 'relative',
    width: width * 1,
    aspectRatio: 1,
    maxWidth: 700,
    maxHeight: 700,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    top: 50
  },
  islandImage: {
    width: '130%',
    height: '130%',
  },
  levelSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
     width: '100%',
     paddingHorizontal: 20,
     marginTop: -30,
  },
  levelSelectorImage: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
   arrowImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginHorizontal: -20,
  
  },
  navArrow:{
    padding: 10
  },
  flippedHorizontal: {
    transform: [{ scaleX: -1 }],
  },
  currentLevel: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginHorizontal: 20,
    width: 150
  },
  currentLevelText: {
    color: '#fff',
    fontSize: 30,
    textAlign: 'center',
    color: 'white',
    fontFamily: 'FunkySign',
  },
   loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
   disabledArrow: {
    opacity: 0.5,
  },
  lockedOverlay: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    left: -26,
    opacity: 0.9,
  },
});
