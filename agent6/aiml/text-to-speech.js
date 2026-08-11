class TextToSpeech {
  constructor() { this.voices = []; this.rate = 1; this.pitch = 1; }
  speak(text, options={}) { 
    console.log(`TTS: ${text}`);
    return Promise.resolve({ started: true, text });
  }
  pause() { return Promise.resolve({ paused: true }); }
  resume() { return Promise.resolve({ resumed: true }); }
  stop() { return Promise.resolve({ stopped: true }); }
  setVoice(voice) { this.voice = voice; }
  getVoices() { return this.voices; }
}
window.TextToSpeech = TextToSpeech;