/**
 * Colony Governance System
 * Q2 2025 Feature: Civilization & Society
 * 
 * Manages player colonies, taxation, policies, and societal stability.
 */
class ColonyGovernanceSystem {
    constructor() {
        this.colonies = new Map(); // key: planetId, value: ColonyData
        this.policies = {
            'Industrial Stimulus': { cost: 100, effect: 'production +20%', happiness: -5 },
            'Utopian Welfare': { cost: 500, effect: 'happiness +15%', income: -10 },
            'Martial Law': { cost: 200, effect: 'stability +30%', happiness: -20 },
            'Scientific Mandate': { cost: 300, effect: 'research +25%', income: -5 }
        };
        this.factions = ['Industrialists', 'Scientists', 'Militarists', 'Populists'];
        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            console.log('🏛️ Colony Governance System Initialized');
        }
        // Load saved colonies if any (mock)
    }

    establishColony(planetId, planetName) {
        if (this.colonies.has(planetId)) return false;

        const colony = {
            id: planetId,
            name: planetName,
            population: 1000,
            happiness: 100, // 0-100
            stability: 100, // 0-100
            taxRate: 0.1, // 10%
            activePolicies: [],
            dominantFaction: 'Populists',
            income: 0,
            lastUpdate: Date.now()
        };

        this.colonies.set(planetId, colony);
        this.notify(`Colony established on ${planetName}!`, 'success');
        return true;
    }

    getColony(planetId) {
        return this.colonies.get(planetId);
    }

    setTaxRate(planetId, rate) {
        const colony = this.getColony(planetId);
        if (!colony) return;

        colony.taxRate = Math.max(0, Math.min(0.5, rate)); // Cap at 50%
        this.notify(`Tax rate on ${colony.name} set to ${(colony.taxRate * 100).toFixed(0)}%`, 'info');
        this.updateHappiness(colony);
    }

    enactPolicy(planetId, policyName) {
        const colony = this.getColony(planetId);
        if (!colony || !this.policies[policyName]) return;

        if (colony.activePolicies.includes(policyName)) {
            this.notify(`Policy ${policyName} is already active.`, 'warning');
            return;
        }

        colony.activePolicies.push(policyName);
        this.notify(`Policy enacted: ${policyName}`, 'success');
        this.updateHappiness(colony);
    }

    update(deltaTime) {
        // Run simulation loop occasionally
        if (Math.random() > 0.05) return; // Throttle

        this.colonies.forEach(colony => {
            // Growth
            const growthRate = 1 + (colony.happiness - 50) / 1000;
            colony.population = Math.floor(colony.population * growthRate);

            // Income
            colony.income += Math.floor(colony.population * colony.taxRate);

            // Stability check
            if (colony.happiness < 30) {
                colony.stability -= 1;
                if (colony.stability < 20) {
                    this.triggerRevolt(colony);
                }
            } else {
                colony.stability = Math.min(100, colony.stability + 0.5);
            }
        });
    }

    updateHappiness(colony) {
        let base = 100;
        // Tax penalty
        base -= (colony.taxRate * 100) * 1.5;

        // Policy effects
        colony.activePolicies.forEach(p => {
            base += this.policies[p].happiness || 0;
        });

        colony.happiness = Math.max(0, Math.min(100, base));
    }

    triggerRevolt(colony) {
        this.notify(`🔥 REVOLT on ${colony.name}! Stability critical.`, 'error');
        // Effect logic would go here
    }

    notify(msg, type) {
        console.log(`[Governance] ${msg}`);
        // Visual notification hook
        if (window.showNotification) {
            window.showNotification(msg, type);
        } else {
            alert(msg); // Fallback
        }
    }

    // UI Handling
    showGovernanceUI(planetId, planetName) {
        const modalId = 'governance-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; justify-content: center; align-items: center;';
            document.body.appendChild(modal);
        }

        const colony = this.getColony(planetId);
        const content = colony ? this.renderColonyView(colony) : this.renderEstablishView(planetId, planetName);

        modal.innerHTML = `
            <div style="background: rgba(20, 20, 30, 0.95); border: 2px solid #ba944f; padding: 2rem; border-radius: 12px; width: 600px; max-width: 90%; color: #eee; font-family: 'Raleway', sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f; margin: 0;">🏛️ Colony Governance</h2>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: transparent; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                ${content}
            </div>
        `;
    }

    renderEstablishView(planetId, planetName) {
        return `
            <div style="text-align: center;">
                <h3>Uninhabited World</h3>
                <p>This planet has no established colony. Would you like to found one?</p>
                <div style="margin: 2rem 0; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div><strong>Planet:</strong> ${planetName}</div>
                    <div><strong>Cost:</strong> 1,000 Credits</div>
                </div>
                <button onclick="window.colonyGovernanceSystem.establishColony('${planetId}', '${planetName}'); window.colonyGovernanceSystem.showGovernanceUI('${planetId}', '${planetName}')" 
                    style="background: #ba944f; color: black; border: none; padding: 1rem 2rem; font-weight: bold; border-radius: 6px; cursor: pointer;">
                    Found Colony
                </button>
            </div>
        `;
    }

    renderColonyView(colony) {
        const policiesHTML = Object.entries(this.policies).map(([name, data]) => {
            const isActive = colony.activePolicies.includes(name);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: rgba(255,255,255,0.05); margin-bottom: 0.5rem; border-radius: 4px;">
                    <div>
                        <div style="font-weight: bold; color: ${isActive ? '#10b981' : '#ccc'}">${name}</div>
                        <div style="font-size: 0.8rem; opacity: 0.7;">${data.effect} (Cost: ${data.cost})</div>
                    </div>
                    ${isActive ?
                    '<span style="color: #10b981;">Active</span>' :
                    `<button onclick="window.colonyGovernanceSystem.enactPolicy('${colony.id}', '${name}'); window.colonyGovernanceSystem.showGovernanceUI('${colony.id}', '${colony.name}')" style="background: rgba(186,148,79,0.2); border: 1px solid #ba944f; color: #ba944f; padding: 0.2rem 0.6rem; cursor: pointer; border-radius: 4px;">Enact</button>`
                }
                </div>
            `;
        }).join('');

        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3 style="border-bottom: 1px solid #444; padding-bottom: 0.5rem;">Statistics</h3>
                    <div style="margin-bottom: 0.5rem;">Population: <strong style="color: #ba944f;">${colony.population.toLocaleString()}</strong></div>
                    <div style="margin-bottom: 0.5rem;">Happiness: <strong style="color: ${this.getColor(colony.happiness)}">${colony.happiness.toFixed(0)}%</strong></div>
                    <div style="margin-bottom: 0.5rem;">Stability: <strong style="color: ${this.getColor(colony.stability)}">${colony.stability.toFixed(0)}%</strong></div>
                    <div style="margin-bottom: 0.5rem;">Income: <strong style="color: #10b981;">+${colony.income}</strong> / cycle</div>
                    
                    <h3 style="border-bottom: 1px solid #444; padding-bottom: 0.5rem; margin-top: 2rem;">Taxation</h3>
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Tax Rate:</span>
                            <span id="tax-display-val">${(colony.taxRate * 100).toFixed(0)}%</span>
                        </div>
                        <input type="range" min="0" max="50" value="${colony.taxRate * 100}" 
                            style="width: 100%; accent-color: #ba944f;"
                            oninput="document.getElementById('tax-display-val').innerText = this.value + '%'"
                            onchange="window.colonyGovernanceSystem.setTaxRate('${colony.id}', this.value / 100); window.colonyGovernanceSystem.showGovernanceUI('${colony.id}', '${colony.name}')">
                    </div>
                </div>
                <div>
                    <h3 style="border-bottom: 1px solid #444; padding-bottom: 0.5rem;">Policies</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${policiesHTML}
                    </div>
                </div>
            </div>
        `;
    }

    getColor(value) {
        if (value > 70) return '#10b981';
        if (value > 40) return '#f59e0b';
        return '#ef4444';
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ColonyGovernanceSystem = ColonyGovernanceSystem;
}
