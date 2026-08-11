/**
 * Supply Chain Logistics System
 * Manages autonomous cargo fleets Transporting resources between planets.
 * "The Spice must flow."
 */

class SupplyChainSystem {
    constructor() {
        this.routes = []; // { id, source, target, resource, status }
        this.ships = []; // { id, routeId, progress }

        this.init();
    }

    init() {
        console.log("🚛 Regional Supply Chain Logistics Initialized");

        // Mock some initial routes between systems
        this.createRoute("kepler_186f", "wolf_1061c", "ore");
        this.createRoute("wolf_1061c", "trappist_1e", "refined_metal");

        this.simulationLoop();
    }

    createRoute(sourceSys, targetSys, resource) {
        const route = {
            id: `route-${Math.random().toString(36).substr(2, 5)}`,
            sourceSys,
            targetSys,
            resource,
            volume: 0,
            active: true
        };
        this.routes.push(route);
        console.log(`🛣️ Trade Route established: ${sourceSys} -> ${targetSys} (${resource})`);

        // Spawn initial ships for this route
        this.spawnShip(route.id);
    }

    spawnShip(routeId) {
        this.ships.push({
            id: `transport-${Math.random().toString(36).substr(2, 5)}`,
            routeId: routeId,
            progress: 0,
            speed: 1 + (Math.random() * 2),
            payload: 50 + Math.floor(Math.random() * 100)
        });
    }

    update() {
        this.ships.forEach(ship => {
            ship.progress += ship.speed;
            if (ship.progress >= 100) {
                // Delivery complete
                ship.progress = 0;
                const route = this.routes.find(r => r.id === ship.routeId);
                if (route) {
                    this.processDelivery(route, ship.payload);
                }
            }
        });
    }

    processDelivery(route, amount) {
        route.volume += amount;

        // Impact Economy System if available
        if (window.economySystem) {
            // Source system loses supply (price up)
            window.economySystem.trade('sell', route.resource, amount, route.sourceSys);
            // Target system gains supply (price down)
            window.economySystem.trade('buy', route.resource, amount, route.targetSys);
        }
    }

    getManifest() {
        return this.routes.map(r => ({
            route: `${r.source} -> ${r.target}`,
            cargo: r.resource,
            totalDelivered: r.volume,
            activeShips: this.ships.filter(s => s.routeId === r.id).length
        }));
    }

    simulationLoop() {
        setInterval(() => this.update(), 1000);
    }
}

if (typeof window !== 'undefined') {
    window.SupplyChainSystem = SupplyChainSystem;
    window.supplyChainSystem = new SupplyChainSystem();
}
