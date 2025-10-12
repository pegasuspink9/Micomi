import React from 'react';
import { View, Text, ActivityIndicator, ProgressBarAndroid, ProgressViewIOS, StyleSheet, Platform } from 'react-native';

const ProgressBar = Platform.OS === 'ios' ? ProgressViewIOS : ProgressBarAndroid;

export default function AssetDownloadProgress({ 
  visible, 
  progress, 
  currentAsset, 
  onComplete 
}) {
  if (!visible) return null;

  const percentage = Math.round(progress.progress * 100);

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>Downloading Character Assets</Text>
        
        <View style={styles.progressContainer}>
          <ProgressBar
            style={styles.progressBar}
            progress={progress.progress}
            color="#4CAF50"
          />
          <Text style={styles.progressText}>
            {progress.loaded} / {progress.total} ({percentage}%)
          </Text>
        </View>

        {currentAsset && (
          <Text style={styles.currentAsset}>
            {currentAsset.characterName} - {currentAsset.name}
          </Text>
        )}

        <ActivityIndicator 
          size="large" 
          color="#4CAF50" 
          style={styles.spinner} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'rgba(3, 63, 116, 0.9)',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Computerfont',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Computerfont',
    color: 'white',
    textAlign: 'center',
  },
  currentAsset: {
    fontSize: 12,
    fontFamily: 'Computerfont',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 15,
  },
  spinner: {
    marginTop: 10,
  },
});