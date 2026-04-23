import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
// 1. Import Video AND ResizeMode from expo-av
import { Video, ResizeMode } from 'expo-av';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

const PVP_BG_VIDEO = 'https://micomi-assets.me/Pvp%20Assets/Landing%20Image/FinalBackground.mp4';

const PvpBackgroundVideo = () => {
  const getCachedVideoSource = useCallback(() => {
    const cachedPath = universalAssetPreloader.getCachedAssetPath(PVP_BG_VIDEO);
    return { uri: cachedPath || PVP_BG_VIDEO };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Video
        source={getCachedVideoSource()}
        style={styles.videoBackground}
        shouldPlay
        isLooping={true}
        resizeMode={ResizeMode.STRETCH}
        isMuted
        useNativeControls={false}
      />
      <View style={styles.videoOverlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default React.memo(PvpBackgroundVideo);