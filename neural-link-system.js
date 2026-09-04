/**
 * NeuralLinkSystem.js
 * Simulates Brain-Computer Interface (BCI), manages Haptic Feedback, 
 * and detects player "Emotion" based on input patterns.
 */

class NeuralLinkSystem {
    constructor(game) {
        this.game = game;
        this.isCalibrated = false;
        this.calibrationLevel = 0; // 0-100%
        this.stressLevel = 0; // 0-100
        this.flowState = 0; // 0-100

        // Input tracking for Emotion Engine
        this.clickHistory = [];
        this.mouseMoveHistory = [];
        this.lastInputTime = Date.now();

        this.bindEvents();
    }

    bindEvents() {
        // Track clicks
        document.addEventListener('click', () => {
            this.clickHistory.push(Date.now());
            this.lastInputTime = Date.now();
            this.analyzeInput();
        });

        // Track mouse movement (throttled)
        document.addEventListener('mousemove', (e) => {
            if (Date.now() - this.lastInputTime > 100) {
                this.mouseMoveHistory.push({ t: Date.now(), x: e.clientX, y: e.clientY });
                this.lastInputTime = Date.now();
            }
        });
    }

    /**
     * Haptic Feedback
     * @param {number} duration - Duration in ms
     * @param {string} pattern - Preset pattern name (optional)
     */
    triggerHaptic(duration = 200, pattern = null) {
        if (typeof navigator.vibrate !== 'function') return false;

        try {
            if (pattern === 'pulse') return navigator.vibrate([100,50,100]);
            if (pattern === 'explosion') return navigator.vibrate([50,50,100,50,200]);
            return navigator.vibrate(duration);
        } catch {return false;}
    }

    /**
     * Analyze input patterns to determine "Emotion"
     */
    analyzeInput() {
        const now = Date.now();

        // Clean up old history (> 5 seconds)
        this.clickHistory = this.clickHistory.filter(t => now - t < 5000);

        // Actions Per Minute (APM) approximation based on last 5s
        const clickRate = this.clickHistory.length * 12; // Extrapolate to minute

        if (clickRate > 300) {
            this.stressLevel = Math.min(this.stressLevel + 5, 100);
            this.game.notify("Neural Link: High Stress Detect. Reduce input frequency.", "warning");
        } else if (clickRate > 60 && clickRate < 200) {
            this.flowState = Math.min(this.flowState + 2, 100);
            this.stressLevel = Math.max(this.stressLevel - 1, 0);
        } else {
            this.stressLevel = Math.max(this.stressLevel - 2, 0);
        }

        // Visual feedback based on state
        this.updateScreenEffects();
    }

    updateScreenEffects() {
        const body = document.body;
        if (this.stressLevel > 80) {
            body.style.boxShadow = `inset 0 0 ${this.stressLevel}px rgba(255, 0, 0, 0.3)`;
        } else if (this.flowState > 80) {
            body.style.boxShadow = `inset 0 0 ${this.flowState}px rgba(0, 200, 255, 0.2)`;
        } else {
            body.style.boxShadow = 'none';
        }
    }

    /**
     * Simulation of BCI Calibration
     * Returns true if calibration succeeds
     */
    async calibrate() {
        if(this.calibrationPromise)return this.calibrationPromise;
        this.calibrationLevel = 0;
        const start=performance.now();
        this.calibrationPromise=new Promise((resolve) => {
            this.calibrationResolve=resolve;
            this.calibrationInterval = setInterval(() => {
                this.calibrationLevel = Math.min(100,(performance.now()-start)/20);
                if (typeof this.game.updateNeuralUI === 'function') this.game.updateNeuralUI();
                if (this.calibrationLevel >= 100) {
                    clearInterval(this.calibrationInterval);this.calibrationInterval=null;
                    this.isCalibrated = true;
                    this.triggerHaptic(500, 'pulse');
                    this.calibrationResolve=null;
                    resolve(true);
                }
            }, 80);
        });
        try{return await this.calibrationPromise;}finally{this.calibrationPromise=null;}
    }

    cancelCalibration() {
        if(!this.calibrationInterval)return;
        clearInterval(this.calibrationInterval);this.calibrationInterval=null;
        this.calibrationResolve?.(false);this.calibrationResolve=null;
    }
}

window.NeuralLinkSystem = NeuralLinkSystem;
