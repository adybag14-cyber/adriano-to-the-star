/**
 * landing-audio.js
 * Generates sci-fi sound effects using the Web Audio API.
 * No external files needed. Pure math.
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isInit = false;
    }

    init() {
        if (this.isInit) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.isInit = true;
    }

    // Deep, rhythmic thrumming
    playAmbientHum() {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, this.ctx.currentTime);

        // Low pass filter to make it rumbly
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, this.ctx.currentTime);

        // Pulse lfo
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 50; // Filter modulation depth

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2);

        osc.start();
        lfo.start();

        this.ambient = { osc, lfo, gain };
    }

    // High pitched charging sound
    playChargeUp() {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 1);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }

    // Massive warp explosion
    playWarpBoom() {
        if (!this.ctx) this.init();

        // White noise buffer
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 2);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start();

        // Sub-bass sweep
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);

        oscGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start();
    }
}

window.audioEngine = new AudioEngine();
