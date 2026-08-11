/**
 * 🏔️ THREE.TERRAIN
 * Era II: The Living Cosmos - Procedural Terrain Generation
 * 
 * Procedural terrain generation engine for Three.js.
 * Based on the THREE.Terrain library by Ian Taylor.
 */

import * as THREE from 'three';

class THREETerrain {
    constructor() {
        this.noise = null;
        this.perlin = new PerlinNoise();
        
        console.log('🏔️ THREE.Terrain: Initialized');
    }

    /**
     * Generate terrain mesh
     */
    generate(options = {}) {
        const {
            width = 100,
            depth = 100,
            widthSegments = 64,
            depthSegments = 64,
            maxHeight = 20,
            minHeight = -10,
            frequency = 0.05,
            octaves = 4,
            persistence = 0.5,
            lacunarity = 2.0,
            seed = Math.random() * 10000
        } = options;

        // Create geometry
        const geometry = new THREE.PlaneGeometry(
            width,
            depth,
            widthSegments,
            depthSegments
        );

        // Generate heightmap
        const positions = geometry.attributes.position.array;
        const vertexCount = positions.length / 3;

        for (let i = 0; i < vertexCount; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            
            // Generate height using multi-octave noise
            const height = this.getHeight(x, y, {
                maxHeight,
                minHeight,
                frequency,
                octaves,
                persistence,
                lacunarity,
                seed
            });
            
            positions[i * 3 + 2] = height;
        }

        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Get height at position
     */
    getHeight(x, y, options) {
        const {
            maxHeight,
            minHeight,
            frequency,
            octaves,
            persistence,
            lacunarity,
            seed
        } = options;

        let amplitude = 1;
        let freq = frequency;
        let noiseHeight = 0;
        let maxAmplitude = 0;

        for (let i = 0; i < octaves; i++) {
            const sampleX = (x + seed) * freq;
            const sampleY = (y + seed) * freq;

            const noiseValue = this.perlin.noise(sampleX, sampleY);
            noiseHeight += noiseValue * amplitude;
            maxAmplitude += amplitude;

            amplitude *= persistence;
            freq *= lacunarity;
        }

        // Normalize to range
        noiseHeight = (noiseHeight / maxAmplitude + 1) / 2;
        return minHeight + noiseHeight * (maxHeight - minHeight);
    }

    /**
     * Generate heightmap as Float32Array
     */
    generateHeightmap(width, height, options = {}) {
        const heightmap = new Float32Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = x * options.scale || 1;
                const worldY = y * options.scale || 1;
                
                heightmap[y * width + x] = this.getHeight(worldX, worldY, options);
            }
        }
        
        return heightmap;
    }

    /**
     * Generate terrain with specific biome
     */
    generateBiome(biome, options = {}) {
        const biomeOptions = this.getBiomeOptions(biome, options);
        return this.generate(biomeOptions);
    }

    /**
     * Get biome-specific options
     */
    getBiomeOptions(biome, baseOptions = {}) {
        const biomeDefaults = {
            lunar: {
                maxHeight: 5,
                minHeight: -2,
                frequency: 0.03,
                octaves: 5,
                persistence: 0.6,
                lacunarity: 2.2
            },
            mars: {
                maxHeight: 15,
                minHeight: -5,
                frequency: 0.02,
                octaves: 4,
                persistence: 0.5,
                lacunarity: 2.0
            },
            earth: {
                maxHeight: 30,
                minHeight: -10,
                frequency: 0.01,
                octaves: 6,
                persistence: 0.5,
                lacunarity: 2.0
            },
            ice: {
                maxHeight: 10,
                minHeight: -3,
                frequency: 0.04,
                octaves: 4,
                persistence: 0.4,
                lacunarity: 2.0
            },
            volcanic: {
                maxHeight: 25,
                minHeight: -8,
                frequency: 0.015,
                octaves: 5,
                persistence: 0.6,
                lacunarity: 2.5
            },
            desert: {
                maxHeight: 20,
                minHeight: -5,
                frequency: 0.025,
                octaves: 4,
                persistence: 0.5,
                lacunarity: 2.0
            },
            forest: {
                maxHeight: 25,
                minHeight: -8,
                frequency: 0.02,
                octaves: 5,
                persistence: 0.55,
                lacunarity: 2.1
            },
            ocean: {
                maxHeight: -5,
                minHeight: -50,
                frequency: 0.01,
                octaves: 6,
                persistence: 0.5,
                lacunarity: 2.0
            }
        };

        return { ...biomeDefaults[biome], ...baseOptions };
    }

    /**
     * Apply erosion to terrain
     */
    applyErosion(geometry, options = {}) {
        const {
            iterations = 100,
            erosionRate = 0.1,
            depositionRate = 0.1,
            minSlope = 0.01
        } = options;

        const positions = geometry.attributes.position.array;
        const vertexCount = positions.length / 3;

        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < vertexCount; i++) {
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const z = positions[i * 3 + 2];

                // Calculate gradient
                const gradient = this.calculateGradient(positions, i, vertexCount);

                // Apply erosion if slope is steep enough
                if (gradient > minSlope) {
                    const erosionAmount = gradient * erosionRate;
                    positions[i * 3 + 2] -= erosionAmount;
                }
            }
        }

        geometry.computeVertexNormals();
    }

    /**
     * Calculate gradient at vertex
     */
    calculateGradient(positions, index, vertexCount) {
        const x = positions[index * 3];
        const y = positions[index * 3 + 1];
        const z = positions[index * 3 + 2];

        // Find neighbors (simplified)
        let gradient = 0;
        let neighbors = 0;

        for (let i = 0; i < vertexCount; i++) {
            if (i === index) continue;

            const nx = positions[i * 3];
            const ny = positions[i * 3 + 1];
            const nz = positions[i * 3 + 2];

            const dx = nx - x;
            const dy = ny - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2 && distance > 0.1) {
                gradient += Math.abs(nz - z) / distance;
                neighbors++;
            }
        }

        return neighbors > 0 ? gradient / neighbors : 0;
    }

    /**
     * Generate terrain mesh with material
     */
    generateMesh(options = {}) {
        const {
            material = null,
            wireframe = false,
            shadows = true
        } = options;

        const geometry = this.generate(options);

        let meshMaterial = material;
        
        if (!meshMaterial) {
            meshMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.8,
                metalness: 0.2,
                wireframe: wireframe,
                flatShading: false
            });
        }

        const mesh = new THREE.Mesh(geometry, meshMaterial);
        mesh.receiveShadow = shadows;
        mesh.castShadow = shadows;

        return mesh;
    }

    /**
     * Generate terrain chunks for large areas
     */
    generateChunks(options = {}) {
        const {
            chunkSize = 100,
            chunksX = 4,
            chunksZ = 4,
            ...terrainOptions
        } = options;

        const chunks = [];

        for (let cx = 0; cx < chunksX; cx++) {
            for (let cz = 0; cz < chunksZ; cz++) {
                const offsetX = cx * chunkSize;
                const offsetZ = cz * chunkSize;

                const chunkOptions = {
                    ...terrainOptions,
                    offsetX,
                    offsetZ
                };

                const mesh = this.generateMesh(chunkOptions);
                mesh.position.set(offsetX, 0, offsetZ);

                chunks.push({
                    x: cx,
                    z: cz,
                    mesh: mesh
                });
            }
        }

        return chunks;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        console.log('🏔️ THREE.Terrain: Disposed');
    }
}

/**
 * Perlin Noise Implementation
 */
class PerlinNoise {
    constructor() {
        this.permutation = [];
        this.p = [];
        this.seed(Math.random() * 10000);
    }

    seed(seed) {
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation.push(i);
        }

        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor((seed * (i + 1)) % (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }

        // Duplicate for overflow
        this.p = [...this.permutation, ...this.permutation];
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;

        return this.lerp(
            v,
            this.lerp(
                u,
                this.grad(this.p[A], x, y),
                this.grad(this.p[B], x - 1, y)
            ),
            this.lerp(
                u,
                this.grad(this.p[A + 1], x, y - 1),
                this.grad(this.p[B + 1], x - 1, y - 1)
            )
        );
    }
}

export default THREETerrain;
