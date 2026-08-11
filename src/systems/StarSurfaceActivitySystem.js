/**
 * ☀️ STAR SURFACE ACTIVITY SYSTEM
 * Era II: The Living Cosmos - Advanced Planetary Engines
 * 
 * Procedural star surface activity including flares, sunspots, coronal mass ejections,
 * and solar wind. Affects local solar weather and planetary environments.
 */

import * as THREE from 'three';

class StarSurfaceActivitySystem {
    constructor(game) {
        this.game = game;
        this.stars = [];
        
        // Activity parameters
        this.activityLevel = 0.5; // 0-1, affects frequency of events
        this.maxFlares = 10;
        this.maxSunspots = 20;
        this.maxCMEs = 5;
        
        // Solar wind parameters
        this.solarWindSpeed = 400; // km/s
        this.solarWindDensity = 5; // particles/cm³
        
        console.log('☀️ Star Surface Activity System: Initialized');
    }

    /**
     * Initialize the star surface activity system
     */
    initialize() {
        // Create a default star (sun-like)
        this.createStar({
            mass: 1.989e30,
            radius: 6.96e8,
            temperature: 5778,
            spectralType: 'G2V',
            position: new THREE.Vector3(0, 0, 0),
            name: 'Sol'
        });
    }

    /**
     * Create a star
     */
    createStar(config) {
        const star = {
            id: this.stars.length,
            mass: config.mass,
            radius: config.radius,
            temperature: config.temperature,
            spectralType: config.spectralType,
            position: config.position.clone(),
            name: config.name || `Star_${this.stars.length}`,
            flares: [],
            sunspots: [],
            cmes: [],
            magneticField: this.generateMagneticField(),
            rotationPeriod: 25.4 * 24 * 3600, // 25.4 days in seconds
            rotationAngle: 0
        };

        this.stars.push(star);

        // Create visualization
        this.createStarVisualization(star);

        // Initialize sunspots
        this.generateSunspots(star);

        return star;
    }

    /**
     * Generate magnetic field configuration
     */
    generateMagneticField() {
        return {
            strength: 1 + Math.random() * 4, // Gauss
            polarity: Math.random() > 0.5 ? 1 : -1,
            complexity: Math.floor(Math.random() * 5) + 1
        };
    }

    /**
     * Create star visualization
     */
    createStarVisualization(star) {
        const group = new THREE.Group();
        group.position.copy(star.position);

        // Star sphere with shader for surface effects
        const geometry = new THREE.SphereGeometry(
            Math.log10(star.radius) * 0.1,
            128,
            128
        );

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                temperature: { value: star.temperature },
                activityLevel: { value: this.activityLevel },
                starColor: { value: this.getSpectralColor(star.spectralType) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float temperature;
                uniform float activityLevel;
                uniform vec3 starColor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                void main() {
                    // Base color from temperature
                    float tempNorm = (temperature - 3000.0) / 27000.0;
                    vec3 hotColor = vec3(1.0, 1.0, 0.8);
                    vec3 coolColor = vec3(1.0, 0.3, 0.0);
                    vec3 baseColor = mix(coolColor, hotColor, tempNorm);
                    
                    // Surface turbulence
                    float turbulence = snoise(vUv * 10.0 + time * 0.5) * 0.5 + 0.5;
                    turbulence += snoise(vUv * 20.0 - time * 0.3) * 0.25;
                    
                    // Granulation pattern
                    float granulation = snoise(vUv * 50.0) * 0.1;
                    
                    // Limb darkening
                    float cosTheta = dot(vNormal, vec3(0.0, 0.0, 1.0));
                    float limbDarkening = 1.0 - 0.6 * (1.0 - cosTheta);
                    
                    // Activity effects (brighter areas for flares)
                    float activity = snoise(vUv * 5.0 + time * 0.2) * activityLevel;
                    vec3 activityColor = vec3(1.0, 0.9, 0.7) * activity;
                    
                    // Combine all effects
                    vec3 color = baseColor * (0.8 + turbulence * 0.2 + granulation);
                    color += activityColor;
                    color *= limbDarkening;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        const starMesh = new THREE.Mesh(geometry, material);
        group.add(starMesh);
        star.mesh = starMesh;

        // Corona (glowing atmosphere)
        const coronaGeometry = new THREE.SphereGeometry(
            Math.log10(star.radius) * 0.1 * 1.2,
            64,
            64
        );

        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                starColor: { value: this.getSpectralColor(star.spectralType) }
            },
            vertexShader: `
                varying vec3 vNormal;
                
                void main() {
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 starColor;
                
                varying vec3 vNormal;
                
                void main() {
                    // Fresnel effect for corona glow
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
                    
                    // Pulsing effect
                    float pulse = sin(time * 2.0) * 0.1 + 0.9;
                    
                    vec3 color = starColor * fresnel * pulse;
                    
                    gl_FragColor = vec4(color, fresnel * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });

        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        group.add(corona);
        star.coronaMesh = corona;

        // Point light for illumination
        const light = new THREE.PointLight(starColor, 2, 10000);
        light.position.copy(star.position);
        this.game.scene.add(light);
        star.light = light;

        this.game.scene.add(group);
        star.group = group;
    }

    /**
     * Get color based on spectral type
     */
    getSpectralColor(spectralType) {
        const colors = {
            'O': new THREE.Color(0x9bb0ff),
            'B': new THREE.Color(0xaabfff),
            'A': new THREE.Color(0xcad7ff),
            'F': new THREE.Color(0xf8f7ff),
            'G': new THREE.Color(0xfff4ea),
            'K': new THREE.Color(0xffd2a1),
            'M': new THREE.Color(0xffcc6f)
        };

        const type = spectralType[0];
        return colors[type] || new THREE.Color(0xffff00);
    }

    /**
     * Generate sunspots
     */
    generateSunspots(star) {
        const numSunspots = Math.floor(Math.random() * this.maxSunspots * this.activityLevel);

        for (let i = 0; i < numSunspots; i++) {
            const sunspot = {
                id: i,
                latitude: (Math.random() - 0.5) * Math.PI * 0.4, // Within 40° of equator
                longitude: Math.random() * Math.PI * 2,
                size: 0.01 + Math.random() * 0.05,
                lifetime: 10 + Math.random() * 100, // days
                age: 0,
                magneticPolarity: Math.random() > 0.5 ? 1 : -1
            };

            star.sunspots.push(sunspot);
        }
    }

    /**
     * Generate solar flare
     */
    generateFlare(star) {
        if (star.flares.length >= this.maxFlares) return;

        const flare = {
            id: Date.now(),
            position: this.getRandomSurfacePosition(star),
            intensity: 0.5 + Math.random() * 0.5,
            duration: 10 + Math.random() * 60, // minutes
            age: 0,
            type: Math.random() > 0.7 ? 'X-class' : Math.random() > 0.4 ? 'M-class' : 'C-class'
        };

        star.flares.push(flare);

        // Trigger CME for large flares
        if (flare.type === 'X-class' && Math.random() > 0.5) {
            this.generateCME(star, flare);
        }

        return flare;
    }

    /**
     * Generate coronal mass ejection
     */
    generateCME(star, associatedFlare = null) {
        if (star.cmes.length >= this.maxCMEs) return;

        const cme = {
            id: Date.now(),
            position: associatedFlare ? associatedFlare.position.clone() : this.getRandomSurfacePosition(star),
            velocity: 300 + Math.random() * 2000, // km/s
            mass: 1e12 + Math.random() * 1e15, // kg
            direction: this.getRandomDirection(),
            lifetime: 1000 + Math.random() * 2000,
            age: 0,
            associatedFlare: associatedFlare
        };

        star.cmes.push(cme);

        return cme;
    }

    /**
     * Get random surface position on star
     */
    getRandomSurfacePosition(star) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        return new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        ).multiplyScalar(star.radius);
    }

    /**
     * Get random direction for CME
     */
    getRandomDirection() {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        return new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        );
    }

    /**
     * Update star surface activity
     */
    update(deltaTime) {
        const time = performance.now() * 0.001;

        for (const star of this.stars) {
            // Update rotation
            star.rotationAngle += (2 * Math.PI / star.rotationPeriod) * deltaTime;

            // Update star shader uniforms
            if (star.mesh && star.mesh.material.uniforms) {
                star.mesh.material.uniforms.time.value = time;
                star.mesh.material.uniforms.activityLevel.value = this.activityLevel;
            }

            // Update corona
            if (star.coronaMesh && star.coronaMesh.material.uniforms) {
                star.coronaMesh.material.uniforms.time.value = time;
            }

            // Update sunspots
            this.updateSunspots(star, deltaTime);

            // Update flares
            this.updateFlares(star, deltaTime);

            // Update CMEs
            this.updateCMEs(star, deltaTime);

            // Randomly generate new events based on activity level
            if (Math.random() < this.activityLevel * deltaTime * 0.1) {
                this.generateFlare(star);
            }

            // Regenerate sunspots periodically
            if (Math.random() < 0.01 * deltaTime) {
                this.generateSunspots(star);
            }
        }
    }

    /**
     * Update sunspots
     */
    updateSunspots(star, deltaTime) {
        for (let i = star.sunspots.length - 1; i >= 0; i--) {
            const sunspot = star.sunspots[i];
            sunspot.age += deltaTime;

            // Remove old sunspots
            if (sunspot.age > sunspot.lifetime) {
                star.sunspots.splice(i, 1);
            }
        }
    }

    /**
     * Update flares
     */
    updateFlares(star, deltaTime) {
        for (let i = star.flares.length - 1; i >= 0; i--) {
            const flare = star.flares[i];
            flare.age += deltaTime;

            // Remove old flares
            if (flare.age > flare.duration) {
                star.flares.splice(i, 1);
            }
        }
    }

    /**
     * Update coronal mass ejections
     */
    updateCMEs(star, deltaTime) {
        for (let i = star.cmes.length - 1; i >= 0; i--) {
            const cme = star.cmes[i];
            cme.age += deltaTime;

            // Move CME outward
            const movement = cme.direction.clone().multiplyScalar(cme.velocity * deltaTime * 0.001);
            cme.position.add(movement);

            // Remove old CMEs
            if (cme.age > cme.lifetime) {
                star.cmes.splice(i, 1);
            }
        }
    }

    /**
     * Get solar wind properties at position
     */
    getSolarWindAt(position, star) {
        const direction = position.clone().sub(star.position).normalize();
        const distance = position.distanceTo(star.position);

        // Solar wind speed decreases with distance
        const speed = this.solarWindSpeed * (1 + 100 / distance);

        // Solar wind density decreases with distance squared
        const density = this.solarWindDensity * Math.pow(star.radius / distance, 2);

        return {
            direction,
            speed,
            density,
            temperature: 1e6 * Math.pow(star.radius / distance, 0.5) // Kelvin
        };
    }

    /**
     * Check if position is affected by solar flare
     */
    isAffectedByFlare(position, star) {
        for (const flare of star.flares) {
            const flareDirection = flare.position.clone().sub(star.position).normalize();
            const positionDirection = position.clone().sub(star.position).normalize();

            const dot = flareDirection.dot(positionDirection);
            if (dot > 0.9) { // Within ~25° of flare direction
                return {
                    affected: true,
                    flare,
                    intensity: flare.intensity * dot
                };
            }
        }

        return { affected: false };
    }

    /**
     * Check if position is affected by CME
     */
    isAffectedByCME(position, star) {
        for (const cme of star.cmes) {
            const cmeDirection = cme.direction.clone();
            const positionDirection = position.clone().sub(star.position).normalize();

            const dot = cmeDirection.dot(positionDirection);
            if (dot > 0.95) { // Within ~18° of CME direction
                const distance = position.distanceTo(star.position);
                const cmeDistance = cme.position.distanceTo(star.position);

                // Check if position is within CME cone
                if (Math.abs(distance - cmeDistance) < cme.velocity * cme.age * 0.001 * 0.5) {
                    return {
                        affected: true,
                        cme,
                        intensity: cme.mass / 1e13 * dot
                    };
                }
            }
        }

        return { affected: false };
    }

    /**
     * Get star by ID
     */
    getStar(id) {
        return this.stars.find(star => star.id === id);
    }

    /**
     * Get all stars
     */
    getAllStars() {
        return this.stars;
    }

    /**
     * Set activity level
     */
    setActivityLevel(level) {
        this.activityLevel = Math.max(0, Math.min(1, level));
    }

    /**
     * Cleanup
     */
    dispose() {
        for (const star of this.stars) {
            if (star.group) {
                this.game.scene.remove(star.group);
                
                // Dispose all meshes
                star.group.traverse(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                });
            }

            if (star.light) {
                this.game.scene.remove(star.light);
            }
        }

        this.stars = [];
    }
}

export default StarSurfaceActivitySystem;
