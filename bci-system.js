/**
 * Neural Link System (BCI)
 * Phase 9: Neural Link
 * manages Brain-Computer Interface integration for thought control.
 */

class BCISystem {
    constructor() {
        this.connected = false;
        this.signalStrength = 0;
        this.focusLevel = 0; // 0.0 - 1.0
        this.device = null; // Mock device
    }

    init() {
        console.log("🧠 Neural Link Interface: INITIALIZING...");
        this.createUI();
    }

    async connect() {
        console.log("Searching for Neuro-Link device...");

        // Simulation of connection delay
        await new Promise(r => setTimeout(r, 1500));

        this.connected = true;
        this.device = "Neuralink V4 (Simulated)";
        this.signalStrength = 98;

        this.startStream();
        console.log("✅ CONNECTED to Neuralink V4. Signal: Strong.");

        alert("Neural Link Connected. Focus your thoughts to control the simulation.");
    }

    startStream() {
        // Mock data stream
        setInterval(() => {
            if (!this.connected) return;

            // Randomly fluctuate focus
            this.focusLevel = 0.5 + (Math.random() * 0.5);

            // Interaction with other systems based on "Focus"
            if (this.focusLevel > 0.8) {
                // High focus might improve mining yields or speed up time
                if (window.bciIndicator) window.bciIndicator.style.color = '#00ff00';
            } else {
                if (window.bciIndicator) window.bciIndicator.style.color = '#ffffff';
            }

            this.updateUI();
        }, 1000);
    }

    createUI() {
        const container = document.getElementById('visualization-features-container');
        if (container) {
            const btn = document.createElement('button');
            btn.className = 'secondary-btn';
            btn.innerHTML = "🧠 Connect Neural Link";
            btn.onclick = () => this.connect();
            container.appendChild(btn);

            // Signal Indicator
            const indicator = document.createElement('div');
            indicator.id = 'bci-indicator';
            indicator.style.cssText = "margin-top: 10px; font-size: 0.8rem; opacity: 0.7;";
            indicator.innerHTML = "Status: Disconnected";
            container.appendChild(indicator);
            this.uiIndicator = indicator;
        }
    }

    updateUI() {
        if (this.uiIndicator) {
            this.uiIndicator.innerHTML = `Signal: ${this.signalStrength}% | Focus: ${(this.focusLevel * 100).toFixed(1)}% | Device: ${this.device}`;
        }
    }
}

if (typeof window !== 'undefined') {
    window.BCISystem = BCISystem;
    window.bciSystem = new BCISystem();
}
