/**
 * ⚔️ NEWTONIAN COMBAT SYSTEM
 * Era II: The Living Cosmos - Advanced Planetary Engines
 * 
 * Space battles using true Newtonian physics with gravity wells,
 * light-lag mechanics, and orbital dynamics.
 */

import * as THREE from 'three';

const G = 6.674e-11; // Gravitational constant
const LIGHT_SPEED = 299792458; // Speed of light in m/s
const SCALE_FACTOR = 1000; // Scale factor for game physics

class NewtonianCombatSystem {
    constructor(game) {
        this.game = game;
        this.ships = new Map();
        this.projectiles = new Map();
        this.gravityWells = new Map();
        this.combatZones = new Map();
        
        this.lightLagEnabled = true;
        this.gravityEnabled = true;
        this.maxLightLag = 5.0; // Maximum light lag in seconds
        
        this.combatLog = [];
        this.damageEvents = [];
        
        this.physicsStep = 0.016;
        this.simulationTime = 0;
        
        console.log('⚔️ Newtonian Combat System: Initialized');
    }

    /**
     * Initialize the combat system
     */
    initialize() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.game.events.on('ship_fired', this.handleShipFired.bind(this));
        this.game.events.on('projectile_hit', this.handleProjectileHit.bind(this));
        this.game.events.on('ship_destroyed', this.handleShipDestroyed.bind(this));
    }

    /**
     * Register a ship in the combat system
     */
    registerShip(shipId, shipData) {
        const ship = {
            id: shipId,
            position: new THREE.Vector3().copy(shipData.position),
            velocity: new THREE.Vector3().copy(shipData.velocity || new THREE.Vector3()),
            rotation: new THREE.Quaternion().copy(shipData.rotation || new THREE.Quaternion()),
            angularVelocity: new THREE.Vector3().copy(shipData.angularVelocity || new THREE.Vector3()),
            mass: shipData.mass || 10000,
            thrust: shipData.thrust || 50000,
            maxSpeed: shipData.maxSpeed || 1000,
            turnRate: shipData.turnRate || 1.0,
            health: shipData.health || 100,
            maxHealth: shipData.maxHealth || 100,
            shields: shipData.shields || 0,
            maxShields: shipData.maxShields || 50,
            weapons: shipData.weapons || [],
            owner: shipData.owner || 'neutral',
            lastFired: new Map(),
            target: null,
            combatState: 'idle'
        };
        
        this.ships.set(shipId, ship);
        return ship;
    }

    /**
     * Register a gravity well (planet, star, black hole)
     */
    registerGravityWell(id, data) {
        const well = {
            id,
            position: new THREE.Vector3().copy(data.position),
            mass: data.mass,
            radius: data.radius,
            type: data.type || 'planet',
            eventHorizon: data.eventHorizon || 0
        };
        
        this.gravityWells.set(id, well);
        return well;
    }

    /**
     * Fire a weapon from a ship
     */
    fireWeapon(shipId, weaponIndex, targetPosition = null) {
        const ship = this.ships.get(shipId);
        if (!ship) return null;
        
        const weapon = ship.weapons[weaponIndex];
        if (!weapon) return null;
        
        const now = this.simulationTime;
        const lastFired = ship.lastFired.get(weaponIndex) || 0;
        
        if (now - lastFired < weapon.cooldown) {
            return null;
        }
        
        ship.lastFired.set(weaponIndex, now);
        
        // Calculate firing direction
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(ship.rotation);
        
        // Add weapon spread
        if (weapon.spread > 0) {
            direction.x += (Math.random() - 0.5) * weapon.spread;
            direction.y += (Math.random() - 0.5) * weapon.spread;
            direction.z += (Math.random() - 0.5) * weapon.spread;
            direction.normalize();
        }
        
        // Create projectile
        const projectileId = `projectile_${Date.now()}_${Math.random()}`;
        const projectile = {
            id: projectileId,
            type: weapon.type,
            position: ship.position.clone().add(direction.clone().multiplyScalar(10)),
            velocity: ship.velocity.clone().add(direction.clone().multiplyScalar(weapon.speed)),
            damage: weapon.damage,
            range: weapon.range,
            lifetime: weapon.range / weapon.speed,
            owner: ship.owner,
            sourceShip: shipId,
            targetPosition: targetPosition ? new THREE.Vector3().copy(targetPosition) : null,
            creationTime: now,
            trail: []
        };
        
        this.projectiles.set(projectileId, projectile);
        
        // Emit event
        this.game.events.emit('weapon_fired', {
            shipId,
            weaponIndex,
            projectileId,
            position: projectile.position.clone(),
            direction: direction.clone()
        });
        
        return projectileId;
    }

    /**
     * Handle ship fired event
     */
    handleShipFired(event) {
        this.fireWeapon(event.shipId, event.weaponIndex, event.targetPosition);
    }

    /**
     * Handle projectile hit event
     */
    handleProjectileHit(event) {
        const projectile = this.projectiles.get(event.projectileId);
        if (!projectile) return;
        
        const targetShip = this.ships.get(event.targetShipId);
        if (!targetShip) return;
        
        // Apply damage
        this.applyDamage(targetShip, projectile.damage, projectile.owner);
        
        // Remove projectile
        this.projectiles.delete(event.projectileId);
        
        // Log hit
        this.combatLog.push({
            time: this.simulationTime,
            type: 'hit',
            source: projectile.sourceShip,
            target: event.targetShipId,
            damage: projectile.damage,
            position: event.position.clone()
        });
    }

    /**
     * Handle ship destroyed event
     */
    handleShipDestroyed(event) {
        const ship = this.ships.get(event.shipId);
        if (!ship) return;
        
        // Create explosion
        this.createExplosion(ship.position, ship.mass);
        
        // Remove ship
        this.ships.delete(event.shipId);
        
        // Log destruction
        this.combatLog.push({
            time: this.simulationTime,
            type: 'destroyed',
            shipId: event.shipId,
            position: ship.position.clone(),
            killer: event.killer
        });
    }

    /**
     * Apply damage to a ship
     */
    applyDamage(ship, damage, source) {
        // Shields absorb damage first
        if (ship.shields > 0) {
            const shieldDamage = Math.min(ship.shields, damage);
            ship.shields -= shieldDamage;
            damage -= shieldDamage;
        }
        
        // Apply remaining damage to hull
        ship.health -= damage;
        
        this.damageEvents.push({
            time: this.simulationTime,
            target: ship.id,
            damage,
            source,
            remainingHealth: ship.health
        });
        
        // Check if ship is destroyed
        if (ship.health <= 0) {
            this.game.events.emit('ship_destroyed', {
                shipId: ship.id,
                killer: source
            });
        }
        
        this.game.events.emit('ship_damaged', {
            shipId: ship.id,
            damage,
            source,
            health: ship.health,
            shields: ship.shields
        });
    }

    /**
     * Create explosion effect
     */
    createExplosion(position, intensity) {
        const particleCount = Math.floor(50 * (intensity / 10000));
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            velocities.push({
                direction,
                speed: Math.random() * 100 + 50
            });
            
            // Fire colors (orange, yellow, red)
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.5; colors[i * 3 + 2] = 0.0;
            } else if (colorChoice < 0.66) {
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.0;
            } else {
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.0; colors[i * 3 + 2] = 0.0;
            }
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const explosion = new THREE.Points(geometry, material);
        explosion.userData.velocities = velocities;
        explosion.userData.life = 1.0;
        explosion.userData.maxLife = 1.0;
        
        this.game.scene.add(explosion);
        
        return explosion;
    }

    /**
     * Calculate gravitational force at position
     */
    calculateGravity(position, mass) {
        if (!this.gravityEnabled) return new THREE.Vector3(0, 0, 0);
        
        const totalForce = new THREE.Vector3(0, 0, 0);
        
        for (const well of this.gravityWells.values()) {
            const direction = new THREE.Vector3().subVectors(well.position, position);
            const distance = direction.length();
            
            // Avoid singularity
            if (distance < well.radius) continue;
            
            // F = G * m1 * m2 / r^2
            const forceMagnitude = (G * well.mass * mass) / (distance * distance);
            direction.normalize().multiplyScalar(forceMagnitude * SCALE_FACTOR);
            
            totalForce.add(direction);
        }
        
        return totalForce;
    }

    /**
     * Calculate light lag between two positions
     */
    calculateLightLag(position1, position2) {
        if (!this.lightLagEnabled) return 0;
        
        const distance = position1.distanceTo(position2);
        const lightLag = distance / (LIGHT_SPEED / SCALE_FACTOR);
        
        return Math.min(lightLag, this.maxLightLag);
    }

    /**
     * Update ship physics
     */
    updateShipPhysics(ship, deltaTime) {
        // Apply gravity
        const gravityForce = this.calculateGravity(ship.position, ship.mass);
        const gravityAcceleration = gravityForce.divideScalar(ship.mass);
        ship.velocity.add(gravityAcceleration.multiplyScalar(deltaTime));
        
        // Apply thrust if ship is accelerating
        if (ship.thrusting) {
            const thrustDirection = new THREE.Vector3(0, 0, 1);
            thrustDirection.applyQuaternion(ship.rotation);
            
            const thrustForce = thrustDirection.multiplyScalar(ship.thrust);
            const thrustAcceleration = thrustForce.divideScalar(ship.mass);
            ship.velocity.add(thrustAcceleration.multiplyScalar(deltaTime));
        }
        
        // Limit speed
        const speed = ship.velocity.length();
        if (speed > ship.maxSpeed) {
            ship.velocity.normalize().multiplyScalar(ship.maxSpeed);
        }
        
        // Apply drag (very low in space)
        ship.velocity.multiplyScalar(0.999);
        
        // Update position
        ship.position.add(ship.velocity.clone().multiplyScalar(deltaTime));
        
        // Update rotation
        if (ship.turning) {
            ship.angularVelocity.multiplyScalar(deltaTime);
            const rotationChange = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    ship.angularVelocity.x * deltaTime,
                    ship.angularVelocity.y * deltaTime,
                    ship.angularVelocity.z * deltaTime
                )
            );
            ship.rotation.multiply(rotationChange);
        }
        
        // Dampen angular velocity
        ship.angularVelocity.multiplyScalar(0.95);
    }

    /**
     * Update projectile physics
     */
    updateProjectilePhysics(projectile, deltaTime) {
        // Apply gravity (affects trajectory)
        const gravityForce = this.calculateGravity(projectile.position, 100);
        projectile.velocity.add(gravityForce.multiplyScalar(deltaTime));
        
        // Update position
        projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
        
        // Update trail
        projectile.trail.push(projectile.position.clone());
        if (projectile.trail.length > 50) {
            projectile.trail.shift();
        }
        
        // Check lifetime
        projectile.lifetime -= deltaTime;
        if (projectile.lifetime <= 0) {
            this.projectiles.delete(projectile.id);
            return false;
        }
        
        // Check for collisions with ships
        for (const [shipId, ship] of this.ships) {
            if (ship.owner === projectile.owner) continue; // Don't hit own ships
            
            const distance = projectile.position.distanceTo(ship.position);
            if (distance < 10) { // Hit radius
                this.game.events.emit('projectile_hit', {
                    projectileId: projectile.id,
                    targetShipId: shipId,
                    position: projectile.position.clone()
                });
                return false;
            }
        }
        
        // Check for collisions with gravity wells
        for (const well of this.gravityWells.values()) {
            const distance = projectile.position.distanceTo(well.position);
            if (distance < well.radius) {
                this.projectiles.delete(projectile.id);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Update AI targeting with light lag
     */
    updateAITargeting(ship, deltaTime) {
        if (!ship.target || !ship.aiEnabled) return;
        
        const targetShip = this.ships.get(ship.target);
        if (!targetShip) {
            ship.target = null;
            return;
        }
        
        // Calculate light lag
        const lightLag = this.calculateLightLag(ship.position, targetShip.position);
        
        // Predict target position at time of impact
        const predictedPosition = targetShip.position.clone().add(
            targetShip.velocity.clone().multiplyScalar(lightLag)
        );
        
        // Calculate firing solution
        const toTarget = new THREE.Vector3().subVectors(predictedPosition, ship.position);
        const distance = toTarget.length();
        
        // Check if in range
        const weapon = ship.weapons[0];
        if (weapon && distance < weapon.range) {
            // Aim at predicted position
            const targetDirection = toTarget.normalize();
            const currentDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(ship.rotation);
            
            // Calculate angle to target
            const angle = currentDirection.angleTo(targetDirection);
            
            // If aimed, fire
            if (angle < 0.1) {
                this.fireWeapon(ship.id, 0, predictedPosition);
            }
        }
    }

    /**
     * Update simulation
     */
    update(deltaTime) {
        this.simulationTime += deltaTime;
        
        // Update ships
        for (const ship of this.ships.values()) {
            this.updateShipPhysics(ship, deltaTime);
            this.updateAITargeting(ship, deltaTime);
            
            // Regenerate shields slowly
            if (ship.shields < ship.maxShields) {
                ship.shields = Math.min(ship.maxShields, ship.shields + deltaTime * 5);
            }
        }
        
        // Update projectiles
        for (const projectile of this.projectiles.values()) {
            this.updateProjectilePhysics(projectile, deltaTime);
        }
    }

    /**
     * Get ship data for rendering
     */
    getShipRenderData(shipId) {
        const ship = this.ships.get(shipId);
        if (!ship) return null;
        
        return {
            position: ship.position.clone(),
            rotation: ship.rotation.clone(),
            velocity: ship.velocity.clone(),
            health: ship.health,
            maxHealth: ship.maxHealth,
            shields: ship.shields,
            maxShields: ship.maxShields
        };
    }

    /**
     * Get projectile data for rendering
     */
    getProjectileRenderData() {
        const data = [];
        
        for (const projectile of this.projectiles.values()) {
            data.push({
                position: projectile.position.clone(),
                trail: projectile.trail.map(p => p.clone()),
                type: projectile.type,
                owner: projectile.owner
            });
        }
        
        return data;
    }

    /**
     * Get combat log
     */
    getCombatLog(since = 0) {
        return this.combatLog.filter(entry => entry.time >= since);
    }

    /**
     * Set ship thrust
     */
    setShipThrust(shipId, thrusting) {
        const ship = this.ships.get(shipId);
        if (ship) {
            ship.thrusting = thrusting;
        }
    }

    /**
     * Set ship turning
     */
    setShipTurning(shipId, angularVelocity) {
        const ship = this.ships.get(shipId);
        if (ship) {
            ship.angularVelocity.copy(angularVelocity);
            ship.turning = true;
        }
    }

    /**
     * Set ship target
     */
    setShipTarget(shipId, targetId) {
        const ship = this.ships.get(shipId);
        if (ship) {
            ship.target = targetId;
        }
    }

    /**
     * Enable/disable light lag
     */
    setLightLagEnabled(enabled) {
        this.lightLagEnabled = enabled;
    }

    /**
     * Enable/disable gravity
     */
    setGravityEnabled(enabled) {
        this.gravityEnabled = enabled;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.ships.clear();
        this.projectiles.clear();
        this.gravityWells.clear();
        this.combatLog = [];
        this.damageEvents = [];
    }
}

export default NewtonianCombatSystem;
