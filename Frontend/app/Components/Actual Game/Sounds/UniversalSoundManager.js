import { Audio } from 'expo-av';
import { universalAssetPreloader } from '../../../services/preloader/universalAssetPreloader';

class UniversalSoundManager {
  constructor() {
    // Each sound type gets its own "channel" to prevent interference.
    this.activeSounds = {
      message: null,
      ui: null,
      combat: null,
      button: null,
      bgm: null,
      versus: null,
      victory: null,
      defeat: null
    };
    
    // State for sequential message audio
    this.currentBgmUrl = null;
    this.messageQueue = [];
    this.preloadedMessageSound = null;
    this.isMessagePlaying = false;
    this.onMessagePlaybackStart = null;

    this._urlCache = new Map();
  }

  async _playSimpleSound(channel, url, onPlayCallback, volume = 1.0) {
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

    const fullUrl = this._getCachedUrl(url);
    
    if (typeof fullUrl === 'string' && !fullUrl.startsWith('http') && !fullUrl.startsWith('file')) {
      fullUrl = `https://${fullUrl}`;
    }

    // 2. Load and play the new sound.
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: fullUrl }, { shouldPlay: false });
      this.activeSounds[channel] = sound;

      await sound.setVolumeAsync(volume);

      // 3. Execute callback for perfect sync before playing.
      if (onPlayCallback) onPlayCallback();
      
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
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

  playUISound(url, onPlayCallback) {
    this._playSimpleSound('ui', url, onPlayCallback);
  }

  playCombatSound(url, volume = 1.0) {
    this._playSimpleSound('combat', url, null, volume);
  }

  _getCachedUrl(url) {
    if (this._urlCache.has(url)) {
      return this._urlCache.get(url);
    }

    const cachedPath = universalAssetPreloader.getCachedAssetPath(url);
    
    if (cachedPath && cachedPath.startsWith('file://')) {
      this._urlCache.set(url, cachedPath);
      return cachedPath;
    }
    
    let resolvedUrl = url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      resolvedUrl = `https://${url}`;
    }
    
    // Cache the resolved URL too
    this._urlCache.set(url, resolvedUrl);
    return resolvedUrl;
  }

  clearUrlCache() {
    this._urlCache.clear();
  }

  playButtonTapSound() {
    const tapSoundUrl = this._getCachedUrl('https://micomi-assets.me/Sounds/Final/Tap.wav');
    this._playSimpleSound('button', tapSoundUrl, null);
  }

  playGameButtonTapSound(volume = 1.0) {
    const tapSoundUrl = this._getCachedUrl('https://micomi-assets.me/Sounds/Final/Tap3.wav');
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('button', tapSoundUrl, null, v);
  }
  
  playUniversalTap() {
    this.playGameButtonTapSound(0.3); // Subtle default volume for generic taps
  }

  playLoadingSound() {
    const doorSoundUrl = this._getCachedUrl('https://micomi-assets.me/Sounds/Final/micomi_door.wav');
    this._playSimpleSound('ui', doorSoundUrl, null);
  }


  playCardFlipSound(volume = 1.0) {
    const flipSoundUrl = this._getCachedUrl('https://micomi-assets.me/Sounds/Final/Card_Flip_2.wav');
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('ui', flipSoundUrl, null, v);
  }

   playPageFlipSound(volume = 1.0) {
    const pageFlipUrl = this._getCachedUrl('https://micomi-assets.me/Sounds/Final/page%20flip.mp3');
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('ui', pageFlipUrl, null, v);
  }

  playBlankTapSound(volume = 1.0) {
    const blankTapUrl = this._getCachedUrl('https://micomi-assets.me/Sounds/Final/Tap2.wav');
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('button', blankTapUrl, null, v);
  }

  playCachedSound(url, channel = 'ui', volume = 1.0, onPlayCallback = null) {
    const resolvedUrl = this._getCachedUrl(url);
    this._playSimpleSound(channel, resolvedUrl, onPlayCallback, volume);
  }

  async playVersusMusic(url, volume = 0.5) {
    console.log(`⚔️ Preparing to play Versus BGM: ${url ? url.slice(-30) : 'None'}`);
    
    // Stop any currently playing BGM.
    await this.stopBackgroundMusic();
    
    if (!url) {
      return;
    }

     const fullUrl = this._getCachedUrl(url);

    if (typeof fullUrl === 'string' && !fullUrl.startsWith('http') && !fullUrl.startsWith('file')) {
      fullUrl = `https://${fullUrl}`;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { 
          shouldPlay: true, 
          isLooping: false, // Versus music should not loop
          volume: volume 
        }
      );

      this.activeSounds.versus = sound;
      console.log(`⚔️ Versus BGM playback started: ${url.slice(-30)}`);
      
      // Self-cleanup listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (this.activeSounds.versus === sound) {
            this.activeSounds.versus = null;
          }
        }
      });

    } catch (error) {
      console.error(`Error playing versus music [${url}]:`, error);
      this.activeSounds.versus = null;
    }
  }

  async stopVersusMusic() {
    if (this.activeSounds.versus) {
      console.log('⚔️ Stopping current Versus BGM...');
      const soundToUnload = this.activeSounds.versus;
      this.activeSounds.versus = null;
      soundToUnload.setOnPlaybackStatusUpdate(null);
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }
  }

  async playVictorySound(url, volume = 0.7) {
    if (!url) return;
    
    console.log(`🏆 Playing Victory Sound: ${url.slice(-30)}`);
    // Stop other music to ensure the victory sound is clear
    await this.stopBackgroundMusic();
    await this.stopVersusMusic();
    
    // Use the simple sound player on the 'victory' channel
    this._playSimpleSound('victory', url, null, volume);
  }


  async playDefeatSound(url, volume = 0.6) {
    if (!url) return;

    console.log(`💀 Playing Defeat Sound: ${url.slice(-30)}`);
    // Stop other music to ensure the defeat sound is clear
    await this.stopBackgroundMusic();
    await this.stopVersusMusic();
    
    // Use the simple sound player on the 'defeat' channel
    this._playSimpleSound('defeat', url, null, volume);
  }

  async playBackgroundMusic(url, volume = 0.2, loop = true) {
    // 1. If the requested music is already playing, do nothing.
    if (this.currentBgmUrl === url && this.activeSounds.bgm) {
      console.log(`🎵 BGM is already playing: ${url.slice(-30)}`);
      return;
    }

    console.log(`🎵 Preparing to play new BGM: ${url ? url.slice(-30) : 'None'}`);
    
    // 2. Stop any currently playing BGM.
    await this.stopBackgroundMusic();
    
    // 3. If no new URL is provided, we are done.
    if (!url) {
      return;
    }

    const fullUrl = this._getCachedUrl(url);
     
    if (typeof fullUrl === 'string' && !fullUrl.startsWith('http') && !fullUrl.startsWith('file')) {
      fullUrl = `https://${fullUrl}`;
    }

    // 4. Load and play the new background music.
    try {
      this.currentBgmUrl = url; // Set this early to prevent race conditions
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { 
          shouldPlay: true, 
          isLooping: loop,
          volume: volume 
        }
      );

      this.activeSounds.bgm = sound;
      console.log(`🎵 BGM playback started: ${url.slice(-30)}`);
    } catch (error) {
      console.error(`Error playing background music [${url}]:`, error);
      this.activeSounds.bgm = null;
      this.currentBgmUrl = null;
    }
  }

  async stopBackgroundMusic() {
    if (this.activeSounds.bgm) {
      console.log('🎵 Stopping current BGM...');
      const soundToUnload = this.activeSounds.bgm;
      this.activeSounds.bgm = null;
      this.currentBgmUrl = null;
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
      console.log('🎵 BGM stopped and unloaded.');
    }
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
    await this._playSimpleSound('victory', null, null); 
    await this._playSimpleSound('defeat', null, null);
    await this.stopVersusMusic();
    await this.stopBackgroundMusic();
    console.log('🔊 All sound channels have been stopped.');
  }
}

export const soundManager = new UniversalSoundManager();