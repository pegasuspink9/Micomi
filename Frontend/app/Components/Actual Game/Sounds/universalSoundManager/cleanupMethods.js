export const cleanupMethods = {
  async stopAllSounds() {
    await this._stopMessageSound();
    await this._playSimpleSound('ui', null, null);
    await this._playSimpleSound('combat', null, null);
    await this._playSimpleSound('idle', null, null);
    await this._playSimpleSound('button', null, null);
    await this._playSimpleSound('victory', null, null);
    await this._playSimpleSound('defeat', null, null);
    await this.stopVersusMusic();
    await this.stopBackgroundMusic();
    console.log('🔊 All sound channels have been stopped.');
  },
};
