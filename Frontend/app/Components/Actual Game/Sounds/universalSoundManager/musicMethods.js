import { Audio } from 'expo-av';

export const musicMethods = {
  async playVersusMusic(url, volume = 0.5) {
    console.log(`⚔️ Preparing to play Versus BGM: ${url ? url.slice(-30) : 'None'}`);

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
          isLooping: false,
          volume: volume,
        }
      );

      this.activeSounds.versus = sound;
      console.log(`⚔️ Versus BGM playback started: ${url.slice(-30)}`);

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
  },

  async stopVersusMusic() {
    if (this.activeSounds.versus) {
      console.log('⚔️ Stopping current Versus BGM...');
      const soundToUnload = this.activeSounds.versus;
      this.activeSounds.versus = null;
      soundToUnload.setOnPlaybackStatusUpdate(null);
      await soundToUnload.stopAsync().catch(() => {});
      await soundToUnload.unloadAsync().catch(() => {});
    }
  },

  async playVictorySound(url, volume = 0.7) {
    if (!url) return;

    console.log(`🏆 Playing Victory Sound: ${url.slice(-30)}`);
    await this.stopBackgroundMusic();
    await this.stopVersusMusic();

    this._playSimpleSound('victory', url, null, volume);
  },

  async playDefeatSound(url, volume = 0.6) {
    if (!url) return;

    console.log(`💀 Playing Defeat Sound: ${url.slice(-30)}`);
    await this.stopBackgroundMusic();
    await this.stopVersusMusic();

    this._playSimpleSound('defeat', url, null, volume);
  },

  async playBackgroundMusic(url, volume = 0.2, loop = true) {
    if (this.currentBgmUrl === url && this.activeSounds.bgm) {
      console.log(`🎵 BGM is already playing: ${url.slice(-30)}`);
      return;
    }

    console.log(`🎵 Preparing to play new BGM: ${url ? url.slice(-30) : 'None'}`);

    await this.stopBackgroundMusic();

    if (!url) {
      return;
    }

    const fullUrl = this._getCachedUrl(url);

    if (typeof fullUrl === 'string' && !fullUrl.startsWith('http') && !fullUrl.startsWith('file')) {
      fullUrl = `https://${fullUrl}`;
    }

    try {
      this.currentBgmUrl = url;

      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        {
          shouldPlay: true,
          isLooping: loop,
          volume: volume,
        }
      );

      this.activeSounds.bgm = sound;
      console.log(`🎵 BGM playback started: ${url.slice(-30)}`);
    } catch (error) {
      console.error(`Error playing background music [${url}]:`, error);
      this.activeSounds.bgm = null;
      this.currentBgmUrl = null;
    }
  },

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
  },
};
