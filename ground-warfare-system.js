/**
 * Ground Warfare System
 * Planetary Invasion Module.
 * "Risk-lite" mechanics for capturing colonies.
 */

if (typeof GroundWarfareSystem === 'undefined') {
    window.GroundWarfareSystem = class GroundWarfareSystem {
        constructor() {
            this.activeInvasion = null;
            this.factions = ['Player', 'Defenders'];
            this.territories = [];
        }

        startInvasion(planetName, planetData) {
            console.log(`🪖 Initiating ground invasion of ${planetName}`);
            this.planetName = planetName;

            // Generate procedural map of "Zones"
            this.territories = [];
            for (let i = 0; i < 5; i++) {
                this.territories.push({
                    id: i,
                    name: `Zone Alpha-${i}`,
                    owner: 'Defenders',
                    troops: Math.floor(Math.random() * 50) + 10,
                    defenseBonus: Math.random() * 0.5
                });
            }

            // Player landing zone
            this.territories[0].owner = 'Player';
            this.territories[0].troops = 100; // Landing force

            this.showUI();
        }

        showUI() {
            let modal = document.getElementById('invasion-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'invasion-modal';
                modal.style.cssText = `
                    position:fixed; top:10%; left:10%; width:80%; height:80%;
                    background:rgba(20, 20, 20, 0.95); border: 2px solid #ff4400;
                    z-index: 15000; color: #fff; font-family: 'Courier New', monospace;
                    display:flex; flex-direction:column; padding:2rem;
                `;
                document.body.appendChild(modal);
            }

            this.renderMap(modal);
        }

        renderMap(container) {
            const zonesHtml = this.territories.map(t => `
                <div class="war-zone" onclick="window.groundWarfareSystem.attackZone(${t.id})" 
                    style="
                        background: ${t.owner === 'Player' ? '#4caf50' : '#f44336'}; 
                        padding:1rem; margin:0.5rem; cursor:pointer;
                        border: 1px solid #fff; opacity: ${t.owner === 'Player' ? 1 : 0.7};
                    ">
                    <h3>${t.name}</h3>
                    <p>Owner: ${t.owner}</p>
                    <p>Troops: ${t.troops}</p>
                    <p>Defense: ${(t.defenseBonus * 100).toFixed(0)}%</p>
                    ${t.owner !== 'Player' ? '<small>(Click to Attack)</small>' : ''}
                </div>
            `).join('');

            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #ff4400; padding-bottom:1rem;">
                    <h1 style="color:#ff4400; margin:0;">INVASION: ${this.planetName}</h1>
                    <button onclick="document.getElementById('invasion-modal').remove()" style="background:red; color:white; border:none; padding:0.5rem;">ABORT</button>
                </div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; margin-top:2rem;">
                    ${zonesHtml}
                </div>
                <div id="battle-log" style="margin-top:auto; height:150px; overflow-y:auto; border-top:1px solid #555; padding-top:1rem; font-size:0.9rem; color:#aaa;">
                    System ready. Select a hostile zone to launch assault from nearest base.
                </div>
            `;
        }

        attackZone(targetId) {
            const target = this.territories.find(t => t.id === targetId);
            if (target.owner === 'Player') return; // Can't attack self

            // Find adjacent player zone (simplified: assume index 0 allows index 1...)
            // For prototype, find ANY player zone with troops > 10
            const source = this.territories.find(t => t.owner === 'Player' && t.troops > 10);

            if (!source) {
                this.log("⚠️ No active squads available for assault!");
                return;
            }

            // Battle Calculation
            const attackForce = Math.floor(source.troops * 0.5); // Send half
            source.troops -= attackForce;

            this.log(`⚔️ Assaulting ${target.name} with ${attackForce} marines...`);

            // Simple roll
            const defensePower = target.troops * (1 + target.defenseBonus);
            const attackPower = attackForce; // No bonus yet

            // Resolve (random variance)
            const attackRoll = attackPower * Math.random();
            const defenseRoll = defensePower * Math.random();

            if (attackRoll > defenseRoll) {
                // Victory
                const survivors = Math.floor(attackForce * 0.7);
                target.owner = 'Player';
                target.troops = survivors;
                this.log(`✅ VICTORY! Captured ${target.name}. ${survivors} survivors securing the area.`);
            } else {
                // Defeat
                const enemySurvivors = Math.floor(target.troops * 0.8);
                target.troops = enemySurvivors;
                this.log(`❌ DEFEAT! Assault repelled. Enemy troops remaining: ${enemySurvivors}.`);
            }

            this.renderMap(document.getElementById('invasion-modal'));
            this.checkWinCondition();
        }

        checkWinCondition() {
            const enemyZones = this.territories.filter(t => t.owner !== 'Player');
            if (enemyZones.length === 0) {
                this.log("🏆 PLANET SECURED. Main base captured. Invasion successful.");
                // Reward logic here
            }
        }

        log(msg) {
            const log = document.getElementById('battle-log');
            if (log) {
                log.innerHTML += `<div>> ${msg}</div>`;
                log.scrollTop = log.scrollHeight;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.GroundWarfareSystem = GroundWarfareSystem;
    window.groundWarfareSystem = new GroundWarfareSystem();
}
