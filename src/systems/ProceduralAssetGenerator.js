/**
 * 🎨 PROCEDURAL ASSET GENERATOR
 * Era II: The Living Cosmos - Asset Production
 * 
 * Procedurally generates 3D models, textures, materials, and audio at runtime.
 * Eliminates need for external asset files while maintaining visual quality.
 */

import * as THREE from 'three';

class ProceduralAssetGenerator {
    constructor(game) {
        this.game = game;
        this.generatedAssets = new Map();
        
        // Texture cache
        this.textureCache = new Map();
        
        // Audio context
        this.audioContext = null;
        
        console.log('🎨 Procedural Asset Generator: Initialized');
    }

    /**
     * Initialize the asset generator
     */
    initialize() {
        this.initializeAudio();
    }

    /**
     * Initialize audio context for procedural sound generation
     */
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    // ==================== 3D MODEL GENERATION ====================

    /**
     * Generate a procedural 3D model
     */
    generateModel(type, options = {}) {
        const key = `${type}_${JSON.stringify(options)}`;
        
        if (this.generatedAssets.has(key)) {
            return this.generatedAssets.get(key);
        }

        let model;

        switch (type) {
            case 'habitat':
                model = this.generateHabitat(options);
                break;
            case 'ship':
                model = this.generateShip(options);
                break;
            case 'character':
                model = this.generateCharacter(options);
                break;
            case 'prop':
                model = this.generateProp(options);
                break;
            case 'vehicle':
                model = this.generateVehicle(options);
                break;
            case 'megastructure':
                model = this.generateMegastructure(options);
                break;
            case 'weapon':
                model = this.generateWeapon(options);
                break;
            case 'alien':
                model = this.generateAlien(options);
                break;
            default:
                model = this.generateDefaultModel(options);
        }

        this.generatedAssets.set(key, model);
        return model;
    }

    /**
     * Generate habitat module
     */
    generateHabitat(options) {
        const { variant = 'living-quarter', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Main structure
        const geometry = new THREE.BoxGeometry(4 * scale, 3 * scale, 4 * scale);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const main = new THREE.Mesh(geometry, material);
        group.add(main);
        
        // Windows
        const windowGeometry = new THREE.PlaneGeometry(1, 1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            emissive: 0x88ccff,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 4; i++) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(
                Math.sin(i * Math.PI / 2) * 2 * scale,
                0.5 * scale,
                Math.cos(i * Math.PI / 2) * 2 * scale
            );
            window.lookAt(0, 0.5 * scale, 0);
            group.add(window);
        }
        
        // Details based on variant
        if (variant === 'bio-dome') {
            const domeGeometry = new THREE.SphereGeometry(2 * scale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
            const domeMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ff88,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const dome = new THREE.Mesh(domeGeometry, domeMaterial);
            dome.position.y = 1.5 * scale;
            group.add(dome);
        }
        
        return group;
    }

    /**
     * Generate spaceship
     */
    generateShip(options) {
        const { classType = 'interceptor', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Hull
        const hullGeometry = new THREE.ConeGeometry(1 * scale, 4 * scale, 8);
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.5,
            metalness: 0.7
        });
        
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.rotation.x = Math.PI / 2;
        group.add(hull);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.5 * scale, 16, 16);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x88ccff,
            emissiveIntensity: 0.2
        });
        
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.z = 1 * scale;
        group.add(cockpit);
        
        // Engines
        const engineGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.2 * scale, 1 * scale, 8);
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.9
        });
        
        for (let i = 0; i < 2; i++) {
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.position.x = (i === 0 ? -1 : 1) * 0.5 * scale;
            engine.position.z = -1.5 * scale;
            engine.rotation.x = Math.PI / 2;
            group.add(engine);
        }
        
        // Engine glow
        const glowGeometry = new THREE.SphereGeometry(0.2 * scale, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 2; i++) {
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.x = (i === 0 ? -1 : 1) * 0.5 * scale;
            glow.position.z = -2 * scale;
            group.add(glow);
        }
        
        return group;
    }

    /**
     * Generate character model
     */
    generateCharacter(options) {
        const { type = 'pioneer', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3 * scale, 0.6 * scale, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: type === 'pioneer' ? 0x4488ff : 0x88ff88,
            roughness: 0.6,
            metalness: 0.4
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6 * scale;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25 * scale, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc99,
            roughness: 0.8
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2 * scale;
        group.add(head);
        
        // Visor
        const visorGeometry = new THREE.SphereGeometry(0.2 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.7,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });
        
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.y = 1.2 * scale;
        visor.position.z = 0.1 * scale;
        visor.rotation.x = -Math.PI / 4;
        group.add(visor);
        
        return group;
    }

    /**
     * Generate prop model
     */
    generateProp(options) {
        const { type = 'console', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(2 * scale, 0.1 * scale, 1 * scale);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5,
            metalness: 0.7
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        group.add(base);
        
        // Screen
        const screenGeometry = new THREE.PlaneGeometry(1.8 * scale, 0.8 * scale);
        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.y = 0.5 * scale;
        screen.rotation.x = -Math.PI / 6;
        group.add(screen);
        
        // Holographic projection
        const hologramGeometry = new THREE.ConeGeometry(0.3 * scale, 1 * scale, 8, 1, true);
        const hologramMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const hologram = new THREE.Mesh(hologramGeometry, hologramMaterial);
        hologram.position.y = 1 * scale;
        hologram.rotation.x = Math.PI;
        group.add(hologram);
        
        return group;
    }

    /**
     * Generate vehicle model
     */
    generateVehicle(options) {
        const { type = 'rover', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Chassis
        const chassisGeometry = new THREE.BoxGeometry(2 * scale, 0.5 * scale, 3 * scale);
        const chassisMaterial = new THREE.MeshStandardMaterial({
            color: 0x886644,
            roughness: 0.8
        });
        
        const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.y = 0.5 * scale;
        group.add(chassis);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4 * scale, 0.4 * scale, 0.3 * scale, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        
        const wheelPositions = [
            [-0.8, 0, -1],
            [0.8, 0, -1],
            [-0.8, 0, 1],
            [0.8, 0, 1]
        ];
        
        for (const pos of wheelPositions) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0] * scale, pos[1] * scale + 0.4 * scale, pos[2] * scale);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        }
        
        // Cabin
        const cabinGeometry = new THREE.BoxGeometry(1.5 * scale, 0.8 * scale, 1.5 * scale);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x6688ff,
            transparent: true,
            opacity: 0.7
        });
        
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1 * scale;
        group.add(cabin);
        
        return group;
    }

    /**
     * Generate megastructure
     */
    generateMegastructure(options) {
        const { type = 'dyson-ring', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        if (type === 'dyson-ring') {
            // Ring segments
            const segmentCount = 12;
            const segmentGeometry = new THREE.BoxGeometry(2 * scale, 0.5 * scale, 1 * scale);
            const segmentMaterial = new THREE.MeshStandardMaterial({
                color: 0x8888ff,
                roughness: 0.3,
                metalness: 0.8,
                emissive: 0x4444aa,
                emissiveIntensity: 0.2
            });
            
            for (let i = 0; i < segmentCount; i++) {
                const angle = (i / segmentCount) * Math.PI * 2;
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                
                segment.position.x = Math.cos(angle) * 10 * scale;
                segment.position.z = Math.sin(angle) * 10 * scale;
                segment.rotation.y = angle;
                
                group.add(segment);
            }
            
            // Central star
            const starGeometry = new THREE.SphereGeometry(2 * scale, 32, 32);
            const starMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00
            });
            
            const star = new THREE.Mesh(starGeometry, starMaterial);
            group.add(star);
            
            // Star glow
            const glowGeometry = new THREE.SphereGeometry(3 * scale, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.3
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            group.add(glow);
        }
        
        return group;
    }

    /**
     * Generate weapon model
     */
    generateWeapon(options) {
        const { type = 'laser-rifle', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.05 * scale, 0.08 * scale, 2 * scale, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        group.add(barrel);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.2 * scale, 0.3 * scale, 1 * scale);
        const stockMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.6
        });
        
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.z = 1.2 * scale;
        group.add(stock);
        
        // Energy cell
        const cellGeometry = new THREE.BoxGeometry(0.15 * scale, 0.15 * scale, 0.3 * scale);
        const cellMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.y = 0.2 * scale;
        group.add(cell);
        
        return group;
    }

    /**
     * Generate alien creature
     */
    generateAlien(options) {
        const { type = 'stalker', scale = 1 } = options;
        
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5 * scale, 1 * scale, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ff88,
            roughness: 0.7
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8 * scale;
        group.add(body);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.08 * scale, 0.8 * scale, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x66cc66,
            roughness: 0.8
        });
        
        for (let i = 0; i < 6; i++) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            const angle = (i / 6) * Math.PI * 2;
            leg.position.x = Math.cos(angle) * 0.4 * scale;
            leg.position.z = Math.sin(angle) * 0.4 * scale;
            leg.position.y = 0.3 * scale;
            
            group.add(leg);
        }
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1 * scale, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.x = (i - 1) * 0.2 * scale;
            eye.position.y = 1.3 * scale;
            eye.position.z = 0.4 * scale;
            
            group.add(eye);
        }
        
        return group;
    }

    /**
     * Generate default model
     */
    generateDefaultModel(options) {
        const { scale = 1 } = options;
        
        const geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.5
        });
        
        return new THREE.Mesh(geometry, material);
    }

    // ==================== TEXTURE GENERATION ====================

    /**
     * Generate procedural texture
     */
    generateTexture(type, options = {}) {
        const key = `texture_${type}_${JSON.stringify(options)}`;
        
        if (this.textureCache.has(key)) {
            return this.textureCache.get(key);
        }

        // Check if we should use online texture source
        if (options.useOnlineSource && options.onlineSource) {
            return this.loadOnlineTexture(options.onlineSource, options);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = options.size || 512;
        
        canvas.width = size;
        canvas.height = size;
        
        switch (type) {
            case 'noise':
                this.generateNoiseTexture(ctx, size, options);
                break;
            case 'metal':
                this.generateMetalTexture(ctx, size, options);
                break;
            case 'rock':
                this.generateRockTexture(ctx, size, options);
                break;
            case 'fabric':
                this.generateFabricTexture(ctx, size, options);
                break;
            case 'emissive':
                this.generateEmissiveTexture(ctx, size, options);
                break;
            case 'polyhaven':
                this.generatePolyHavenStyleTexture(ctx, size, options);
                break;
            case 'ambientcg':
                this.generateAmbientCGStyleTexture(ctx, size, options);
                break;
            default:
                this.generateDefaultTexture(ctx, size, options);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        this.textureCache.set(key, texture);
        return texture;
    }

    /**
     * Load texture from online source
     */
    async loadOnlineTexture(source, options) {
        const key = `online_${source}`;
        
        if (this.textureCache.has(key)) {
            return this.textureCache.get(key);
        }

        try {
            const textureLoader = new THREE.TextureLoader();
            const texture = await new Promise((resolve, reject) => {
                textureLoader.load(source, resolve, undefined, reject);
            });
            
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            this.textureCache.set(key, texture);
            return texture;
        } catch (error) {
            console.warn(`Failed to load online texture ${source}, falling back to procedural:`, error);
            // Fallback to procedural generation
            return this.generateTexture('noise', options);
        }
    }

    /**
     * Generate noise texture
     */
    generateNoiseTexture(ctx, size, options) {
        const { scale = 10, octaves = 4 } = options;
        
        const imageData = ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let value = 0;
                let amplitude = 1;
                let frequency = scale;
                
                for (let o = 0; o < octaves; o++) {
                    value += this.noise(x * frequency / size, y * frequency / size) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                value = (value + 1) / 2;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = value * 255;
                imageData.data[i + 1] = value * 255;
                imageData.data[i + 2] = value * 255;
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate metal texture
     */
    generateMetalTexture(ctx, size, options) {
        const { color = 0x888888, roughness = 0.3 } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const noise = this.noise(x * 20 / size, y * 20 / size);
                const variation = (noise - 0.5) * roughness * 100;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r + variation));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g + variation));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b + variation));
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate rock texture
     */
    generateRockTexture(ctx, size, options) {
        const { color = 0x666666 } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        const imageData = ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const noise1 = this.noise(x * 5 / size, y * 5 / size);
                const noise2 = this.noise(x * 15 / size, y * 15 / size);
                
                const value = noise1 * 0.7 + noise2 * 0.3;
                const variation = (value - 0.5) * 80;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r + variation));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g + variation));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b + variation));
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate fabric texture
     */
    generateFabricTexture(ctx, size, options) {
        const { color = 0x888888 } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const weaveX = Math.sin(x * 0.1) * 0.5 + 0.5;
                const weaveY = Math.cos(y * 0.1) * 0.5 + 0.5;
                const value = (weaveX + weaveY) / 2;
                
                const variation = (value - 0.5) * 30;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r + variation));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g + variation));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b + variation));
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate emissive texture
     */
    generateEmissiveTexture(ctx, size, options) {
        const { color = 0x00ff00, intensity = 1.0 } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const noise = this.noise(x * 10 / size, y * 10 / size);
                const pulse = Math.sin(noise * Math.PI * 2) * 0.5 + 0.5;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = r * pulse * intensity;
                imageData.data[i + 1] = g * pulse * intensity;
                imageData.data[i + 2] = b * pulse * intensity;
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate default texture
     */
    generateDefaultTexture(ctx, size, options) {
        const { color = 0xffffff } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, size, size);
    }

    /**
     * Generate Poly Haven style texture (high-quality PBR)
     */
    generatePolyHavenStyleTexture(ctx, size, options) {
        const { color = 0x888888, roughness = 0.5, metalness = 0.1 } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        const imageData = ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Multi-layer noise for realistic detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.02;
                
                for (let o = 0; o < 6; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Normalized noise
                const normalizedNoise = (noise + 1) / 2;
                
                // Apply roughness variation
                const roughnessVariation = normalizedNoise * roughness * 50;
                
                // Apply metalness highlights
                const metalnessHighlight = metalness > 0.5 ? (normalizedNoise - 0.5) * 30 : 0;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r + roughnessVariation - metalnessHighlight));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g + roughnessVariation - metalnessHighlight));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b + roughnessVariation - metalnessHighlight));
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate AmbientCG style texture (PBR material)
     */
    generateAmbientCGStyleTexture(ctx, size, options) {
        const { color = 0x886644, type = 'concrete' } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        const imageData = ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.03;
                
                for (let o = 0; o < 5; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Material-specific patterns
                let variation = 0;
                
                switch (type) {
                    case 'concrete':
                        // Concrete with subtle grain
                        const grain = this.noise(x * 0.5, y * 0.5) * 20;
                        variation = noise * 30 + grain;
                        break;
                    case 'wood':
                        // Wood grain pattern
                        const woodGrain = Math.sin(x * 0.1 + noise * 2) * 30;
                        variation = noise * 20 + woodGrain;
                        break;
                    case 'metal':
                        // Brushed metal
                        const brushed = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 15;
                        variation = noise * 25 + brushed;
                        break;
                    case 'fabric':
                        // Woven fabric
                        const weaveX = Math.sin(x * 0.1) * 0.5 + 0.5;
                        const weaveY = Math.cos(y * 0.1) * 0.5 + 0.5;
                        variation = (weaveX + weaveY) / 2 * 20;
                        break;
                    default:
                        variation = noise * 25;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r + variation));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g + variation));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b + variation));
                imageData.data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Simple 2D noise function
     */
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    // ==================== AUDIO GENERATION ====================

    /**
     * Generate procedural audio
     */
    generateAudio(type, options = {}) {
        if (!this.audioContext) {
            console.warn('Audio context not initialized');
            return null;
        }

        const { duration = 1.0, frequency = 440 } = options;
        
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (type) {
            case 'laser':
                this.generateLaserSound(data, sampleRate, options);
                break;
            case 'explosion':
                this.generateExplosionSound(data, sampleRate, options);
                break;
            case 'engine':
                this.generateEngineSound(data, sampleRate, options);
                break;
            case 'ui':
                this.generateUISound(data, sampleRate, options);
                break;
            case 'ambient':
                this.generateAmbientSound(data, sampleRate, options);
                break;
            case 'sonniss-laser':
                this.generateSonnissLaserSound(data, sampleRate, options);
                break;
            case 'sonniss-impact':
                this.generateSonnissImpactSound(data, sampleRate, options);
                break;
            case 'sonniss-powerup':
                this.generateSonnissPowerupSound(data, sampleRate, options);
                break;
            default:
                this.generateDefaultSound(data, sampleRate, options);
        }
        
        return buffer;
    }

    /**
     * Generate laser sound
     */
    generateLaserSound(data, sampleRate, options) {
        const { frequency = 880, duration = 0.3 } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            const sweep = frequency * (1 - t * 0.5);
            
            data[i] = Math.sin(2 * Math.PI * sweep * t) * envelope * 0.3;
        }
    }

    /**
     * Generate explosion sound
     */
    generateExplosionSound(data, sampleRate, options) {
        const { duration = 1.0 } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3);
            const noise = (Math.random() - 0.5) * 2;
            const lowpass = Math.sin(2 * Math.PI * 50 * t) * 0.5;
            
            data[i] = (noise + lowpass) * envelope * 0.5;
        }
    }

    /**
     * Generate engine sound
     */
    generateEngineSound(data, sampleRate, options) {
        const { frequency = 100 } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() - 0.5) * 2;
            const tone = Math.sin(2 * Math.PI * frequency * t);
            
            data[i] = (noise * 0.3 + tone * 0.7) * 0.2;
        }
    }

    /**
     * Generate UI sound
     */
    generateUISound(data, sampleRate, options) {
        const { frequency = 880, duration = 0.1 } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 20);
            
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
        }
    }

    /**
     * Generate ambient sound
     */
    generateAmbientSound(data, sampleRate, options) {
        const { frequency = 200 } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() - 0.5) * 2;
            const tone1 = Math.sin(2 * Math.PI * frequency * t);
            const tone2 = Math.sin(2 * Math.PI * frequency * 1.5 * t);
            
            data[i] = (noise * 0.2 + tone1 * 0.4 + tone2 * 0.4) * 0.1;
        }
    }

    /**
     * Generate default sound
     */
    generateDefaultSound(data, sampleRate, options) {
        for (let i = 0; i < data.length; i++) {
            data[i] = 0;
        }
    }

    /**
     * Generate SONNISS-style laser sound
     */
    generateSonnissLaserSound(data, sampleRate, options) {
        const { frequency = 1200, duration = 0.4 } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // Multi-layered laser sound
            const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 50));
            const sweep = frequency * (1 - t * 0.7);
            const modulation = Math.sin(t * 200 * Math.PI) * 0.3;
            
            // High-frequency carrier
            const carrier = Math.sin(2 * Math.PI * sweep * t);
            
            // Add harmonics
            const harmonic2 = Math.sin(2 * Math.PI * sweep * 2 * t) * 0.3;
            const harmonic3 = Math.sin(2 * Math.PI * sweep * 3 * t) * 0.1;
            
            data[i] = (carrier + harmonic2 + harmonic3 + modulation) * envelope * 0.35;
        }
    }

    /**
     * Generate SONNISS-style impact sound
     */
    generateSonnissImpactSound(data, sampleRate, options) {
        const { duration = 0.5, impactType = 'metal' } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // Impact envelope
            const envelope = Math.exp(-t * 20) + Math.exp(-t * 8) * 0.5;
            
            // Noise layer
            const noise = (Math.random() - 0.5) * 2;
            
            // Low-frequency impact
            const impact = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 10);
            
            // Material-specific characteristics
            let resonance = 0;
            switch (impactType) {
                case 'metal':
                    resonance = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 15) * 0.3;
                    break;
                case 'wood':
                    resonance = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 12) * 0.2;
                    break;
                case 'stone':
                    resonance = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 8) * 0.25;
                    break;
                default:
                    resonance = Math.sin(2 * Math.PI * 250 * t) * Math.exp(-t * 10) * 0.2;
            }
            
            data[i] = (noise * 0.4 + impact * 0.3 + resonance) * envelope * 0.4;
        }
    }

    /**
     * Generate SONNISS-style powerup sound
     */
    generateSonnissPowerupSound(data, sampleRate, options) {
        const { duration = 0.8, type = 'collect' } = options;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // Rising pitch for powerup
            const baseFreq = 440;
            const pitchRamp = t * 400;
            
            // Envelope
            const envelope = Math.sin(t * Math.PI / duration) * Math.exp(-t * 2);
            
            // Chord-like structure
            const note1 = Math.sin(2 * Math.PI * (baseFreq + pitchRamp) * t);
            const note2 = Math.sin(2 * Math.PI * (baseFreq * 1.25 + pitchRamp) * t) * 0.5;
            const note3 = Math.sin(2 * Math.PI * (baseFreq * 1.5 + pitchRamp) * t) * 0.3;
            
            // Sparkle effect
            const sparkle = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 10) * 0.2;
            
            // Type-specific variations
            let variation = 0;
            switch (type) {
                case 'collect':
                    variation = Math.sin(2 * Math.PI * 880 * t) * 0.2;
                    break;
                case 'upgrade':
                    variation = Math.sin(2 * Math.PI * 660 * t) * 0.3;
                    break;
                case 'achievement':
                    variation = Math.sin(2 * Math.PI * 1100 * t) * 0.25;
                    break;
            }
            
            data[i] = (note1 + note2 + note3 + sparkle + variation) * envelope * 0.3;
        }
    }

    /**
     * Play generated audio
     */
    playAudio(buffer, volume = 1.0) {
        if (!this.audioContext || !buffer) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }

    // ==================== SKYBOX GENERATION ====================

    /**
     * Generate procedural skybox
     */
    generateSkybox(type, options = {}) {
        const { size = 512 } = options;
        
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size);
        const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
        
        const scene = new THREE.Scene();
        
        switch (type) {
            case 'nebula':
                this.generateNebulaSkybox(scene, options);
                break;
            case 'deep-space':
                this.generateDeepSpaceSkybox(scene, options);
                break;
            case 'planetary':
                this.generatePlanetarySkybox(scene, options);
                break;
            default:
                this.generateDefaultSkybox(scene, options);
        }
        
        cubeCamera.update(this.game.renderer, scene);
        
        return cubeRenderTarget.texture;
    }

    /**
     * Generate nebula skybox
     */
    generateNebulaSkybox(scene, options) {
        const { colors = [0xff0088, 0x0088ff, 0x8800ff] } = options;
        
        // Stars
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < 5000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 500 + Math.random() * 500;
            
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            
            const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
            starColors.push(color.r, color.g, color.b);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
        
        // Nebula clouds
        const nebulaGeometry = new THREE.SphereGeometry(400, 32, 32);
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(colors[0]) },
                color2: { value: new THREE.Color(colors[1]) }
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec3 vPosition;
                void main() {
                    float noise = sin(vPosition.x * 0.01) * cos(vPosition.y * 0.01) * sin(vPosition.z * 0.01);
                    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
                    gl_FragColor = vec4(color, 0.3);
                }
            `,
            transparent: true,
            side: THREE.BackSide
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        scene.add(nebula);
    }

    /**
     * Generate deep space skybox
     */
    generateDeepSpaceSkybox(scene, options) {
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < 10000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 500 + Math.random() * 1000;
            
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            
            const brightness = Math.random();
            const color = new THREE.Color().setHSL(0.6, 0.2, brightness);
            starColors.push(color.r, color.g, color.b);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    }

    /**
     * Generate planetary skybox
     */
    generatePlanetarySkybox(scene, options) {
        const { planetColor = 0x4488ff, atmosphereColor = 0x88ccff } = options;
        
        // Planet
        const planetGeometry = new THREE.SphereGeometry(200, 64, 64);
        const planetMaterial = new THREE.MeshStandardMaterial({
            color: planetColor,
            roughness: 0.8
        });
        
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        scene.add(planet);
        
        // Atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(220, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                atmosphereColor: { value: new THREE.Color(atmosphereColor) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 atmosphereColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(atmosphereColor, intensity * 0.5);
                }
            `,
            transparent: true,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);
    }

    /**
     * Generate default skybox
     */
    generateDefaultSkybox(scene, options) {
        scene.background = new THREE.Color(0x000011);
    }

    /**
     * Cleanup
     */
    dispose() {
        // Clear cache
        this.generatedAssets.clear();
        this.textureCache.clear();
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

export default ProceduralAssetGenerator;
