/**
 * Ascension System
 * Q4 2025 Feature: Transcendence
 * 
 * Manages player ascension paths (Cybernetic, Psionic, Biological).
 */
class AscensionSystem {
    constructor() {
        this.activePath = null;
        this.perks = [];
        this.paths = {
            'cybernetic': { name: 'Cybernetic Ascension', description: 'Merge machine and flesh. Efficiency +50%.', cost: 10000 },
            'psionic': { name: 'Psionic Ascension', description: 'Unlock the mind. Influence +50%.', cost: 15000 },
            'biological': { name: 'Biological Ascension', description: 'Genetic mastery. Pop Growth +100%.', cost: 12000 }
        };
        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            console.log('✨ Ascension System Online');
        }
    }

    choosePath(path) {
        if (this.activePath) {
            this.notify(`Already ascended via ${this.paths[this.activePath].name}.`, 'warning');
            return;
        }

        const data = this.paths[path];
        if (window.economySystem && window.economySystem.playerResources.credits < data.cost) {
            this.notify(`Need ${data.cost} Cr for ascension ritual.`, 'error');
            return;
        }

        if (window.economySystem) window.economySystem.playerResources.credits -= data.cost;

        this.activePath = path;
        this.notify(`Ascended via ${data.name}!`, 'success');
        this.applyEffects(path);
        this.showUI();
    }

    applyEffects(path) {
        // Mock effects hook
        if (path === 'cybernetic') {
            // Efficiency hook
        }
        // ...
    }

    notify(msg, type) {
        console.log(`[Ascension] ${msg}`);
        if (window.showNotification) {
            window.showNotification(msg, type);
        } else {
            alert(msg);
        }
    }

    showUI() {
        const modalId = 'ascension-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 10005; display: flex; justify-content: center; align-items: center;';
            document.body.appendChild(modal);
        }

        let content = '';
        if (this.activePath) {
            content = `
                <div style="text-align: center;">
                    <h2 style="color: #ec4899; margin-bottom: 1rem;">✨ Ascended: ${this.paths[this.activePath].name}</h2>
                    <p style="color: #ccc;">${this.paths[this.activePath].description}</p>
                    <div style="margin-top: 2rem; padding: 1rem; border: 1px solid #ec4899; border-radius: 8px;">
                        Path Perks Active
                    </div>
                </div>
            `;
        } else {
            content = `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                    ${Object.entries(this.paths).map(([key, data]) => `
                        <button onclick="window.ascensionSystem.choosePath('${key}')" 
                            style="background: rgba(236, 72, 153, 0.1); border: 1px solid #ec4899; color: #ec4899; padding: 1.5rem; border-radius: 8px; cursor: pointer; text-align: left; display: flex; flex-direction: column; justify-content: space-between; height: 200px; transition: all 0.2s;">
                            <div>
                                <div style="font-weight: bold; font-size: 1.2rem; margin-bottom: 0.5rem;">${data.name}</div>
                                <div style="font-size: 0.9rem; opacity: 0.8;">${data.description}</div>
                            </div>
                            <div style="margin-top: 1rem; color: #fff; font-weight: bold;">Cost: ${data.cost} Cr</div>
                        </button>
                    `).join('')}
                </div>
            `;
        }

        modal.innerHTML = `
            <div style="background: rgba(20, 10, 20, 0.95); border: 2px solid #ec4899; padding: 2rem; border-radius: 12px; width: 900px; color: #eee; font-family: 'Raleway', sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ec4899; margin: 0;">✨ Ascension Paths</h2>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: transparent; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                ${content}
            </div>
        `;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AscensionSystem = AscensionSystem;
}
