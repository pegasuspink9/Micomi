import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

const PVP_BG_VIDEO = 'https://micomi-assets.me/Pvp%20Assets/Landing%20Image/FinalBackground%20(1).mp4';

const PvpBackgroundVideo = () => {
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Stabilize video source with useMemo to prevent re-renders
  const videoSource = useMemo(() => {
    const cachedPath = universalAssetPreloader.getCachedAssetPath(PVP_BG_VIDEO);
    return { uri: cachedPath || PVP_BG_VIDEO };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Solid fallback background - always visible underneath */}
      <View style={styles.fallbackBackground} />

      {/* Video layer - only render if no error */}
      {!videoError && (
        <Video
          source={videoSource}
          style={[styles.videoBackground, !videoReady && styles.hidden]}
          shouldPlay
          isLooping
          isMuted
          resizeMode={ResizeMode.COVER}
          useNativeControls={false}
          rate={1.0}
          progressUpdateIntervalMillis={0}
          onLoad={() => setVideoReady(true)}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Dark overlay for readability on top of the video */}
      <View style={styles.videoOverlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#081a33',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default React.memo(PvpBackgroundVideo);