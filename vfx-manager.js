/**
 * VFX Manager
 * Handles particle systems, custom shaders, and post-processing effects.
 * Part of the Asset Production Roadmap - Category 2.
 */

console.log('✨ VFXManager script execution started');
class VFXManager {
    constructor(scene, camera, renderer, manifest = null) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.manifest = manifest;
        this.particleSystems = new Map();
        this.shaders = new Map();
        
        // Post-Processing (Item 111-114)
        this.composer = null; 
        this.passes = {
            bloom: null,
            motionBlur: null,
            chromaticAberration: null
        };
        
        this.init();
    }

    init() {
        console.log("✨ VFX Manager initialized.");
        this.setupShaders();
        this.setupPostProcessing();
    }

    findVFXById(id) {
        if (!this.manifest || !this.manifest.vfx) return null;
        const key = Object.keys(this.manifest.vfx).find(k => this.manifest.vfx[k].id === id);
        return key ? this.manifest.vfx[key] : null;
    }

    /**
     * Creates an effect based on manifest ID.
     */
    createVFXById(id, options = {}) {
        const vfxDef = this.findVFXById(id);
        if (!vfxDef) {
            console.warn(`VFX definition not found for ID: ${id}`);
            return null;
        }

        if (vfxDef.type === 'particle') {
            // Bridge manifest IDs to internal factory types
            let type = vfxDef.id.replace('vfx_', '');
            if (type === 'ion_trail') type = 'ion_engine';
            if (type === 'rocket_exhaust') type = 'chemical_exhaust';
            
            return this.createParticleSystem(type, options);
        }

        if (vfxDef.id === 'vfx_shield_impact') {
            return this.createShield(options.radius || 5);
        }

        return null;
    }

    setupPostProcessing() {
        // Implementation of simple post-processing hooks
        // In a full production environment, this would use THREE.EffectComposer
        this.postProcessingEnabled = true;
        this.postEffects = {
            bloomIntensity: 1.5,
            chromaticAmount: 0.002,
            vignetteDarkness: 1.0
        };
    }

    setupShaders() {
        // Shield Hex Ripple Shader (Item 105)
        this.shaders.set('shield_hex', {
            uniforms: {
                time: { value: 0 },
                impactPos: { value: new THREE.Vector3() },
                impactRadius: { value: 0 },
                hexScale: { value: 10.0 }
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
                uniform vec3 impactPos;
                uniform float impactRadius;
                uniform float hexScale;
                varying vec2 vUv;
                varying vec3 vPosition;

                float hex(vec2 p) {
                    p.x *= 1.1547;
                    float y = p.y + (floor(p.x) * 0.5);
                    vec2 f = fract(vec2(p.x, y));
                    return max(abs(f.y - 0.5) * 1.1547, abs(f.x - 0.5));
                }

                void main() {
                    float dist = distance(vPosition, impactPos);
                    float ripple = sin(dist * 10.0 - time * 5.0) * 0.5 + 0.5;
                    float edge = smoothstep(impactRadius, impactRadius - 0.1, dist);
                    
                    float h = hex(vUv * hexScale);
                    float hexBorder = smoothstep(0.45, 0.5, h);
                    
                    vec3 color = vec3(0.0, 0.5, 1.0) * (hexBorder + ripple * edge);
                    gl_FragColor = vec4(color, color.r > 0.1 ? 0.6 : 0.1);
                }
            `
        });

        // Black Hole Gravitational Lensing Shader (Item 107)
        this.shaders.set('black_hole_lensing', {
            uniforms: {
                time: { value: 0 },
                eventHorizon: { value: 1.0 },
                distortion: { value: 2.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float eventHorizon;
                uniform float distortion;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv - 0.5;
                    float d = length(uv);
                    
                    if (d < eventHorizon * 0.1) {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        return;
                    }

                    float offset = distortion / (d * 10.0);
                    vec2 distortedUv = vUv + uv * offset;
                    
                    // Simple radial rainbow for lensing preview
                    vec3 color = 0.5 + 0.5 * cos(time + distortedUv.xyx + vec3(0, 2, 4));
                    gl_FragColor = vec4(color * smoothstep(eventHorizon * 0.1, eventHorizon * 0.2, d), 1.0);
                }
            `
        });
    }

    /**
     * Creates a shield effect mesh.
     */
    createShield(radius = 5) {
        const shaderDef = this.shaders.get('shield_hex');
        const geometry = new THREE.IcosahedronGeometry(radius, 3);
        const material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(shaderDef.uniforms),
            vertexShader: shaderDef.vertexShader,
            fragmentShader: shaderDef.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        return {
            mesh,
            triggerImpact: (position) => {
                material.uniforms.impactPos.value.copy(position);
                material.uniforms.impactRadius.value = radius * 0.5;
                // Auto-fade radius in update
            },
            update: (time, delta) => {
                material.uniforms.time.value = time;
                if (material.uniforms.impactRadius.value > 0) {
                    material.uniforms.impactRadius.value -= delta * 2.0;
                }
            }
        };
    }

    /**
     * Creates a foundational particle system.
     * @param {string} type - 'ion_engine', 'warp_tunnel', 'meteor_entry', etc.
     */
    createParticleSystem(type, options = {}) {
        let system;
        switch (type) {
            case 'ion_engine':
                system = this.setupIonEngineParticles(options);
                break;
            case 'chemical_exhaust':
                system = this.setupChemicalRocketExhaust(options);
                break;
            case 'warp_tunnel':
                system = this.setupWarpTunnelParticles(options);
                break;
            case 'meteor_entry':
                system = this.setupMeteorEntryParticles(options);
                break;
            case 'ship_explosion':
                system = this.setupShipExplosion(options);
                break;
            case 'supernova':
                system = this.setupSupernova(options);
                break;
            default:
                console.warn(`Unknown particle type: ${type}`);
                return null;
        }
        
        this.particleSystems.set(`${type}_${Date.now()}`, system);
        this.scene.add(system.mesh);
        return system;
    }

    setupIonEngineParticles(options) {
        const count = options.count || 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            // Blue-to-white gradient logic
            colors[i * 3] = 0.5 + Math.random() * 0.5;
            colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
            colors[i * 3 + 2] = 1.0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const mesh = new THREE.Points(geometry, material);
        return {
            mesh,
            update: (delta) => {
                const pos = geometry.attributes.position.array;
                for (let i = 0; i < count; i++) {
                    pos[i * 3 + 2] -= delta * 5; // Move "backwards"
                    if (pos[i * 3 + 2] < -5) {
                        pos[i * 3] = (Math.random() - 0.5) * 0.2;
                        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
                        pos[i * 3 + 2] = 0;
                    }
                }
                geometry.attributes.position.needsUpdate = true;
            }
        };
    }

    setupWarpTunnelParticles(options) {
        // Implementation for Warp Tunnel light-streaks
        const count = options.count || 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 2;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        
        const mesh = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.05, color: 0x88ffff }));
        
        return {
            mesh,
            update: (delta) => {
                const pos = geometry.attributes.position.array;
                for (let i = 0; i < count; i++) {
                    pos[i * 3 + 2] += delta * 100;
                    if (pos[i * 3 + 2] > 25) pos[i * 3 + 2] = -25;
                }
                geometry.attributes.position.needsUpdate = true;
            }
        };
    }

    setupMeteorEntryParticles(options) {
        // Fireball and smoke dissipation logic
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 0.2,
            color: 0xff4400,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const mesh = new THREE.Points(geometry, material);
        return {
            mesh,
            update: (delta) => {
                // Dissipation logic
                const pos = geometry.attributes.position.array;
                for (let i = 0; i < count; i++) {
                    pos[i * 3 + 1] -= delta * 2.0; // Fall down
                    pos[i * 3] += (Math.random() - 0.5) * 0.1;
                }
                geometry.attributes.position.needsUpdate = true;
            }
        };
    }

    setupChemicalRocketExhaust(options) {
        // Item 102: Chemical Rocket Exhaust
        const count = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 2] = -Math.random() * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xffaa00,
            transparent: true,
            opacity: 0.4
        });
        
        const mesh = new THREE.Points(geometry, material);
        return {
            mesh,
            update: (delta) => {
                const pos = geometry.attributes.position.array;
                for (let i = 0; i < count; i++) {
                    pos[i * 3 + 2] -= delta * 10.0;
                    if (pos[i * 3 + 2] < -5) {
                        pos[i * 3] = (Math.random() - 0.5) * 0.1;
                        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
                        pos[i * 3 + 2] = 0;
                    }
                }
                geometry.attributes.position.needsUpdate = true;
            }
        };
    }

    setupShipExplosion(options) {
        // ... (existing code)
    }

    setupSupernova(options) {
        // Item 108: Supernova
        const count = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * 2.0;

            positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
            positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
            positions[i * 3 + 2] = Math.cos(phi) * r;

            velocities[i * 3] = positions[i * 3] * 50.0;
            velocities[i * 3 + 1] = positions[i * 3 + 1] * 50.0;
            velocities[i * 3 + 2] = positions[i * 3 + 2] * 50.0;

            // Bright white/blue/gold mix
            colors[i * 3] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 1.0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const mesh = new THREE.Points(geometry, material);
        let age = 0;

        // Add a blinding flash light
        const flash = new THREE.PointLight(0xffffff, 100, 1000);
        this.scene.add(flash);

        return {
            mesh,
            update: (delta) => {
                age += delta;
                const pos = geometry.attributes.position.array;
                for (let i = 0; i < count; i++) {
                    pos[i * 3] += velocities[i * 3] * delta;
                    pos[i * 3 + 1] += velocities[i * 3 + 1] * delta;
                    pos[i * 3 + 2] += velocities[i * 3 + 2] * delta;
                }
                geometry.attributes.position.needsUpdate = true;
                material.opacity = Math.max(0, 1.0 - age * 0.2);
                flash.intensity = Math.max(0, 100 * (1.0 - age * 2.0));

                if (age > 5.0) {
                    this.scene.remove(mesh);
                    this.scene.remove(flash);
                }
            }
        };
    }

    /**
     * Day/Night Cycle Lighting logic (Item 109)
     */
    updateDayNightCycle(timeOfDay, sunLight) {
        if (!sunLight) return;
        
        // sunLight.position is updated in ExoplanetPioneer main loop
        // Here we can add volumetric effects or color shifting
        const intensity = Math.max(0, Math.sin(timeOfDay * Math.PI * 2));
        sunLight.intensity = intensity * 2.0;
        
        // Warm sunset colors
        if (intensity < 0.3 && intensity > 0) {
            sunLight.color.setHex(0xff7733);
        } else {
            sunLight.color.setHex(0xffffff);
        }
    }

    update(time, delta) {
        this.particleSystems.forEach(system => {
            if (system.update) system.update(delta);
        });
        // Update any active shader effects if needed
    }
}

if (typeof window !== 'undefined') {
    window.VFXManager = VFXManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VFXManager;
}
