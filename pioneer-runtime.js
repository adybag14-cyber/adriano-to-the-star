/* Pioneer runtime v2: one frame owner, fixed simulation steps and bounded telemetry. */
(function (scope) {
    'use strict';
    class PioneerRuntime {
        constructor(game, environment = {}) {
            this.game = game;
            this.requestFrame = environment.requestFrame || (callback => requestAnimationFrame(callback));
            this.cancelFrame = environment.cancelFrame || (id => cancelAnimationFrame(id));
            this.document = environment.document || document;
            this.step = 1 / 60;
            this.maxSteps = 6;
            this.accumulator = 0;
            this.colonyAccumulator = 0;
            this.lastTimestamp = null;
            this.frameId = null;
            this.running = false;
            this.contextLost = false;
            this.disposed = false;
            this.samples = new Float64Array(240);
            this.sampleCount = 0;
            this.sampleIndex = 0;
            this.simulationSteps = 0;
            this.frameCount = 0;
            this.elapsed = 0;
            this.onFrame = timestamp => {
                this.frameId = null;
                if (!this.running || this.disposed || this.document.hidden || this.contextLost) return;
                const delta = this.lastTimestamp === null ? 0 : Math.max(0, (timestamp - this.lastTimestamp) / 1000);
                this.lastTimestamp = timestamp;
                this.advance(delta);
                this.schedule();
            };
            this.onVisibility = () => this.document.hidden ? this.suspend() : this.resume();
            this.onContextLost = event => {
                event.preventDefault();
                this.contextLost = true;
                this.suspend();
                this.game.notify?.('Graphics context interrupted. Your colony is paused while the browser restores it.', 'warning');
            };
            this.onContextRestored = () => {
                this.contextLost = false;
                this.game.rayTracingRenderer?.resetAccumulation?.();
                this.game.resize?.();
                this.resume();
                this.game.notify?.('Graphics restored. Colony simulation resumed.', 'success');
            };
            this.document.addEventListener('visibilitychange', this.onVisibility);
            this.canvas = game.renderer?.domElement;
            this.canvas?.addEventListener('webglcontextlost', this.onContextLost);
            this.canvas?.addEventListener('webglcontextrestored', this.onContextRestored);
        }

        schedule() {
            if (this.running && !this.disposed && !this.document.hidden && !this.contextLost && this.frameId === null) this.frameId = this.requestFrame(this.onFrame);
        }

        start() {
            if (this.disposed) return;
            this.running = true;
            this.schedule();
        }

        suspend() {
            if (this.frameId !== null) this.cancelFrame(this.frameId);
            this.frameId = null;
            this.lastTimestamp = null;
            this.accumulator = 0;
            // Background time is deliberately not charged to a survival colony.
            this.colonyAccumulator = 0;
        }

        resume() {
            this.lastTimestamp = null;
            this.schedule();
        }

        advance(rawDelta) {
            const delta = Math.min(0.1, Math.max(0, Number(rawDelta) || 0));
            this.elapsed += delta;
            if (delta > 0) {
                this.samples[this.sampleIndex] = Math.max(0, Number(rawDelta) || 0) * 1000;
                this.sampleIndex = (this.sampleIndex + 1) % this.samples.length;
                this.sampleCount = Math.min(this.samples.length, this.sampleCount + 1);
            }
            if (!this.game.isPaused && this.game.timeScale > 0) {
                this.accumulator = Math.min(this.accumulator + delta, this.step * this.maxSteps);
                let count = 0;
                while (this.accumulator + 1e-9 >= this.step && count < this.maxSteps) {
                    this.game.stepSimulation(this.step);
                    this.accumulator = Math.max(0, this.accumulator - this.step);
                    this.simulationSteps += 1;
                    count += 1;
                }
                this.colonyAccumulator += delta;
                if (this.colonyAccumulator + 1e-9 >= 1) {
                    this.colonyAccumulator = Math.max(0, this.colonyAccumulator - 1);
                    this.game.colonyTick?.();
                }
            } else {
                this.accumulator = 0;
                this.colonyAccumulator = 0;
            }
            this.game.renderFrame(delta);
            this.frameCount += 1;
        }

        getMetrics() {
            const sorted = Array.from(this.samples.subarray(0, this.sampleCount)).sort((a, b) => a - b);
            const percentile = p => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] || 0;
            return { version: 'pioneer-runtime-v2', samples: sorted.length, medianMs: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99), simulationSteps: this.simulationSteps, renderedFrames: this.frameCount, suspended: this.document.hidden || this.contextLost, fixedStepHz: 60 };
        }

        dispose() {
            this.running = false;
            this.disposed = true;
            this.suspend();
            this.document.removeEventListener('visibilitychange', this.onVisibility);
            this.canvas?.removeEventListener('webglcontextlost', this.onContextLost);
            this.canvas?.removeEventListener('webglcontextrestored', this.onContextRestored);
        }
    }
    scope.PioneerRuntime = PioneerRuntime;
})(typeof window !== 'undefined' ? window : globalThis);
