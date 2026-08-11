/**
 * Diplomacy System
 * Q3 2025 Feature: Warfare 2.0
 * 
 * Manages relationships with other factions, alliances, and espionage.
 */
class DiplomacySystem {
    constructor(game) {
        this.game = game;
        this.factions = ['United Sol Federation', 'Alpha Centauri Combine', 'Sirius Syndicate', 'Proxima Republic'];
        this.relations = new Map(); // faction -> relation value (-100 to 100)
        this.factionDetails = {
            'United Sol Federation': { exports: 'credits', imports: 'minerals' },
            'Alpha Centauri Combine': { exports: 'energy', imports: 'food' },
            'Sirius Syndicate': { exports: 'alloys', imports: 'credits' },
            'Proxima Republic': { exports: 'data', imports: 'oxygen' }
        };
        this.activeEspionage = [];
        this.init();
    }

    init() {
        this.factions.forEach(faction => {
            this.relations.set(faction, 0); // Neutral start
        });
        if (typeof window !== 'undefined') {
            console.log('🤝 Diplomacy System Online');
        }
    }

    getFaction(name) {
        if (!this.factions.includes(name)) return null;
        const relation = this.getRelation(name);
        const details = this.factionDetails[name] || { exports: 'credits', imports: 'minerals' };

        return {
            name: name,
            reputation: relation + 50, // Map -50..50 relation to 0..100 reputation for TradeManager
            specialization: details,
            modifyReputation: (amount) => this.modifyRelation(name, amount)
        };
    }

    getRelation(faction) {
        return this.relations.get(faction) || 0;
    }

    modifyRelation(faction, amount) {
        const current = this.getRelation(faction);
        const newVal = Math.max(-100, Math.min(100, current + amount));
        this.relations.set(faction, newVal);

        let status = 'Neutral';
        if (newVal > 50) status = 'Friendly';
        if (newVal > 80) status = 'Allied';
        if (newVal < -50) status = 'Hostile';
        if (newVal < -80) status = 'At War';

        this.notify(`Relation with ${faction} changed to ${newVal.toFixed(0)} (${status})`, amount > 0 ? 'success' : 'warning');
    }

    proposeAlliance(faction) {
        const rel = this.getRelation(faction);
        if (rel > 80) {
            this.notify(`Alliance accepted by ${faction}!`, 'success');
            // Logic for shared vision etc.
        } else {
            this.notify(`${faction} refuses alliance. Requires higher standing.`, 'error');
            this.modifyRelation(faction, -5); // Insulted
        }
    }

    startEspionage(faction, operation) {
        // Operations: 'Sabotage', 'Intel', 'Steal Tech'
        const cost = 500;
        if (window.economySystem && window.economySystem.playerResources.credits < cost) {
            this.notify('Insufficient credits for operation.', 'error');
            return;
        }

        if (window.economySystem) window.economySystem.playerResources.credits -= cost;

        const chance = 0.6; // 60% success
        this.notify(`Spy network attempting ${operation} against ${faction}...`, 'info');

        setTimeout(() => {
            if (Math.random() < chance) {
                this.notify(`Espionage Successful: ${operation} against ${faction}!`, 'success');
                if (operation === 'Sabotage') {
                    // Reduce their readiness or something
                    this.activeEspionage.push({ faction, type: operation, timestamp: Date.now() });
                }
            } else {
                this.notify(`Spy captured in ${faction} space! Relations plummeted.`, 'error');
                this.modifyRelation(faction, -30);
            }
        }, 3000);
    }

    notify(msg, type) {
        console.log(`[Diplomacy] ${msg}`);
        if (window.showNotification) {
            window.showNotification(msg, type);
        } else {
            alert(msg);
        }
    }

    showDiplomacyUI() {
        const modalId = 'diplomacy-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10003; display: flex; justify-content: center; align-items: center;';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background: rgba(15, 20, 35, 0.95); border: 2px solid #88ccff; padding: 2rem; border-radius: 12px; width: 700px; color: #eee; font-family: 'Raleway', sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #88ccff; margin: 0;">🤝 Galactic Diplomacy</h2>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: transparent; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    ${this.factions.map(f => this.renderFactionCard(f)).join('')}
                </div>
            </div>
        `;
    }

    renderFactionCard(faction) {
        const val = this.getRelation(faction);
        let color = '#ccc';
        if (val > 50) color = '#10b981';
        if (val < -50) color = '#ef4444';

        return `
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; border-left: 4px solid ${color};">
                <h3 style="margin: 0 0 0.5rem 0;">${faction}</h3>
                <div style="margin-bottom: 1rem;">Relations: <strong style="color: ${color}">${val}</strong></div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="window.diplomacySystem.proposeAlliance('${faction}')" style="flex: 1; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981; padding: 0.25rem; border-radius: 4px; cursor: pointer;">Alliance</button>
                    <button onclick="window.diplomacySystem.startEspionage('${faction}', 'Sabotage')" style="flex: 1; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; padding: 0.25rem; border-radius: 4px; cursor: pointer;">Sabotage</button>
                    <button onclick="window.diplomacySystem.modifyRelation('${faction}', 10)" style="flex: 1; background: rgba(136, 204, 255, 0.2); border: 1px solid #88ccff; color: #88ccff; padding: 0.25rem; border-radius: 4px; cursor: pointer;">Gift</button>
                </div>
            </div>
        `;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.DiplomacySystem = DiplomacySystem;
}
