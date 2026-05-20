import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

const shouldDisableNotifications = isRunningInExpoGo() && Platform.OS === 'android';

let Notifications = null;
if (!shouldDisableNotifications) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('⚠️ Failed to load expo-notifications:', error);
  }
}

export const notificationMethods = {
  async requestNotificationPermission() {
    // Auto-allow: Return true directly without calling requestPermissionsAsync() to prevent prompting the user.
    return true;
  },

  async updatePreloadNotification(progressPercent, category = 'general') {
    try {
      const roundedPercent = Math.round(progressPercent);

      // Throttle notification updates: only update if percent changes by at least 3% or is 0/100,
      // or if it's been more than 5 seconds since the last update
      const now = Date.now();
      const lastPercent = this.lastNotificationPercent || 0;
      const lastTime = this.lastNotificationTime || 0;

      if (roundedPercent !== 0 && roundedPercent !== 100 &&
        Math.abs(roundedPercent - lastPercent) < 3 &&
        (now - lastTime) < 5000) {
        return;
      }

      this.lastNotificationPercent = roundedPercent;
      this.lastNotificationTime = now;

      if (!Notifications) {
        console.log(`[Preload Progress] ${roundedPercent}% - Caching ${category.replace('_', ' ')}...`);
        return;
      }

      const isGranted = await this.requestNotificationPermission();
      if (!isGranted) return;

      const totalBlocks = 10;
      const filledBlocks = Math.round((roundedPercent / 100) * totalBlocks);
      const emptyBlocks = totalBlocks - filledBlocks;
      const progressBarText = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

      await Notifications.scheduleNotificationAsync({
        identifier: 'micomi-preload-progress',
        content: {
          title: 'Downloading Micomi Assets',
          body: `[${progressBarText}] ${roundedPercent}% - Caching ${category.replace('_', ' ')}...`,
          sticky: true,
          ongoing: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('⚠️ Notification failed to update:', error);
    }
  },

  async sendPreloadPausedNotification(currentPercent) {
    try {
      const roundedPercent = Math.min(100, Math.max(0, Math.round(currentPercent)));

      if (!Notifications) {
        console.log(`[Preload Paused] ${roundedPercent}%`);
        return;
      }

      await Notifications.dismissNotificationAsync('micomi-preload-progress');
      const isGranted = await this.requestNotificationPermission();
      if (!isGranted) return;

      const totalBlocks = 10;
      const filledBlocks = Math.min(totalBlocks, Math.max(0, Math.round((roundedPercent / 100) * totalBlocks)));
      const emptyBlocks = totalBlocks - filledBlocks;
      const progressBarText = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

      await Notifications.scheduleNotificationAsync({
        identifier: 'micomi-preload-progress',
        content: {
          title: 'Micomi Downloading in Background',
          body: `[${progressBarText}] ${roundedPercent}% - Preloading game assets...`,
          sticky: false,
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('⚠️ Background notification failed:', error);
    }
  },

  async sendPreloadCompleteNotification() {
    try {
      if (!Notifications) {
        console.log('[Preload Complete] All game assets successfully downloaded.');
        return;
      }

      await Notifications.dismissNotificationAsync('micomi-preload-progress');

      const isGranted = await this.requestNotificationPermission();
      if (!isGranted) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Preloading Completed!',
          body: 'All game assets are successfully downloaded. Open Micomi to play!',
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.warn('⚠️ Completion notification failed:', error);
    }
  },

  async dismissPreloadNotification() {
    try {
      if (!Notifications) return;
      await Notifications.dismissNotificationAsync('micomi-preload-progress');
    } catch (error) {
      console.warn('⚠️ Dismiss notification failed:', error);
    }
  }
};
