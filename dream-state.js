/**
 * DreamState.js
 * Manages the "Dream Mode" (Idle State)
 * Generates resources and displays visuals when the player is away.
 */

class DreamState {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.idleTimer = 0;
        this.idleThreshold = 30000; // 30 seconds to trigger dream state
        this.dreamShards = 0;

        // Visuals
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
    }

    init() {
        this.createOverlay();
        // Reset timer on interaction
        ['click', 'mousemove', 'keydown'].forEach(evt => {
            document.addEventListener(evt, () => this.resetIdleTimer());
        });
    }

    createOverlay() {
        const div = document.createElement('div');
        div.id = 'dream-overlay';
        div.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 2000; display: none;
            justify-content: center; align-items: center; flex-direction: column;
            pointer-events: none; /* Allow click through to wake up? or capture? */
        `;
        div.innerHTML = `
            <h1 style="color: #a855f7; font-family: 'Orbitron'; text-shadow: 0 0 20px #a855f7;">DREAM STATE BUSY</h1>
            <p style="color: #e9d5ff;">Harvesting Dream Shards...</p>
            <div id="dream-counter" style="color: #fff; font-size: 2em;">0</div>
        `;
        document.body.appendChild(div);

        this.container = div;
        this.counterEl = div.querySelector('#dream-counter');

        // Wake up on click overlay
        // Actually, we want any movement to wake up, which is handled by resetIdleTimer
    }

    update(dt) {
        // Check for idle
        if (!this.isActive) {
            if (Date.now() - this.game.neural.lastInputTime > this.idleThreshold) {
                this.enterDream();
            }
        } else {
            // In Dream State
            this.dreamShards += dt * 0.5; // 0.5 shards per second
            if (this.counterEl) this.counterEl.innerText = Math.floor(this.dreamShards);

            // If input detected, we wake up (handled by event listeners calling resetIdleTimer)
        }
    }

    resetIdleTimer() {
        if (this.isActive) {
            this.wakeUp();
        }
        // Last input time is tracked by NeuralLinkSystem, so we just check that
        // But for safety locally:
        // this.lastInput = Date.now();
    }

    enterDream() {
        this.isActive = true;
        this.container.style.display = 'flex';
        this.game.notify("Entering Dream State...", "info");
    }

    wakeUp() {
        this.isActive = false;
        this.container.style.display = 'none';

        if (this.dreamShards > 1) {
            const gained = Math.floor(this.dreamShards);
            this.game.notify(`Woke up! Gained ${gained} Dream Shards.`, "success");
            // Add to game resources (abstract)
            // this.game.resources.dreamShards = (this.game.resources.dreamShards || 0) + gained;
        }
        this.dreamShards = 0;
    }
}

window.DreamState = DreamState;
