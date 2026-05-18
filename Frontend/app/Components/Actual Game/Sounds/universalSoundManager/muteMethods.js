export const muteMethods = {
  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      // Stop all sounds when muting
      this.stopAllSounds({ preserveBgmUrl: true }).catch(err => 
        console.error('Error stopping all sounds:', err)
      );
      console.log('🔇 All sounds muted');
    } else {
      // Unmute and resume background music immediately if it was playing
      console.log('🔊 Sounds unmuted');
      if (this.currentBgmUrl) {
        const volume = this.currentBgmVolume ?? 0.2;
        const loop = this.currentBgmLoop ?? true;
        this.playBackgroundMusic(this.currentBgmUrl, volume, loop).catch(err =>
          console.error('Error resuming background music:', err)
        );
      }
    }
  },

  getMuted() {
    return this.isMuted;
  },

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  },
};
