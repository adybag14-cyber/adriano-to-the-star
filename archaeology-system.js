/**
 * Archaeology System
 * Allows players to scan for ancient ruins, excavate them, and recover artifacts.
 */

class ArchaeologyManager {
    constructor(game) {
        this.game = game;
        this.digSites = []; // Active ruins found
        this.artifacts = []; // Collected items
        this.isScanning = false;

        this.lootTable = [
            { id: 'shard', name: 'Ancient Shard', rarity: 'Common', desc: 'Fragments of unknown alloy.', type: 'resource', val: { alloys: 100 } },
            { id: 'data_crystal', name: 'Data Crystal', rarity: 'Rare', desc: 'Encoded historical records.', type: 'resource', val: { data: 50 } },
            { id: 'precursor_tech', name: 'Precursor Core', rarity: 'Legendary', desc: 'A humming power source of immense potential.', type: 'artifact' }
        ];
    }

    init() {
        console.log("Archaeology Manager Initialized");
    }

    scanPlanet() {
        const cost = 100;
        if (this.game.resources.data < cost) {
            this.game.notify("Insufficient Data to scan! Need 100 Data.", "warning");
            return;
        }

        this.game.resources.data -= cost;
        this.game.updateResourceUI();
        this.game.notify("Scanning surface...", "info");
        this.isScanning = true;

        setTimeout(() => {
            this.isScanning = false;
            // 40% chance to find a ruin
            if (Math.random() < 0.4) {
                const ruin = {
                    id: 'ruin_' + Date.now(),
                    name: 'Mystery Signal ' + Math.floor(Math.random() * 999),
                    difficulty: Math.floor(Math.random() * 3) + 1,
                    progress: 0,
                    status: 'unexplored' // unexplored, digging, excavated
                };
                this.digSites.push(ruin);
                this.game.notify("Anomaly Detected! New Dig Site marked.", "success");
                this.updateUI();
            } else {
                this.game.notify("Scan complete. No anomalies found.", "info");
            }
        }, 2000);
    }

    startExcavation(ruinId) {
        const ruin = this.digSites.find(r => r.id === ruinId);
        if (!ruin || ruin.status !== 'unexplored') return;

        ruin.status = 'digging';
        this.updateUI();

        // Simulate time (e.g., 5 seconds per difficulty level)
        const duration = ruin.difficulty * 2000;

        setTimeout(() => {
            this.completeExcavation(ruin);
        }, duration);
    }

    completeExcavation(ruin) {
        ruin.status = 'excavated';
        ruin.progress = 100;

        // Loot logic
        const roll = Math.random();
        let loot;
        if (roll > 0.9) loot = this.lootTable[2]; // Legendary
        else if (roll > 0.6) loot = this.lootTable[1]; // Rare
        else loot = this.lootTable[0]; // Common

        this.game.notify(`Excavation Complete! Found: ${loot.name}`, "success");

        if (loot.type === 'resource') {
            for (const res in loot.val) {
                this.game.resources[res] = (this.game.resources[res] || 0) + loot.val[res];
            }
            this.game.updateResourceUI();
        } else {
            this.artifacts.push(loot);
        }

        // Remove ruin after delay or keep as "explored"? Let's remove for cleanup
        this.digSites = this.digSites.filter(r => r.id !== ruin.id);
        this.updateUI();
    }

    // UI METHODS ========================================================

    openUI() {
        let modal = document.getElementById('ep-archaeology-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-archaeology-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="ep-modal" style="width:600px; max-width:90vw; height:700px; display:flex; flex-direction:column;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#fbbf24;">🏛️ Xeno-Archaeology</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-archaeology-modal').style.display='none'">CLOSE</button>
                    </div>
                    
                    <div style="padding:20px; text-align:center; border-bottom:1px solid #334155;">
                        <button class="ep-sys-btn" id="ep-btn-scan-ruins" style="font-size:1.2em; padding:10px 20px;">📡 SCAN SURFACE (100 Data)</button>
                    </div>

                    <div class="ep-modal-body" style="flex:1; padding:10px; overflow-y:auto;">
                        <h3 style="color:#94a3b8;">Active Dig Sites</h3>
                        <div id="ep-ruin-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;"></div>

                        <h3 style="color:#94a3b8;">Artifact Collection</h3>
                        <div id="ep-artifact-list" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px;"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('ep-btn-scan-ruins').onclick = () => this.scanPlanet();
        }

        this.updateUI();
        modal.style.display = 'flex';
    }

    updateUI() {
        const modal = document.getElementById('ep-archaeology-modal');
        if (!modal || modal.style.display === 'none') return;

        const ruinList = document.getElementById('ep-ruin-list');
        ruinList.innerHTML = '';

        if (this.digSites.length === 0) {
            ruinList.innerHTML = '<div style="color:#475569; text-align:center;">No active signals. Scan for more.</div>';
        } else {
            this.digSites.forEach(r => {
                const el = document.createElement('div');
                el.style.cssText = 'background:#1e293b; border:1px solid #475569; padding:10px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;';

                let action = '';
                if (r.status === 'unexplored') {
                    action = `<button class="ep-sys-btn" style="color:#fbbf24; border-color:#fbbf24;">⛏️ Excavate</button>`;
                } else if (r.status === 'digging') {
                    action = `<span style="color:#94a3b8;">Excavating...</span>`;
                }

                el.innerHTML = `
                    <div>
                        <div style="font-weight:bold; color:#e2e8f0;">${r.name}</div>
                        <div style="font-size:0.8em; color:#94a3b8;">Difficulty: ${r.difficulty}</div>
                    </div>
                    ${action}
                `;

                if (r.status === 'unexplored') {
                    el.querySelector('button').onclick = () => this.startExcavation(r.id);
                }
                ruinList.appendChild(el);
            });
        }

        const artifactList = document.getElementById('ep-artifact-list');
        artifactList.innerHTML = '';

        if (this.artifacts.length === 0) {
            artifactList.innerHTML = '<div style="grid-column:1/-1; color:#475569; text-align:center;">No artifacts recovered.</div>';
        } else {
            this.artifacts.forEach(a => {
                const el = document.createElement('div');
                el.style.cssText = 'background:#0f172a; border:1px solid #fbbf24; padding:5px; border-radius:4px; text-align:center;';
                el.innerHTML = `
                    <div style="font-size:2em;">🎁</div>
                    <div style="font-size:0.8em; font-weight:bold; color:#fbbf24;">${a.name}</div>
                `;
                el.title = a.desc;
                artifactList.appendChild(el);
            });
        }
    }
}

window.ArchaeologyManager = ArchaeologyManager;
