/**
 * 🏔️ PROCEDURAL TERRAIN TEXTURE GENERATOR
 * Era II: The Living Cosmos - Asset Production
 * 
 * Generates high-quality terrain textures procedurally at runtime.
 * Supports multiple biome types with realistic material properties.
 */

import * as THREE from 'three';

class ProceduralTerrainTextureGenerator {
    constructor() {
        this.textureCache = new Map();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        console.log('🏔️ Procedural Terrain Texture Generator: Initialized');
    }

    /**
     * Generate terrain texture for a biome
     */
    generateTerrainTexture(biome, options = {}) {
        const key = `terrain_${biome}_${JSON.stringify(options)}`;
        
        if (this.textureCache.has(key)) {
            return this.textureCache.get(key);
        }

        const size = options.size || 1024;
        this.canvas.width = size;
        this.canvas.height = size;

        switch (biome) {
            case 'lunar':
                this.generateLunarTexture(size, options);
                break;
            case 'mars':
                this.generateMarsTexture(size, options);
                break;
            case 'earth':
                this.generateEarthTexture(size, options);
                break;
            case 'ice':
                this.generateIceTexture(size, options);
                break;
            case 'volcanic':
                this.generateVolcanicTexture(size, options);
                break;
            case 'alien':
                this.generateAlienTexture(size, options);
                break;
            case 'desert':
                this.generateDesertTexture(size, options);
                break;
            case 'forest':
                this.generateForestTexture(size, options);
                break;
            case 'ocean':
                this.generateOceanTexture(size, options);
                break;
            default:
                this.generateDefaultTexture(size, options);
        }

        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(options.repeatX || 1, options.repeatY || 1);
        
        this.textureCache.set(key, texture);
        return texture;
    }

    /**
     * Generate PBR material for terrain
     */
    generateTerrainMaterial(biome, options = {}) {
        const albedoTexture = this.generateTerrainTexture(biome, options);
        
        // Generate normal map
        const normalTexture = this.generateNormalMap(biome, options);
        
        // Generate roughness map
        const roughnessTexture = this.generateRoughnessMap(biome, options);
        
        // Generate metalness map
        const metalnessTexture = this.generateMetalnessMap(biome, options);
        
        // Generate height/displacement map
        const heightTexture = this.generateHeightMap(biome, options);
        
        return {
            albedo: albedoTexture,
            normal: normalTexture,
            roughness: roughnessTexture,
            metalness: metalnessTexture,
            height: heightTexture
        };
    }

    /**
     * Generate lunar texture
     */
    generateLunarTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Multi-octave noise for crater detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.02;
                
                for (let o = 0; o < 6; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Craters
                const craterNoise = this.noise(x * 0.05, y * 0.05);
                const crater = craterNoise > 0.7 ? (craterNoise - 0.7) * 3 : 0;
                
                // Base gray color
                let r = 128 + noise * 30 - crater * 80;
                let g = 128 + noise * 30 - crater * 80;
                let b = 128 + noise * 30 - crater * 80;
                
                // Add subtle blue tint in shadows
                const shadow = 1 - noise * 0.5;
                r -= shadow * 10;
                g -= shadow * 5;
                b += shadow * 10;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate Mars texture
     */
    generateMarsTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Multi-octave noise
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.01;
                
                for (let o = 0; o < 5; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Dust storms
                const dustNoise = this.noise(x * 0.03, y * 0.03);
                const dust = dustNoise > 0.6 ? (dustNoise - 0.6) * 2 : 0;
                
                // Base rusty red color
                let r = 180 + noise * 40 + dust * 30;
                let g = 80 + noise * 20 - dust * 20;
                let b = 40 + noise * 10 - dust * 10;
                
                // Dark patches (basalt)
                const darkPatch = this.noise(x * 0.02, y * 0.02);
                if (darkPatch < 0.3) {
                    r *= 0.6;
                    g *= 0.6;
                    b *= 0.6;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate Earth-like texture
     */
    generateEarthTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Continental noise
                let continentNoise = 0;
                let amplitude = 1;
                let frequency = 0.005;
                
                for (let o = 0; o < 4; o++) {
                    continentNoise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Determine biome
                let r, g, b;
                
                if (continentNoise > 0.3) {
                    // Land
                    const landNoise = this.noise(x * 0.02, y * 0.02);
                    
                    if (landNoise > 0.5) {
                        // Mountains (rocky gray)
                        r = 120 + landNoise * 40;
                        g = 100 + landNoise * 30;
                        b = 80 + landNoise * 20;
                    } else if (landNoise < -0.3) {
                        // Forests (green)
                        r = 40 + landNoise * 20;
                        g = 120 + landNoise * 40;
                        b = 40 + landNoise * 20;
                    } else {
                        // Grasslands (light green)
                        r = 100 + landNoise * 30;
                        g = 160 + landNoise * 30;
                        b = 60 + landNoise * 20;
                    }
                } else {
                    // Ocean
                    const oceanNoise = this.noise(x * 0.03, y * 0.03);
                    r = 20 + oceanNoise * 20;
                    g = 60 + oceanNoise * 30;
                    b = 140 + oceanNoise * 40;
                }
                
                // Add clouds
                const cloudNoise = this.noise(x * 0.01 + 100, y * 0.01 + 100);
                if (cloudNoise > 0.55) {
                    const cloud = (cloudNoise - 0.55) * 4;
                    r = Math.min(255, r + cloud * 200);
                    g = Math.min(255, g + cloud * 200);
                    b = Math.min(255, b + cloud * 200);
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate ice texture
     */
    generateIceTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Ice cracks
                const crackNoise = this.noise(x * 0.05, y * 0.05);
                const crack = crackNoise > 0.7 || crackNoise < 0.3 ? Math.abs(crackNoise - 0.5) * 2 : 0;
                
                // Surface detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.02;
                
                for (let o = 0; o < 4; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Base ice color
                let r = 220 + noise * 20 - crack * 100;
                let g = 240 + noise * 15 - crack * 100;
                let b = 255 - crack * 100;
                
                // Blue tint in cracks
                if (crack > 0.3) {
                    r -= crack * 50;
                    g -= crack * 30;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate volcanic texture
     */
    generateVolcanicTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Lava flow
                const lavaNoise = this.noise(x * 0.03, y * 0.03);
                const lava = lavaNoise > 0.6 ? (lavaNoise - 0.6) * 3 : 0;
                
                // Rock detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.02;
                
                for (let o = 0; o < 5; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Base basalt color
                let r = 40 + noise * 20;
                let g = 30 + noise * 15;
                let b = 30 + noise * 15;
                
                // Lava glow
                if (lava > 0) {
                    r += lava * 200;
                    g += lava * 100;
                    b += lava * 20;
                }
                
                // Ash deposits
                const ashNoise = this.noise(x * 0.04, y * 0.04);
                if (ashNoise > 0.7) {
                    const ash = (ashNoise - 0.7) * 2;
                    r += ash * 100;
                    g += ash * 100;
                    b += ash * 100;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate alien texture
     */
    generateAlienTexture(size, options) {
        const { primaryColor = 0x88ff88, secondaryColor = 0xff88ff } = options;
        
        const pR = (primaryColor >> 16) & 255;
        const pG = (primaryColor >> 8) & 255;
        const pB = primaryColor & 255;
        
        const sR = (secondaryColor >> 16) & 255;
        const sG = (secondaryColor >> 8) & 255;
        const sB = secondaryColor & 255;
        
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Organic patterns
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.01;
                
                for (let o = 0; o < 5; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Bioluminescent patches
                const biolumNoise = this.noise(x * 0.02 + 50, y * 0.02 + 50);
                const biolum = biolumNoise > 0.7 ? (biolumNoise - 0.7) * 3 : 0;
                
                // Mix colors
                const mix = (noise + 1) / 2;
                let r = pR * mix + sR * (1 - mix);
                let g = pG * mix + sG * (1 - mix);
                let b = pB * mix + sB * (1 - mix);
                
                // Add bioluminescence
                if (biolum > 0) {
                    r += biolum * 100;
                    g += biolum * 150;
                    b += biolum * 50;
                }
                
                // Vein patterns
                const veinNoise = this.noise(x * 0.05, y * 0.05);
                if (veinNoise > 0.8) {
                    r += 50;
                    g += 50;
                    b += 50;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate desert texture
     */
    generateDesertTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Sand dunes
                const duneNoise = this.noise(x * 0.01, y * 0.01);
                
                // Fine sand detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.03;
                
                for (let o = 0; o < 4; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Base sand color
                let r = 210 + duneNoise * 30 + noise * 20;
                let g = 180 + duneNoise * 20 + noise * 15;
                let b = 120 + duneNoise * 10 + noise * 10;
                
                // Rock formations
                const rockNoise = this.noise(x * 0.02, y * 0.02);
                if (rockNoise > 0.6) {
                    const rock = (rockNoise - 0.6) * 2;
                    r -= rock * 80;
                    g -= rock * 70;
                    b -= rock * 60;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate forest texture
     */
    generateForestTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Vegetation density
                const vegNoise = this.noise(x * 0.02, y * 0.02);
                
                // Ground detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.04;
                
                for (let o = 0; o < 4; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Base grass color
                let r = 60 + noise * 40;
                let g = 140 + noise * 60;
                let b = 40 + noise * 30;
                
                // Dense vegetation
                if (vegNoise > 0.5) {
                    const density = (vegNoise - 0.5) * 2;
                    r -= density * 30;
                    g += density * 40;
                    b -= density * 20;
                }
                
                // Dirt patches
                const dirtNoise = this.noise(x * 0.03, y * 0.03);
                if (dirtNoise < 0.3) {
                    const dirt = (0.3 - dirtNoise) * 2;
                    r += dirt * 40;
                    g += dirt * 20;
                    b += dirt * 10;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate ocean texture
     */
    generateOceanTexture(size, options) {
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Wave patterns
                const waveNoise = this.noise(x * 0.02, y * 0.02);
                
                // Foam detail
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.05;
                
                for (let o = 0; o < 3; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Base water color
                let r = 20 + waveNoise * 30;
                let g = 80 + waveNoise * 40;
                let b = 150 + waveNoise * 50;
                
                // Deep water
                const depthNoise = this.noise(x * 0.01, y * 0.01);
                if (depthNoise < 0.3) {
                    const depth = (0.3 - depthNoise) * 2;
                    r -= depth * 15;
                    g -= depth * 30;
                    b -= depth * 40;
                }
                
                // Foam
                if (noise > 0.7) {
                    const foam = (noise - 0.7) * 3;
                    r += foam * 200;
                    g += foam * 200;
                    b += foam * 200;
                }
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate default texture
     */
    generateDefaultTexture(size, options) {
        const { color = 0x888888 } = options;
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const noise = this.noise(x * 0.02, y * 0.02);
                
                const i = (y * size + x) * 4;
                imageData.data[i] = Math.max(0, Math.min(255, r + noise * 30));
                imageData.data[i + 1] = Math.max(0, Math.min(255, g + noise * 30));
                imageData.data[i + 2] = Math.max(0, Math.min(255, b + noise * 30));
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate normal map from height data
     */
    generateNormalMap(biome, options) {
        const size = options.size || 512;
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Generate height data first
        const heightData = new Float32Array(size * size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.02;
                
                for (let o = 0; o < 4; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                heightData[y * size + x] = noise;
            }
        }
        
        // Calculate normals
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const dx = heightData[y * size + (x + 1)] - heightData[y * size + (x - 1)];
                const dy = heightData[(y + 1) * size + x] - heightData[(y - 1) * size + x];
                
                const nx = -dx * 127 + 128;
                const ny = -dy * 127 + 128;
                const nz = 255;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = nx;
                imageData.data[i + 1] = ny;
                imageData.data[i + 2] = nz;
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Generate roughness map
     */
    generateRoughnessMap(biome, options) {
        const size = options.size || 512;
        this.canvas.width = size;
        this.canvas.height = size;
        
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.03;
                
                for (let o = 0; o < 3; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                const roughness = (noise + 1) / 2 * 255;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = roughness;
                imageData.data[i + 1] = roughness;
                imageData.data[i + 2] = roughness;
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Generate metalness map
     */
    generateMetalnessMap(biome, options) {
        const size = options.size || 512;
        this.canvas.width = size;
        this.canvas.height = size;
        
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const noise = this.noise(x * 0.02, y * 0.02);
                const metalness = noise > 0.5 ? (noise - 0.5) * 2 * 255 : 0;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = metalness;
                imageData.data[i + 1] = metalness;
                imageData.data[i + 2] = metalness;
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Generate height/displacement map
     */
    generateHeightMap(biome, options) {
        const size = options.size || 512;
        this.canvas.width = size;
        this.canvas.height = size;
        
        const imageData = this.ctx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let noise = 0;
                let amplitude = 1;
                let frequency = 0.01;
                
                for (let o = 0; o < 5; o++) {
                    noise += this.noise(x * frequency, y * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                const height = (noise + 1) / 2 * 255;
                
                const i = (y * size + x) * 4;
                imageData.data[i] = height;
                imageData.data[i + 1] = height;
                imageData.data[i + 2] = height;
                imageData.data[i + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Simple noise function
     */
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    /**
     * Cleanup
     */
    dispose() {
        this.textureCache.clear();
    }
}

export default ProceduralTerrainTextureGenerator;
