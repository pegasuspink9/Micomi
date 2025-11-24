import { Audio } from 'expo-av';

class CombatSoundManager {
  constructor() {
    this.currentSound = null;
  }

  async playSound(url) {
    // Stop and fully clean up any sound that is currently playing.
    if (this.currentSound) {
      const soundToUnload = this.currentSound;
      this.currentSound = null; // Nullify the class property immediately.
      soundToUnload.setOnPlaybackStatusUpdate(null); // IMPORTANT: Detach the old listener.
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }

    if (!url) {
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      this.currentSound = sound;

      // Attach a listener that is only aware of this specific sound object.
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          // Unload the specific sound instance this listener is attached to.
          sound.unloadAsync().catch(() => {});
          // Only nullify the class property if it hasn't been replaced by a newer sound.
          if (this.currentSound === sound) {
            this.currentSound = null;
          }
        }
      });
    } catch (error) {
      console.error(`Error playing combat sound ${url}:`, error);
      this.currentSound = null; // Ensure state is clean on error.
    }
  }

  async stopAllSounds() {
    if (this.currentSound) {
      const soundToUnload = this.currentSound;
      this.currentSound = null;
      soundToUnload.setOnPlaybackStatusUpdate(null);
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }
  }
}

export const combatSoundManager = new CombatSoundManager();