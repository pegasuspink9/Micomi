import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameData } from './hooks/useGameData';
import Guide from './Components/Actual Game/GameQuestions/Output/Guide';
import MainLoading from './Components/Actual Game/Loading/MainLoading';
import { Ionicons } from '@expo/vector-icons';
import { gameScale } from './Components/Responsiveness/gameResponsive';

export default function LessonPage() {
  const { levelId } = useLocalSearchParams();
  const router = useRouter();
  
  const { gameState, loading } = useGameData(levelId);
  const [currentPage, setCurrentPage] = useState(0);

  // 1. Extract and split the content into pages based on "next page"
  const pages = useMemo(() => {
    if (gameState?.modules && gameState.modules.length > 0) {
      const fullContent = gameState.modules.map(m => m.lesson_content).join('\n\n');
      // Split by "next page" (case-insensitive) and remove empty pages
      return fullContent
        .split(/next page/i)
        .map(page => page.trim())
        .filter(page => page.length > 0);
    }
    return [];
  }, [gameState]);

  const currentGuideContent = pages[currentPage] || '';

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      router.back(); // Complete Lesson
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (loading) return <MainLoading visible={true} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={gameScale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {gameState?.level?.level_title || 'Lesson Guide'}
        </Text>
        <View style={styles.pageIndicatorContainer}>
          <Text style={styles.pageIndicatorText}>
            {pages.length > 0 ? `${currentPage + 1} / ${pages.length}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Using key={currentPage} forces the ScrollView inside Guide to reset to the top on page change */}
         <Guide 
          key={currentPage} 
          currentQuestion={{ guide: currentGuideContent }} 
          isFullPageLesson={true} 
        />
      </View>

      {/* Footer with Pagination Controls */}
      <View style={styles.footer}>
        {currentPage > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
            <Ionicons name="chevron-back" size={gameScale(24)} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.completeButton, 
            { marginLeft: currentPage > 0 ? gameScale(10) : 0 }
          ]} 
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
    backgroundColor: '#0d253f', // Dark blue theme
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
    width: gameScale(40),
    alignItems: 'flex-end',
  },
  pageIndicatorText: {
    color: '#4dabf7',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff', // White background for the Guide component
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
    backgroundColor: '#0e639c', // Small blue box
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
    flex: 1, // Takes up remaining space
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