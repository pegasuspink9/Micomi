import React, { useState, useRef } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Animated, ImageBackground, Dimensions, Modal, Image, ActivityIndicator, Alert } from "react-native";
import MapHeader from '../Components/Map/mapHeader';
import CharacterDisplay from '../Components/Character/CharacterDisplay';
import ActionButton from '../Components/Character/ActionButton';
import AttributePanel from '../Components/Character/AttributePanel';
import ScreenLabel from '../Components/Character/ScreenLabel';
import { URLS } from '../Components/Character/CharacterData';
import { useCharacterSelection } from '../hooks/useCharacterSelection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CharacterProfile() {
  const playerId = 11;
  
  const {
    charactersData,
    selectedHero,
    currentHero,
    loading,
    error,
    purchasing,
    selecting,
    selectCharacter,
    purchaseCharacter,
    loadCharacters,
    clearError,
    getHeroNames,
    changeDisplayedCharacter // Add this from the hook
  } = useCharacterSelection(playerId);

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showStaticImage, setShowStaticImage] = useState(false);
  const [isCharacterAnimating, setIsCharacterAnimating] = useState(true);

  // Animation refs
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  
  // Refs for child components
  const screenLabelRef = useRef(null);
  const attributePanelRef = useRef(null);

  const attributeData = currentHero ? [
    { style: styles.heroRole, icon: currentHero.roleIcon, text: `Role:\n${currentHero.character_type}` },
    { style: styles.health, icon: URLS.healthIcon, text: "Health:", number: currentHero.health },
    { style: styles.skill, icon: currentHero.damageIcon, text: "Damage:", number: currentHero.character_damage }
  ] : [];

  const handleCharacterAnimationFinish = () => {
    setIsCharacterAnimating(false);
    
    Animated.timing(backgroundOpacity, { 
      toValue: 0, 
      duration: 500, 
      useNativeDriver: true 
    }).start(() => {
      setShowStaticImage(true);
      
      screenLabelRef.current?.startAnimation();
      
      setTimeout(() => {
        attributePanelRef.current?.startAnimations();
      }, 500);
    });
  };

  const handleHeroViewing = (heroName) => {
    console.log(`👁️ Viewing character: ${heroName}`);
    changeDisplayedCharacter(heroName);
  };

  const handleCharacterSelection = async (heroName) => {
    try {
      console.log(`🎯 Attempting to select character: ${heroName}`);
      await selectCharacter(heroName);
    } catch (error) {
      console.error('Selection Error:', error);
    }
  };

  const handlePurchase = async () => {
    if (!currentHero) return;

    try {
      console.log(`🛒 Initiating purchase for ${currentHero.character_name} (Shop ID: ${currentHero.characterShopId})`);
      
      const response = await purchaseCharacter(selectedHero);
      setShowBuyModal(false);
      
      Alert.alert(
        'Purchase Successful! 🎉', 
        response.message || `${currentHero.character_name} has been purchased!`,
        [{ text: 'OK', style: 'default' }]
      );
      
      console.log('✅ Purchase completed successfully:', response);
      
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      Alert.alert(
        'Purchase Failed', 
        error.message || 'Unable to purchase character. Please try again.',
        [{ text: 'OK', style: 'destructive' }]
      );
    }
  };

  React.useEffect(() => {
    if (selectedHero) {
      setShowStaticImage(false);
      setIsCharacterAnimating(true);
      backgroundOpacity.setValue(1);
    }
  }, [selectedHero]);

  // Updated renderHeroBox function
  const renderHeroBox = (heroName) => {
    const hero = charactersData[heroName];
    if (!hero) return null;

    const isCurrentlyViewed = selectedHero === heroName;
    const isActuallySelected = hero.is_selected;

    return (
      <TouchableOpacity
        key={heroName}
        style={[
          styles.heroBox, 
          isCurrentlyViewed && styles.viewedHeroBox,
          isActuallySelected 
        ]}
        onPress={() => handleHeroViewing(heroName)} // Now properly calls the viewing function
        disabled={selecting}
      >
        <ImageBackground 
          source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760064111/Untitled_design_3_ghewno.png' }} 
          style={styles.heroBoxBorder} 
          resizeMode="contain"
        >
          <ImageBackground
            source={{ uri: hero.character_avatar }}
            resizeMode="cover"
            style={styles.heroBoxBackground}
          >
            <Text style={styles.heroBoxTxt}>{heroName}</Text>
            
          </ImageBackground>
        </ImageBackground>
      </TouchableOpacity>
    );
  };


  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          clearError();
          loadCharacters();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentHero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No character data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MapHeader />
      </View>

      <ImageBackground 
        source={{ uri: URLS.background }} 
        resizeMode="cover" 
        opacity={0.7} 
        style={styles.fullBackground}
      >
        <View style={styles.topSection}>
          <View style={styles.contentContainer}>
            
            {/* Screen Label */}
            <ScreenLabel 
              ref={screenLabelRef}
              heroName={currentHero.character_name}
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
                onSelectCharacter={handleCharacterSelection}
                onShowBuyModal={setShowBuyModal}
                coinIcon={URLS.coin}
                styles={styles}
                disabled={selecting || purchasing}
                selecting={selecting}
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
        </View>

        {/* Bottom Character Selection */}
        <View style={styles.bottomBar}>
          <View style={styles.characterSelection}>
            {getHeroNames().map(renderHeroBox)}
          </View>
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
              Do you want to buy {currentHero.character_name} 
              {currentHero.character_price > 0 ? ` for ${currentHero.character_price} coins` : ''}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowBuyModal(false)}
                disabled={purchasing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Image source={{ uri: URLS.coin }} style={styles.modalCoinIcon} />
                    <Text style={styles.confirmButtonText}>Buy {currentHero.character_price}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
   centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: screenWidth * 0.05,
    fontFamily: 'Computerfont',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    fontSize: screenWidth * 0.05,
    fontFamily: 'Computerfont',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.8)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  retryButtonText: {
    color: 'white',
    fontSize: screenWidth * 0.045,
    fontFamily: 'Computerfont',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
  },
  headerContainer: {
    position: 'absolute',
    zIndex: 100
  },
    fullBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    alignItems: 'center',
    
    marginTop: screenHeight * 0.05,
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
    zIndex: 2,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: screenHeight * 0.02,
  },
    viewedHeroBox: {
    width: screenWidth * 0.21,
    height: screenHeight * 0.16,
    shadowColor: '#ffffff',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 10,
    
    borderWidth: 2,
    borderColor: '#02b7ffff',
    shadowOffset: { width: 30, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 30,
  },


   heroBoxBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    width: '100%',
    height: '100%',
  },

  selectionIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectionIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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


  heroBoxBackground: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
    shadowColor: '#4CAF50',
    
  },
 
  heroBoxTxt: {
    color: 'white',
    fontSize: screenWidth * 0.040,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    paddingVertical: 2,
    marginTop: screenHeight * 0.12,
    fontFamily: 'MusicVibes',
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