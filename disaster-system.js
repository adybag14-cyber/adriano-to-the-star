/**
 * DisasterSystem.js
 * 
 * Manages random events and crises.
 * Can trigger visual effects, modify stats, and deform terrain.
 */

class DisasterManager {
    constructor(game) {
        this.game = game;
        this.activeDisasters = [];
        this.lastDisasterDay = 0;
        this.disasterChance = 0.05; // 5% chance per day

        this.events = {
            'solar_flare': {
                name: 'Solar Flare',
                desc: 'High radiation levels detected. Comms disrupted.',
                duration: 3, // days
                effect: (game) => {
                    if (game.triggerVisuals) game.triggerVisuals('solar_flare');
                    // Notification handled by dailyUpdate usually, but event adds one too
                },
                tick: (game) => {
                    // Ongoing effects, e.g., reduce energy production
                }
            },
            'earthquake': {
                name: 'Seismic Event',
                desc: 'Ground instability detected.',
                duration: 0, // Instant
                effect: (game) => {
                    this.triggerEarthquake(game);
                }
            },
            'tremor': {
                name: 'Minor Tremor',
                desc: 'Small ground vibrations.',
                duration: 0,
                effect: (game) => {
                    game.notify("Minor tremor felt.", 'neutral');
                    if (game.camera) {
                        // mild cam shake effect placeholder
                    }
                }
            }
        };
    }

    dailyUpdate(day) {
        // Check for new disasters if enough time passed
        if (day - this.lastDisasterDay > 10) { // Cooldown
            if (Math.random() < this.disasterChance) {
                this.triggerRandomDisaster();
                this.lastDisasterDay = day;
            }
        }

        // Update active disasters
        this.activeDisasters = this.activeDisasters.filter(d => {
            d.daysLeft--;
            if (d.def.tick) d.def.tick(this.game);
            return d.daysLeft > 0;
        });
    }

    triggerRandomDisaster() {
        const keys = Object.keys(this.events);
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        this.triggerEvent(randKey);
    }

    triggerEvent(type) {
        const def = this.events[type];
        if (!def) return;

        this.game.notify(`ALERT: ${def.name} - ${def.desc}`, 'error');

        if (def.effect) def.effect(this.game);

        if (def.duration > 0) {
            this.activeDisasters.push({
                type: type,
                def: def,
                daysLeft: def.duration
            });
        }
    }

    triggerEarthquake(game) {
        // Deform terrain at a random location
        // We need access to the voxel system
        if (!game.voxelTerrain) return;

        // Pick a random spot near the center/player
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;

        game.notify(`Creating seismic disruption at ${x.toFixed(0)}, ${z.toFixed(0)}`, 'warning');

        // "Dig" a crater or "Raise" a spike
        // Using the existing tool logic if possible, or direct modification
        // Since voxelTerrain.modifyTerrain expects vector/brush, we simulate it

        const radius = 10 + Math.random() * 10;
        const strength = -0.5; // Crater

        const point = new THREE.Vector3(x, 0, z); // Assuming planet surface approx 0 or handled by raycast
        // Actually, voxel system relies on raycast usually, but we can try to find height
        // For now, let's just assume simple deformation if we have access

        if (game.voxelTerrain && game.voxelTerrain.applyBrush) {
            game.voxelTerrain.applyBrush(point, strength, radius);
            // Particles handled by applyBrush
        }
    }
}

window.DisasterManager = DisasterManager;
