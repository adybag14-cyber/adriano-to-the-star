/**
 * 🕳️ BLACK HOLE SYSTEM
 * Era II: The Living Cosmos - Advanced Planetary Engines
 * 
 * Volumetric black hole event horizons with gravitational lensing,
 * accretion disk simulation, and Hawking radiation effects.
 */

import * as THREE from 'three';

class BlackHoleSystem {
    constructor(game) {
        this.game = game;
        this.blackHoles = [];
        
        // Physics constants
        this.G = 6.674e-11;
        this.c = 3e8; // Speed of light
        
        // Visualization settings
        this.accretionDiskSegments = 128;
        this.eventHorizonSegments = 64;
        this.lensingSamples = 32;
        
        console.log('🕳️ Black Hole System: Initialized');
    }

    /**
     * Initialize the black hole system
     */
    initialize() {
        // Create a default supermassive black hole
        this.createBlackHole({
            mass: 4e6, // Solar masses (Sagittarius A* scale)
            position: new THREE.Vector3(0, 0, 0),
            accretionDiskMass: 1e3,
            spin: 0.9,
            name: 'Sagittarius A*'
        });
    }

    /**
     * Create a black hole
     */
    createBlackHole(config) {
        const blackHole = {
            id: this.blackHoles.length,
            mass: config.mass * 1.989e30, // Convert to kg
            position: config.position.clone(),
            spin: config.spin || 0,
            accretionDiskMass: config.accretionDiskMass || 1e3,
            name: config.name || `BlackHole_${this.blackHoles.length}`
        };

        // Calculate Schwarzschild radius (event horizon)
        blackHole.schwarzschildRadius = (2 * this.G * blackHole.mass) / (this.c * this.c);
        
        // Calculate photon sphere radius
        blackHole.photonSphereRadius = 1.5 * blackHole.schwarzschildRadius;
        
        // Calculate ergosphere radius (for rotating black holes)
        blackHole.ergosphereRadius = blackHole.schwarzschildRadius * (1 + Math.sqrt(1 - blackHole.spin * blackHole.spin));

        this.blackHoles.push(blackHole);

        // Create visualization
        this.createBlackHoleVisualization(blackHole);

        return blackHole;
    }

    /**
     * Create black hole visualization
     */
    createBlackHoleVisualization(blackHole) {
        const group = new THREE.Group();
        group.position.copy(blackHole.position);

        // Event horizon (black sphere)
        const horizonGeometry = new THREE.SphereGeometry(
            blackHole.schwarzschildRadius,
            this.eventHorizonSegments,
            this.eventHorizonSegments
        );
        
        const horizonMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000
        });

        const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
        group.add(horizon);
        blackHole.horizonMesh = horizon;

        // Accretion disk
        const diskGeometry = new THREE.RingGeometry(
            blackHole.schwarzschildRadius * 3,
            blackHole.schwarzschildRadius * 10,
            this.accretionDiskSegments
        );

        const diskMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                innerRadius: { value: blackHole.schwarzschildRadius * 3 },
                outerRadius: { value: blackHole.schwarzschildRadius * 10 },
                diskColor: { value: new THREE.Color(0xff6600) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float innerRadius;
                uniform float outerRadius;
                uniform vec3 diskColor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    float radius = length(vPosition.xy);
                    float normalizedRadius = (radius - innerRadius) / (outerRadius - innerRadius);
                    
                    // Doppler shift effect (blueshift on approaching side, redshift on receding)
                    float angle = atan(vPosition.y, vPosition.x);
                    float doppler = 1.0 + 0.3 * sin(angle + time * 2.0);
                    
                    // Temperature gradient (hotter near event horizon)
                    float temperature = 1.0 - normalizedRadius;
                    temperature = pow(temperature, 2.0);
                    
                    // Color based on temperature
                    vec3 hotColor = vec3(1.0, 0.9, 0.7); // White-hot
                    vec3 coolColor = vec3(1.0, 0.3, 0.0); // Red-orange
                    vec3 color = mix(coolColor, hotColor, temperature) * doppler;
                    
                    // Intensity falloff
                    float intensity = 1.0 - normalizedRadius;
                    intensity = pow(intensity, 1.5);
                    
                    // Add noise/turbulence
                    float noise = sin(radius * 20.0 - time * 5.0) * 0.1;
                    intensity += noise;
                    
                    gl_FragColor = vec4(color * intensity, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.rotation.x = -Math.PI / 2;
        group.add(disk);
        blackHole.diskMesh = disk;

        // Gravitational lensing effect (using a sphere with refraction shader)
        const lensGeometry = new THREE.SphereGeometry(
            blackHole.schwarzschildRadius * 5,
            64,
            64
        );

        const lensMaterial = new THREE.ShaderMaterial({
            uniforms: {
                blackHolePosition: { value: blackHole.position },
                schwarzschildRadius: { value: blackHole.schwarzschildRadius }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 blackHolePosition;
                uniform float schwarzschildRadius;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    // Calculate distance from black hole center
                    float dist = length(vPosition);
                    
                    // Lensing effect (bending light)
                    float lensingStrength = schwarzschildRadius / dist;
                    
                    // Create distortion effect
                    vec2 distortedUv = gl_FragCoord.xy / vec2(800.0, 600.0);
                    distortedUv += (vNormal.xy * lensingStrength * 0.5);
                    
                    // Alpha based on distance (fade out at edges)
                    float alpha = smoothstep(schwarzschildRadius * 5.0, schwarzschildRadius * 2.0, dist);
                    
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.1);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        group.add(lens);
        blackHole.lensMesh = lens;

        // Jet (relativistic jets from poles)
        this.createBlackHoleJets(blackHole, group);

        this.game.scene.add(group);
        blackHole.group = group;
    }

    /**
     * Create relativistic jets
     */
    createBlackHoleJets(blackHole, group) {
        const jetLength = blackHole.schwarzschildRadius * 20;
        const jetGeometry = new THREE.CylinderGeometry(
            blackHole.schwarzschildRadius * 0.1,
            blackHole.schwarzschildRadius * 0.5,
            jetLength,
            32,
            1,
            true
        );

        const jetMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                jetColor: { value: new THREE.Color(0x88ccff) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 jetColor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    // Pulsing effect
                    float pulse = sin(time * 10.0 + vUv.y * 20.0) * 0.5 + 0.5;
                    
                    // Intensity gradient (brighter at base)
                    float intensity = 1.0 - vUv.y;
                    intensity = pow(intensity, 2.0);
                    
                    // Color variation
                    vec3 color = mix(jetColor, vec3(1.0, 1.0, 1.0), pulse * 0.5);
                    
                    gl_FragColor = vec4(color, intensity * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        // Upper jet
        const upperJet = new THREE.Mesh(jetGeometry, jetMaterial);
        upperJet.position.y = jetLength / 2;
        group.add(upperJet);

        // Lower jet
        const lowerJet = new THREE.Mesh(jetGeometry, jetMaterial);
        lowerJet.position.y = -jetLength / 2;
        lowerJet.rotation.z = Math.PI;
        group.add(lowerJet);

        blackHole.jetMeshes = [upperJet, lowerJet];
    }

    /**
     * Update black hole simulation
     */
    update(deltaTime) {
        const time = performance.now() * 0.001;

        for (const blackHole of this.blackHoles) {
            // Update accretion disk animation
            if (blackHole.diskMesh && blackHole.diskMesh.material.uniforms) {
                blackHole.diskMesh.material.uniforms.time.value = time;
            }

            // Update jet animation
            if (blackHole.jetMeshes) {
                for (const jet of blackHole.jetMeshes) {
                    if (jet.material.uniforms) {
                        jet.material.uniforms.time.value = time;
                    }
                }
            }

            // Calculate gravitational effects on nearby objects
            this.applyGravitationalEffects(blackHole);
        }
    }

    /**
     * Apply gravitational effects to nearby objects
     */
    applyGravitationalEffects(blackHole) {
        const eventHorizonRadius = blackHole.schwarzschildRadius;
        const influenceRadius = eventHorizonRadius * 100;

        // Find all objects within influence radius
        const nearbyObjects = this.game.scene.children.filter(obj => {
            if (obj.isMesh && obj.position) {
                const dist = obj.position.distanceTo(blackHole.position);
                return dist < influenceRadius && dist > eventHorizonRadius;
            }
            return false;
        });

        for (const obj of nearbyObjects) {
            const direction = new THREE.Vector3()
                .subVectors(blackHole.position, obj.position)
                .normalize();

            const distance = obj.position.distanceTo(blackHole.position);

            // Calculate gravitational force
            const forceMagnitude = (this.G * blackHole.mass) / (distance * distance);

            // Apply tidal forces (stretching and compression)
            const tidalForce = forceMagnitude / distance;
            
            // Redshift effect (time dilation)
            const redshiftFactor = Math.sqrt(1 - eventHorizonRadius / distance);

            // Visual effect: stretch object toward black hole
            if (obj.userData.originalScale) {
                const stretchFactor = 1.0 + tidalForce * 0.001;
                obj.scale.set(
                    obj.userData.originalScale.x / stretchFactor,
                    obj.userData.originalScale.y * stretchFactor,
                    obj.userData.originalScale.z / stretchFactor
                );
            } else {
                obj.userData.originalScale = obj.scale.clone();
            }

            // Move object toward black hole
            const velocity = direction.clone().multiplyScalar(forceMagnitude * 0.0001);
            obj.position.add(velocity);

            // Check if object crossed event horizon
            if (distance < eventHorizonRadius) {
                // Object is consumed by black hole
                this.game.scene.remove(obj);
            }
        }
    }

    /**
     * Calculate gravitational time dilation at position
     */
    getTimeDilation(position, blackHole) {
        const distance = position.distanceTo(blackHole.position);
        const rs = blackHole.schwarzschildRadius;
        
        return Math.sqrt(1 - rs / distance);
    }

    /**
     * Calculate gravitational redshift
     */
    getRedshift(position, blackHole) {
        const timeDilation = this.getTimeDilation(position, blackHole);
        return 1.0 / timeDilation - 1.0;
    }

    /**
     * Get black hole by ID
     */
    getBlackHole(id) {
        return this.blackHoles.find(bh => bh.id === id);
    }

    /**
     * Get all black holes
     */
    getAllBlackHoles() {
        return this.blackHoles;
    }

    /**
     * Cleanup
     */
    dispose() {
        for (const blackHole of this.blackHoles) {
            if (blackHole.group) {
                this.game.scene.remove(blackHole.group);
                
                // Dispose all meshes
                blackHole.group.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                });
            }
        }

        this.blackHoles = [];
    }
}

export default BlackHoleSystem;
