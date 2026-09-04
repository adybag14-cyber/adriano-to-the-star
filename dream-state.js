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
        this.idleThreshold = 300000; // Watching a scene should never interrupt play.
        this.lastInputTime = Date.now();
        this.dreamShards = 0;

        // Visuals
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
    }

    init() {
        this.createOverlay();
        // Reset timer on interaction
        this.onInput = () => this.resetIdleTimer();
        ['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(evt => {
            document.addEventListener(evt, this.onInput, { passive: true });
        });
    }

    createOverlay() {
        const div = document.createElement('div');
        div.id = 'dream-overlay';
        div.setAttribute('aria-live', 'off');
        div.innerHTML = `
            <strong>OBSERVATION MODE</strong>
            <span>Your colony continues while you watch. Move the pointer or use a key to dismiss.</span>
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
            if (Date.now() - this.lastInputTime > this.idleThreshold) {
                this.enterDream();
            }
        } else {
            // In Dream State
            this.idleTimer += Math.max(0, Number(dt) || 0);

            // If input detected, we wake up (handled by event listeners calling resetIdleTimer)
        }
    }

    resetIdleTimer() {
        this.lastInputTime = Date.now();
        if (this.isActive) {
            this.wakeUp();
        }
        // Last input time is tracked by NeuralLinkSystem, so we just check that
        // But for safety locally:
        // this.lastInput = Date.now();
    }

    enterDream() {
        this.isActive = true;
        this.container.style.display = 'block';
    }

    wakeUp() {
        this.isActive = false;
        this.container.style.display = 'none';

        this.idleTimer = 0;
        this.dreamShards = 0;
    }

    dispose() {
        ['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(evt => document.removeEventListener(evt, this.onInput));
        this.container?.remove();
    }
}

window.DreamState = DreamState;
