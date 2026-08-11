console.log('📡 AlienSignalSystem script execution started');
class AlienSignalSystem {
    constructor(game) {
        console.log('📡 AlienSignalSystem class definition loaded');
        this.game = game;
        this.activeSignals = [];
        this.discoveredSignals = [];
        this.isProcessing = false;
    }

    update(dt) {
        // Roadmap Item 139: Pattern Recognition AI for Alien Signals
        if (Math.random() < 0.001 * (this.game.timeScale || 1)) {
            this.detectSignal();
        }

        this.activeSignals.forEach(s => {
            if (s.status === 'analyzing') {
                s.progress += (0.05 + (this.game.attributes?.intelligence || 10) * 0.001) * dt;
                if (s.progress >= 1.0) {
                    this.completeAnalysis(s);
                }
            }
        });
    }

    detectSignal() {
        const id = 'sig_' + Date.now();
        const types = ['Harmonic', 'Pulsed', 'Fractal', 'Neural'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const signal = {
            id,
            type,
            name: `${type} Emission ${id.substr(-4)}`,
            progress: 0,
            status: 'detected',
            strength: Math.random() * 100
        };

        this.activeSignals.push(signal);
        this.game.notify(`📡 UNKNOWN SIGNAL: ${signal.name} detected from deep space!`, "info");
    }

    analyzeSignal(id) {
        const signal = this.activeSignals.find(s => s.id === id);
        if (signal) {
            signal.status = 'analyzing';
            this.game.notify(`🔬 Analysis started on ${signal.name}...`, "info");
        }
    }

    completeAnalysis(signal) {
        signal.status = 'completed';
        const rewards = {
            data: Math.floor(20 + Math.random() * 30),
            credits: Math.floor(Math.random() * 100)
        };

        this.game.resources.data += rewards.data;
        this.game.resources.credits += rewards.credits;
        
        this.discoveredSignals.push(signal);
        this.activeSignals = this.activeSignals.filter(s => s.id !== signal.id);

        this.game.notify(`✅ SIGNAL ANALYZED: ${signal.name} contains encrypted stellar data! +${rewards.data} Data`, "success");
        this.game.recordColonyEvent(`Deciphered an alien signal of ${signal.type} origin.`, 0.7);
        this.game.updateResourceUI();
    }
}

window.AlienSignalSystem = AlienSignalSystem;
