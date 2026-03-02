import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar, ImageBackground, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { LinearGradient } from 'expo-linear-gradient'; // Add this

export default function PracticeScreen() {
  const router = useRouter();

  const MenuButton = ({ title, onPress, bgImage, color = '#ffbd2e' }) => {
    // Derive the translucent color to match the end of the LinearGradient
    const flagEndColor = color.length === 9 || color.includes('rgba') ? color : color + 'CC';

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.boxButton,
          { 
            borderColor: color, 
            borderBottomColor: color 
          },
          pressed && styles.boxButtonPressed
        ]}
        onPress={onPress}
      >
        <ImageBackground 
          source={bgImage} 
          style={styles.buttonBg} 
          imageStyle={styles.buttonImageStyle}
          resizeMode="cover"
        >
          {/* Flag Container */}
          <View style={styles.flagWrapper}>
            <LinearGradient
              colors={[color, flagEndColor]} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.flagContainer}
            >
              <Text style={styles.boxText}>{title}</Text>
            </LinearGradient>
            {/* Flag Corner notch effect now matches the end color and alpha */}
            <View style={[styles.flagNotch, { borderLeftColor: flagEndColor }]} />
          </View>
        </ImageBackground>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Game Modes</Text>
        </View>
        
        <View style={styles.menuContainer}>
          <MenuButton 
            title="Story Mode" 
            onPress={() => router.push('/StoryMode')} 
            bgImage={require('../Components/Practice Components/Story.png')} 
            color="#4a6e10a9"
          />

          <MenuButton 
            title="Study Lessons" 
            onPress={() => router.push('../../Components/Practice Components/LessonModules')}
            bgImage={require('../Components/Practice Components/Study.png')}
            color="#0d3457"
          />

          <MenuButton 
            title="PlayGround" 
            onPress={() => router.push('../../Components/Practice Components/CodePlayGround')}
            bgImage={require('../Components/Practice Components/Coding.png')}
            color="#0d666f"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
    
    top: gameScale(40),
  },
  scrollContent: {
    padding: gameScale(10),
    paddingBottom: gameScale(30),
  },
  container: {
    flex: 1,
    padding: gameScale(10),
    justifyContent: 'center',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#0d3457',
    borderRadius: gameScale(16),
    borderWidth: gameScale(3),
    borderColor: '#214564',
    borderBottomWidth: gameScale(6),
    borderBottomColor: '#214564',
    paddingVertical: gameScale(15),
    marginBottom: gameScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: gameScale(30),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: gameScale(4) },
    textShadowRadius: gameScale(4),
  },
   menuContainer: {
    gap: gameScale(25), // Increased gap for descriptions
    paddingBottom: gameScale(20),
  },
  buttonWrapper: {
    width: '100%',
  },
  boxButton: {
    width: '100%',
    height: gameScale(200),
    borderRadius: gameScale(16),
    borderWidth: gameScale(3), // Increased for visibility
    borderBottomWidth: gameScale(10), 
    overflow: 'hidden'
  },
  buttonBg: {
    flex: 1,
  },
  buttonImageStyle: {
    opacity: 0.7,
  },
  flagWrapper: {
    position: 'absolute',
    top: gameScale(15),
    left: gameScale(-5), // Slight offset to look like it's pinned to the edge
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(8),
    borderTopRightRadius: gameScale(4),
    borderBottomRightRadius: gameScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  flagNotch: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: gameScale(17),
    borderBottomWidth: gameScale(17),
    borderLeftWidth: gameScale(15),
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: gameScale(-1),
  },
  boxButtonPressed: {
    borderBottomWidth: gameScale(3), 
    transform: [{ translateY: gameScale(7) }], 
  },
  boxText: {
    color: '#ffffff',
    fontSize: gameScale(15),
    fontFamily: 'Grobold',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});