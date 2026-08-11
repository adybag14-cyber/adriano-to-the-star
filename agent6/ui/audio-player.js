class AudioPlayer {
  constructor() { this.tracks = []; this.current = 0; this.playing = false; }
  load(track) { this.tracks = [track]; this.current = 0; }
  loadPlaylist(tracks) { this.tracks = tracks; this.current = 0; }
  play() { 
    if(this.tracks[this.current]) {
      this.playing = true; 
      console.log(`Playing: ${this.tracks[this.current]}`);
    }
    return Promise.resolve();
  }
  pause() { this.playing = false; console.log('Paused'); return Promise.resolve(); }
  stop() { this.playing = false; console.log('Stopped'); }
  next() { 
    this.current = (this.current + 1) % this.tracks.length; 
    if(this.playing) this.play();
  }
  previous() { 
    this.current = (this.current - 1 + this.tracks.length) % this.tracks.length; 
    if(this.playing) this.play();
  }
  seek(time) { console.log(`Seeked to ${time}s`); }
  setVolume(vol) { this.volume = Math.max(0, Math.min(1, vol)); }
}
window.AudioPlayer = AudioPlayer;