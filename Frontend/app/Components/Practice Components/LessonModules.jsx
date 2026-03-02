import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import { useLesson } from '../../hooks/useLesson';

// Define repeating color palettes based on the QuestCard styles
const BORDER_PALETTES = [
  { // Blue
    gradient: ['#1e3a5f', '#0d1f33'],
    outerBg: '#1e3a5f', outerBorderTop: '#0d1f33', outerBorderBottom: '#2d5a87',
    middleBg: '#152d4a', middleBorderTop: '#4a90d9', middleBorderBottom: '#0a1929',
    innerBg: 'rgba(74, 144, 217, 0.15)', innerBorder: 'rgba(74, 144, 217, 0.3)',
  },
  { // Green
    gradient: ['#2d5a2d', '#1a3d1a'],
    outerBg: '#2d5a2d', outerBorderTop: '#1a3d1a', outerBorderBottom: '#4CAF50',
    middleBg: '#1a3d1a', middleBorderTop: '#66BB6A', middleBorderBottom: '#0d260d',
    innerBg: 'rgba(76, 175, 80, 0.2)', innerBorder: 'rgba(102, 187, 106, 0.4)',
  },
  { // Light Blue
    gradient: ['#1a5276', '#0e3a52'],
    outerBg: '#1a5276', outerBorderTop: '#0e3a52', outerBorderBottom: '#2980b9',
    middleBg: '#14415e', middleBorderTop: '#3498db', middleBorderBottom: '#0a2d42',
    innerBg: 'rgba(52, 152, 219, 0.15)', innerBorder: 'rgba(52, 152, 219, 0.3)',
  },
  { // Purple / Dark Blue
    gradient: ['#2a4a6e', '#15304d'],
    outerBg: '#2a4a6e', outerBorderTop: '#15304d', outerBorderBottom: '#3d6a94',
    middleBg: '#1f3a57', middleBorderTop: '#5a9fd4', middleBorderBottom: '#0f2536',
    innerBg: 'rgba(90, 159, 212, 0.15)', innerBorder: 'rgba(90, 159, 212, 0.3)',
  }
];

const ModuleCard = ({ item, index }) => {
  const router = useRouter();
  const palette = BORDER_PALETTES[index % BORDER_PALETTES.length];

  const dots = useMemo(() => {
    const dotArray = [];
    const dotCount = 15;
    for (let i = 0; i < dotCount; i++) {
        dotArray.push({
        id: i,
        top: `${Math.random() * 90 + 5}%`,
        left: `${Math.random() * 90 + 5}%`,
        size: gameScale(Math.random() * 8 + 4),
        opacity: Math.random() * 0.15 + 0.05,
        isLight: Math.random() > 0.5,
      });
    }
    return dotArray;
  }, [item.map_id]);

  const handlePress = () => {
    router.push({ 
      pathname: '/CourseTopics',
      params: { 
        mapId: item.map_id, 
        mapName: item.map_name 
      } 
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.cardWrapper}>
      <View style={[
        styles.cardBorderOuter, 
        { 
          backgroundColor: palette.outerBg,
          borderTopColor: palette.outerBorderTop,
          borderLeftColor: palette.outerBorderTop,
          borderBottomColor: palette.outerBorderBottom,
          borderRightColor: palette.outerBorderBottom,
        }
      ]}>
        <View style={[
          styles.cardBorderMiddle, 
          { 
            backgroundColor: palette.middleBg,
            borderTopColor: palette.middleBorderTop,
            borderLeftColor: palette.middleBorderTop,
            borderBottomColor: palette.middleBorderBottom,
            borderRightColor: palette.middleBorderBottom,
          }
        ]}>
          <View style={[
            styles.cardBorderInner,
            {
              backgroundColor: palette.innerBg,
              borderColor: palette.innerBorder,
            }
          ]}>
            <LinearGradient
              colors={palette.gradient}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.dotsOverlay} pointerEvents="none">
                {dots.map((dot) => (
                  <View
                    key={dot.id}
                    style={[
                      styles.dot,
                      {
                        top: dot.top,
                        left: dot.left,
                        width: dot.size,
                        height: dot.size,
                        borderRadius: dot.size / 2,
                        backgroundColor: dot.isLight 
                          ? `rgba(255, 255, 255, ${dot.opacity})` 
                          : `rgba(0, 0, 0, ${dot.opacity})`,
                      }
                    ]}
                  />
                ))}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.moduleTitleText}>{item.map_name}</Text>
                <Text style={styles.moduleSubtitleText}>Tap to start studying</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function LessonModules() {
  const router = useRouter();
  const { languages, loading, error } = useLesson();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={styles.backButtonText}>{'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Modules</Text>
        <View style={{ width: gameScale(50) }} /> 
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4dabf7" />
            <Text style={styles.loadingText}>Loading modules...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {languages.map((item, index) => (
              <ModuleCard key={item.map_id} item={item} index={index} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(15),
    paddingVertical: gameScale(15),
  },
  backButton: {
    paddingVertical: gameScale(5),
    paddingHorizontal: gameScale(10),
  },
  backButtonText: {
    color: '#4a90d9',
    fontFamily: 'Grobold',
    fontSize: gameScale(14),
  },
  headerTitle: {
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: gameScale(2) },
    textShadowRadius: gameScale(4),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: gameScale(10),
    color: '#d1d5d9',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(14),
  },
  errorText: {
    color: '#ff5f56',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(16),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: gameScale(20),
    gap: gameScale(25),
    paddingBottom: gameScale(50),
  },
  cardWrapper: {
    width: '100%',
  },
  cardBorderOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(6) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(8),
    elevation: 8,
    overflow: 'hidden',
    borderRadius: gameScale(16),
  },
  cardBorderMiddle: {
    flex: 1,
    borderWidth: gameScale(1.5),
    padding: gameScale(1.5),
    borderRadius: gameScale(14),
    overflow: 'hidden',
  },
  cardBorderInner: {
    flex: 1,
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  cardGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(10),
    minHeight: gameScale(140), 
    position: 'relative',
  },
  dotsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  dot: {
    position: 'absolute',
  },
  cardContent: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitleText: {
    color: '#ffffff',
    fontSize: gameScale(32), 
    fontFamily: 'Grobold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: gameScale(2), height: gameScale(3) },
    textShadowRadius: gameScale(4),
  },
  moduleSubtitleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    marginTop: gameScale(8),
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
});