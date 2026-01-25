import React, { useState, useRef } from "react";
import { Text, View, StyleSheet, Pressable, TouchableOpacity, Animated, ImageBackground, Dimensions, Modal, Image, ActivityIndicator } from "react-native";
import MapHeader from '../../Components/Map/mapHeader';
import CharacterDisplay from '../../Components/Character/CharacterDisplay';
import ActionButton from '../../Components/Character/ActionButton';
import AttributePanel from '../../Components/Character/AttributePanel';
import ScreenLabel from '../../Components/Character/ScreenLabel';
import { URLS } from '../../Components/Character/CharacterData';
import { useCharacterSelection } from '../../hooks/useCharacterSelection';
import { Video } from 'expo-av';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { gameScale } from '../../Components/Responsiveness/gameResponsive';
import MainLoading from '../Actual Game/Loading/MainLoading';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Keep your existing imports and logic, I am just updating the styles to ensure the layers work
export default function CharacterProfile() {
  
  const {
    charactersData,
    selectedHero,
    currentHero,
    loading,
    error,
    purchasing,
    selecting,
    userCoins,
    selectCharacter,
    purchaseCharacter,
    loadCharacters,
    clearError,
    getHeroNames,
    changeDisplayedCharacter,
  } = useCharacterSelection();

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '', title: 'Purchase Failed' });
  const [showStaticImage, setShowStaticImage] = useState(false);
  const [isCharacterAnimating, setIsCharacterAnimating] = useState(true);
  const [videoReady, setVideoReady] = useState(false);

  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const screenLabelRef = useRef(null);
  const attributePanelRef = useRef(null);

  const attributeData = currentHero ? [
    { style: styles.heroRole, icon: currentHero.roleIcon, text: `Role:\n${currentHero.character_type}` },
    { style: styles.health, icon: universalAssetPreloader.getCachedAssetPath(URLS.healthIcon), text: "Health:", number: currentHero.health },
    { style: styles.skill, icon: currentHero.damageIcon, text: "Damage:", number: currentHero.character_damage }
  ] : [];

  const getCachedVideoSource = () => {
    const videoUrl = 'https://micomi-assets.me/Hero%20Selection%20Components/Background.mp4';
    const cachedPath = universalAssetPreloader.getCachedAssetPath(videoUrl);
    return { uri: cachedPath };
  };

  const getCachedCoinIcon = () => universalAssetPreloader.getCachedAssetPath(URLS.coin);
  
  const getCachedHeroBoxBorder = () => universalAssetPreloader.getCachedAssetPath('https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760064111/Untitled_design_3_ghewno.png');

  const onVideoLoad = (status) => { if (status.isLoaded) setVideoReady(true); };
  const onVideoError = (error) => setVideoReady(false);
  const onVideoStatusUpdate = (status) => {};

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

  const handleHeroViewing = (heroName) => changeDisplayedCharacter(heroName);
  const handleCharacterSelection = async (heroName) => { try { await selectCharacter(heroName); } catch (error) {} };

  const handlePurchase = async () => {
    if (!currentHero) return;

    try {
      console.log(`🛒 Initiating purchase for ${currentHero.character_name}`);
      const response = await purchaseCharacter(currentHero);
      setShowBuyModal(false);
      console.log('✅ Purchase completed successfully:', response);
    } catch (error) {
      console.log('Purchase interrupted:', error.message);
      setShowBuyModal(false);
     
      let modalTitle = 'Purchase Failed';
      if (error.message === 'Not enough coins') {
        modalTitle = 'Insufficient Funds';
      } else if (error.message === 'Character already purchased') {
        modalTitle = 'Info';
      }

      setErrorModal({ 
        visible: true, 
        message: error.message || 'Unable to purchase character. Please try again.',
        title: modalTitle
      });
    }
  };

  React.useEffect(() => {
    if (selectedHero) {
      setShowStaticImage(false);
      setIsCharacterAnimating(true);
      backgroundOpacity.setValue(1);
    }
  }, [selectedHero]);

  const renderHeroBox = (heroName) => {
    const hero = charactersData[heroName];
    if (!hero) return null;
    const isCurrentlyViewed = selectedHero === heroName;
    const isActuallySelected = hero.is_selected;
    return (
      <Pressable
        key={heroName}
        style={[styles.heroBox, isCurrentlyViewed && styles.viewedHeroBox, isActuallySelected && styles.selectedHeroBox]}
        onPress={() => handleHeroViewing(heroName)}
        disabled={selecting}
      >
        <ImageBackground source={{ uri: getCachedHeroBoxBorder() }} style={styles.heroBoxBorder} resizeMode="contain">
          <ImageBackground source={{ uri: hero.character_image_select }} resizeMode="cover" style={styles.heroBoxBackground}>
            <Text style={styles.heroBoxTxt}>{heroName}</Text>
          </ImageBackground>
        </ImageBackground>
      </Pressable>
    );
  };

  if (!currentHero && error && !loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadCharacters} style={styles.modalSingleButton}><Text>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MapHeader coins={userCoins} />
      </View>

      {currentHero && (
        <>
          <Video 
            ref={videoRef}
            source={getCachedVideoSource()} 
            style={styles.fullBackground}
            shouldPlay={true} isLooping={true} resizeMode="contain" useNativeControls={false} isMuted={true}
            onLoad={onVideoLoad} onError={onVideoError} onPlaybackStatusUpdate={onVideoStatusUpdate}
          />

          <View style={styles.contentOverlay}>
            <View style={styles.topSection}>
              <View style={styles.contentContainer}>
                
                <ScreenLabel 
                  ref={screenLabelRef}
                  heroName={currentHero.character_name}
                  selectedHero={selectedHero}
                  styles={styles}
                />

                <Animated.View style={{ opacity: backgroundOpacity }} />

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
                    coinIcon={getCachedCoinIcon()}
                    styles={styles}
                    disabled={selecting || purchasing}
                    selecting={selecting}
                  />

                  {/* ✅ Passing Static Cards Data */}
                  <AttributePanel
                    ref={attributePanelRef}
                    attributeData={attributeData}
                    cardsData={currentHero?.cards || []} 
                    selectedHero={selectedHero}
                    styles={styles}
                  />
                </View>
              </View>
            </View>

            <View style={styles.bottomBar}>
              <View style={styles.characterSelection}>
                {getHeroNames().map(renderHeroBox)}
              </View>
            </View>
          </View>
        </>
      )}

      {/* ... [Modals and Loading] ... */}
      <MainLoading visible={loading || !currentHero} />
    </View>
  );
}

const styles = StyleSheet.create({
  contentOverlay: {
    position: 'absolute',
    top: gameScale(-55),
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
  },
  fullBackground: {
    position: 'absolute',
    width: gameScale(900),
    height: gameScale(920),
    alignSelf: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: gameScale(18),
    fontFamily: 'Computerfont',
    marginTop: gameScale(20),
  },
  errorText: {
    color: 'red',
    fontSize: gameScale(18),
    fontFamily: 'Computerfont',
    textAlign: 'center',
    marginBottom: gameScale(20),
  },
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
  },
  headerContainer: {
    position: 'absolute',
    zIndex: 100
  },
  topSection: {
    flex: 1, 
  },
  contentContainer: {
    top: gameScale(276),
  },
  characterContainer: {
    height: gameScale(298),
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
    top: gameScale(-168),
    width: gameScale(234),
    height: gameScale(506),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  screenLabelText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: gameScale(74),
    width: '120%',
    fontFamily: 'GoldenAge',
    textAlign: 'center',
  },
  attributePanel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: gameScale(98),
    height: gameScale(253),
    top: gameScale(126),
  },
  characterImage: {
    width: gameScale(351),
    height: gameScale(351),
    top: gameScale(110),
  },
  bottomBar: {
    height: gameScale(180), 
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attributeText: {
    borderWidth: 2,
    borderColor: 'rgba(106, 191, 244, 1)',
    width: '100%',
    top: gameScale(17),
    height: gameScale(68),
    borderRadius: gameScale(10),
    paddingLeft: gameScale(8),
    overflow: 'hidden',
    backgroundColor: 'rgba(3, 67, 112, 0.74)'
  },
  attributeTextContent: {
    fontFamily: 'Computerfont',
    fontSize: gameScale(16),
    color: 'white',
    textShadowRadius: 10,
  },
  attributeTextContentNumber: {
    fontSize: gameScale(35),
    color: 'white',
    textAlign: 'left',
    top: gameScale(-8),
    fontFamily: 'Computerfont',
  },
  heroRole: {
    marginLeft: gameScale(-234),
  },
  health: {
    marginLeft: gameScale(234),
  },
  skill: {
    marginBottom: gameScale(12),
    marginLeft: gameScale(-234),
  },
  characterSelection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: gameScale(15),
    alignItems: 'center',
    width: '100%',
    marginTop: gameScale(2),
  },
  heroBox: {
    width: gameScale(78),
    zIndex: 2,
    borderRadius: gameScale(8),
    overflow: 'hidden',
    marginTop: gameScale(17),
  },
  viewedHeroBox: {
    shadowColor: '#ffffff',
    shadowOpacity: 0.5,
    shadowRadius: gameScale(10),
    elevation: 30,
    height: gameScale(194),
    width: gameScale(78),
  },
  selectedHeroBox: {
    shadowOpacity: 1,
    shadowRadius: gameScale(10),
    elevation: 35,
  },
  heroBoxBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    width: '100%',
    height: gameScale(168), 
  },
  selectButton: {
    position: 'absolute',
    top: gameScale(422),
    borderWidth: 2,
    padding: gameScale(5),
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: gameScale(30),
    backgroundColor: 'rgba(3, 63, 116, 0.94)',
    width: gameScale(156),
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBoxBackground: {
    width: gameScale(110),
    height: gameScale(110),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  heroBoxTxt: {
    color: 'white',
    fontSize: gameScale(15),
    marginTop: gameScale(90),
    fontFamily: 'MusicVibes',
    textAlign: 'center'
  },
  heroRoleIcon: {
    width: gameScale(78),
    height: gameScale(78),
    marginLeft: gameScale(31),
    position: 'absolute',
    transform: [{ rotate: '20deg' }],
    opacity: 0.9
  },
  buyButton: {
    position: 'absolute',
    top: gameScale(422),
    borderWidth: 2,
    padding: gameScale(5),
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: gameScale(30),
    backgroundColor: 'rgba(3, 63, 116, 0.94)',
    width: gameScale(156),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: gameScale(23),
    color: 'white',
    fontFamily: 'Computerfont',
    textAlign: 'center',
  },
  coinIcon: {
    width: gameScale(27),
    height: gameScale(27),
    marginRight: gameScale(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(3, 63, 116, 1)',
    borderRadius: gameScale(20),
    padding: gameScale(31),
    width: gameScale(312),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  modalTitle: {
    fontSize: gameScale(27),
    fontFamily: 'Computerfont',
    color: 'white',
    marginBottom: gameScale(17),
    textAlign: 'center',
  },
  modalText: {
    fontSize: gameScale(18),
    fontFamily: 'Computerfont',
    color: 'white',
    textAlign: 'center',
    marginBottom: gameScale(25),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalSingleButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.59)',
    padding: gameScale(12),
    borderRadius: gameScale(15),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.48)',
    padding: gameScale(12),
    borderRadius: gameScale(15),
    flex: 0.4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  confirmButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.59)',
    padding: gameScale(12),
    borderRadius: gameScale(15),
    flex: 0.55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: gameScale(16),
    fontFamily: 'Computerfont',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: gameScale(16),
    fontFamily: 'Computerfont',
    marginLeft: gameScale(5),
  },
  modalCoinIcon: {
    width: gameScale(20),
    height: gameScale(20),
  },

  // ✅ CARD CONTAINER
   cardsContainerRow: {
    flexDirection: 'row',
    marginBottom: gameScale(-50),
    justifyContent: 'center',
    alignItems: 'center',
    width: gameScale(80), // Reverted to a more appropriate width
    marginTop: gameScale(10),
  },
  
  skillCardWrapper: {
    width: gameScale(45),
    height: gameScale(45),
    marginHorizontal: gameScale(-7), 
  },

  // ✅ BASE CARD FACE
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: gameScale(8),
    backfaceVisibility: 'hidden', 
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ FRONT FACE (Transparent)
  cardFaceFront: {
    zIndex: 2,
    backgroundColor: 'transparent',
    // ✅ CHANGED: Removed overflow hidden so name can hang below
  },

  // ✅ BACK FACE (With Background)
  cardFaceBack: {
    zIndex: 1,
    transform: [{ rotateY: '180deg' }], 
    backgroundColor: 'rgba(3, 63, 116, 0.95)', 
    borderWidth: 1.5,
    borderColor: 'rgba(106, 191, 244, 0.9)',
  },

  skillCardImage: {
    width: '100%',
    height: '100%',
  },

  cardDamageContainer: {
    position: 'absolute',
    top: gameScale(8),
    right: gameScale(13),
    alignItems: 'flex-end',
    zIndex: 10,
    
  },
  
  cardNameContainer: {
    position: 'absolute',
    bottom: gameScale(-.8),
    width: '90%', 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, 
    borderRadius: gameScale(5),
  },

  cardTitle: {
    fontFamily: 'GoldenAgeDark',
    fontSize: gameScale(3),
    color: 'rgb(255, 255, 255)',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },

  cardDamageLabel: {
    fontFamily: 'GoldenAgeDark',
    fontSize: gameScale(2.5), 
    color: '#aaa',
  },
  
  cardDamageValue: {
    fontFamily: 'GoldenAgeDark',
    fontSize: gameScale(5), 
    color: '#dcdcdc',
    marginTop: gameScale(-1),
  },
});