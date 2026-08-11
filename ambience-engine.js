/**
 * AmbienceEngine.js
 * Logic layer that translates Game Events into IoT Color Instructions.
 */

class AmbienceEngine {
    constructor(game, iot) {
        this.game = game;
        this.iot = iot;
        this.currentMood = "IDLE";
        this.tick = 0;
    }

    init() {
        console.log("Ambience Engine: Active.");
    }

    update(dt) {
        this.tick += dt;

        // Determine Mood based on Game State
        if (this.game.capsule && this.game.capsule.isJumping) {
            this.currentMood = "WARP";
        } else if (this.game.combatMode) { // Future combat check
            this.currentMood = "COMBAT";
        } else {
            this.currentMood = "IDLE";
        }

        this.applyMood();
    }

    applyMood() {
        // Generate dynamic colors based on time/mood
        const t = this.tick;

        if (this.currentMood === "WARP") {
            // Strobe Blue/White
            if (Math.floor(t * 10) % 2 === 0) {
                this.iot.setColor(0, 50, 255); // Blue
            } else {
                this.iot.setColor(255, 255, 255); // White
            }
        }
        else if (this.currentMood === "COMBAT") {
            // Pulsing Red
            const intensity = Math.sin(t * 5) * 127 + 128;
            this.iot.setColor(intensity, 0, 0);
        }
        else if (this.currentMood === "IDLE") {
            // Slow Morph: Deep Space Purple/Cyan
            const r = Math.sin(t * 0.5) * 50 + 50;   // 0-100
            const g = Math.cos(t * 0.3) * 20 + 20;   // 0-40
            const b = Math.sin(t * 0.4) * 80 + 175;  // 95-255 (Always blueish)
            this.iot.setColor(Math.floor(r), Math.floor(g), Math.floor(b));
        }
    }

    // Manual overrides
    triggerEvent(eventName) {
        if (eventName === "DISCOVERY") {
            // Flash Green
            this.iot.setColor(0, 255, 0);
            setTimeout(() => this.currentMood = "IDLE", 2000);
        }
    }
}

window.AmbienceEngine = AmbienceEngine;
