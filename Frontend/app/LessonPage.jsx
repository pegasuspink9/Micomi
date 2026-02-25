import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameData } from './hooks/useGameData';
import Guide from './Components/Actual Game/GameQuestions/Output/Guide';
import MainLoading from './Components/Actual Game/Loading/MainLoading';
import { Ionicons } from '@expo/vector-icons';
import { gameScale } from './Components/Responsiveness/gameResponsive';
import { LinearGradient } from 'expo-linear-gradient'; // Added import for gradients

export default function LessonPage() {
  const { levelId } = useLocalSearchParams();
  const router = useRouter();
  
  const { gameState, loading } = useGameData(levelId);
  const [currentPage, setCurrentPage] = useState(0);
  const [showTopics, setShowTopics] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Use useEffect to handle state transitions properly
  React.useEffect(() => {
    if (!loading) {
      // This will trigger the exit (opening panels) animation in MainLoading
      setShowLoading(false);
    }
  }, [loading]);

  const pages = useMemo(() => {
    if (gameState?.modules && gameState.modules.length > 0) {
      const fullContent = gameState.modules.map(m => m.lesson_content).join('\n\n');
      return fullContent
        .split(/next page/i)
        .map(page => page.trim())
        .filter(page => page.length > 0);
    }
    return [];
  }, [gameState]);

  const topics = useMemo(() => {
    return pages.map((pageContent, index) => {
      const match = pageContent.match(/--(.+?)--/);
      let title = `Page ${index + 1}`;
      if (match && match[1]) {
        title = match[1].replace(/:$/, '').trim(); 
      }
      return { title, pageIndex: index };
    });
  }, [pages]);

  const currentGuideContent = pages[currentPage] || '';

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      router.back(); 
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />

        <MainLoading visible={showLoading} />
      
      
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={gameScale(24)} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {gameState?.level?.level_title || 'Lesson Guide'}
          </Text>
          
          <TouchableOpacity 
            style={styles.pageIndicatorContainer}
            onPress={() => setShowTopics(!showTopics)}
            activeOpacity={0.7}
          >
            <Text style={styles.pageIndicatorText}>
              {pages.length > 0 ? `${currentPage + 1} / ${pages.length}` : ''}
            </Text>
            <Ionicons 
              name={showTopics ? "chevron-up" : "chevron-down"} 
              size={gameScale(16)} 
              color="#4dabf7" 
              style={{ marginLeft: gameScale(4) }} 
            />
          </TouchableOpacity>
        </View>

        {showTopics && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {topics.map((topic, idx) => {
                const isActive = currentPage === topic.pageIndex;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCurrentPage(topic.pageIndex);
                      setShowTopics(false);
                    }}
                  >
                    <View style={[styles.card3DOuter, isActive && styles.activeCard3DOuter]}>
                      <View style={[styles.card3DMiddle, isActive && styles.activeCard3DMiddle]}>
                        <View style={[styles.card3DInner, isActive && styles.activeCard3DInner]}>
                          <LinearGradient
                            colors={isActive ? ['#b8860b', '#8b6508'] : ['#0d294d', '#09284b']}
                            style={styles.cardContent}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Text style={[styles.topicTabText, isActive && styles.activeTopicTabText]}>
                              {topic.title}
                            </Text>
                            {isActive && (
                              <Ionicons name="checkmark-circle" size={gameScale(22)} color="#FFD700" />
                            )}
                          </LinearGradient>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.content}>
         <Guide 
          key={currentPage} 
          currentQuestion={{ guide: currentGuideContent }} 
          isFullPageLesson={true} 
        />
      </View>

      <View style={styles.footer}>
        {currentPage > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrev} activeOpacity={0.9}>
            <Ionicons name="chevron-back" size={gameScale(24)} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.completeButton, 
            { marginLeft: currentPage > 0 ? gameScale(10) : 0 }
          ]} 
          activeOpacity={0.9}
          onPress={handleNext}
        >
          <Text style={styles.completeButtonText}>
            {currentPage < pages.length - 1 ? 'Next Page' : 'Ready to fight!'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d253f', 
  },
  headerWrapper: {
    zIndex: 10, 
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(15),
    paddingVertical: gameScale(15),
    backgroundColor: '#0d253f',
    borderBottomWidth: gameScale(2),
    borderBottomColor: '#4dabf7',
    zIndex: 11,
  },
  backButton: {
    padding: gameScale(5),
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: gameScale(20),
    fontFamily: 'Grobold',
    textAlign: 'center',
    flex: 1,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a5f',
    paddingVertical: gameScale(6),
    paddingHorizontal: gameScale(10),
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: '#4dabf7',
  },
  pageIndicatorText: {
    color: '#4dabf7',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
  },
  
  // --- Hanging Dropdown Styles (100% Width) ---
   dropdownContainer: {
    position: 'absolute',
    top: '100%', 
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'rgba(13, 37, 63, 0.98)', // Slightly more opaque
    borderBottomWidth: gameScale(2),
    borderColor: '#4dabf7',
    maxHeight: gameScale(600), 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(6) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(8),
    elevation: 15,
    zIndex: 10,
  },
  dropdownScroll: {
    flexGrow: 0,
    paddingHorizontal: gameScale(15),
    paddingTop: gameScale(15),
    paddingBottom: 0, // Removed bottom padding as requested
  },

  // --- Leaderboard-style 3D Cards ---
  card3DOuter: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    backgroundColor: '#1e3a5f',
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
    borderRadius: gameScale(10),
    marginBottom: gameScale(10), // Gap between buttons
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
    paddingVertical: gameScale(16),
  },

  // --- Active State (Gold Theme) ---
  activeCard3DOuter: {
    backgroundColor: '#8B6508',
    borderTopColor: '#FDB931',
    borderLeftColor: '#FDB931',
    borderBottomColor: '#5D4037',
    borderRightColor: '#5D4037',
  },
  activeCard3DMiddle: {
    backgroundColor: '#a2770a',
    borderTopColor: '#FFD700',
    borderLeftColor: '#FFD700',
    borderBottomColor: '#3E2723',
    borderRightColor: '#3E2723',
  },
  activeCard3DInner: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },

  topicTabText: {
    color: '#e0e0e0',
    fontFamily: 'Grobold',
    fontSize: gameScale(15),
    flex: 1,
  },
  activeTopicTabText: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // -------------------------------

  content: {
    flex: 1,
    backgroundColor: '#ffffff', 
    zIndex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: gameScale(15),
    backgroundColor: '#ffffff',
    borderTopWidth: gameScale(1),
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#0e639c', 
    paddingVertical: gameScale(12),
    paddingHorizontal: gameScale(15),
    borderRadius: gameScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(3),
    elevation: gameScale(5),
  },
  completeButton: {
    flex: 1, 
    backgroundColor: '#4caf50',
    paddingVertical: gameScale(15),
    borderRadius: gameScale(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(3),
    elevation: gameScale(5),
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: gameScale(18),
    fontFamily: 'Grobold',
  },
});