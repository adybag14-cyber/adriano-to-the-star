/**
 * Trade System
 * Manages trade routes and resource exchange between colonies
 */

class TradeRoute {
    constructor(id, factionId, diplomacy) {
        this.id = id;
        this.factionId = factionId;
        this.diplomacy = diplomacy;
        this.active = true;
        this.frequency = 10; // Exchange every N days
        this.lastExchange = 0;

        const faction = diplomacy.getFaction(factionId);
        if (faction) {
            this.exportResource = faction.specialization.imports; // What they want
            this.importResource = faction.specialization.exports; // What they offer
            this.exchangeRate = 1.0 + (faction.reputation - 50) / 100; // Better rates with rep
        }
    }

    processExchange(game, currentDay) {
        if (!this.active) return null;
        if (currentDay - this.lastExchange < this.frequency) return null;

        const exportAmount = 20;
        const importAmount = Math.floor(exportAmount * this.exchangeRate);

        if (game.resources[this.exportResource] < exportAmount) {
            return { success: false, message: `Insufficient ${this.exportResource} for trade` };
        }

        game.resources[this.exportResource] -= exportAmount;
        game.resources[this.importResource] = (game.resources[this.importResource] || 0) + importAmount;
        this.lastExchange = currentDay;

        return {
            success: true,
            exported: { resource: this.exportResource, amount: exportAmount },
            imported: { resource: this.importResource, amount: importAmount }
        };
    }
}

class TradeShip {
    constructor(route, game) {
        this.route = route;
        this.game = game;
        this.state = 'OUTBOUND'; // OUTBOUND, LOADING, INBOUND, UNLOADING
        this.progress = 0;
        this.travelTime = 5; // Seconds per leg

        // Visual
        this.mesh = this.createMesh();
        this.startPos = new THREE.Vector3(0, 70, 0);
        this.endPos = new THREE.Vector3(100 + Math.random() * 50, 50, 100 + Math.random() * 50);
        this.mesh.position.copy(this.startPos);
        game.scene.add(this.mesh);
    }

    createMesh() {
        const geo = new THREE.ConeGeometry(1.5, 4, 6);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        return new THREE.Mesh(geo, mat);
    }

    update(dt) {
        this.progress += dt / this.travelTime;

        if (this.state === 'OUTBOUND') {
            this.mesh.position.lerpVectors(this.startPos, this.endPos, this.progress);
            if (this.progress >= 1) {
                this.state = 'LOADING';
                this.progress = 0;
            }
        } else if (this.state === 'LOADING') {
            this.mesh.rotation.z += dt * 3;
            if (this.progress >= 0.5) {
                this.state = 'INBOUND';
                this.progress = 0;
            }
        } else if (this.state === 'INBOUND') {
            this.mesh.position.lerpVectors(this.endPos, this.startPos, this.progress);
            if (this.progress >= 1) {
                this.state = 'UNLOADING';
                this.progress = 0;
            }
        } else if (this.state === 'UNLOADING') {
            this.mesh.rotation.z += dt * 3;
            if (this.progress >= 0.5) {
                // Complete cycle
                const result = this.route.processExchange(this.game, this.game.day);
                if (result && result.success) {
                    this.game.notify(`📦 Trade Ship: Exchanged ${result.exported.amount} ${result.exported.resource} for ${result.imported.amount} ${result.imported.resource}`, 'success');
                }
                this.state = 'OUTBOUND';
                this.progress = 0;
            }
        }
    }

    destroy() {
        this.game.scene.remove(this.mesh);
    }
}

class TradeManager {
    constructor(game, diplomacy) {
        this.game = game;
        this.diplomacy = diplomacy;
        this.routes = [];
        this.ships = [];
    }

    init() {
        console.log("Trade System Initialized");
    }

    establishRoute(factionId) {
        const faction = this.diplomacy.getFaction(factionId);
        if (!faction) {
            this.game.notify("Unknown faction", "danger");
            return false;
        }

        if (faction.reputation < 40) {
            this.game.notify("Need 40 reputation for trade route", "danger");
            return false;
        }

        // Check if route already exists
        if (this.routes.some(r => r.factionId === factionId)) {
            this.game.notify("Trade route already exists!", "info");
            return false;
        }

        const route = new TradeRoute(this.routes.length, factionId, this.diplomacy);
        this.routes.push(route);

        // Spawn trade ship
        const ship = new TradeShip(route, this.game);
        this.ships.push(ship);

        faction.modifyReputation(5);
        this.game.notify(`🚀 Trade route established with ${faction.name}!`, "success");
        return true;
    }

    cancelRoute(factionId) {
        const idx = this.routes.findIndex(r => r.factionId === factionId);
        if (idx > -1) {
            const route = this.routes[idx];
            route.active = false;
            this.routes.splice(idx, 1);

            // Remove ship
            const shipIdx = this.ships.findIndex(s => s.route.factionId === factionId);
            if (shipIdx > -1) {
                this.ships[shipIdx].destroy();
                this.ships.splice(shipIdx, 1);
            }

            this.game.notify("Trade route cancelled", "info");
        }
    }

    getActiveRoutes() {
        return this.routes.filter(r => r.active);
    }

    update(dt) {
        this.ships.forEach(ship => ship.update(dt));
    }

    // Trade UI
    openTradeUI() {
        let modal = document.getElementById('ep-trade-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-trade-modal';
            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #ffd700;border-radius:15px;padding:30px;z-index:1000;min-width:450px;';
            document.body.appendChild(modal);
        }

        const activeRoutes = this.getActiveRoutes();

        modal.innerHTML = `
            <h2 style="color:#ffd700;margin:0 0 15px 0;">📦 Trade Routes</h2>
            <p style="color:#94a3b8;">Active Routes: ${activeRoutes.length}</p>
            <div id="trade-routes-list" style="max-height:300px;overflow-y:auto;margin:15px 0;"></div>
            <button onclick="document.getElementById('ep-trade-modal').remove()" style="padding:10px 20px;background:#334155;color:#fff;border:none;border-radius:5px;cursor:pointer;">Close</button>
        `;

        const listDiv = modal.querySelector('#trade-routes-list');

        if (activeRoutes.length === 0) {
            listDiv.innerHTML = '<p style="color:#64748b;text-align:center;">No active trade routes. Establish relations with factions first!</p>';
        } else {
            activeRoutes.forEach(route => {
                const faction = this.diplomacy.getFaction(route.factionId);
                const div = document.createElement('div');
                div.style.cssText = 'background:#1e293b;padding:15px;border-radius:8px;margin:10px 0;';
                div.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#ffd700;font-weight:bold;">${faction?.name || 'Unknown'}</span>
                            <p style="color:#64748b;font-size:0.9em;margin:5px 0;">Export: ${route.exportResource} → Import: ${route.importResource}</p>
                            <p style="color:#94a3b8;font-size:0.8em;">Rate: ${route.exchangeRate.toFixed(2)}x</p>
                        </div>
                        <button onclick="window.game.trade.cancelRoute('${route.factionId}');window.game.trade.openTradeUI();" style="padding:5px 10px;background:#ef4444;color:#fff;border:none;border-radius:5px;cursor:pointer;">Cancel</button>
                    </div>
                `;
                listDiv.appendChild(div);
            });
        }
    }
}

window.TradeRoute = TradeRoute;
window.TradeShip = TradeShip;
window.TradeManager = TradeManager;
