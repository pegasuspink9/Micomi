import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { gameScale } from '../Responsiveness/gameResponsive';
import { connectivityStore, useConnectivity } from '../../store/connectivityStore';
import { apiService } from '../../services/api';

// Removed Image related constants (SPRITE_SHEET, IMAGE_WIDTH, IMAGE_HEIGHT)

const RECONNECT_MESSAGES = [
  "Micomi's searching for signal...",
  "Micomi has lost the trail...",
  "Putting the internet back together...",
  "Micomi is casting a connection spell...",
  "Hang tight, Micomi is on it!",
  "Where did the wifi go? Micomi is looking.",
];

export default function UniversalLoadingOverlay({ label }) {
  const isOffline = useConnectivity();
  // State to keep track of current message index
  const [messageIdx, setMessageIdx] = useState(0);

  // --- NetInfo Listener (NO LOGIC CHANGE) ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const hasInternet = state.isInternetReachable ?? state.isConnected;
      if (typeof hasInternet === 'boolean') {
        connectivityStore.setOffline(!hasInternet);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Connection Tester & Message Cycler (NO LOGIC CHANGE) ---
  useEffect(() => {
    if (!isOffline) {
        // Reset message index when we come back online
        setMessageIdx(0);
        return undefined;
    }

    // 1. Ping API periodically
    const connectionIntervalId = setInterval(() => {
      apiService.testConnection().catch(() => {});
    }, 3000);

    // 2. Cycle messages periodically
    const messageIntervalId = setInterval(() => {
        // Cycle to the next message index, looping back to 0 at the end
        setMessageIdx((prevIdx) => (prevIdx + 1) % RECONNECT_MESSAGES.length);
    }, 2500); // Change message every 2.5 seconds

    // Cleanup both intervals
    return () => {
        clearInterval(connectionIntervalId);
        clearInterval(messageIntervalId);
    };
  }, [isOffline]);


  if (!isOffline) return null;

  // Determine text to display: use provided label if it exists, otherwise use rotating messages
  const displayText = label || RECONNECT_MESSAGES[messageIdx];

  return (
    <View
      style={styles.overlay}
      pointerEvents="auto"
      // Prevents touches passing through to the game beneath
      onStartShouldSetResponder={() => true}
    >
      <View style={styles.content}>
        {/* Image Removed here */}

        {/* Added a key here to trigger a subtle fade effect when text changes (optional but nice) */}
        <Text key={displayText} style={styles.label}>
            {displayText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', // Slightly darker background for better contrast
    zIndex: 99999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: gameScale(20),
  },
  // staticImage style removed
  label: {
    // Removed margin since it's now the only element and should be perfectly centered
    // marginTop: gameScale(8),
    color: '#ffffff',
    // Ensure your font family is linked correctly
    fontFamily: 'DynaPuff',
    fontSize: gameScale(18),
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: gameScale(24),
  },
});