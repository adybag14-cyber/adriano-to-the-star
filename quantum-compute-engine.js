/**
 * QuantumComputeEngine.js
 * Simulates a Quantum Processing Unit (QPU) with "Coherence" mechanics.
 * Players must maintain coherence to run high-risk, high-reward "Superposition Tasks".
 */

class QuantumComputeEngine {
    constructor(game) {
        this.game = game;
        this.coherence = 100.0; // 0 to 100%
        this.decayRate = 0.5; // % per second
        this.qubits = 4; // Start with 4 simulated qubits
        this.activeTasks = [];
        this.entanglementLevel = 0;
    }

    update(dt) {
        // Natural Decoherence
        if (this.coherence > 0) {
            this.coherence -= this.decayRate * dt;
            if (this.coherence < 0) this.coherence = 0;
        }

        // Warning thresholds
        if (this.coherence < 20 && Math.random() > 0.99) {
            this.game.notify("Warning: Qubit Decoherence Critical!", "error");
        }

        // Process Active Tasks
        this.activeTasks.forEach((task, index) => {
            task.progress += dt;
            if (task.progress >= task.duration) {
                this.completeTask(task, index);
            }
        });
    }

    stabilize(amount) {
        this.coherence += amount;
        if (this.coherence > 100) this.coherence = 100;
        this.game.createFloatingText(`+${amount}% Coherence`, this.game.mouse.x, this.game.mouse.y, '#a855f7');
    }

    runTask(type) {
        if (this.coherence < 30) {
            this.game.notify("Coherence too low to initiate Quantum Task!", "error");
            return;
        }

        const task = {
            type: type,
            duration: 5.0, // Seconds
            progress: 0,
            risk: (100 - this.coherence) / 100 // Risk scales with decoherence
        };

        this.activeTasks.push(task);
        this.game.notify(`Initiating Quantum Task: ${type}...`, "info");
    }

    completeTask(task, index) {
        // Roll for success based on current coherence (not initial risk)
        // High coherence = High success chance
        const roll = Math.random() * 100;
        const successChance = this.coherence; // Direct mapping

        if (roll <= successChance) {
            this.applyTaskReward(task.type);
            this.game.notify(`Quantum Task '${task.type}' SUCCESS! State Collapsed favorably.`, "success");
        } else {
            this.game.notify(`Quantum Task '${task.type}' FAILED! Decoherence Error.`, "error");
            // Penalty? Sim decay?
            this.coherence -= 10;
        }

        this.activeTasks.splice(index, 1);
    }

    applyTaskReward(type) {
        switch (type) {
            case 'Optimization':
                this.game.resources.energy += 500;
                this.game.resources.metal += 200;
                break;
            case 'Encryption':
                this.game.techTree.generateRP(500); // Massive RP boost
                break;
            case 'Entanglement':
                this.entanglementLevel++;
                if (this.game.universe) {
                    // Slight connection boost to multiverse
                    this.game.notify("Multiverse Entanglement Increased.", "warning");
                }
                break;
        }
    }
}

window.QuantumComputeEngine = QuantumComputeEngine;
