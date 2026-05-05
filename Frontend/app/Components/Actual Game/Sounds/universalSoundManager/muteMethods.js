export const muteMethods = {
  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      // Stop all sounds when muting
      this.stopAllSounds().catch(err => 
        console.error('Error stopping all sounds:', err)
      );
      console.log('🔇 All sounds muted');
    } else {
      // Unmute and resume background music immediately if it was playing
      console.log('🔊 Sounds unmuted');
      if (this.currentBgmUrl) {
        this.playBackgroundMusic(this.currentBgmUrl, 0.2, true).catch(err =>
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
