import { ImageBackground } from 'expo-image';
import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, Image } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LevelModal = ({ 
  visible = true, 
  onClose = () => {},
  onPlay = () => {},
  levelData = {
    level_number: 5,
    level_type: "Logic Puzzle",
    level_difficulty: "MEDIUM",
    content: "Solve the pattern sequence to unlock the next area. Use logical thinking to identify the missing elements in the sequence.",
    points_reward: 150,
    is_unlocked: true
  }
}) => {
  
  const getDifficultyColor = (difficulty) => {
    const colors = {
      'EASY': '#34c759',
      'MEDIUM': '#ff9500',
      'HARD': '#ff3b30',
      'EXPERT': '#af52de'
    };
    return colors[difficulty] || '#007aff';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.robotHead}>
          {/* Outer Decorative Border */}
          <View style={styles.outerBorder}>
            {/* Robot Antenna */}
            <Image source={{uri: 'https://github.com/user-attachments/assets/4743543a-b50b-4a55-bb59-8e0c53c08919'}}  style={styles.antenna}/>
            
            {/* Robot Eyes/Visor with Organic Shape */}
            <View style={styles.visor}>
               <ImageBackground
                  source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759220459/363a62c7-6a6a-456a-a3b5-c1ffb987aef1_fnpugf.png' }}
              
                  imageStyle={styles.backgroundImage} 
                  resizeMode="cover"
                >
                <View style={styles.visorGlass}  resizeMode="cover">
                  {/* Modal Content */}
                  <View style={styles.modalContent}>
                    <View style={styles.textContainer}>
                       <Text style={styles.levelTitle}>Level: {levelData.level_number}</Text>
                    </View>
                 
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelType}>{levelData.level_type}</Text>
                  </View>

                  <View style={styles.levelInfo}>
                    <Text style={styles.enemy}>Enemy Found:{levelData.level_type}</Text>
                  </View>
                  
                  
                  <View style={styles.contentContainer}>
                    <Text style={styles.contentText}>{levelData.content}</Text>
                  </View>

                  <View style={styles.rewardContainer}>
                    <Text style={styles.rewardLabel}>Rewards:</Text>
                    <View style={styles.rewardFrames}>
                      
                      <View style={styles.rewardFrame}>
                        <View style={styles.rewardBox}>
                          <View style={styles.rewardIconContainer}>
                            <Text style={styles.rewardIcon}>🪙</Text>
                            <Text style={styles.rewardPointsInside}>{levelData.points_reward}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.rewardFrame}>
                        <View style={styles.rewardBox}>
                          <View style={styles.rewardIconContainer}>
                            <Text style={styles.rewardIcon}>⭐</Text>
                            <Text style={styles.rewardPointsInside}>{Math.floor(levelData.points_reward * 0.8)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: levelData.is_unlocked ? '#34c759' : '#8e8e93' }
                    ]}>
                      <Text style={styles.statusText}>
                        {levelData.is_unlocked ? 'Cleared' : 'Locked'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
                 </ImageBackground>
            </View>
          </View>
          
          {/* Close Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>

        {/* Play Button - Outside and Below the Modal */}
        <View style={styles.playButtonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.playButtonOuter,
              pressed && styles.playButtonPressed
            ]}
            onPress={onPlay}
          >
            <View style={styles.playButtonMiddle}>
              <Text style={styles.playButtonText}>PLAY</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  robotHead: {
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * -0.2,
    width: SCREEN_WIDTH * 0.85,
    position: 'relative',
  },

  // Outer decorative border with complex curves
  outerBorder: {
    backgroundColor: '#03aaafff',
    borderRadius: SCREEN_WIDTH * 0.12,
    padding: 4,
    borderTopLeftRadius: SCREEN_WIDTH * 0.12,
    borderTopRightRadius: SCREEN_WIDTH * 0.12,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.12,
    borderBottomRightRadius: SCREEN_WIDTH * 0.12,
    shadowColor: '#1e40af',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
    // Gradient-like effect with borders
    borderTopWidth: 3,
    borderTopColor: '#01142bff',
    borderLeftWidth: 2,
    borderLeftColor: '#01142bff',
    borderBottomWidth: 4,
    borderBottomColor: '#01142bff',
    borderRightWidth: 3,
    borderRightColor: '#01142bff',
  },

  antenna: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_WIDTH * -0.35,
    zIndex: 5,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
  },

  visor: {
    backgroundColor: '#e8ecedff',
    padding: 4,
    marginBottom: -120,
    // Organic visor shape
    borderTopLeftRadius: SCREEN_WIDTH * 0.15,
    borderTopRightRadius: SCREEN_WIDTH * 0.12,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.06,
    borderBottomRightRadius: SCREEN_WIDTH * 0.06,
    // Enhanced 3D visor effect
    borderTopWidth: 2,
    borderTopColor: '#002c38ff',
    borderLeftWidth: 1,
    borderLeftColor: '#002c38ff',
    borderBottomWidth: 3,
    borderBottomColor: '#002c38ff',
    borderRightWidth: 2,
    borderRightColor: '#002c38ff',
    // Subtle glow
    shadowColor: '#002c38ff',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },

  visorGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.81)',
    minHeight: SCREEN_HEIGHT * 0.4,
    position: 'relative',
    overflow: 'hidden',
    // Matching organic glass shape
    borderTopLeftRadius: SCREEN_WIDTH * 0.15,
    borderTopRightRadius: SCREEN_WIDTH * 0.11,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.055,
    borderBottomRightRadius: SCREEN_WIDTH * 0.055,
    // Enhanced glass effect
    borderWidth: 2,
    borderTopColor: 'rgba(4, 59, 141, 0.55)',
    borderLeftColor: 'rgba(4, 59, 141, 0.8)',
    borderBottomColor: 'rgba(4, 59, 141, 0.8)',
    borderRightColor: 'rgba(4, 59, 141, 0.8)',
    paddingBottom: 100,
  },


// imageStyle applied directly to the background image (this actually rounds the bitmap)
backgroundImage: {
  borderTopLeftRadius: SCREEN_WIDTH * 0.15,
  borderTopRightRadius: SCREEN_WIDTH * 0.11,
  borderBottomLeftRadius: SCREEN_WIDTH * 0.055,
  borderBottomRightRadius: SCREEN_WIDTH * 0.055,
},

  modalContent: {
    alignItems: 'center',
  },

  textContainer: {
    backgroundColor: '#3f76dcc2',
    width: SCREEN_WIDTH * 0.7,  
    height: SCREEN_WIDTH * 0.17,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.1, 
    borderBottomRightRadius: SCREEN_WIDTH * 0.1, 
    borderTopLeftRadius: 0,     
    borderTopRightRadius: 0,   
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', 
    borderWidth: 2,
    borderColor: '#darkgreen',
    shadowColor: '#000000ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    marginBottom: 10,
    shadowOpacity: 1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  levelTitle: {
    fontSize: SCREEN_WIDTH * 0.13,
    color: '#d8d8d8ff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  levelInfo: {
    alignItems: 'center',
    width: '100%',
  },

  levelType: {
    fontSize: SCREEN_WIDTH * 0.1,
    color: '#2c5282',
    fontWeight: '600',
    fontFamily: 'FunkySign',
    textAlign: 'center',
  },

  contentText: {
    fontSize: SCREEN_WIDTH * 0.029,
    color: '#374151',
    textAlign: 'justify',
    width: 230,
    fontFamily: 'DynaPuff',
  },

  contentContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 12
  },

  rewardContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },

  rewardLabel: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'DynaPuff',
  },

  rewardFrames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    paddingHorizontal: 20,
  },

  // Outer simple border frame
  rewardFrame: {
    backgroundColor: '#000000c2',
    padding: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },

  // Middle gold layer
  rewardBox: {
    backgroundColor: '#FFD700',
    padding: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SCREEN_WIDTH * 0.1,
    minHeight: SCREEN_WIDTH * 0.15,
  },

  // Inner black container with icon and text overlaid
  rewardIconContainer: {
    borderColor: 'black',
    borderWidth: 2,
    backgroundColor: '#ffffffe9',
    width: SCREEN_WIDTH * 0.15,
    height: SCREEN_WIDTH * 0.15,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  rewardIcon: {
    fontSize: SCREEN_WIDTH * 0.06,
    textAlign: 'center',
    position: 'absolute',
    top: SCREEN_WIDTH * 0.01,
  },

  rewardPointsInside: {
    fontSize: SCREEN_WIDTH * 0.028,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    position: 'absolute',
    bottom: SCREEN_WIDTH * 0.01,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  statusContainer: {
    width: '100%',
    alignItems: 'center',
  },

  statusIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    // Organic status indicator
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  statusText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: 'FunkySign',
  },

  closeButton: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.01,
    right: SCREEN_WIDTH * 0.02,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    // Enhanced 3D button effect
    borderTopWidth: 3,
    borderTopColor: '#fca5a5',
    borderLeftWidth: 2,
    borderLeftColor: '#f87171',
    borderBottomWidth: 4,
    borderBottomColor: '#b91c1c',
    borderRightWidth: 3,
    borderRightColor: '#dc2626',
  },

  closeButtonPressed: {
    transform: [{ translateY: 2 }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  closeButtonText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Play Button Styles - Same styling as modal but green themed
  playButtonContainer: {
    position: 'absolute',
    marginTop: SCREEN_HEIGHT * 0.75,
    alignItems: 'center',
  },

  playButtonOuter: {
    backgroundColor: '#000000ff', // Same blue as modal
    padding: 4,
    borderRadius: SCREEN_WIDTH * 0.08,
    shadowColor: '#1e40af',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
    borderTopWidth: 3,
    borderTopColor: '#01142bff',
    borderLeftWidth: 2,
    borderLeftColor: '#01142bff',
    borderBottomWidth: 4,
    borderBottomColor: '#01142bff',
    borderRightWidth: 3,
    borderRightColor: '#01142bff',
  },

  playButtonMiddle: {
    backgroundColor: '#22c5baaf',
    padding: 4,
    borderRadius: SCREEN_WIDTH * 0.075,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SCREEN_WIDTH * 0.35,
    minHeight: SCREEN_WIDTH * 0.15,
    borderTopWidth: 2,
    borderTopColor: '#f1f1f1a6',
    borderLeftWidth: 1,
    borderLeftColor: '#22c5baaf',
    borderBottomWidth: 3,
    borderBottomColor: '#f1f1f1a6',
    borderRightWidth: 2,
    borderRightColor: '#22c5baaf',
  },



  playButtonText: {
    fontSize: SCREEN_WIDTH * 0.1,
    color: '#ffffffe0',
    fontFamily: 'FunkySign',
    textAlign: 'center',
  },

  playButtonPressed: {
    transform: [{ translateY: 3 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default LevelModal;