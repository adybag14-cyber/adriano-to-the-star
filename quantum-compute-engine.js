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
        this.lastResult = '';
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
        this.game.notify?.(`Simulated qubit stabilized: ${this.coherence.toFixed(0)}% coherence.`, 'info');
    }

    runTask(type) {
        if(!['Optimization','Encryption','Entanglement'].includes(type))return false;
        if (this.coherence < 30) {
            this.game.notify("Coherence too low to initiate Quantum Task!", "error");
            return false;
        }

        const task = {
            type: type,
            duration: 5.0, // Seconds
            progress: 0,
            risk: (100 - this.coherence) / 100 // Risk scales with decoherence
        };

        this.activeTasks.push(task);
        this.game.notify(`Initiating Quantum Task: ${type}...`, "info");
        this.lastResult='';
        return true;
    }

    completeTask(task, index) {
        // Roll for success based on current coherence (not initial risk)
        // High coherence = High success chance
        const roll = Math.random() * 100;
        const successChance = this.coherence; // Direct mapping

        if (roll <= successChance) {
            this.applyTaskReward(task.type);
            this.lastResult=`${task.type} complete: ${task.type==='Optimization'?'+500 energy, +200 minerals':task.type==='Encryption'?'+500 data':'entanglement increased'}.`;
            this.game.notify(`Quantum Task '${task.type}' SUCCESS! State Collapsed favorably.`, "success");
        } else {
            this.lastResult=`${task.type} failed due to decoherence. Stabilize the qubit and retry.`;
            this.game.notify(`Quantum Task '${task.type}' FAILED! Decoherence Error.`, "error");
            // Penalty? Sim decay?
            this.coherence -= 10;
        }

        this.activeTasks.splice(index, 1);
        this.game.updateResourceUI?.();
    }

    applyTaskReward(type) {
        switch (type) {
            case 'Optimization':
                this.game.resources.energy += 500;
                this.game.resources.minerals = (Number(this.game.resources.minerals)||0) + 200;
                break;
            case 'Encryption':
                this.game.resources.data = (Number(this.game.resources.data)||0) + 500;
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
