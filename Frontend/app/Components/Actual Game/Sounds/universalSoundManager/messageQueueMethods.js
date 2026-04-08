import { Audio } from 'expo-av';

export const messageQueueMethods = {
  async playSequentialMessage(urls, onPlaybackStart) {
    if (!Array.isArray(urls) || urls.length === 0) {
      if (onPlaybackStart) onPlaybackStart();
      return;
    }

    await this._stopMessageSound();

    this.onMessagePlaybackStart = onPlaybackStart || null;
    this.messageQueue = [...urls];
    this._playNextInMessageQueue();
  },

  async _playNextInMessageQueue() {
    let soundToPlay = null;

    if (this.preloadedMessageSound) {
      soundToPlay = this.preloadedMessageSound;
      this.preloadedMessageSound = null;
    } else if (this.messageQueue.length > 0) {
      const url = this.messageQueue.shift();
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        soundToPlay = sound;
      } catch (_error) {
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
  },

  async _onMessageStatusUpdate(status, soundInstance) {
    if (status.didJustFinish) {
      soundInstance.setOnPlaybackStatusUpdate(null);
      await soundInstance.unloadAsync().catch(() => {});
      if (this.activeSounds.message === soundInstance) {
        this.activeSounds.message = null;
      }
      this._playNextInMessageQueue();
    }
  },

  async _preloadNextMessageSound() {
    if (this.messageQueue.length > 0 && !this.preloadedMessageSound) {
      const nextUrl = this.messageQueue.shift();
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: nextUrl }, { shouldPlay: false });
        this.preloadedMessageSound = sound;
      } catch (_error) {
        this.messageQueue.unshift(nextUrl);
      }
    }
  },

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
  },
};
