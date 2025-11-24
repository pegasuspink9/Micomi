import { Audio } from 'expo-av';

class UISoundManager {
  constructor() {
    this.currentSound = null;
  }

  async playSound(url, onPlayCallback) {
    // If no URL is provided, execute the callback immediately to ensure UI updates are not blocked.
    if (!url) {
      if (onPlayCallback) onPlayCallback();
      return;
    }

    // Stop any previously playing UI sound to prevent overlap.
    if (this.currentSound) {
      await this.currentSound.stopAsync().catch(() => {});
      await this.currentSound.unloadAsync().catch(() => {});
      this.currentSound = null;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false } // Load the sound but don't play it yet.
      );
      this.currentSound = sound;

      // Execute the callback right before playing for perfect synchronization.
      if (onPlayCallback) {
        onPlayCallback();
      }

      await this.currentSound.playAsync();

      // Set up a listener to clean up resources once the sound finishes.
      this.currentSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.currentSound.unloadAsync().catch(() => {});
          this.currentSound = null;
        }
      });
    } catch (error) {
      console.error(`Error playing UI sound ${url}:`, error);
      // If the sound fails to load, still execute the callback to prevent the UI from getting stuck.
      if (onPlayCallback) {
        onPlayCallback();
      }
    }
  }
}

export const uiSoundManager = new UISoundManager();