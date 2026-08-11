/**
 * Tactical Combat System
 * A Newtonian physics-based space combat engine.
 * Features:
 * - Inertia-based movement (ships drift).
 * - Vector math for thrust and trajectories.
 * - Weapon systems (Lasers, Missiles).
 * - Fleet management.
 */

if (typeof Vector2 === 'undefined') {
    class Vector2 {
        constructor(x, y) { this.x = x; this.y = y; }
        add(v) { this.x += v.x; this.y += v.y; return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; return this; }
        mult(s) { this.x *= s; this.y *= s; return this; }
        mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        normalize() {
            const m = this.mag();
            if (m > 0) this.mult(1 / m);
            return this;
        }
        clone() { return new Vector2(this.x, this.y); }
    }
    window.Vector2 = Vector2;
} else {
    // If it exists, retrieve it from window if globally assigned
    // Or just rely on it being there.
}

if (typeof Ship === 'undefined') {
    class Ship {
        constructor(id, type, x, y, faction) {
            this.id = id;
            this.type = type; // 'Frigate', 'Cruiser', 'Interceptor'
            this.faction = faction; // 'Player', 'Enemy'

            // Physics
            this.pos = new Vector2(x, y);
            this.vel = new Vector2(0, 0);
            this.acc = new Vector2(0, 0);
            this.rotation = 0; // Radians

            // Stats
            this.hp = 100;
            this.maxHp = 100;
            this.shield = 50;
            this.maxShield = 50;

            // Config
            this.thrustPower = 0.5;
            this.turnSpeed = 0.05;
            this.drag = 0.99;

            // EWAR State
            this.ewar = {
                web: 0,      // Speed reduction factor (0-1)
                scram: false, // Disables warp/jump
                damp: 0      // Tracking penalty
            };
        }

        applyForce(force) {
            this.acc.add(force);
        }

        update() {
            // Apply EWAR penalties to physics
            const effectiveThrust = this.thrustPower * (1 - this.ewar.web);
            const effectiveDrag = this.drag * (1 - this.ewar.web * 0.1);

            // Apply Physics
            this.vel.add(this.acc);
            this.vel.mult(effectiveDrag); // Damping
            this.pos.add(this.vel);
            this.acc.mult(0); // Reset acceleration

            // Shield regen
            if (this.shield < this.maxShield) this.shield += 0.05;

            // Decay EWAR effects over time (simple implementation)
            if (this.ewar.web > 0) this.ewar.web -= 0.001;
            if (this.ewar.web < 0) this.ewar.web = 0;
        }

        thrust() {
            const force = new Vector2(Math.cos(this.rotation), Math.sin(this.rotation));
            const effectiveThrust = this.thrustPower * (1 - this.ewar.web);
            force.mult(effectiveThrust);
            this.applyForce(force);
        }

        rotate(dir) {
            const effectiveTurn = this.turnSpeed * (1 - this.ewar.web * 0.5);
            this.rotation += effectiveTurn * dir;
        }
    }
    window.Ship = Ship;
}

if (typeof TacticalCombatSystem === 'undefined') {
    window.TacticalCombatSystem = class TacticalCombatSystem {
        constructor() {
            this.activeBattle = false;
            this.ships = [];
            this.projectiles = [];
            this.canvas = null;
            this.ctx = null;
            this.loopId = null;
            this.keys = {};

            this.init();
        }

        init() {
            console.log('⚔️ Tactical Combat System Initialized');
        }

        startBattle(planetName) {
            if (this.activeBattle) return;

            console.log(`⚔️ Deploying fleet to ${planetName}...`);
            this.activeBattle = true;
            this.ships = [];
            this.projectiles = [];

            this.createOverlay();

            // Spawn Player Fleet
            this.spawnShip('Player_1', 'Cruiser', 200, 300, 'Player');
            this.spawnShip('Player_2', 'Interceptor', 150, 350, 'Player');

            // Spawn Enemy Fleet
            this.spawnShip('Enemy_1', 'Frigate', 600, 300, 'Enemy');
            this.ships[2].rotation = Math.PI; // Face player

            this.loop();
        }

        spawnShip(id, type, x, y, faction) {
            const ship = new Ship(id, type, x, y, faction);
            this.ships.push(ship);
        }

        createOverlay() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'combat-overlay';
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.canvas.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:9000; pointer-events:auto; background:rgba(0,0,0,0.2);';

            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            // Close Button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = 'RETREAT';
            closeBtn.style.cssText = 'position:absolute; top:20px; right:20px; z-index:9001; padding:10px 20px; background:red; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;';
            closeBtn.onclick = () => this.endBattle();
            document.body.appendChild(closeBtn);
            this.closeBtn = closeBtn;

            // Input Handling
            this.keys = {};
            window.addEventListener('keydown', e => this.keys[e.code] = true);
            window.addEventListener('keyup', e => this.keys[e.code] = false);

            // Resize
            window.addEventListener('resize', () => {
                if (this.canvas) {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight;
                }
            });
        }

        endBattle() {
            this.activeBattle = false;
            cancelAnimationFrame(this.loopId);
            if (this.canvas) this.canvas.remove();
            if (this.closeBtn) this.closeBtn.remove();
            console.log('🏳️ Fleet retreated.');
        }

        update() {
            // Player Input (Control first ship)
            const playerShip = this.ships.find(s => s.faction === 'Player');
            if (playerShip) {
                if (this.keys['ArrowUp'] || this.keys['KeyW']) playerShip.thrust();
                if (this.keys['ArrowLeft'] || this.keys['KeyA']) playerShip.rotate(-1);
                if (this.keys['ArrowRight'] || this.keys['KeyD']) playerShip.rotate(1);
                if (this.keys['Space']) this.fireWeapon(playerShip);
            }

            // AI (Simple pursuit)
            this.ships.filter(s => s.faction === 'Enemy').forEach(enemy => {
                const target = this.ships.find(s => s.faction === 'Player');
                if (target) {
                    // Aim at target
                    const dx = target.pos.x - enemy.pos.x;
                    const dy = target.pos.y - enemy.pos.y;
                    const angle = Math.atan2(dy, dx);

                    // Turn towards
                    const diff = angle - enemy.rotation;
                    // Normalize angle
                    // Simple AI turn
                    if (Math.abs(diff) > 0.1) enemy.rotate(Math.sign(diff));

                    // Thrust if far
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 200) enemy.thrust();

                    // Fire if aligned
                    if (dist < 400 && Math.abs(diff) < 0.2 && Math.random() < 0.05) this.fireWeapon(enemy);
                }
            });

            // Update Physics
            this.ships.forEach(s => s.update());
            this.projectiles.forEach(p => {
                p.pos.add(p.vel);
                p.life--;
            });

            // Collisions
            this.checkCollisions();

            // EWAR Logic: Players can manifest Webifiers with 'E' key on closest enemy
            if (this.keys['KeyE']) {
                const playerShip = this.ships.find(s => s.faction === 'Player');
                const enemy = this.findClosestEnemy(playerShip);
                if (enemy && this.getDistance(playerShip, enemy) < 400) {
                    this.applyEWAR(playerShip, enemy, 'web');
                }
            }

            // Cleanup
            this.projectiles = this.projectiles.filter(p => p.life > 0);
            this.ships = this.ships.filter(s => s.hp > 0);
        }

        findClosestEnemy(source) {
            if (!source) return null;
            let closest = null;
            let minDist = Infinity;
            this.ships.filter(s => s.faction !== source.faction).forEach(enemy => {
                const dist = this.getDistance(source, enemy);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            });
            return closest;
        }

        getDistance(a, b) {
            const dx = a.pos.x - b.pos.x;
            const dy = a.pos.y - b.pos.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        applyEWAR(attacker, target, type) {
            if (type === 'web') {
                target.ewar.web = Math.min(0.9, target.ewar.web + 0.05); // Rapid stacking with decay
                // Add a visual localized pulse or beam logic could be added here
            }
        }

        fireWeapon(ship) {
            // Laser
            const vel = new Vector2(Math.cos(ship.rotation), Math.sin(ship.rotation));
            vel.mult(10);
            vel.add(ship.vel); // Add ship's velocity (Newtonian)

            this.projectiles.push({
                pos: ship.pos.clone(),
                vel: vel,
                life: 100,
                faction: ship.faction
            });
        }

        checkCollisions() {
            this.projectiles.forEach(p => {
                this.ships.forEach(s => {
                    if (s.faction !== p.faction) {
                        const dist = this.getDistance(s, p);
                        if (dist < 20) { // Hit
                            s.hp -= 10;
                            p.life = 0;
                        }
                    }
                });
            });
        }

        draw() {
            if (!this.ctx) return;

            // Clear
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw HUD
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Raleway';
            this.ctx.fillText(`Active Ships: ${this.ships.length}`, 20, 50);

            // Draw Ships
            this.ships.forEach(s => {
                this.ctx.save();
                this.ctx.translate(s.pos.x, s.pos.y);
                this.ctx.rotate(s.rotation);

                // Shield
                if (s.shield > 20) {
                    this.ctx.strokeStyle = `rgba(0, 100, 255, ${s.shield / 50})`;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                // WEB EWAR Indicator
                if (s.ewar.web > 0.1) {
                    this.ctx.strokeStyle = `rgba(245, 158, 11, ${s.ewar.web})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    this.ctx.lineWidth = 1;
                }

                // Body
                this.ctx.fillStyle = s.faction === 'Player' ? '#4caf50' : '#f44336';
                this.ctx.beginPath();
                this.ctx.moveTo(15, 0);
                this.ctx.lineTo(-10, 10);
                this.ctx.lineTo(-5, 0);
                this.ctx.lineTo(-10, -10);
                this.ctx.closePath();
                this.ctx.fill();

                // Thrust flame
                if (s.acc.mag() > 0.01) {
                    this.ctx.fillStyle = 'orange';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-10, 5);
                    this.ctx.lineTo(-20, 0);
                    this.ctx.lineTo(-10, -5);
                    this.ctx.fill();
                }

                this.ctx.restore();

                // HP Bar
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(s.pos.x - 15, s.pos.y - 30, 30, 4);
                this.ctx.fillStyle = 'green';
                this.ctx.fillRect(s.pos.x - 15, s.pos.y - 30, 30 * (s.hp / s.maxHp), 4);
            });

            // Draw Projectiles
            this.ctx.fillStyle = 'yellow';
            this.projectiles.forEach(p => {
                this.ctx.beginPath();
                this.ctx.arc(p.pos.x, p.pos.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        loop() {
            if (!this.activeBattle) return;
            this.update();
            this.draw();
            this.loopId = requestAnimationFrame(() => this.loop());
        }
    }
}

if (typeof window !== 'undefined') {
    window.TacticalCombatSystem = TacticalCombatSystem;
    window.tacticalCombatSystem = new TacticalCombatSystem();
}
