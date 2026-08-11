/**
 * 🌍 VOXEL TERRAIN 2.0
 * Era II: The Living Cosmos - Advanced Planetary Engines
 * 
 * Destructible voxel-based terrain system replacing traditional heightmaps.
 * Supports underground bases, caves, mining, and dynamic terrain modification.
 */

import * as THREE from 'three';

const VOXEL_SIZE = 1.0;
const CHUNK_SIZE = 16;
const MAX_DEPTH = 64;
const SURFACE_LEVEL = 32;

class VoxelTerrainSystem {
    constructor(game) {
        this.game = game;
        this.chunks = new Map();
        this.voxelData = new Map();
        this.modifiedVoxels = new Set();
        this.physicsWorld = null;
        this.meshes = new Map();
        
        // WebGPU support
        this.webgpuDevice = null;
        this.webgpuContext = null;
        this.computePipeline = null;
        this.useWebGPU = false;
        
        this.materials = {
            stone: new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 }),
            dirt: new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.95 }),
            grass: new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.8 }),
            sand: new THREE.MeshStandardMaterial({ color: 0xF4A460, roughness: 0.9 }),
            water: new THREE.MeshStandardMaterial({ 
                color: 0x2196F3, 
                transparent: true, 
                opacity: 0.7,
                roughness: 0.1
            }),
            ore: new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.8 }),
            bedrock: new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 1.0 })
        };
        
        this.noiseScale = 0.02;
        this.amplitude = 20;
        this.octaves = 4;
        this.persistence = 0.5;
        this.lacunarity = 2.0;
        
        // Erosion simulation
        this.erosionEnabled = true;
        this.erosionRate = 0.0001;
        this.erosionField = [];
        this.sedimentField = [];
        
        console.log('🌍 Voxel Terrain 2.0: Initialized');
    }

    /**
     * Initialize the terrain system with physics world
     */
    async initialize(physicsWorld) {
        this.physicsWorld = physicsWorld;
        
        // Try to initialize WebGPU
        await this.initializeWebGPU();
        
        this.generateInitialTerrain();
    }

    /**
     * Initialize WebGPU for GPU-accelerated voxel mesh generation
     */
    async initializeWebGPU() {
        if (!navigator.gpu) {
            console.warn('WebGPU not supported, falling back to CPU rendering');
            return;
        }

        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                console.warn('No WebGPU adapter found, falling back to CPU rendering');
                return;
            }

            this.webgpuDevice = await adapter.requestDevice();
            this.useWebGPU = true;
            
            console.log('🎮 WebGPU initialized for voxel terrain');
            
            // Create compute pipeline for voxel mesh generation
            await this.createComputePipeline();
            
        } catch (error) {
            console.error('WebGPU initialization failed:', error);
            console.warn('Falling back to CPU rendering');
        }
    }

    /**
     * Create WebGPU compute pipeline for voxel mesh generation
     */
    async createComputePipeline() {
        const shaderCode = `
            struct VoxelData {
                type: u32,
                health: u32,
                modified: u32,
            }

            struct Uniforms {
                chunkX: i32,
                chunkZ: i32,
                time: f32,
            }

            @group(0) @binding(0) var<storage, read> voxelData: array<VoxelData>;
            @group(0) @binding(1) var<storage, read_write> vertexBuffer: array<f32>;
            @group(0) @binding(2) var<storage, read_write> normalBuffer: array<f32>;
            @group(0) @binding(3) var<storage, read_write> indexBuffer: array<u32>;
            @group(0) @binding(4) var<uniform> uniforms: Uniforms;
            
            @compute @workgroup_size(8, 8, 1)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                let voxelIndex = global_id.x + global_id.y * 16 + global_id.z * 256;
                
                if (voxelIndex >= 4096) {
                    return;
                }
                
                let voxel = voxelData[voxelIndex];
                
                if (voxel.type == 0) {
                    return;
                }
                
                // Calculate world position
                let localX = i32(global_id.x);
                let localY = i32(global_id.y);
                let localZ = i32(global_id.z);
                
                let worldX = uniforms.chunkX * 16 + localX;
                let worldY = localY;
                let worldZ = uniforms.chunkZ * 16 + localZ;
                
                // Check neighbors for visible faces
                let visibleFaces = 0;
                
                // Check each of 6 faces
                if (localX < 15 && voxelData[voxelIndex + 1].type == 0) visibleFaces |= 1;
                if (localX > 0 && voxelData[voxelIndex - 1].type == 0) visibleFaces |= 2;
                if (localY < 63 && voxelData[voxelIndex + 16].type == 0) visibleFaces |= 4;
                if (localY > 0 && voxelData[voxelIndex - 16].type == 0) visibleFaces |= 8;
                if (localZ < 15 && voxelData[voxelIndex + 256].type == 0) visibleFaces |= 16;
                if (localZ > 0 && voxelData[voxelIndex - 256].type == 0) visibleFaces |= 32;
                
                // Generate vertices for visible faces
                let vertexOffset = atomicAdd(&vertexBuffer[0], 0.0);
                let indexOffset = atomicAdd(&indexBuffer[0], 0.0);
                
                if (visibleFaces & 1) { // Right face
                    vertexBuffer[vertexOffset * 3 + 1] = f32(worldX + 1);
                    vertexBuffer[vertexOffset * 3 + 2] = f32(worldY);
                    vertexBuffer[vertexOffset * 3 + 3] = f32(worldZ);
                    
                    vertexBuffer[vertexOffset * 3 + 4] = 1.0;
                    vertexBuffer[vertexOffset * 3 + 5] = 0.0;
                    vertexBuffer[vertexOffset * 3 + 6] = 0.0;
                    
                    // ... more vertices
                }
            }
        `;
        
        const shaderModule = this.webgpuDevice.createShaderModule({
            code: shaderCode
        });
        
        this.computePipeline = this.webgpuDevice.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'main'
            }
        });
    }

    /**
     * Generate initial terrain using procedural noise
     */
    generateInitialTerrain() {
        const renderDistance = 4;
        
        for (let x = -renderDistance; x <= renderDistance; x++) {
            for (let z = -renderDistance; z <= renderDistance; z++) {
                this.generateChunk(x, z);
            }
        }
    }

    /**
     * Generate a chunk at the given chunk coordinates
     */
    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        if (this.chunks.has(chunkKey)) {
            return;
        }

        const chunkData = new Map();
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                const height = this.getTerrainHeight(worldX, worldZ);
                
                for (let y = 0; y < MAX_DEPTH; y++) {
                    const voxelKey = `${worldX},${y},${worldZ}`;
                    
                    if (y > height) {
                        continue;
                    }
                    
                    let voxelType = this.determineVoxelType(y, height);
                    
                    // Add ore deposits randomly
                    if (y < height - 3 && Math.random() < 0.02) {
                        voxelType = 'ore';
                    }
                    
                    chunkData.set(voxelKey, {
                        type: voxelType,
                        health: this.getVoxelHealth(voxelType),
                        modified: false
                    });
                    
                    this.voxelData.set(voxelKey, {
                        type: voxelType,
                        health: this.getVoxelHealth(voxelType),
                        modified: false
                    });
                }
            }
        }
        
        this.chunks.set(chunkKey, chunkData);
        this.buildChunkMesh(chunkX, chunkZ);
    }

    /**
     * Get terrain height at world coordinates using noise
     */
    getTerrainHeight(worldX, worldZ) {
        let amplitude = this.amplitude;
        let frequency = this.noiseScale;
        let noiseHeight = 0;
        let maxAmplitude = 0;
        
        for (let i = 0; i < this.octaves; i++) {
            const sampleX = worldX * frequency;
            const sampleZ = worldZ * frequency;
            
            const noiseValue = this.noise(sampleX, sampleZ);
            noiseHeight += noiseValue * amplitude;
            maxAmplitude += amplitude;
            
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }
        
        noiseHeight = (noiseHeight / maxAmplitude + 1) / 2;
        return Math.floor(noiseHeight * (SURFACE_LEVEL - 4) + 4);
    }

    /**
     * Simple noise function (replace with Perlin/Simplex for production)
     */
    noise(x, z) {
        return Math.sin(x * 0.1) * Math.cos(z * 0.1) + 
               Math.sin(x * 0.05 + z * 0.05) * 0.5;
    }

    /**
     * Determine voxel type based on depth and surface
     */
    determineVoxelType(y, surfaceHeight) {
        if (y === 0) return 'bedrock';
        if (y === surfaceHeight) return 'grass';
        if (y > surfaceHeight - 3) return 'dirt';
        if (y < surfaceHeight - 15) return 'stone';
        return 'dirt';
    }

    /**
     * Get voxel health based on type
     */
    getVoxelHealth(type) {
        const healthMap = {
            stone: 100,
            dirt: 50,
            grass: 30,
            sand: 25,
            ore: 150,
            bedrock: 9999
        };
        return healthMap[type] || 50;
    }

    /**
     * Build mesh for a chunk
     */
    buildChunkMesh(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunkData = this.chunks.get(chunkKey);
        
        if (!chunkData) return;
        
        // Use WebGPU if available for GPU-accelerated mesh generation
        if (this.useWebGPU && this.computePipeline) {
            this.buildChunkMeshWebGPU(chunkX, chunkZ, chunkData);
            return;
        }
        
        // Fall back to CPU rendering
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];
        
        let vertexCount = 0;
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let y = 0; y < MAX_DEPTH; y++) {
                    const worldX = chunkX * CHUNK_SIZE + x;
                    const worldZ = chunkZ * CHUNK_SIZE + z;
                    const voxelKey = `${worldX},${y},${worldZ}`;
                    
                    const voxel = chunkData.get(voxelKey);
                    if (!voxel) continue;
                    
                    // Only draw visible faces (culling)
                    const faces = this.getVisibleFaces(worldX, y, worldZ);
                    
                    if (faces.length === 0) continue;
                    
                    this.addVoxelGeometry(
                        vertices, normals, colors, indices,
                        worldX, y, worldZ, voxel.type, faces, vertexCount
                    );
                    
                    vertexCount += faces.length * 4;
                }
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Remove old mesh if exists
        if (this.meshes.has(chunkKey)) {
            this.game.scene.remove(this.meshes.get(chunkKey));
            this.meshes.get(chunkKey).geometry.dispose();
        }
        
        this.game.scene.add(mesh);
        this.meshes.set(chunkKey, mesh);
    }

    /**
     * Build chunk mesh using WebGPU compute shaders
     */
    async buildChunkMeshWebGPU(chunkX, chunkZ, chunkData) {
        // Convert chunk data to WebGPU-compatible format
        const voxelArray = new Uint32Array(CHUNK_SIZE * CHUNK_SIZE * MAX_DEPTH * 3);
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let y = 0; y < MAX_DEPTH; y++) {
                    const worldX = chunkX * CHUNK_SIZE + x;
                    const worldZ = chunkZ * CHUNK_SIZE + z;
                    const voxelKey = `${worldX},${y},${worldZ}`;
                    const voxel = chunkData.get(voxelKey);
                    
                    const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
                    if (voxel) {
                        voxelArray[index * 3] = this.getVoxelTypeCode(voxel.type);
                        voxelArray[index * 3 + 1] = voxel.health;
                        voxelArray[index * 3 + 2] = voxel.modified ? 1 : 0;
                    }
                }
            }
        }
        
        // Create GPU buffers
        const voxelBuffer = this.webgpuDevice.createBuffer({
            size: voxelArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Uint32Array(voxelBuffer.getMappedRange()).set(voxelArray);
        voxelBuffer.unmap();
        
        const vertexBufferSize = 1000000 * 4 * 3; // 1M vertices * 3 components * 4 bytes
        const vertexBuffer = this.webgpuDevice.createBuffer({
            size: vertexBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        
        const normalBufferSize = 1000000 * 4 * 3;
        const normalBuffer = this.webgpuDevice.createBuffer({
            size: normalBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        
        const indexBufferSize = 1000000 * 4;
        const indexBuffer = this.webgpuDevice.createBuffer({
            size: indexBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        
        // Create uniform buffer
        const uniformData = new Float32Array([chunkX, chunkZ, 0]);
        const uniformBuffer = this.webgpuDevice.createBuffer({
            size: uniformData.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(uniformBuffer.getMappedRange()).set(uniformData);
        uniformBuffer.unmap();
        
        // Create bind group
        const bindGroup = this.webgpuDevice.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: voxelBuffer } },
                { binding: 1, resource: { buffer: vertexBuffer } },
                { binding: 2, resource: { buffer: normalBuffer } },
                { binding: 3, resource: { buffer: indexBuffer } },
                { binding: 4, resource: { buffer: uniformBuffer } }
            ]
        });
        
        // Dispatch compute shader
        const commandEncoder = this.webgpuDevice.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        
        passEncoder.setPipeline(this.computePipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(2, 2, 4); // 16x16x64 / 8x8x1 = 2x2x4 workgroups
        
        passEncoder.end();
        
        this.webgpuDevice.queue.submit([commandEncoder.finish()]);
        
        // Read back results and create Three.js mesh
        await this.webgpuDevice.queue.onSubmittedWorkDone();
        
        // For now, fall back to CPU rendering for mesh creation
        // Full WebGPU integration would require more complex buffer management
        this.buildChunkMeshCPU(chunkX, chunkZ, chunkData);
    }

    /**
     * Build chunk mesh using CPU (fallback)
     */
    buildChunkMeshCPU(chunkX, chunkZ, chunkData) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];
        
        let vertexCount = 0;
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let y = 0; y < MAX_DEPTH; y++) {
                    const worldX = chunkX * CHUNK_SIZE + x;
                    const worldZ = chunkZ * CHUNK_SIZE + z;
                    const voxelKey = `${worldX},${y},${worldZ}`;
                    
                    const voxel = chunkData.get(voxelKey);
                    if (!voxel) continue;
                    
                    const faces = this.getVisibleFaces(worldX, y, worldZ);
                    if (faces.length === 0) continue;
                    
                    this.addVoxelGeometry(
                        vertices, normals, colors, indices,
                        worldX, y, worldZ, voxel.type, faces, vertexCount
                    );
                    vertexCount += faces.length * 4;
                }
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.meshes.has(chunkKey)) {
            this.game.scene.remove(this.meshes.get(chunkKey));
            this.meshes.get(chunkKey).geometry.dispose();
        }
        
        this.game.scene.add(mesh);
        this.meshes.set(chunkKey, mesh);
    }

    /**
     * Get voxel type code for WebGPU
     */
    getVoxelTypeCode(type) {
        const typeMap = {
            'stone': 1,
            'dirt': 2,
            'grass': 3,
            'sand': 4,
            'water': 5,
            'ore': 6,
            'bedrock': 7
        };
        return typeMap[type] || 0;
    }

    /**
     * Get visible faces for a voxel (culling)
     */
    getVisibleFaces(x, y, z) {
        const faces = [];
        const directions = [
            { dir: [1, 0, 0], face: 'right' },
            { dir: [-1, 0, 0], face: 'left' },
            { dir: [0, 1, 0], face: 'top' },
            { dir: [0, -1, 0], face: 'bottom' },
            { dir: [0, 0, 1], face: 'front' },
            { dir: [0, 0, -1], face: 'back' }
        ];
        
        for (const { dir, face } of directions) {
            const neighborKey = `${x + dir[0]},${y + dir[1]},${z + dir[2]}`;
            const neighbor = this.voxelData.get(neighborKey);
            
            if (!neighbor || neighbor.type === 'water') {
                faces.push(face);
            }
        }
        
        return faces;
    }

    /**
     * Add voxel geometry to buffers
     */
    addVoxelGeometry(vertices, normals, colors, indices, x, y, z, type, faces, startVertex) {
        const color = this.materials[type].color;
        const r = color.r;
        const g = color.g;
        const b = color.b;
        
        const faceData = {
            top: {
                vertices: [
                    [x, y + 1, z], [x + 1, y + 1, z],
                    [x + 1, y + 1, z + 1], [x, y + 1, z + 1]
                ],
                normal: [0, 1, 0]
            },
            bottom: {
                vertices: [
                    [x, y, z + 1], [x + 1, y, z + 1],
                    [x + 1, y, z], [x, y, z]
                ],
                normal: [0, -1, 0]
            },
            front: {
                vertices: [
                    [x, y, z + 1], [x, y + 1, z + 1],
                    [x + 1, y + 1, z + 1], [x + 1, y, z + 1]
                ],
                normal: [0, 0, 1]
            },
            back: {
                vertices: [
                    [x + 1, y, z], [x + 1, y + 1, z],
                    [x, y + 1, z], [x, y, z]
                ],
                normal: [0, 0, -1]
            },
            right: {
                vertices: [
                    [x + 1, y, z + 1], [x + 1, y + 1, z + 1],
                    [x + 1, y + 1, z], [x + 1, y, z]
                ],
                normal: [1, 0, 0]
            },
            left: {
                vertices: [
                    [x, y, z], [x, y + 1, z],
                    [x, y + 1, z + 1], [x, y, z + 1]
                ],
                normal: [-1, 0, 0]
            }
        };
        
        for (const face of faces) {
            const data = faceData[face];
            if (!data) continue;
            
            for (const vertex of data.vertices) {
                vertices.push(...vertex);
                normals.push(...data.normal);
                colors.push(r, g, b);
            }
            
            const idx = startVertex;
            indices.push(
                idx, idx + 1, idx + 2,
                idx, idx + 2, idx + 3
            );
            startVertex += 4;
        }
    }

    /**
     * Destroy a voxel at the given position
     */
    destroyVoxel(x, y, z, damage = 100) {
        const voxelKey = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        const voxel = this.voxelData.get(voxelKey);
        
        if (!voxel || voxel.type === 'bedrock') {
            return false;
        }
        
        voxel.health -= damage;
        
        if (voxel.health <= 0) {
            this.voxelData.delete(voxelKey);
            this.modifiedVoxels.add(voxelKey);
            
            // Update chunk
            const chunkX = Math.floor(x / CHUNK_SIZE);
            const chunkZ = Math.floor(z / CHUNK_SIZE);
            const chunkKey = `${chunkX},${chunkZ}`;
            const chunkData = this.chunks.get(chunkKey);
            
            if (chunkData) {
                chunkData.delete(voxelKey);
                this.buildChunkMesh(chunkX, chunkZ);
            }
            
            // Drop items/resources
            this.dropResource(voxel.type, x, y, z);
            
            // Update physics
            this.updatePhysicsBody(x, y, z);
            
            return true;
        }
        
        return false;
    }

    /**
     * Place a voxel at the given position
     */
    placeVoxel(x, y, z, type) {
        const voxelKey = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        
        if (this.voxelData.has(voxelKey)) {
            return false;
        }
        
        const voxel = {
            type,
            health: this.getVoxelHealth(type),
            modified: true
        };
        
        this.voxelData.set(voxelKey, voxel);
        this.modifiedVoxels.add(voxelKey);
        
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunkData = this.chunks.get(chunkKey);
        
        if (chunkData) {
            chunkData.set(voxelKey, voxel);
            this.buildChunkMesh(chunkX, chunkZ);
        }
        
        return true;
    }

    /**
     * Drop resource when voxel is destroyed
     */
    dropResource(type, x, y, z) {
        const resourceMap = {
            stone: 'stone',
            dirt: 'dirt',
            grass: 'dirt',
            sand: 'sand',
            ore: 'gold_ore'
        };
        
        const resource = resourceMap[type];
        if (resource) {
            this.game.events.emit('voxel_destroyed', {
                type: resource,
                position: { x, y, z },
                amount: type === 'ore' ? Math.floor(Math.random() * 3) + 1 : 1
            });
        }
    }

    /**
     * Update physics body for voxel changes
     */
    updatePhysicsBody(x, y, z) {
        if (!this.physicsWorld) return;
        
        // Remove old physics body and create new collision shape
        // This would integrate with your physics engine (Cannon.js, Ammo.js, etc.)
    }

    /**
     * Create underground base/cave system
     */
    createUndergroundBase(centerX, centerZ, radius, depth) {
        const voxelsToRemove = [];
        
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                for (let y = depth - radius; y <= depth + radius; y++) {
                    const dist = Math.sqrt(x * x + z * z + (y - depth) * (y - depth));
                    
                    if (dist < radius) {
                        const worldX = centerX + x;
                        const worldZ = centerZ + z;
                        const voxelKey = `${worldX},${y},${worldZ}`;
                        
                        if (this.voxelData.has(voxelKey)) {
                            voxelsToRemove.push({ x: worldX, y, z: worldZ });
                        }
                    }
                }
            }
        }
        
        // Remove voxels to create cave
        for (const voxel of voxelsToRemove) {
            this.destroyVoxel(voxel.x, voxel.y, voxel.z, 9999);
        }
        
        return {
            center: { x: centerX, y: depth, z: centerZ },
            radius,
            voxelCount: voxelsToRemove.length
        };
    }

    /**
     * Raycast to find voxel at position
     */
    raycast(origin, direction, maxDistance = 100) {
        const step = 0.1;
        const pos = origin.clone();
        let prevPos = pos.clone();
        
        for (let i = 0; i < maxDistance / step; i++) {
            const voxelKey = `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`;
            
            if (this.voxelData.has(voxelKey)) {
                return {
                    position: pos.clone(),
                    voxelPosition: {
                        x: Math.floor(pos.x),
                        y: Math.floor(pos.y),
                        z: Math.floor(pos.z)
                    },
                    normal: prevPos.sub(pos).normalize(),
                    type: this.voxelData.get(voxelKey).type
                };
            }
            
            prevPos = pos.clone();
            pos.add(direction.clone().multiplyScalar(step));
        }
        
        return null;
    }

    /**
     * Get terrain data for serialization
     */
    getTerrainData() {
        const data = {};
        
        for (const [key, voxel] of this.voxelData.entries()) {
            if (voxel.modified) {
                data[key] = voxel;
            }
        }
        
        return {
            modifiedVoxels: data,
            chunks: Array.from(this.chunks.keys())
        };
    }

    /**
     * Load terrain data from save
     */
    loadTerrainData(data) {
        if (!data) return;
        
        for (const [key, voxel] of Object.entries(data.modifiedVoxels || {})) {
            this.voxelData.set(key, voxel);
            this.modifiedVoxels.add(key);
            
            const [x, y, z] = key.split(',').map(Number);
            const chunkX = Math.floor(x / CHUNK_SIZE);
            const chunkZ = Math.floor(z / CHUNK_SIZE);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            let chunkData = this.chunks.get(chunkKey);
            if (!chunkData) {
                chunkData = new Map();
                this.chunks.set(chunkKey, chunkData);
            }
            
            chunkData.set(key, voxel);
        }
        
        // Rebuild modified chunks
        for (const chunkKey of data.chunks || []) {
            const [x, z] = chunkKey.split(',').map(Number);
            this.buildChunkMesh(x, z);
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        for (const mesh of this.meshes.values()) {
            this.game.scene.remove(mesh);
            mesh.geometry.dispose();
        }
        this.meshes.clear();
        this.chunks.clear();
        this.voxelData.clear();
    }
}

export default VoxelTerrainSystem;
