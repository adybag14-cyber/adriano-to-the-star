class SpeechToText {
  constructor() { this.listening = false; this.interimResults = true; }
  start() { 
    this.listening = true; 
    return Promise.resolve({ started: true });
  }
  stop() { 
    this.listening = false; 
    return Promise.resolve({ stopped: true });
  }
  onresult(event) { 
    return event.results.map(r => r[0].transcript).join(''); 
  }
  onerror(event) { 
    return { error: event.error }; 
  }
  getSupportedLanguages() { return ['en-US', 'es-ES', 'fr-FR']; }
}
window.SpeechToText = SpeechToText;