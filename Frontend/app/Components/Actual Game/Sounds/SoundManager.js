import { Audio } from 'expo-av';

class SoundManager {
  constructor() {
    this.currentSound = null; // The sound object currently playing
    this.nextSound = null;    // The sound object that is preloaded and ready
    this.isPlaying = false;
    this.soundQueue = [];     // A queue of URLs for upcoming sounds
    this.onPlaybackStartCallback = null;
  }

  async playSequentialSounds(urls, onPlaybackStart) {
    if (!Array.isArray(urls) || urls.length === 0) {
      // If there are no sounds, but a callback was provided, call it immediately.
      if (onPlaybackStart) onPlaybackStart();
      return;
    }
    // Stop any currently playing sequence to start the new one fresh.
    await this.stopAllSounds();

    this.onPlaybackStartCallback = onPlaybackStart || null; 
    this.soundQueue = [...urls];
    this._playNextInQueue();
  }


  _playNextInQueue = async () => {
    // Case 1: A sound has been preloaded and is ready to go.
    if (this.nextSound) {
      this.currentSound = this.nextSound;
      this.nextSound = null; // Clear the preloaded slot
    } 
    // Case 2: No sound was preloaded, but there are more URLs in the queue (e.g., the very first sound).
    else if (this.soundQueue.length > 0) {
      const url = this.soundQueue.shift();
      try {
        console.log(`🔊 Loading sound: ${url}`);
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        this.currentSound = sound;
      } catch (error) {
        console.error(`Error loading sound ${url}:`, error);
        // If loading fails, skip to the next in the queue.
        this._playNextInQueue();
        return;
      }
    } 
    // Case 3: No preloaded sound and the queue is empty. We're done.
    else {
      console.log('🔊 Sound sequence finished.');
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    
    // IMPORTANT: As soon as we have a sound to play, start preloading the next one.
    this._preloadNextSound();
    
    // Set up the listener that will call this function again when the current sound finishes.
    this.currentSound.setOnPlaybackStatusUpdate(this._onPlaybackStatusUpdate);

    if (this.onPlaybackStartCallback) {
      this.onPlaybackStartCallback();
      this.onPlaybackStartCallback = null; // Consume the callback so it only fires once.
    }
    
    // Finally, play the sound.
    await this.currentSound.playAsync();
  };

  _onPlaybackStatusUpdate = async (status) => {
    if (status.didJustFinish) {
      // The sound finished. Clean up its resources.
      if (this.currentSound) {
        this.currentSound.setOnPlaybackStatusUpdate(null);
        await this.currentSound.unloadAsync().catch(e => console.error("Error unloading sound:", e));
        this.currentSound = null;
      }
      // Trigger the next sound in the sequence, which should be preloaded.
      this._playNextInQueue();
    }
  };

  _preloadNextSound = async () => {
    // Preload if there's a URL in the queue and the `nextSound` slot is empty.
    if (this.soundQueue.length > 0 && !this.nextSound) {
      const nextUrl = this.soundQueue.shift();
      try {
        console.log(`🔊 Preloading next sound: ${nextUrl}`);
        const { sound } = await Audio.Sound.createAsync({ uri: nextUrl }, { shouldPlay: false });
        this.nextSound = sound;
      } catch (error) {
        console.error(`Error preloading sound ${nextUrl}:`, error);
        // If preload fails, put the URL back at the front of the queue to try again later.
        this.soundQueue.unshift(nextUrl);
      }
    }
  };

  async stopAllSounds() {
    this.soundQueue = [];
    this.isPlaying = false;

    if (this.currentSound) {
      this.currentSound.setOnPlaybackStatusUpdate(null);
      await this.currentSound.stopAsync().catch(() => {});
      await this.currentSound.unloadAsync().catch(() => {});
      this.currentSound = null;
    }
    if (this.nextSound) {
      await this.nextSound.unloadAsync().catch(() => {});
      this.nextSound = null;
    }
    console.log('🔊 All sounds stopped and unloaded.');
  }
}

export const soundManager = new SoundManager();