import { cacheMethods } from './universalSoundManager/cacheMethods';
import { simplePlaybackMethods } from './universalSoundManager/simplePlaybackMethods';
import { musicMethods } from './universalSoundManager/musicMethods';
import { messageQueueMethods } from './universalSoundManager/messageQueueMethods';
import { cleanupMethods } from './universalSoundManager/cleanupMethods';

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
}

Object.assign(
  UniversalSoundManager.prototype,
  cacheMethods,
  simplePlaybackMethods,
  musicMethods,
  messageQueueMethods,
  cleanupMethods
);

export const soundManager = new UniversalSoundManager();