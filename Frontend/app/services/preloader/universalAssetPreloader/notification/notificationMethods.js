import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
      await Notifications.dismissNotificationAsync('micomi-preload-progress');
      const isGranted = await this.requestNotificationPermission();
      if (!isGranted) return;

      const roundedPercent = Math.min(100, Math.max(0, Math.round(currentPercent)));
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
      await Notifications.dismissNotificationAsync('micomi-preload-progress');
    } catch (error) {
      console.warn('⚠️ Dismiss notification failed:', error);
    }
  }
};
