import React, { useState, useEffect, useRef } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Animated, ImageBackground, Dimensions, Modal, Image } from "react-native";
import LottieView from "lottie-react-native";
import MapHeader from '../Components/Map/mapHeader';
import CharacterDisplay from '../Components/Character/CharacterDisplay';
import ActionButton from '../Components/Character/ActionButton';
import AttributePanel from '../Components/Character/AttributePanel';
import ScreenLabel from '../Components/Character/ScreenLabel';
import { HERO_DATA, URLS } from '../Components/Character/CharacterData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CharacterProfile() {
  const [heroData, setHeroData] = useState(HERO_DATA);
  const [selectedHero, setSelectedHero] = useState('Gino');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showStaticImage, setShowStaticImage] = useState(false);
  const [isCharacterAnimating, setIsCharacterAnimating] = useState(true);

  // Animation refs
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  
  // Refs for child components
  const screenLabelRef = useRef(null);
  const attributePanelRef = useRef(null);

  const currentHero = heroData[selectedHero];

  const attributeData = [
    { style: styles.heroRole, icon: currentHero.roleIcon, text: `Role:\n${currentHero.role}` },
    { style: styles.health, icon: URLS.healthIcon, text: "Health:", number: currentHero.health },
    { style: styles.skill, icon: currentHero.damageIcon, text: "Damage:", number: currentHero.damage }
  ];

  const handleCharacterAnimationFinish = () => {
    setIsCharacterAnimating(false);
    
    Animated.timing(backgroundOpacity, { 
      toValue: 0, 
      duration: 500, 
      useNativeDriver: true 
    }).start(() => {
      setShowStaticImage(true);
      
      // Start screen label animation first
      screenLabelRef.current?.startAnimation();
      
      // Then start attribute animations
      setTimeout(() => {
        attributePanelRef.current?.startAnimations();
      }, 500);
    });
  };

  const handleHeroSelection = (heroName) => {
    setSelectedHero(heroName);
    setHeroData(prevData => {
      const newData = { ...prevData };
      Object.keys(newData).forEach(key => {
        newData[key] = { ...newData[key], isSelected: key === heroName };
      });
      return newData;
    });
  };

  const handlePurchase = () => {
    setHeroData(prevData => ({
      ...prevData,
      [selectedHero]: { ...prevData[selectedHero], isPurchased: true }
    }));
    setShowBuyModal(false);
  };

  useEffect(() => {
    setShowStaticImage(false);
    setIsCharacterAnimating(true);
    backgroundOpacity.setValue(1);
  }, [selectedHero]);

  // Render functions
  const renderHeroBox = (heroName) => (
    <TouchableOpacity
      key={heroName}
      style={[styles.heroBox, selectedHero === heroName && styles.selectedHeroBox]}
      onPress={() => handleHeroSelection(heroName)}
    >
      <ImageBackground
        source={{ uri: heroData[heroName].characterImage }}
        resizeMode="cover"
        style={styles.heroBoxBackground}
      >
        <Text style={styles.heroBoxTxt}>{heroName}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MapHeader />
      </View>

      <View style={styles.topSection}>
        <ImageBackground 
          source={{ uri: URLS.background }} 
          resizeMode="cover" 
          opacity={0.7} 
          style={styles.characterMainBackground}
        >
          <View style={styles.contentContainer}>
            
            {/* Screen Label */}
            <ScreenLabel 
              ref={screenLabelRef}
              heroName={currentHero.name}
              selectedHero={selectedHero}
              styles={styles}
            />

            {/* Background Animation */}
            <Animated.View style={{ opacity: backgroundOpacity }}>
              
            </Animated.View>

            {/* Character Display */}
            <View style={styles.characterContainer}>
              <CharacterDisplay
                currentHero={currentHero}
                selectedHero={selectedHero}
                isCharacterAnimating={isCharacterAnimating}
                onAnimationFinish={handleCharacterAnimationFinish}
                styles={styles}
              />

              <ActionButton
                currentHero={currentHero}
                onHeroSelection={handleHeroSelection}
                onShowBuyModal={setShowBuyModal}
                coinIcon={URLS.coin}
                styles={styles}
              />

              {/* Attribute Panel */}
              <AttributePanel
                ref={attributePanelRef}
                attributeData={attributeData}
                selectedHero={selectedHero}
                styles={styles}
              />
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Bottom Character Selection */}
      <ImageBackground 
        source={{ uri: URLS.bottomBar }} 
        resizeMode="cover" 
        style={styles.bottomBar} 
        opacity={0.6}
      >
        <View style={styles.characterSelection}>
          {Object.keys(heroData).map(renderHeroBox)}
        </View>
      </ImageBackground>

      {/* Purchase Modal */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={showBuyModal} 
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            <Text style={styles.modalText}>
              Do you want to buy {currentHero.name} for {currentHero.buy} coins?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowBuyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handlePurchase}>
                <Image source={{ uri: URLS.coin }} style={styles.modalCoinIcon} />
                <Text style={styles.confirmButtonText}>Buy {currentHero.buy}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Keep your existing styles here...
const styles = StyleSheet.create({
  // ... your existing styles remain the same
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
  },
  headerContainer: {
    position: 'absolute',
    zIndex: 100
  },
  topSection: {
    flex: 0.85
  },
  characterMainBackground: {
    flex: 1,
    width: '100%'
  },
  contentContainer: {
    top: screenHeight * 0.06,
    alignItems: 'center'
  },
  characterBackground: {
    width: screenWidth,
    height: screenHeight,
    alignSelf: 'center',
    top: screenHeight * -0.1,
    position: 'absolute',
  },
  characterContainer: {
    height: screenHeight * 0.4,
    marginTop: screenHeight * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  screenLabel: {
    position: 'absolute',
    top: screenHeight * -0.11,
    width: screenWidth * 0.6,
    height: screenHeight * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  screenLabelText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: screenWidth * 0.15,
    fontFamily: 'GoldenAge',
    textAlign: 'center',
  },
  attributePanel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth * 0.25,
    height: screenHeight * 0.3,
    top: screenHeight * 0.15
  },
  characterImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    top: screenHeight * 0.13,
  },
  bottomBar: {
    flex: 0.17,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.02,
    backgroundColor: 'rgba(0, 0, 0, 1)'
  },
  attributeText: {
    borderWidth: 2,
    borderColor: 'rgba(106, 191, 244, 1)',
    width: '100%',
    top: screenHeight * 0.02,
    height: screenHeight * 0.08,
    borderRadius: 10,
    paddingLeft: screenWidth * 0.02,
    overflow: 'hidden',
    backgroundColor: 'rgba(3, 67, 112, 0.74)'
  },
  attributeTextContent: {
    fontFamily: 'Computerfont',
    fontSize: screenWidth * 0.042,
    color: 'white',
    textShadowRadius: 10,
  },
  attributeTextContentNumber: {
    fontSize: screenWidth * 0.09,
    color: 'white',
    textAlign: 'left',
    top: screenHeight * -0.01,
    fontFamily: 'Computerfont',
  },
  heroRole: {
    marginLeft: screenWidth * -0.60,
  },
  health: {
    marginLeft: screenWidth * 0.60,
  },
  skill: {
    marginBottom: screenHeight * 0.015,
    marginLeft: screenWidth * -0.60,
  },
  characterSelection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
    marginTop: screenHeight * 0.01,
  },
  heroBox: {
    width: screenWidth * 0.20,
    height: screenHeight * 0.15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: screenHeight * 0.02,
  },
  selectedHeroBox: {
    borderColor: '#3172ffff',
    borderWidth: 3,
    shadowColor: '#3172ffff',
    shadowOffset: { width: 30, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 30,
  },
  heroBoxBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBoxTxt: {
    color: 'white',
    fontSize: screenWidth * 0.050,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: '100%',
    marginTop: screenHeight * 0.12,
    fontFamily: 'Computerfont',
    textAlign: 'center',
  },
  heroRoleIcon: {
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    marginLeft: screenWidth * 0.08,
    position: 'absolute',
    transform: [{ rotate: '20deg' }],
    opacity: 0.9
  },
  selectButton: {
    position: 'absolute',
    top: screenHeight * 0.5,
    borderWidth: 2,
    padding: 5,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 30,
    backgroundColor: 'rgba(3, 63, 116, 0.94)',
    width: screenWidth * 0.4,
  },
  buyButton: {
    position: 'absolute',
    top: screenHeight * 0.5,
    borderWidth: 2,
    padding: 5,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 30,
    backgroundColor: 'rgba(3, 63, 116, 0.94)',
    width: screenWidth * 0.4,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: screenWidth * 0.06,
    color: 'white',
    fontFamily: 'Computerfont',
    textAlign: 'center',
  },
  coinIcon: {
    width: screenWidth * 0.07,
    height: screenWidth * 0.07,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(3, 63, 116, 0.6)',
    borderRadius: 20,
    padding: screenWidth * 0.08,
    width: screenWidth * 0.8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  modalTitle: {
    fontSize: screenWidth * 0.07,
    fontFamily: 'Computerfont',
    color: 'white',
    marginBottom: screenHeight * 0.02,
    textAlign: 'center',
  },
  modalText: {
    fontSize: screenWidth * 0.05,
    fontFamily: 'Computerfont',
    color: 'white',
    textAlign: 'center',
    marginBottom: screenHeight * 0.03,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.48)',
    padding: screenHeight * 0.015,
    borderRadius: 15,
    flex: 0.4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  confirmButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.59)',
    padding: screenHeight * 0.015,
    borderRadius: 15,
    flex: 0.55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: screenWidth * 0.045,
    fontFamily: 'Computerfont',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: screenWidth * 0.045,
    fontFamily: 'Computerfont',
    marginLeft: 5,
  },
  modalCoinIcon: {
    width: screenWidth * 0.05,
    height: screenWidth * 0.05,
  },
});