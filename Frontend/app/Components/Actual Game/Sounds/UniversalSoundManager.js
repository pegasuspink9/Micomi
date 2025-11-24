import { Audio } from 'expo-av';

class UniversalSoundManager {
  constructor() {
    // Each sound type gets its own "channel" to prevent interference.
    this.activeSounds = {
      message: null,
      ui: null,
      combat: null,
      button: null
    };
    
    // State for sequential message audio
    this.messageQueue = [];
    this.preloadedMessageSound = null;
    this.isMessagePlaying = false;
    this.onMessagePlaybackStart = null;
  }

  // --- PRIVATE HELPER for one-shot sounds (UI & Combat) ---
  async _playSimpleSound(channel, url, onPlayCallback) {
    // 1. Stop any sound currently playing on this specific channel.
    if (this.activeSounds[channel]) {
      const soundToUnload = this.activeSounds[channel];
      this.activeSounds[channel] = null;
      soundToUnload.setOnPlaybackStatusUpdate(null);
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }

    if (!url) {
      if (onPlayCallback) onPlayCallback();
      return;
    }

    // 2. Load and play the new sound.
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
      this.activeSounds[channel] = sound;

      // 3. Execute callback for perfect sync before playing.
      if (onPlayCallback) onPlayCallback();
      
      await sound.playAsync();

      // 4. Set up a self-cleaning listener.
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          // Only clear the channel if it hasn't been replaced by a newer sound.
          if (this.activeSounds[channel] === sound) {
            this.activeSounds[channel] = null;
          }
        }
      });
    } catch (error) {
      console.error(`Error playing sound on channel [${channel}]:`, error);
      this.activeSounds[channel] = null;
      if (onPlayCallback) onPlayCallback();
    }
  }
  
  // --- PUBLIC METHODS for different sound types ---
  
  playUISound(url, onPlayCallback) {
    this._playSimpleSound('ui', url, onPlayCallback);
  }

  playCombatSound(url) {
    this._playSimpleSound('combat', url, null);
  }

  playButtonTapSound() {
    const tapSoundUrl = 'https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Sounds/Final/Tap.wav';
    this._playSimpleSound('button', tapSoundUrl, null);
  }

  // --- Sequential Message Sound Logic (adapted from old SoundManager) ---

  async playSequentialMessage(urls, onPlaybackStart) {
    if (!Array.isArray(urls) || urls.length === 0) {
      if (onPlaybackStart) onPlaybackStart();
      return;
    }
    
    await this._stopMessageSound(); // Stop only the message channel

    this.onMessagePlaybackStart = onPlaybackStart || null;
    this.messageQueue = [...urls];
    this._playNextInMessageQueue();
  }

  _playNextInMessageQueue = async () => {
    let soundToPlay = null;

    if (this.preloadedMessageSound) {
      soundToPlay = this.preloadedMessageSound;
      this.preloadedMessageSound = null;
    } else if (this.messageQueue.length > 0) {
      const url = this.messageQueue.shift();
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        soundToPlay = sound;
      } catch (error) {
        this._playNextInMessageQueue();
        return;
      }
    } else {
      this.isMessagePlaying = false;
      return;
    }

    this.isMessagePlaying = true;
    this.activeSounds.message = soundToPlay;

    this._preloadNextMessageSound();

    soundToPlay.setOnPlaybackStatusUpdate((status) => this._onMessageStatusUpdate(status, soundToPlay));

    if (this.onMessagePlaybackStart) {
      this.onMessagePlaybackStart();
      this.onMessagePlaybackStart = null;
    }
    await soundToPlay.playAsync().catch(() => {});
  };

  _onMessageStatusUpdate = async (status, soundInstance) => {
    if (status.didJustFinish) {
      soundInstance.setOnPlaybackStatusUpdate(null);
      await soundInstance.unloadAsync().catch(() => {});
      if (this.activeSounds.message === soundInstance) {
        this.activeSounds.message = null;
      }
      this._playNextInMessageQueue();
    }
  };

  _preloadNextMessageSound = async () => {
    if (this.messageQueue.length > 0 && !this.preloadedMessageSound) {
      const nextUrl = this.messageQueue.shift();
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: nextUrl }, { shouldPlay: false });
        this.preloadedMessageSound = sound;
      } catch (error) {
        this.messageQueue.unshift(nextUrl);
      }
    }
  };
  
  async _stopMessageSound() {
    this.messageQueue = [];
    this.isMessagePlaying = false;
    this.onMessagePlaybackStart = null;

    if (this.activeSounds.message) {
      const soundToUnload = this.activeSounds.message;
      this.activeSounds.message = null;
      soundToUnload.setOnPlaybackStatusUpdate(null);
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }
    if (this.preloadedMessageSound) {
      const soundToUnload = this.preloadedMessageSound;
      this.preloadedMessageSound = null;
      await soundToUnload.unloadAsync().catch(() => {});
    }
  }
  
  // --- MASTER CLEANUP ---
  
  async stopAllSounds() {
    await this._stopMessageSound();
    await this._playSimpleSound('ui', null, null);
    await this._playSimpleSound('combat', null, null); 
    await this._playSimpleSound('button', null, null); 
    console.log('🔊 All sound channels have been stopped.');
  }
}

export const soundManager = new UniversalSoundManager();