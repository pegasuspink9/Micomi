import React, { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { isRunningInExpoGo } from 'expo';

// In Expo Go on Android, native push/local notifications modules in expo-notifications
// can throw Metro errors or crash the bundler. We bypass loading it there, 
// but enable it for iOS Expo Go, Custom Development builds, APK, and AAB production builds.
const shouldDisableNotifications = isRunningInExpoGo() && Platform.OS === 'android';

let Notifications = null;
if (!shouldDisableNotifications) {
  try {
    Notifications = require('expo-notifications');
  } catch (error) {
    console.warn('⚠️ Failed to load expo-notifications in EnergyNotificationManager:', error);
  }
}

// Engaging phrases for player retention (hourly)
const HOURLY_PHRASES = [
  "A bug is destroying the lands! Fight with Micomi now!",
  "Energy is full! Come fight with Micomi!",
  "The bugs are taking over! Micomi needs your help!",
  "Your energy is restored! Ready for the next battle?",
  "Don't let the bugs win! Micomi is calling you!",
  "Adventure awaits! Jump back into Micomi's world!",
  "The villagers are calling for Micomi! Will you answer?",
  "Your Micomi misses you! Come back and save the day!"
];

// Special player retention phrases for every 4 hours
const FOUR_HOURLY_PHRASES = [
  "Come play, Micomi's waiting!",
  "It's been a while, Micomi is waiting for you!",
  "Micomi missed you! Come play now!",
  "The lands are quiet... too quiet. Come play, Micomi is waiting!"
];

const NOTIFICATION_PREFIX = 'micomi-hourly-';
const TOTAL_NOTIFICATIONS_TO_SCHEDULE = 24;

const IS_TEST_MODE = false;
const INTERVAL_MS = IS_TEST_MODE ? 60 * 1000 : 60 * 60 * 1000;
const INTERVAL_LABEL = IS_TEST_MODE ? 'minute' : 'hour';

export default function EnergyNotificationManager() {
  const isSchedulingRef = useRef(false);

  useEffect(() => {
    // If running in Expo Go Android, simulate the scheduler so you can verify the logic in console
    if (!Notifications) {
      console.log(`[EnergyNotificationManager] Notifications are bypassed in this environment (Expo Go Android).`);

      const simulateScheduling = () => {
        const now = Date.now();
        console.log(`[EnergyNotificationManager] (MOCK SCHEDULER - IS_TEST_MODE: ${IS_TEST_MODE})`);
        console.log(`[EnergyNotificationManager] Clearing previous player retention notifications...`);
        console.log(`[EnergyNotificationManager] Scheduling ${TOTAL_NOTIFICATIONS_TO_SCHEDULE} retention notifications...`);

        for (let i = 1; i <= TOTAL_NOTIFICATIONS_TO_SCHEDULE; i++) {
          const targetTime = now + i * INTERVAL_MS;
          let title = "Micomi 🐾";
          let body = "";

          if (i % 4 === 0) {
            const randomIndex = Math.floor(Math.random() * FOUR_HOURLY_PHRASES.length);
            body = FOUR_HOURLY_PHRASES[randomIndex];
            title = "Micomi is waiting! ⏳";
          } else {
            const randomIndex = Math.floor(Math.random() * HOURLY_PHRASES.length);
            body = HOURLY_PHRASES[randomIndex];

            if (body.includes("Energy is full")) {
              title = "Energy Charged! ⚡";
            } else if (body.includes("bug")) {
              title = "Defend the Kingdom! ⚔️";
            } else {
              title = "Adventure Awaits! 🌟";
            }
          }

          console.log(`[EnergyNotificationManager] (Mock) Scheduled #${i} for: ${new Date(targetTime).toLocaleTimeString()} (${i} ${INTERVAL_LABEL}(s) from now) -> Title: "${title}" | Body: "${body}"`);
        }
        console.log('[EnergyNotificationManager] (Mock) Successfully scheduled all mock player retention notifications.');
      };

      simulateScheduling();

      // Refresh mock queue on active state change to simulate real behavior
      const handleAppStateChangeMock = (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('[AppState] Active: Refreshing mock player retention notifications.');
          simulateScheduling();
        }
      };

      const subscriptionMock = AppState.addEventListener('change', handleAppStateChangeMock);
      return () => {
        subscriptionMock.remove();
      };
    }

    const scheduleAllNotifications = async () => {
      // Prevent concurrent execution
      if (isSchedulingRef.current) return;
      isSchedulingRef.current = true;

      try {
        // 1. Request/Verify Notification Permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (finalStatus !== 'granted') {
          const { status: askStatus } = await Notifications.requestPermissionsAsync();
          finalStatus = askStatus;
        }

        if (finalStatus !== 'granted') {
          console.warn('[EnergyNotificationManager] Notification permission not granted.');
          isSchedulingRef.current = false;
          return;
        }

        // 2. Cancel all previously scheduled micomi hourly/energy notifications
        console.log('[EnergyNotificationManager] Clearing previous player retention notifications...');
        for (let i = 1; i <= TOTAL_NOTIFICATIONS_TO_SCHEDULE; i++) {
          try {
            await Notifications.cancelScheduledNotificationAsync(`${NOTIFICATION_PREFIX}${i}`);
          } catch (err) {
            // Ignore if notification is not scheduled
          }
        }

        // Also cancel old energy notification identifier just in case
        try {
          await Notifications.cancelScheduledNotificationAsync('micomi-energy-full');
        } catch (err) { }

        // 3. Schedule retention notifications
        const now = Date.now();
        console.log(`[EnergyNotificationManager] Scheduling ${TOTAL_NOTIFICATIONS_TO_SCHEDULE} player retention notifications (Interval: ${INTERVAL_LABEL})...`);

        for (let i = 1; i <= TOTAL_NOTIFICATIONS_TO_SCHEDULE; i++) {
          const targetTime = now + i * INTERVAL_MS;
          let title = "Micomi 🐾";
          let body = "";

          // If interval index is a multiple of 4, use 4-hourly/4-minute phrases
          if (i % 4 === 0) {
            const randomIndex = Math.floor(Math.random() * FOUR_HOURLY_PHRASES.length);
            body = FOUR_HOURLY_PHRASES[randomIndex];
            title = "Micomi is waiting! ⏳";
          } else {
            const randomIndex = Math.floor(Math.random() * HOURLY_PHRASES.length);
            body = HOURLY_PHRASES[randomIndex];

            // Customize titles dynamically based on selected random phrase
            if (body.includes("Energy is full")) {
              title = "Energy Charged! ⚡";
            } else if (body.includes("bug")) {
              title = "Defend the Kingdom! ⚔️";
            } else {
              title = "Adventure Awaits! 🌟";
            }
          }

          const identifier = `${NOTIFICATION_PREFIX}${i}`;
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title,
              body,
              sound: true,
              priority: 'high',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes?.DATE || 'date',
              date: new Date(targetTime),
            },
          });

          // Log in development to confirm it is scheduling correctly
          if (__DEV__) {
            console.log(`[EnergyNotificationManager] Scheduled notification #${i} for: ${new Date(targetTime).toLocaleTimeString()} (${i} ${INTERVAL_LABEL}(s) from now) -> Body: "${body}"`);
          }
        }
        console.log('[EnergyNotificationManager] Successfully scheduled all player retention notifications.');
      } catch (error) {
        console.warn('⚠️ Failed to schedule player retention notifications:', error);
      } finally {
        isSchedulingRef.current = false;
      }
    };

    // Run scheduling on initial mount
    scheduleAllNotifications();

    // Listen for AppState transitions to active and refresh the queue
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[AppState] Active: Refreshing player retention notifications.');
        scheduleAllNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
