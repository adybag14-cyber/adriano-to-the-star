/**
 * OmegaPoint.js
 * Handles the "Big Crunch" and Universe Reset (New Game+).
 * Randomizes physics constants for the new timeline.
 */

class OmegaPoint {
    constructor(game) {
        this.game = game;
        this.canTranscend = false;
    }

    init() {
        // Check occasionally if player is ready
        setInterval(() => this.checkCriteria(), 5000);
    }

    checkCriteria() {
        // Pseudo-criteria for demonstration
        // real criteria: Max Tech, Max Knowledge, Dyeing Stars
        if (this.game.resources && this.game.resources.knowledge > 5000) {
            this.canTranscend = true;
            const btn = document.getElementById('btn-transcend');
            if (btn) btn.style.display = 'block';
        }
    }

    triggerTranscendence() {
        console.log("OMEGA POINT REACHED. INITIATING BIG CRUNCH.");

        // 1. Visual Effects
        document.body.style.transition = "filter 3s ease-in";
        document.body.style.filter = "invert(1) hue-rotate(180deg) brightness(3)";

        // 2. Data Wipe / Prestige
        setTimeout(() => {
            // Generate New Physics Constants
            const newGravity = 0.5 + Math.random() * 2.0; // Random gravity
            const newSpeed = Math.floor(Math.random() * 1000 + 100); // Random speed of light

            const seedData = {
                generation: (parseInt(localStorage.getItem('ep_generation') || 1) + 1),
                gravity: newGravity,
                c: newSpeed,
                timestamp: Date.now()
            };

            // Save essential "Soul" data
            localStorage.setItem('ep_omega_seed', JSON.stringify(seedData));

            // Hard Reload
            location.reload();
        }, 3000);
    }
}

window.OmegaPoint = OmegaPoint;
