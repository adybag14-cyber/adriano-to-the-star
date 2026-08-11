/**
 * 🌊 FLUID DYNAMICS SYSTEM
 * Era II: The Living Cosmos - Advanced Planetary Engines
 * 
 * Real-time water/ocean physics and weather patterns simulation.
 * Includes wave propagation, buoyancy, currents, and atmospheric effects.
 */

import * as THREE from 'three';

class FluidDynamicsSystem {
    constructor(game) {
        this.game = game;
        this.waterMeshes = new Map();
        this.particles = [];
        this.weatherState = {
            temperature: 20,
            humidity: 50,
            windSpeed: 5,
            windDirection: new THREE.Vector3(1, 0, 0),
            precipitation: 0,
            cloudCover: 0.3,
            pressure: 1013
        };
        
        this.waveParameters = {
            amplitude: 2.0,
            frequency: 0.5,
            speed: 1.0,
            direction: new THREE.Vector3(1, 0, 0.5)
        };
        
        this.time = 0;
        this.simulationStep = 0.016;
        this.gridSize = 128;
        this.cellSize = 2.0;
        
        this.velocityField = [];
        this.heightField = [];
        this.temperatureField = [];
        
        this.materials = {
            water: new THREE.MeshStandardMaterial({
                color: 0x0077be,
                transparent: true,
                opacity: 0.8,
                roughness: 0.1,
                metalness: 0.3,
                side: THREE.DoubleSide
            }),
            foam: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6,
                roughness: 1.0
            }),
            rain: new THREE.PointsMaterial({
                color: 0xaaaaaa,
                size: 0.1,
                transparent: true,
                opacity: 0.6
            }),
            snow: new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.15,
                transparent: true,
                opacity: 0.8
            })
        };
        
        this.clouds = [];
        this.lightningEnabled = false;
        
        console.log('🌊 Fluid Dynamics System: Initialized');
    }

    /**
     * Initialize the fluid dynamics system
     */
    initialize() {
        this.initializeFields();
        this.createWaterMeshes();
        this.createWeatherParticles();
        this.createClouds();
    }

    /**
     * Initialize simulation fields
     */
    initializeFields() {
        for (let i = 0; i < this.gridSize; i++) {
            this.velocityField[i] = [];
            this.heightField[i] = [];
            this.temperatureField[i] = [];
            
            for (let j = 0; j < this.gridSize; j++) {
                this.velocityField[i][j] = {
                    x: 0,
                    y: 0,
                    z: 0
                };
                this.heightField[i][j] = 0;
                this.temperatureField[i][j] = this.weatherState.temperature;
            }
        }
    }

    /**
     * Create water meshes for oceans and lakes
     */
    createWaterMeshes() {
        const oceanGeometry = new THREE.PlaneGeometry(500, 500, this.gridSize - 1, this.gridSize - 1);
        oceanGeometry.rotateX(-Math.PI / 2);
        
        const ocean = new THREE.Mesh(oceanGeometry, this.materials.water);
        ocean.position.y = 0;
        ocean.receiveShadow = true;
        ocean.name = 'ocean';
        
        this.game.scene.add(ocean);
        this.waterMeshes.set('ocean', ocean);
        
        // Store original positions for wave animation
        ocean.userData.originalPositions = oceanGeometry.attributes.position.array.slice();
    }

    /**
     * Create weather particles (rain/snow)
     */
    createWeatherParticles() {
        const rainGeometry = new THREE.BufferGeometry();
        const rainCount = 10000;
        const positions = new Float32Array(rainCount * 3);
        const velocities = new Float32Array(rainCount * 3);
        
        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
            
            velocities[i * 3] = this.weatherState.windDirection.x * 2;
            velocities[i * 3 + 1] = -10 - Math.random() * 5;
            velocities[i * 3 + 2] = this.weatherState.windDirection.z * 2;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        rainGeometry.userData.velocities = velocities;
        
        this.rainSystem = new THREE.Points(rainGeometry, this.materials.rain);
        this.rainSystem.visible = false;
        this.game.scene.add(this.rainSystem);
    }

    /**
     * Create cloud system
     */
    createClouds() {
        const cloudCount = 20;
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createCloud();
            cloud.position.set(
                (Math.random() - 0.5) * 400,
                50 + Math.random() * 30,
                (Math.random() - 0.5) * 400
            );
            cloud.userData.speed = 0.5 + Math.random() * 0.5;
            cloud.userData.direction = new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize();
            
            this.clouds.push(cloud);
            this.game.scene.add(cloud);
        }
    }

    /**
     * Create a single cloud
     */
    createCloud() {
        const group = new THREE.Group();
        const puffCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < puffCount; i++) {
            const puffGeometry = new THREE.SphereGeometry(
                5 + Math.random() * 5,
                8, 8
            );
            const puffMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                roughness: 1.0
            });
            
            const puff = new THREE.Mesh(puffGeometry, puffMaterial);
            puff.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 15
            );
            
            group.add(puff);
        }
        
        return group;
    }

    /**
     * Update simulation
     */
    update(deltaTime) {
        this.time += deltaTime;
        this.updateWaves(deltaTime);
        this.updateFluidDynamics(deltaTime);
        this.updateWeather(deltaTime);
        this.updateClouds(deltaTime);
        this.updatePrecipitation(deltaTime);
    }

    /**
     * Update wave animation
     */
    updateWaves(deltaTime) {
        for (const [name, mesh] of this.waterMeshes) {
            const positions = mesh.geometry.attributes.position;
            const original = mesh.userData.originalPositions;
            
            for (let i = 0; i < positions.count; i++) {
                const x = original[i * 3];
                const z = original[i * 3 + 2];
                
                // Gerstner wave simulation
                const wave1 = this.calculateGerstnerWave(
                    x, z, this.time,
                    1.0, 2.0, 0.5, new THREE.Vector3(1, 0, 0.3)
                );
                const wave2 = this.calculateGerstnerWave(
                    x, z, this.time * 1.3,
                    0.5, 1.5, 0.7, new THREE.Vector3(0.5, 0, 1)
                );
                const wave3 = this.calculateGerstnerWave(
                    x, z, this.time * 0.7,
                    0.3, 1.0, 0.9, new THREE.Vector3(-0.3, 0, 0.7)
                );
                
                positions.setY(i, wave1 + wave2 + wave3);
            }
            
            positions.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
        }
    }

    /**
     * Calculate Gerstner wave height at position
     */
    calculateGerstnerWave(x, z, time, amplitude, wavelength, speed, direction) {
        const k = (2 * Math.PI) / wavelength;
        const c = speed / k;
        const phase = k * (x * direction.x + z * direction.z) - c * time;
        
        return amplitude * Math.sin(phase);
    }

    /**
     * Update fluid dynamics simulation
     */
    updateFluidDynamics(deltaTime) {
        const newVelocityField = JSON.parse(JSON.stringify(this.velocityField));
        const newHeightField = JSON.parse(JSON.stringify(this.heightField));
        
        // Advection step
        for (let i = 1; i < this.gridSize - 1; i++) {
            for (let j = 1; j < this.gridSize - 1; j++) {
                const vel = this.velocityField[i][j];
                
                // Simple upwind scheme for advection
                const backX = i - Math.sign(vel.x);
                const backZ = j - Math.sign(vel.z);
                
                if (backX >= 0 && backX < this.gridSize && 
                    backZ >= 0 && backZ < this.gridSize) {
                    newVelocityField[i][j].x = this.velocityField[backX][j].x;
                    newVelocityField[i][j].z = this.velocityField[i][backZ].z;
                }
            }
        }
        
        // Apply wind influence
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                newVelocityField[i][j].x += 
                    (this.weatherState.windDirection.x * this.weatherState.windSpeed - 
                     newVelocityField[i][j].x) * 0.01;
                newVelocityField[i][j].z += 
                    (this.weatherState.windDirection.z * this.weatherState.windSpeed - 
                     newVelocityField[i][j].z) * 0.01;
            }
        }
        
        // Wave propagation (simplified shallow water equations)
        for (let i = 1; i < this.gridSize - 1; i++) {
            for (let j = 1; j < this.gridSize - 1; j++) {
                const laplacian = (
                    this.heightField[i + 1][j] +
                    this.heightField[i - 1][j] +
                    this.heightField[i][j + 1] +
                    this.heightField[i][j - 1] -
                    4 * this.heightField[i][j]
                );
                
                newHeightField[i][j] += laplacian * 0.1;
                newHeightField[i][j] *= 0.99; // Damping
            }
        }
        
        this.velocityField = newVelocityField;
        this.heightField = newHeightField;
    }

    /**
     * Update weather state
     */
    updateWeather(deltaTime) {
        // Slowly evolve weather parameters
        this.weatherState.temperature += (Math.random() - 0.5) * 0.01;
        this.weatherState.humidity += (Math.random() - 0.5) * 0.05;
        this.weatherState.pressure += (Math.random() - 0.5) * 0.1;
        
        // Clamp values
        this.weatherState.temperature = Math.max(-20, Math.min(50, this.weatherState.temperature));
        this.weatherState.humidity = Math.max(0, Math.min(100, this.weatherState.humidity));
        this.weatherState.pressure = Math.max(980, Math.min(1040, this.weatherState.pressure));
        
        // Update wind
        const windChange = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
        );
        this.weatherState.windDirection.add(windChange).normalize();
        this.weatherState.windSpeed = Math.max(0, Math.min(30, 
            this.weatherState.windSpeed + (Math.random() - 0.5) * 0.1));
        
        // Determine precipitation based on humidity and pressure
        if (this.weatherState.humidity > 80 && this.weatherState.pressure < 1000) {
            this.weatherState.precipitation = Math.min(1, this.weatherState.precipitation + 0.01);
        } else {
            this.weatherState.precipitation = Math.max(0, this.weatherState.precipitation - 0.01);
        }
        
        // Update cloud cover
        this.weatherState.cloudCover = Math.max(0, Math.min(1, 
            this.weatherState.humidity / 100 + this.weatherState.precipitation * 0.5));
    }

    /**
     * Update cloud positions
     */
    updateClouds(deltaTime) {
        for (const cloud of this.clouds) {
            cloud.position.add(
                cloud.userData.direction.clone()
                    .multiplyScalar(cloud.userData.speed * deltaTime)
            );
            
            // Wrap around
            if (cloud.position.x > 250) cloud.position.x = -250;
            if (cloud.position.x < -250) cloud.position.x = 250;
            if (cloud.position.z > 250) cloud.position.z = -250;
            if (cloud.position.z < -250) cloud.position.z = 250;
            
            // Adjust opacity based on cloud cover
            cloud.children.forEach(puff => {
                puff.material.opacity = 0.3 + this.weatherState.cloudCover * 0.5;
            });
        }
    }

    /**
     * Update precipitation particles
     */
    updatePrecipitation(deltaTime) {
        if (this.weatherState.precipitation > 0.1) {
            this.rainSystem.visible = true;
            
            const positions = this.rainSystem.geometry.attributes.position.array;
            const velocities = this.rainSystem.geometry.userData.velocities;
            
            // Determine rain vs snow based on temperature
            const isSnow = this.weatherState.temperature < 0;
            this.rainSystem.material = isSnow ? this.materials.snow : this.materials.rain;
            
            for (let i = 0; i < positions.length / 3; i++) {
                // Update position
                positions[i * 3] += velocities[i * 3] * deltaTime;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;
                
                // Reset if below ground
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3] = (Math.random() - 0.5) * 500;
                    positions[i * 3 + 1] = 100;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
                }
            }
            
            this.rainSystem.geometry.attributes.position.needsUpdate = true;
        } else {
            this.rainSystem.visible = false;
        }
    }

    /**
     * Calculate buoyancy force for an object
     */
    calculateBuoyancy(position, volume, density = 1000) {
        const waterLevel = 0;
        
        if (position.y < waterLevel) {
            const submergedDepth = waterLevel - position.y;
            const submergedVolume = Math.min(volume, submergedDepth * 10);
            const buoyancyForce = submergedVolume * density * 9.81;
            
            return new THREE.Vector3(0, buoyancyForce, 0);
        }
        
        return new THREE.Vector3(0, 0, 0);
    }

    /**
     * Calculate water drag force
     */
    calculateDrag(velocity, objectPosition, dragCoefficient = 0.5) {
        const waterLevel = 0;
        
        if (objectPosition.y < waterLevel) {
            const speed = velocity.length();
            const dragMagnitude = dragCoefficient * speed * speed;
            
            return velocity.clone().normalize().multiplyScalar(-dragMagnitude);
        }
        
        return new THREE.Vector3(0, 0, 0);
    }

    /**
     * Get water height at position
     */
    getWaterHeight(x, z) {
        const wave1 = this.calculateGerstnerWave(
            x, z, this.time,
            1.0, 2.0, 0.5, new THREE.Vector3(1, 0, 0.3)
        );
        const wave2 = this.calculateGerstnerWave(
            x, z, this.time * 1.3,
            0.5, 1.5, 0.7, new THREE.Vector3(0.5, 0, 1)
        );
        const wave3 = this.calculateGerstnerWave(
            x, z, this.time * 0.7,
            0.3, 1.0, 0.9, new THREE.Vector3(-0.3, 0, 0.7)
        );
        
        return wave1 + wave2 + wave3;
    }

    /**
     * Get water velocity at position
     */
    getWaterVelocity(x, z) {
        const gridX = Math.floor((x + 250) / this.cellSize);
        const gridZ = Math.floor((z + 250) / this.cellSize);
        
        if (gridX >= 0 && gridX < this.gridSize && 
            gridZ >= 0 && gridZ < this.gridSize) {
            const vel = this.velocityField[gridX][gridZ];
            return new THREE.Vector3(vel.x, 0, vel.z);
        }
        
        return new THREE.Vector3(0, 0, 0);
    }

    /**
     * Create splash effect at position
     */
    createSplash(position, intensity = 1.0) {
        const particleCount = Math.floor(20 * intensity);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            velocities.push({
                x: (Math.random() - 0.5) * 10,
                y: Math.random() * 10 + 5,
                z: (Math.random() - 0.5) * 10
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        const splash = new THREE.Points(geometry, material);
        splash.userData.velocities = velocities;
        splash.userData.life = 1.0;
        
        this.game.scene.add(splash);
        this.particles.push(splash);
        
        // Create wave disturbance
        const gridX = Math.floor((position.x + 250) / this.cellSize);
        const gridZ = Math.floor((position.z + 250) / this.cellSize);
        
        if (gridX >= 1 && gridX < this.gridSize - 1 && 
            gridZ >= 1 && gridZ < this.gridSize - 1) {
            this.heightField[gridX][gridZ] += intensity * 2;
        }
    }

    /**
     * Update particle effects
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.userData.velocities;
            
            for (let j = 0; j < velocities.length; j++) {
                positions[j * 3] += velocities[j].x * deltaTime;
                positions[j * 3 + 1] += velocities[j].y * deltaTime;
                positions[j * 3 + 2] += velocities[j].z * deltaTime;
                
                velocities[j].y -= 9.81 * deltaTime; // Gravity
            }
            
            particle.userData.life -= deltaTime;
            particle.material.opacity = particle.userData.life;
            
            if (particle.userData.life <= 0) {
                this.game.scene.remove(particle);
                particle.geometry.dispose();
                this.particles.splice(i, 1);
            } else {
                particle.geometry.attributes.position.needsUpdate = true;
            }
        }
    }

    /**
     * Trigger lightning effect
     */
    triggerLightning() {
        if (this.weatherState.precipitation < 0.5) return;
        
        const lightning = new THREE.PointLight(0xffffff, 10, 500);
        lightning.position.set(
            (Math.random() - 0.5) * 300,
            80,
            (Math.random() - 0.5) * 300
        );
        
        this.game.scene.add(lightning);
        
        // Flash effect
        setTimeout(() => {
            lightning.intensity = 0;
            this.game.scene.remove(lightning);
        }, 100);
        
        // Thunder sound (would need audio system)
        this.game.events.emit('thunder', {
            position: lightning.position,
            intensity: Math.random()
        });
    }

    /**
     * Get current weather state
     */
    getWeatherState() {
        return { ...this.weatherState };
    }

    /**
     * Set weather parameters
     */
    setWeather(params) {
        Object.assign(this.weatherState, params);
    }

    /**
     * Cleanup
     */
    dispose() {
        for (const mesh of this.waterMeshes.values()) {
            this.game.scene.remove(mesh);
            mesh.geometry.dispose();
        }
        this.waterMeshes.clear();
        
        for (const cloud of this.clouds) {
            this.game.scene.remove(cloud);
            cloud.children.forEach(puff => {
                puff.geometry.dispose();
                puff.material.dispose();
            });
        }
        this.clouds.clear();
        
        for (const particle of this.particles) {
            this.game.scene.remove(particle);
            particle.geometry.dispose();
        }
        this.particles.clear();
        
        if (this.rainSystem) {
            this.game.scene.remove(this.rainSystem);
            this.rainSystem.geometry.dispose();
        }
    }
}

export default FluidDynamicsSystem;
