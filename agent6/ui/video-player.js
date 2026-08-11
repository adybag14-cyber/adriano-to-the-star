class VideoPlayer {
  constructor(element) { this.element = element; this.src = ''; this.currentTime = 0; }
  load(src) { this.src = src; this.render(); }
  play() { console.log(`Playing ${this.src}`); return Promise.resolve(); }
  pause() { console.log(`Paused ${this.src}`); return Promise.resolve(); }
  stop() { this.currentTime = 0; console.log(`Stopped ${this.src}`); }
  seek(time) { this.currentTime = time; console.log(`Seeked to ${time}s`); }
  setVolume(vol) { this.volume = Math.max(0, Math.min(1, vol)); }
  setSpeed(rate) { this.playbackRate = rate; }
  getDuration() { return 120; }
  render() { if(this.element) this.element.src = this.src; }
}
window.VideoPlayer = VideoPlayer;