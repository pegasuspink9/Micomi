import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import { Ionicons } from '@expo/vector-icons';
import { useLesson } from '../../hooks/useLesson'; // Import the hook

export default function CourseTopics() {
  const { mapId, mapName } = useLocalSearchParams();
  const router = useRouter();
  
  // Use the lesson hook instead of local states
  const { topics, topicsLoading, topicsError, fetchTopics } = useLesson();

  useEffect(() => {
    if (mapId) {
      fetchTopics(mapId);
    }
  }, [mapId, fetchTopics]);

  const handleTopicPress = (moduleId, title) => {
    router.push({
      pathname: '/LessonPage',
      params: { moduleId: moduleId, title: title }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={styles.backButtonText}>{'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mapName ? `${mapName} Topics` : 'Course Topics'}</Text>
        <View style={{ width: gameScale(50) }} /> 
      </View>

      <View style={styles.container}>
        {topicsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4dabf7" />
            <Text style={styles.loadingText}>Loading topics...</Text>
          </View>
        ) : topicsError ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{topicsError}</Text>
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>No topics found for this module.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {topics.map((item, index) => (
              <TouchableOpacity
                key={item.module_id || index}
                activeOpacity={0.8}
                onPress={() => handleTopicPress(item.module_id, item.module_title)}
              >
                <View style={styles.card3DOuter}>
                  <View style={styles.card3DMiddle}>
                    <View style={styles.card3DInner}>
                      <LinearGradient
                        colors={['#0d294d', '#09284b']}
                        style={styles.cardContent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text 
                          style={styles.topicTabText}
                          numberOfLines={2} 
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.5} 
                        >
                          {item.module_title}
                        </Text>
                        <Ionicons name="play-circle" size={gameScale(22)} color="#4dabf7" />
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
    fontSize: gameScale(20),
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
    paddingHorizontal: gameScale(20),
  },
  loadingText: {
    marginTop: gameScale(10),
    color: '#d1d5d9',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(14),
    textAlign: 'center',
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
    gap: gameScale(15),
    paddingBottom: gameScale(50),
  },

  // --- Leaderboard-style 3D Cards (Copied from LessonPage) ---
  card3DOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    backgroundColor: '#1e3a5f',
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
    borderRadius: gameScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(3) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(4),
    elevation: 5,
  },
  card3DMiddle: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    backgroundColor: '#152d4a',
    borderTopColor: '#5a9fd4',
    borderLeftColor: '#5a9fd4',
    borderBottomColor: '#0f2536',
    borderRightColor: '#0f2536',
    borderRadius: gameScale(10),
  },
  card3DInner: {
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderColor: 'rgba(74, 144, 217, 0.3)',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(20),
    height: gameScale(65), // Fixed height forces the title box size globally
  },
  topicTabText: {
    color: '#e0e0e0',
    fontFamily: 'Grobold',
    fontSize: gameScale(15),
    flex: 1,
    marginRight: gameScale(10),
  },
});