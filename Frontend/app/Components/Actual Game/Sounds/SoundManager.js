import { Audio } from 'expo-av';

class SoundManager {
  constructor() {
    this.currentSound = null;
    this.nextSound = null;
    this.isPlaying = false;
    this.soundQueue = [];
    this.onPlaybackStartCallback = null;
  }

  async playSequentialSounds(urls, onPlaybackStart) {
    if (!Array.isArray(urls) || urls.length === 0) {
      if (onPlaybackStart) onPlaybackStart();
      return;
    }
    
    await this.stopAllSounds();

    this.onPlaybackStartCallback = onPlaybackStart || null;
    this.soundQueue = [...urls];
    this._playNextInQueue();
  }

  _playNextInQueue = async () => {
    let soundToPlay = null;

    if (this.nextSound) {
      soundToPlay = this.nextSound;
      this.nextSound = null;
    } else if (this.soundQueue.length > 0) {
      const url = this.soundQueue.shift();
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        soundToPlay = sound;
      } catch (error) {
        console.error(`Error loading sound ${url}:`, error);
        this._playNextInQueue();
        return;
      }
    } else {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    this.currentSound = soundToPlay;

    this._preloadNextSound();

    // Pass the specific sound instance to the status update handler
    soundToPlay.setOnPlaybackStatusUpdate((status) => this._onPlaybackStatusUpdate(status, soundToPlay));

    if (this.onPlaybackStartCallback) {
      this.onPlaybackStartCallback();
      this.onPlaybackStartCallback = null;
    }

    await soundToPlay.playAsync().catch(e => console.error("Error playing sound:", e));
  };

  _onPlaybackStatusUpdate = async (status, soundInstance) => {
    if (status.didJustFinish) {
      soundInstance.setOnPlaybackStatusUpdate(null);
      await soundInstance.unloadAsync().catch(() => {});

      if (this.currentSound === soundInstance) {
        this.currentSound = null;
      }
      
      this._playNextInQueue();
    }
  };

  _preloadNextSound = async () => {
    if (this.soundQueue.length > 0 && !this.nextSound) {
      const nextUrl = this.soundQueue.shift();
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: nextUrl }, { shouldPlay: false });
        this.nextSound = sound;
      } catch (error) {
        console.error(`Error preloading sound ${nextUrl}:`, error);
        this.soundQueue.unshift(nextUrl);
      }
    }
  };

  async stopAllSounds() {
    this.soundQueue = [];
    this.isPlaying = false;
    this.onPlaybackStartCallback = null;

    if (this.currentSound) {
      const soundToUnload = this.currentSound;
      this.currentSound = null;
      soundToUnload.setOnPlaybackStatusUpdate(null);
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }

    if (this.nextSound) {
      const soundToUnload = this.nextSound;
      this.nextSound = null;
      await soundToUnload.unloadAsync().catch(() => {});
    }
  }
}

export const soundManager = new SoundManager();