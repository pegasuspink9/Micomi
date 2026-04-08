import { Audio } from 'expo-av';
import { SOUND_CATALOG } from './soundCatalog';

export const simplePlaybackMethods = {
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

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: fullUrl }, { shouldPlay: false });
      this.activeSounds[channel] = sound;

      await sound.setVolumeAsync(volume);

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
  },

  playUISound(url, onPlayCallback) {
    this._playSimpleSound('ui', url, onPlayCallback);
  },

  playCombatSound(url, volume = 1.0) {
    this._playSimpleSound('combat', url, null, volume);
  },

  playButtonTapSound() {
    const tapSoundUrl = this._getCachedUrl(SOUND_CATALOG.ui.tap);
    this._playSimpleSound('button', tapSoundUrl, null);
  },

  playGameButtonTapSound(volume = 1.0) {
    const tapSoundUrl = this._getCachedUrl(SOUND_CATALOG.ui.gameTap);
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('button', tapSoundUrl, null, v);
  },

  playUniversalTap() {
    this.playGameButtonTapSound(0.3);
  },

  playLoadingSound() {
    const doorSoundUrl = this._getCachedUrl(SOUND_CATALOG.ui.loadingDoor);
    this._playSimpleSound('ui', doorSoundUrl, null);
  },

  playCardFlipSound(volume = 1.0) {
    const flipSoundUrl = this._getCachedUrl(SOUND_CATALOG.ui.cardFlip);
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('ui', flipSoundUrl, null, v);
  },

  playPageFlipSound(volume = 1.0) {
    const pageFlipUrl = this._getCachedUrl(SOUND_CATALOG.ui.pageFlip);
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('ui', pageFlipUrl, null, v);
  },

  playBlankTapSound(volume = 1.0) {
    const blankTapUrl = this._getCachedUrl(SOUND_CATALOG.ui.blankTap);
    const v = Math.max(0, Math.min(1, volume));
    this._playSimpleSound('button', blankTapUrl, null, v);
  },

  playCachedSound(url, channel = 'ui', volume = 1.0, onPlayCallback = null) {
    const resolvedUrl = this._getCachedUrl(url);
    this._playSimpleSound(channel, resolvedUrl, onPlayCallback, volume);
  },
};
