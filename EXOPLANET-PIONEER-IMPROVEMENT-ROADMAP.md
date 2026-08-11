# 🚀 Exoplanet Pioneer - Comprehensive Improvement Roadmap

**Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Strategic Planning Phase  
**Estimated Timeline:** 12-18 months for full implementation  
**Priority:** High Performance & Architecture Refactoring

---

## 📋 Executive Summary

This roadmap provides a detailed, actionable plan to transform Exoplanet Pioneer from its current state into a production-ready, scalable, and maintainable game platform. The improvements focus on five core pillars:

1. **Architecture Modernization** - Build system, module organization, dependency management
2. **Performance Optimization** - Rendering, memory management, asset loading
3. **Code Quality & Maintainability** - Testing, documentation, type safety
4. **Game Systems Refinement** - Feature balance, progressive complexity, UX polish
5. **Infrastructure & Reliability** - Error handling, offline support, data management

**Key Metrics for Success:**
- Reduce initial load time by 60%
- Achieve 60 FPS on mid-range devices
- 90%+ code coverage for core systems
- Zero critical bugs in production
- Sub-100ms response times for all user interactions

---

## 🎯 Phase 1: Foundation & Architecture (Weeks 1-8)

### 1.1 Build System Implementation

**Current State:**
- 50+ individual script files loaded via HTTP
- No bundling, minification, or optimization
- Hardcoded version strings throughout codebase
- No development/production environment separation

**Target State:**
- Modern build pipeline with Vite
- Automatic code splitting and lazy loading
- Environment-specific configurations
- Optimized production builds with tree-shaking

#### Implementation Steps

**Week 1-2: Vite Setup & Migration**
```bash
# Initialize Vite project
npm create vite@latest exoplanet-pioneer -- --template vanilla

# Install core dependencies
npm install three @types/three
npm install -D vite-plugin-compression vite-plugin-pwa
npm install -D @vitejs/plugin-legacy
```

**Configuration File Structure:**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    viteSingleFile()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'game-core': [
            './src/core/Game.js',
            './src/core/GameState.js'
          ],
          'systems': [
            './src/systems/ProductionSystem.js',
            './src/systems/EconomySystem.js'
          ],
          'ui': [
            './src/ui/UIManager.js',
            './src/ui/ResourcePanel.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

**File Structure Reorganization:**
```
src/
├── core/
│   ├── Game.js
│   ├── GameState.js
│   ├── EventBus.js
│   └── DependencyContainer.js
├── systems/
│   ├── production/
│   │   ├── ProductionSystem.js
│   │   ├── CraftingManager.js
│   │   └── LogisticsEngine.js
│   ├── economy/
│   │   ├── EconomySystem.js
│   │   ├── MarketManager.js
│   │   └── TradeSystem.js
│   └── ...
├── entities/
│   ├── Building.js
│   ├── Colonist.js
│   └── Ship.js
├── ui/
│   ├── UIManager.js
│   ├── components/
│   │   ├── ResourcePanel.js
│   │   ├── BuildingMenu.js
│   │   └── ...
│   └── styles/
├── utils/
│   ├── Logger.js
│   ├── ErrorHandler.js
│   └── MathUtils.js
└── assets/
    ├── models/
    ├── textures/
    └── sounds/
```

**Week 3-4: Module Migration Strategy**

**Migration Order:**
1. Core systems (Game, GameState, EventBus)
2. Utility modules (Logger, ErrorHandler, MathUtils)
3. Game systems (Production, Economy, Combat)
4. UI components
5. Asset loaders and managers

**Migration Template:**
```javascript
// Before: Global variable
class EconomyManager {
  constructor(game) {
    this.game = game;
  }
}

// After: ES Module with dependency injection
import { EventEmitter } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';

export class EconomySystem extends EventEmitter {
  #gameState;
  #logger;

  constructor(gameState, logger = new Logger('EconomySystem')) {
    super();
    this.#gameState = gameState;
    this.#logger = logger;
  }

  // Private methods using # syntax
  #calculatePrice(resource) {
    // Implementation
  }
}
```

**Week 5-6: Dependency Injection System**

**Container Implementation:**
```javascript
// src/core/DependencyContainer.js
export class DependencyContainer {
  #services = new Map();
  #factories = new Map();

  register(name, instance) {
    this.#services.set(name, instance);
    return this;
  }

  registerFactory(name, factory) {
    this.#factories.set(name, factory);
    return this;
  }

  get(name) {
    if (this.#services.has(name)) {
      return this.#services.get(name);
    }
    if (this.#factories.has(name)) {
      const factory = this.#factories.get(name);
      const instance = factory(this);
      this.#services.set(name, instance);
      return instance;
    }
    throw new Error(`Service not found: ${name}`);
  }

  has(name) {
    return this.#services.has(name) || this.#factories.has(name);
  }
}

// Usage
const container = new DependencyContainer();
container
  .register('gameState', new GameState())
  .registerFactory('economySystem', (c) => 
    new EconomySystem(c.get('gameState'))
  );

const economy = container.get('economySystem');
```

**Week 7-8: Environment Configuration**

**Config Files:**
```javascript
// config/development.js
export default {
  api: {
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    nasa: 'https://exoplanetarchive.ipac.caltech.edu'
  },
  logging: {
    level: 'debug',
    console: true,
    remote: false
  },
  performance: {
    enableProfiling: true,
    showFPS: true
  }
};

// config/production.js
export default {
  api: {
    gemini: process.env.GEMINI_API_URL,
    nasa: 'https://exoplanetarchive.ipac.caltech.edu'
  },
  logging: {
    level: 'error',
    console: false,
    remote: true
  },
  performance: {
    enableProfiling: false,
    showFPS: false
  }
};
```

**Deliverables:**
- ✅ Vite build pipeline configured
- ✅ All modules migrated to ES6
- ✅ Dependency injection system implemented
- ✅ Environment-specific configurations
- ✅ Automated build scripts
- ✅ Development and production builds tested

**Success Criteria:**
- Build time under 30 seconds
- Production bundle size reduced by 40%
- Zero build errors
- All existing functionality preserved

---

### 1.2 State Management System

**Current State:**
- Direct object manipulation throughout codebase
- No centralized state management
- Difficult to track state changes
- No state history or undo functionality

**Target State:**
- Centralized state store with Redux-like architecture
- Immutable state updates
- State change logging and debugging
- Time-travel debugging capability

#### Implementation

**Week 1-2: State Store Implementation**
```javascript
// src/core/StateStore.js
import { EventEmitter } from './EventBus.js';

export class StateStore extends EventEmitter {
  #state;
  #history = [];
  #historyIndex = -1;
  #maxHistory = 100;

  constructor(initialState) {
    super();
    this.#state = this.#deepFreeze(initialState);
  }

  getState() {
    return this.#state;
  }

  // Immutable state update
  setState(updater) {
    const prevState = this.#state;
    const nextState = typeof updater === 'function' 
      ? updater(prevState)
      : { ...prevState, ...updater };
    
    this.#state = this.#deepFreeze(nextState);
    
    // Add to history
    this.#history = this.#history.slice(0, this.#historyIndex + 1);
    this.#history.push(prevState);
    if (this.#history.length > this.#maxHistory) {
      this.#history.shift();
    }
    this.#historyIndex = this.#history.length - 1;
    
    // Emit change event
    this.emit('stateChanged', {
      prevState,
      nextState,
      changes: this.#getChanges(prevState, nextState)
    });
  }

  undo() {
    if (this.#historyIndex >= 0) {
      const prevState = this.#history[this.#historyIndex];
      this.#state = this.#deepFreeze(prevState);
      this.#historyIndex--;
      this.emit('stateUndone', { state: this.#state });
    }
  }

  redo() {
    if (this.#historyIndex < this.#history.length - 1) {
      this.#historyIndex++;
      const nextState = this.#history[this.#historyIndex];
      this.#state = this.#deepFreeze(nextState);
      this.emit('stateRedone', { state: this.#state });
    }
  }

  #deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    const frozen = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      frozen[key] = this.#deepFreeze(obj[key]);
    }
    return Object.freeze(frozen);
  }

  #getChanges(prev, next) {
    // Implementation to detect changes
    // Returns array of changed paths
  }
}
```

**Week 3-4: State Slices**
```javascript
// src/state/slices/ResourceSlice.js
export const initialResourceState = {
  energy: 100,
  minerals: 50,
  food: 20,
  alloys: 0,
  circuits: 0,
  data: 0,
  credits: 1000
};

export const resourceSelectors = {
  getResource: (state, resource) => state.resources[resource],
  getAllResources: (state) => state.resources,
  canAfford: (state, costs) => {
    return Object.entries(costs).every(([res, amount]) => 
      state.resources[res] >= amount
    );
  }
};

export const resourceActions = {
  addResource: (resource, amount) => (state) => ({
    ...state,
    resources: {
      ...state.resources,
      [resource]: state.resources[resource] + amount
    }
  }),
  
  spendResources: (costs) => (state) => {
    const newResources = { ...state.resources };
    Object.entries(costs).forEach(([res, amount]) => {
      newResources[res] -= amount;
    });
    return { ...state, resources: newResources };
  }
};
```

**Week 5-6: State Persistence**
```javascript
// src/core/StateManager.js
import { StateStore } from './StateStore.js';
import { LocalStorage } from '../utils/Storage.js';

export class StateManager {
  #store;
  #storage;
  #autoSaveInterval = 30000; // 30 seconds

  constructor(initialState, storage = new LocalStorage()) {
    this.#store = new StateStore(initialState);
    this.#storage = storage;
    this.#setupAutoSave();
  }

  #setupAutoSave() {
    setInterval(() => this.save(), this.#autoSaveInterval);
  }

  save(name = 'autosave') {
    const state = this.#store.getState();
    const saveData = {
      timestamp: Date.now(),
      version: '1.0.0',
      state
    };
    this.#storage.setItem(`save_${name}`, JSON.stringify(saveData));
  }

  async load(name = 'autosave') {
    const data = await this.#storage.getItem(`save_${name}`);
    if (data) {
      const parsed = JSON.parse(data);
      this.#store.setState(parsed.state);
      return true;
    }
    return false;
  }

  getStore() {
    return this.#store;
  }
}
```

**Deliverables:**
- ✅ Immutable state store
- ✅ State selectors and actions
- ✅ Undo/redo functionality
- ✅ Auto-save system
- ✅ Save/load from localStorage
- ✅ State change logging

---

## ⚡ Phase 2: Performance Optimization (Weeks 9-16)

### 2.1 Object Pooling System

**Current State:**
- New objects created every frame for particles, projectiles
- Garbage collection spikes causing frame drops
- No reuse of temporary objects

**Target State:**
- Object pools for frequently created objects
- Automatic pool management
- Memory usage reduced by 60%

#### Implementation

**Week 1-2: Generic Object Pool**
```javascript
// src/utils/ObjectPool.js
export class ObjectPool {
  #factory;
  #reset;
  #pool = [];
  #active = new Set();
  #maxSize = 1000;

  constructor(factory, reset, maxSize = 1000) {
    this.#factory = factory;
    this.#reset = reset;
    this.#maxSize = maxSize;
  }

  acquire(...args) {
    let obj;
    if (this.#pool.length > 0) {
      obj = this.#pool.pop();
    } else {
      obj = this.#factory(...args);
    }
    this.#active.add(obj);
    return obj;
  }

  release(obj) {
    if (this.#active.has(obj)) {
      this.#active.delete(obj);
      this.#reset(obj);
      if (this.#pool.length < this.#maxSize) {
        this.#pool.push(obj);
      }
    }
  }

  get activeCount() {
    return this.#active.size;
  }

  get poolCount() {
    return this.#pool.length;
  }

  clear() {
    this.#pool = [];
    this.#active.clear();
  }
}

// Usage for particles
const particlePool = new ObjectPool(
  () => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    life: 1.0,
    color: new THREE.Color()
  }),
  (particle) => {
    particle.position.set(0, 0, 0);
    particle.velocity.set(0, 0, 0);
    particle.life = 1.0;
    particle.color.setHex(0xffffff);
  },
  500
);

// In game loop
function spawnParticle(position, velocity, color) {
  const particle = particlePool.acquire();
  particle.position.copy(position);
  particle.velocity.copy(velocity);
  particle.color.copy(color);
  return particle;
}

function updateParticles(deltaTime) {
  particles.forEach(particle => {
    particle.position.addScaledVector(particle.velocity, deltaTime);
    particle.life -= deltaTime;
    
    if (particle.life <= 0) {
      particlePool.release(particle);
    }
  });
}
```

**Week 3-4: Specialized Pools**
```javascript
// src/pools/ProjectilePool.js
export class ProjectilePool extends ObjectPool {
  constructor(scene) {
    super(
      () => {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        scene.add(mesh);
        return {
          mesh,
          velocity: new THREE.Vector3(),
          damage: 10,
          lifetime: 2.0,
          owner: null
        };
      },
      (projectile) => {
        projectile.mesh.visible = false;
        projectile.mesh.position.set(0, 0, 0);
        projectile.velocity.set(0, 0, 0);
        projectile.damage = 10;
        projectile.lifetime = 2.0;
        projectile.owner = null;
      },
      100
    );
    this.scene = scene;
  }

  fire(position, direction, speed, damage, owner) {
    const projectile = this.acquire();
    projectile.mesh.visible = true;
    projectile.mesh.position.copy(position);
    projectile.velocity.copy(direction).multiplyScalar(speed);
    projectile.damage = damage;
    projectile.lifetime = 2.0;
    projectile.owner = owner;
    return projectile;
  }
}
```

**Week 5-6: Pool Manager**
```javascript
// src/core/PoolManager.js
import { ObjectPool } from '../utils/ObjectPool.js';
import { ProjectilePool } from '../pools/ProjectilePool.js';
import { ParticlePool } from '../pools/ParticlePool.js';

export class PoolManager {
  #pools = new Map();

  register(name, pool) {
    this.#pools.set(name, pool);
  }

  get(name) {
    return this.#pools.get(name);
  }

  update(deltaTime) {
    this.#pools.forEach(pool => {
      if (pool.update) {
        pool.update(deltaTime);
      }
    });
  }

  getStats() {
    const stats = {};
    this.#pools.forEach((pool, name) => {
      stats[name] = {
        active: pool.activeCount,
        pooled: pool.poolCount,
        total: pool.activeCount + pool.poolCount
      };
    });
    return stats;
  }
}

// Initialize in game
const poolManager = new PoolManager();
poolManager.register('projectiles', new ProjectilePool(scene));
poolManager.register('particles', new ParticlePool(scene));
```

---

### 2.2 Web Workers Integration

**Current State:**
- All computation on main thread
- Frame drops during complex calculations
- Noise generation blocks UI

**Target State:**
- Heavy computations in Web Workers
- Non-blocking game loop
- Parallel processing for independent tasks

#### Implementation

**Week 1-2: Worker Infrastructure**
```javascript
// src/workers/NoiseGeneratorWorker.js
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  if (type === 'generateNoise') {
    const { width, height, seed, octaves, persistence } = data;
    const result = generateNoiseMap(width, height, seed, octaves, persistence);
    self.postMessage({ type: 'noiseComplete', data: result }, [result.buffer]);
  }
};

function generateNoiseMap(width, height, seed, octaves, persistence) {
  const size = width * height;
  const buffer = new Float32Array(size);
  
  // Perlin noise implementation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;
      
      for (let i = 0; i < octaves; i++) {
        value += noise(x * frequency, y * frequency, seed) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }
      
      buffer[y * width + x] = value / maxValue;
    }
  }
  
  return buffer;
}

function noise(x, y, seed) {
  // Simplified noise function
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}
```

**Week 3-4: Worker Manager**
```javascript
// src/core/WorkerManager.js
export class WorkerManager {
  #workers = new Map();
  #pendingTasks = new Map();
  #taskCounter = 0;

  constructor() {
    this.#initializeWorkers();
  }

  #initializeWorkers() {
    this.#registerWorker('noise', new Worker('./workers/NoiseGeneratorWorker.js'));
    this.#registerWorker('pathfinding', new Worker('./workers/PathfindingWorker.js'));
    this.#registerWorker('physics', new Worker('./workers/PhysicsWorker.js'));
  }

  #registerWorker(name, worker) {
    worker.onmessage = (e) => {
      const { taskId, result } = e.data;
      const task = this.#pendingTasks.get(taskId);
      if (task) {
        task.resolve(result);
        this.#pendingTasks.delete(taskId);
      }
    };
    this.#workers.set(name, worker);
  }

  async execute(workerName, type, data, transferables = []) {
    const worker = this.#workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker not found: ${workerName}`);
    }

    const taskId = this.#taskCounter++;
    
    return new Promise((resolve, reject) => {
      this.#pendingTasks.set(taskId, { resolve, reject });
      
      worker.postMessage({
        taskId,
        type,
        data
      }, transferables);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.#pendingTasks.has(taskId)) {
          this.#pendingTasks.delete(taskId);
          reject(new Error(`Task timeout: ${taskId}`));
        }
      }, 30000);
    });
  }

  terminateAll() {
    this.#workers.forEach(worker => worker.terminate());
    this.#workers.clear();
  }
}

// Usage in planet generator
class PlanetGenerator {
  constructor(workerManager) {
    this.workerManager = workerManager;
  }

  async generatePlanet(seed) {
    const noiseMap = await this.workerManager.execute(
      'noise',
      'generateNoise',
      {
        width: 512,
        height: 512,
        seed,
        octaves: 6,
        persistence: 0.5
      }
    );
    
    return this.createPlanetFromNoise(noiseMap);
  }
}
```

**Week 5-6: Parallel Task System**
```javascript
// src/core/TaskScheduler.js
export class TaskScheduler {
  #workerManager;
  #maxConcurrent = 4;
  #activeTasks = 0;
  #queue = [];

  constructor(workerManager, maxConcurrent = 4) {
    this.#workerManager = workerManager;
    this.#maxConcurrent = maxConcurrent;
  }

  async schedule(workerName, type, data, transferables = []) {
    return new Promise((resolve, reject) => {
      this.#queue.push({
        workerName,
        type,
        data,
        transferables,
        resolve,
        reject
      });
      this.#processQueue();
    });
  }

  async #processQueue() {
    if (this.#activeTasks >= this.#maxConcurrent || this.#queue.length === 0) {
      return;
    }

    const task = this.#queue.shift();
    this.#activeTasks++;

    try {
      const result = await this.#workerManager.execute(
        task.workerName,
        task.type,
        task.data,
        task.transferables
      );
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.#activeTasks--;
      this.#processQueue();
    }
  }

  async scheduleAll(tasks) {
    return Promise.all(
      tasks.map(task => 
        this.schedule(task.workerName, task.type, task.data, task.transferables)
      )
    );
  }
}
```

---

### 2.3 Asset Loading & Optimization

**Current State:**
- All assets loaded at startup
- No lazy loading
- No asset compression
- No progressive loading

**Target State:**
- Lazy loading on demand
- Compressed textures (WebP, ASTC)
- Asset preloading for critical path
- Progressive quality loading

#### Implementation

**Week 1-2: Asset Loader**
```javascript
// src/assets/AssetLoader.js
export class AssetLoader {
  #cache = new Map();
  #loading = new Map();

  async load(url, type = 'json') {
    // Check cache
    if (this.#cache.has(url)) {
      return this.#cache.get(url);
    }

    // Check if already loading
    if (this.#loading.has(url)) {
      return this.#loading.get(url);
    }

    // Start loading
    const promise = this.#loadAsset(url, type);
    this.#loading.set(url, promise);

    try {
      const asset = await promise;
      this.#cache.set(url, asset);
      this.#loading.delete(url);
      return asset;
    } catch (error) {
      this.#loading.delete(url);
      throw error;
    }
  }

  async #loadAsset(url, type) {
    switch (type) {
      case 'json':
        return this.#loadJSON(url);
      case 'texture':
        return this.#loadTexture(url);
      case 'model':
        return this.#loadModel(url);
      case 'audio':
        return this.#loadAudio(url);
      default:
        throw new Error(`Unknown asset type: ${type}`);
    }
  }

  async #loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url}`);
    }
    return response.json();
  }

  async #loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.encoding = THREE.sRGBEncoding;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  async #loadModel(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }

  async #loadAudio(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await new AudioContext().decodeAudioData(arrayBuffer);
  }

  preload(urls) {
    return Promise.all(urls.map(url => this.load(url)));
  }

  clearCache() {
    this.#cache.clear();
  }
}
```

**Week 3-4: Asset Bundle System**
```javascript
// src/assets/AssetBundle.js
export class AssetBundle {
  #loader;
  #manifest;

  constructor(loader, manifest) {
    this.#loader = loader;
    this.#manifest = manifest;
  }

  async loadBundle(bundleName) {
    const bundle = this.#manifest.bundles[bundleName];
    if (!bundle) {
      throw new Error(`Bundle not found: ${bundleName}`);
    }

    const assets = {};
    for (const [name, url] of Object.entries(bundle.assets)) {
      assets[name] = await this.#loader.load(url, bundle.type);
    }

    return assets;
  }

  async loadCritical() {
    return this.loadBundle('critical');
  }

  async loadUI() {
    return this.loadBundle('ui');
  }

  async loadGameplay() {
    return this.loadBundle('gameplay');
  }
}

// manifest.json
{
  "bundles": {
    "critical": {
      "type": "texture",
      "assets": {
        "ui-panel": "/assets/textures/ui/panel.png",
        "ui-button": "/assets/textures/ui/button.png"
      }
    },
    "ui": {
      "type": "texture",
      "assets": {
        "icon-solar": "/assets/textures/icons/solar.png",
        "icon-hab": "/assets/textures/icons/hab.png"
      }
    },
    "gameplay": {
      "type": "model",
      "assets": {
        "building-solar": "/assets/models/buildings/solar.glb",
        "building-hab": "/assets/models/buildings/hab.glb"
      }
    }
  }
}
```

**Week 5-6: Progressive Texture Loading**
```javascript
// src/assets/ProgressiveTextureLoader.js
export class ProgressiveTextureLoader {
  #loader;

  constructor(loader) {
    this.#loader = loader;
  }

  async loadProgressive(baseUrl, qualityLevels = ['low', 'medium', 'high']) {
    // Load lowest quality first
    const lowTexture = await this.#loader.loadTexture(
      `${baseUrl}_low.webp`
    );
    
    // Return immediately with low quality
    const result = {
      texture: lowTexture,
      quality: 'low',
      promise: this.#loadHigherQualities(baseUrl, qualityLevels.slice(1))
    };

    // Load higher qualities in background
    result.promise.then(higherTextures => {
      if (higherTextures.high) {
        result.texture = higherTextures.high;
        result.quality = 'high';
      }
    });

    return result;
  }

  async #loadHigherQualities(baseUrl, qualityLevels) {
    const textures = {};
    
    for (const quality of qualityLevels) {
      try {
        textures[quality] = await this.#loader.loadTexture(
          `${baseUrl}_${quality}.webp`
        );
      } catch (error) {
        console.warn(`Failed to load ${quality} quality for ${baseUrl}`);
      }
    }

    return textures;
  }
}
```

---

## 🧪 Phase 3: Code Quality & Testing (Weeks 17-24)

### 3.1 Unit Testing Framework

**Current State:**
- No unit tests
- Only basic E2E tests with Playwright
- No test coverage metrics

**Target State:**
- 90%+ code coverage
- Comprehensive unit tests
- Integration tests
- Performance regression tests

#### Implementation

**Week 1-2: Test Setup**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/dom @testing-library/user-event
```

**Configuration:**
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    }
  }
});
```

**Week 3-4: Core System Tests**
```javascript
// tests/core/StateStore.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { StateStore } from '../../src/core/StateStore.js';

describe('StateStore', () => {
  let store;

  beforeEach(() => {
    store = new StateStore({
      resources: { energy: 100, minerals: 50 }
    });
  });

  it('should return initial state', () => {
    const state = store.getState();
    expect(state.resources.energy).toBe(100);
    expect(state.resources.minerals).toBe(50);
  });

  it('should update state immutably', () => {
    const prevState = store.getState();
    store.setState(state => ({
      ...state,
      resources: {
        ...state.resources,
        energy: state.resources.energy + 10
      }
    }));

    const newState = store.getState();
    expect(newState.resources.energy).toBe(110);
    expect(prevState).not.toBe(newState);
    expect(prevState.resources).not.toBe(newState.resources);
  });

  it('should support undo', () => {
    store.setState(state => ({
      ...state,
      resources: {
        ...state.resources,
        energy: 200
      }
    }));

    expect(store.getState().resources.energy).toBe(200);
    
    store.undo();
    expect(store.getState().resources.energy).toBe(100);
  });

  it('should emit state change events', () => {
    let capturedChange = null;
    store.on('stateChanged', (change) => {
      capturedChange = change;
    });

    store.setState(state => ({
      ...state,
      resources: {
        ...state.resources,
        energy: 150
      }
    }));

    expect(capturedChange).not.toBeNull();
    expect(capturedChange.nextState.resources.energy).toBe(150);
  });
});
```

**Week 5-6: System Tests**
```javascript
// tests/systems/EconomySystem.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EconomySystem } from '../../src/systems/economy/EconomySystem.js';
import { StateStore } from '../../src/core/StateStore.js';

describe('EconomySystem', () => {
  let economy;
  let mockStore;

  beforeEach(() => {
    mockStore = {
      getState: () => ({
        resources: { energy: 100, minerals: 50, credits: 1000 },
        market: {
          prices: { energy: 1.0, minerals: 2.0 }
        }
      }),
      setState: vi.fn()
    };

    economy = new EconomySystem(mockStore);
  });

  it('should calculate correct trade value', () => {
    const value = economy.calculateTradeValue({
      energy: 10,
      minerals: 5
    });

    expect(value).toBe(20); // 10 * 1.0 + 5 * 2.0
  });

  it('should validate sufficient funds', () => {
    const canAfford = economy.canAfford({
      energy: 50,
      minerals: 30
    });

    expect(canAfford).toBe(true);
  });

  it('should reject insufficient funds', () => {
    const canAfford = economy.canAfford({
      energy: 150,
      minerals: 30
    });

    expect(canAfford).toBe(false);
  });

  it('should execute trade successfully', () => {
    const result = economy.executeTrade({
      buy: { energy: 10 },
      sell: { credits: 20 }
    });

    expect(result.success).toBe(true);
    expect(mockStore.setState).toHaveBeenCalled();
  });
});
```

**Week 7-8: Integration Tests**
```javascript
// tests/integration/ProductionFlow.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../src/core/Game.js';
import { ProductionSystem } from '../../src/systems/production/ProductionSystem.js';

describe('Production Flow Integration', () => {
  let game;
  let production;

  beforeEach(async () => {
    game = new Game();
    await game.initialize();
    production = game.getSystem('production');
  });

  it('should complete full production cycle', async () => {
    // Build solar array
    const building = await production.build('solar', { x: 0, y: 0 });
    expect(building).toBeDefined();
    expect(building.type).toBe('solar');

    // Wait for production tick
    await game.tick();

    // Check resources increased
    const resources = game.getState().resources;
    expect(resources.energy).toBeGreaterThan(100);
  });

  it('should handle resource constraints', async () => {
    // Try to build without resources
    const result = await production.build('fusion', { x: 0, y: 0 });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('insufficient');
  });
});
```

---

### 3.2 TypeScript Migration

**Current State:**
- Pure JavaScript
- No type safety
- Frequent runtime errors
- Poor IDE autocomplete

**Target State:**
- Full TypeScript coverage
- Strict type checking
- Better developer experience
- Fewer runtime errors

#### Implementation

**Week 1-2: TypeScript Setup**
```bash
npm install -D typescript @types/three
npm install -D tsx ts-node
```

**Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Week 3-4: Type Definitions**
```typescript
// src/types/GameState.ts
export interface ResourceState {
  energy: number;
  minerals: number;
  food: number;
  alloys: number;
  circuits: number;
  data: number;
  credits: number;
}

export interface BuildingState {
  id: string;
  type: BuildingType;
  position: Vector3;
  level: number;
  health: number;
  production: ProductionStats;
}

export interface GameState {
  resources: ResourceState;
  buildings: BuildingState[];
  colonists: ColonistState[];
  day: number;
  paused: boolean;
}

export type BuildingType = 
  | 'solar'
  | 'hab'
  | 'mine'
  | 'fusion'
  | 'storage'
  | 'farm'
  | 'lab'
  | 'refinery';

export interface ProductionStats {
  energy: number;
  minerals: number;
  food: number;
  alloys: number;
  circuits: number;
  data: number;
}

export interface ColonistState {
  id: string;
  name: string;
  role: ColonistRole;
  morale: number;
  health: number;
  skills: SkillSet;
}

export type ColonistRole = 
  | 'engineer'
  | 'scientist'
  | 'farmer'
  | 'soldier'
  | 'worker';

export interface SkillSet {
  engineering: number;
  science: number;
  farming: number;
  combat: number;
  construction: number;
}
```

**Week 5-6: Migrated System Example**
```typescript
// src/systems/economy/EconomySystem.ts
import { EventEmitter } from '@/core/EventBus';
import type { GameState, ResourceState } from '@/types/GameState';
import type { Logger } from '@/utils/Logger';

export interface TradeOffer {
  id: string;
  buy: Partial<ResourceState>;
  sell: Partial<ResourceState>;
  price: number;
}

export class EconomySystem extends EventEmitter {
  #gameState: GameState;
  #logger: Logger;
  #basePrices: Record<keyof ResourceState, number>;

  constructor(gameState: GameState, logger: Logger) {
    super();
    this.#gameState = gameState;
    this.#logger = logger;
    this.#basePrices = {
      energy: 1.0,
      minerals: 2.0,
      food: 1.5,
      alloys: 10.0,
      circuits: 25.0,
      data: 5.0,
      credits: 1.0
    };
  }

  calculateTradeValue(resources: Partial<ResourceState>): number {
    let total = 0;
    
    for (const [resource, amount] of Object.entries(resources)) {
      const key = resource as keyof ResourceState;
      const price = this.#basePrices[key] || 0;
      total += (amount || 0) * price;
    }

    return total;
  }

  canAfford(cost: Partial<ResourceState>): boolean {
    const resources = this.#gameState.resources;
    
    return Object.entries(cost).every(([resource, amount]) => {
      const key = resource as keyof ResourceState;
      return (resources[key] || 0) >= (amount || 0);
    });
  }

  executeTrade(trade: TradeOffer): { success: boolean; reason?: string } {
    if (!this.canAfford(trade.buy)) {
      return {
        success: false,
        reason: 'Insufficient resources'
      };
    }

    const buyValue = this.calculateTradeValue(trade.buy);
    const sellValue = this.calculateTradeValue(trade.sell);

    if (sellValue < buyValue) {
      return {
        success: false,
        reason: 'Trade value mismatch'
      };
    }

    // Execute trade
    this.emit('tradeExecuted', trade);
    return { success: true };
  }
}
```

---

## 🎮 Phase 4: Game Systems Refinement (Weeks 25-36)

### 4.1 Progressive Feature Unlocking

**Current State:**
- All features available from start
- Overwhelming for new players
- No sense of progression

**Target State:**
- Tiered feature unlocking
- Tutorial system
- Gradual complexity increase

#### Implementation

**Week 1-4: Unlock System**
```typescript
// src/systems/UnlockSystem.ts
export interface UnlockRequirement {
  type: 'day' | 'building' | 'resource' | 'research' | 'achievement';
  value: number | string;
}

export interface Unlock {
  id: string;
  name: string;
  description: string;
  requirements: UnlockRequirement[];
  rewards: UnlockReward[];
  unlocked: boolean;
}

export interface UnlockReward {
  type: 'building' | 'technology' | 'feature' | 'resource';
  value: string | number;
}

export class UnlockSystem extends EventEmitter {
  #unlocks: Map<string, Unlock>;
  #gameState: GameState;

  constructor(gameState: GameState) {
    super();
    this.#gameState = gameState;
    this.#unlocks = new Map();
    this.#initializeUnlocks();
  }

  #initializeUnlocks() {
    // Tier 1: Basic buildings
    this.registerUnlock({
      id: 'unlock_solar',
      name: 'Solar Arrays',
      description: 'Construct solar arrays to generate energy',
      requirements: [
        { type: 'day', value: 1 }
      ],
      rewards: [
        { type: 'building', value: 'solar' }
      ],
      unlocked: true
    });

    // Tier 2: Advanced production
    this.registerUnlock({
      id: 'unlock_fusion',
      name: 'Fusion Reactors',
      description: 'Unlock fusion technology for massive energy production',
      requirements: [
        { type: 'building', value: 'solar' },
        { type: 'resource', value: 'data' },
        { type: 'research', value: 'energy_tech_2' }
      ],
      rewards: [
        { type: 'building', value: 'fusion' }
      ],
      unlocked: false
    });

    // Tier 3: Economy features
    this.registerUnlock({
      id: 'unlock_market',
      name: 'Interstellar Market',
      description: 'Access the galactic marketplace',
      requirements: [
        { type: 'day', value: 10 },
        { type: 'resource', value: 'credits' }
      ],
      rewards: [
        { type: 'feature', value: 'market' }
      ],
      unlocked: false
    });
  }

  registerUnlock(unlock: Unlock) {
    this.#unlocks.set(unlock.id, unlock);
  }

  checkUnlocks(): Unlock[] {
    const newlyUnlocked: Unlock[] = [];

    this.#unlocks.forEach(unlock => {
      if (unlock.unlocked) return;

      const canUnlock = unlock.requirements.every(req => 
        this.#checkRequirement(req)
      );

      if (canUnlock) {
        unlock.unlocked = true;
        this.#applyRewards(unlock.rewards);
        newlyUnlocked.push(unlock);
        this.emit('unlocked', unlock);
      }
    });

    return newlyUnlocked;
  }

  #checkRequirement(req: UnlockRequirement): boolean {
    switch (req.type) {
      case 'day':
        return this.#gameState.day >= (req.value as number);
      
      case 'building':
        return this.#gameState.buildings.some(
          b => b.type === req.value
        );
      
      case 'resource':
        const resources = this.#gameState.resources;
        const resource = req.value as keyof ResourceState;
        return (resources[resource] || 0) > 0;
      
      case 'research':
        // Check if technology researched
        return this.#gameState.research?.includes(req.value as string);
      
      case 'achievement':
        // Check if achievement unlocked
        return this.#gameState.achievements?.includes(req.value as string);
      
      default:
        return false;
    }
  }

  #applyRewards(rewards: UnlockReward[]) {
    rewards.forEach(reward => {
      this.emit('rewardGranted', reward);
    });
  }

  isUnlocked(id: string): boolean {
    const unlock = this.#unlocks.get(id);
    return unlock?.unlocked ?? false;
  }

  getAvailableUnlocks(): Unlock[] {
    return Array.from(this.#unlocks.values()).filter(u => !u.unlocked);
  }

  getUnlockedFeatures(): string[] {
    const features: string[] = [];
    
    this.#unlocks.forEach(unlock => {
      if (unlock.unlocked) {
        unlock.rewards.forEach(reward => {
          if (reward.type === 'feature') {
            features.push(reward.value as string);
          }
        });
      }
    });

    return features;
  }
}
```

**Week 5-8: Tutorial System**
```typescript
// src/systems/TutorialSystem.ts
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: TutorialAction;
  condition: TutorialCondition;
  completed: boolean;
}

export interface TutorialAction {
  type: 'click' | 'build' | 'select' | 'wait';
  target?: string;
  duration?: number;
}

export interface TutorialCondition {
  type: 'building_count' | 'resource_amount' | 'day' | 'custom';
  value: number | string;
  check?: (state: GameState) => boolean;
}

export class TutorialSystem extends EventEmitter {
  #tutorials: Map<string, TutorialStep[]>;
  #currentTutorial: string | null = null;
  #currentStep: number = 0;
  #gameState: GameState;

  constructor(gameState: GameState) {
    super();
    this.#gameState = gameState;
    this.#tutorials = new Map();
    this.#initializeTutorials();
  }

  #initializeTutorials() {
    // Basic tutorial
    this.#tutorials.set('basic', [
      {
        id: 'welcome',
        title: 'Welcome to Exoplanet Pioneer',
        description: 'You have landed on a new world. Let\'s start by building a solar array.',
        action: { type: 'click', target: 'build-menu' },
        condition: { type: 'custom', check: () => true },
        completed: false
      },
      {
        id: 'build_solar',
        title: 'Build Solar Array',
        description: 'Click on the Solar Array icon and place it on the map.',
        action: { type: 'build', target: 'solar' },
        condition: { type: 'building_count', value: 1 },
        completed: false
      },
      {
        id: 'wait_production',
        title: 'Wait for Production',
        description: 'Wait for the solar array to generate energy.',
        action: { type: 'wait', duration: 5 },
        condition: { type: 'resource_amount', value: 110 },
        completed: false
      }
    ]);
  }

  startTutorial(tutorialId: string) {
    const tutorial = this.#tutorials.get(tutorialId);
    if (!tutorial) {
      console.warn(`Tutorial not found: ${tutorialId}`);
      return;
    }

    this.#currentTutorial = tutorialId;
    this.#currentStep = 0;
    this.emit('tutorialStarted', { tutorialId, step: tutorial[0] });
  }

  completeStep() {
    if (!this.#currentTutorial) return;

    const tutorial = this.#tutorials.get(this.#currentTutorial);
    if (!tutorial) return;

    const step = tutorial[this.#currentStep];
    step.completed = true;

    this.emit('stepCompleted', step);

    // Move to next step
    this.#currentStep++;
    if (this.#currentStep < tutorial.length) {
      const nextStep = tutorial[this.#currentStep];
      this.emit('nextStep', nextStep);
    } else {
      this.emit('tutorialCompleted', this.#currentTutorial);
      this.#currentTutorial = null;
      this.#currentStep = 0;
    }
  }

  checkProgress() {
    if (!this.#currentTutorial) return;

    const tutorial = this.#tutorials.get(this.#currentTutorial);
    if (!tutorial) return;

    const step = tutorial[this.#currentStep];
    if (step.completed) return;

    const conditionMet = this.#checkCondition(step.condition);
    if (conditionMet) {
      this.completeStep();
    }
  }

  #checkCondition(condition: TutorialCondition): boolean {
    switch (condition.type) {
      case 'building_count':
        const buildingType = condition.value as string;
        const count = this.#gameState.buildings.filter(
          b => b.type === buildingType
        ).length;
        return count > 0;

      case 'resource_amount':
        const resource = condition.value as keyof ResourceState;
        return this.#gameState.resources[resource] > 100;

      case 'day':
        return this.#gameState.day >= (condition.value as number);

      case 'custom':
        return condition.check?.(this.#gameState) ?? false;

      default:
        return false;
    }
  }

  getCurrentStep(): TutorialStep | null {
    if (!this.#currentTutorial) return null;

    const tutorial = this.#tutorials.get(this.#currentTutorial);
    if (!tutorial) return null;

    return tutorial[this.#currentStep] || null;
  }
}
```

---

### 4.2 Economy System Simplification

**Current State:**
- Over-engineered with unused features
- ZKP, black market, stock exchange rarely used
- Confusing for players

**Target State:**
- Streamlined core economy
- Progressive complexity
- Clear value propositions

#### Implementation

**Week 1-4: Core Economy Refactor**
```typescript
// src/systems/economy/CoreEconomy.ts
export interface EconomyConfig {
  enableAdvancedFeatures: boolean;
  enableMarket: boolean;
  enableStockMarket: boolean;
}

export class CoreEconomy extends EventEmitter {
  #gameState: GameState;
  #config: EconomyConfig;
  #prices: Map<keyof ResourceState, number>;

  constructor(gameState: GameState, config: EconomyConfig) {
    super();
    this.#gameState = gameState;
    this.#config = config;
    this.#prices = new Map();
    this.#initializePrices();
  }

  #initializePrices() {
    this.#prices.set('energy', 1.0);
    this.#prices.set('minerals', 2.0);
    this.#prices.set('food', 1.5);
    this.#prices.set('alloys', 10.0);
    this.#prices.set('circuits', 25.0);
    this.#prices.set('data', 5.0);
  }

  // Simple trade without market
  trade(sell: Partial<ResourceState>, buy: Partial<ResourceState>): boolean {
    const sellValue = this.#calculateValue(sell);
    const buyValue = this.#calculateValue(buy);

    if (sellValue < buyValue) {
      return false;
    }

    // Execute trade
    const resources = this.#gameState.resources;
    
    // Remove sold resources
    Object.entries(sell).forEach(([key, amount]) => {
      const resource = key as keyof ResourceState;
      resources[resource] -= amount || 0;
    });

    // Add bought resources
    Object.entries(buy).forEach(([key, amount]) => {
      const resource = key as keyof ResourceState;
      resources[resource] += amount || 0;
    });

    this.emit('tradeCompleted', { sell, buy });
    return true;
  }

  #calculateValue(resources: Partial<ResourceState>): number {
    let total = 0;
    
    Object.entries(resources).forEach(([key, amount]) => {
      const resource = key as keyof ResourceState;
      const price = this.#prices.get(resource) || 0;
      total += (amount || 0) * price;
    });

    return total;
  }

  // Market system (unlocked later)
  async getMarketPrices(): Promise<Map<keyof ResourceState, number>> {
    if (!this.#config.enableMarket) {
      throw new Error('Market not unlocked');
    }

    // Fetch from API or simulate
    return new Map(this.#prices);
  }

  // Stock market (advanced feature)
  async getStockPrices(): Promise<StockData[]> {
    if (!this.#config.enableStockMarket) {
      throw new Error('Stock market not unlocked');
    }

    // Fetch from API
    return [];
  }
}
```

**Week 5-8: Progressive Economy Features**
```typescript
// src/systems/economy/EconomyProgression.ts
export class EconomyProgression {
  #coreEconomy: CoreEconomy;
  #gameState: GameState;

  constructor(coreEconomy: CoreEconomy, gameState: GameState) {
    this.#coreEconomy = coreEconomy;
    this.#gameState = gameState;
  }

  updateConfig() {
    const config: EconomyConfig = {
      enableAdvancedFeatures: this.#checkUnlock('advanced_economy'),
      enableMarket: this.#checkUnlock('market'),
      enableStockMarket: this.#checkUnlock('stock_market')
    };

    this.#coreEconomy.updateConfig(config);
  }

  #checkUnlock(feature: string): boolean {
    // Check if feature is unlocked
    return this.#gameState.unlocks?.includes(feature) ?? false;
  }
}
```

---

## 🎨 Phase 5: UI/UX Improvements (Weeks 37-44)

### 5.1 Accessibility Features

**Current State:**
- No ARIA labels
- No keyboard navigation
- No screen reader support
- Poor color contrast

**Target State:**
- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- Colorblind modes

#### Implementation

**Week 1-2: ARIA Labels**
```typescript
// src/ui/components/AccessibleButton.ts
export interface AccessibleButtonProps {
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
}

export class AccessibleButton {
  #element: HTMLButtonElement;

  constructor(props: AccessibleButtonProps) {
    this.#element = document.createElement('button');
    
    this.#element.setAttribute('aria-label', props.label);
    if (props.description) {
      this.#element.setAttribute('aria-description', props.description);
    }
    this.#element.setAttribute('role', 'button');
    
    if (props.disabled) {
      this.#element.setAttribute('aria-disabled', 'true');
    }

    if (props.shortcut) {
      this.#element.setAttribute('aria-keyshortcuts', props.shortcut);
    }

    this.#element.addEventListener('click', props.onClick);
  }

  getElement(): HTMLButtonElement {
    return this.#element;
  }
}
```

**Week 3-4: Keyboard Navigation**
```typescript
// src/ui/KeyboardNavigation.ts
export class KeyboardNavigation {
  #focusableElements: HTMLElement[] = [];
  #currentIndex = 0;

  constructor(container: HTMLElement) {
    this.#scanFocusable(container);
    this.#setupListeners();
  }

  #scanFocusable(container: HTMLElement) {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.#focusableElements = Array.from(
      container.querySelectorAll(selector)
    );
  }

  #setupListeners() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          this.#navigateTab(e.shiftKey);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          this.#navigateNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.#navigatePrevious();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.#activateCurrent();
          break;
      }
    });
  }

  #navigateTab(reverse: boolean) {
    if (reverse) {
      this.#navigatePrevious();
    } else {
      this.#navigateNext();
    }
  }

  #navigateNext() {
    this.#currentIndex = (this.#currentIndex + 1) % this.#focusableElements.length;
    this.#focusCurrent();
  }

  #navigatePrevious() {
    this.#currentIndex = (this.#currentIndex - 1 + this.#focusableElements.length) % this.#focusableElements.length;
    this.#focusCurrent();
  }

  #focusCurrent() {
    const element = this.#focusableElements[this.#currentIndex];
    if (element) {
      element.focus();
    }
  }

  #activateCurrent() {
    const element = this.#focusableElements[this.#currentIndex];
    if (element) {
      element.click();
    }
  }
}
```

**Week 5-6: Screen Reader Announcements**
```typescript
// src/ui/ScreenReader.ts
export class ScreenReader {
  #announcer: HTMLElement;

  constructor() {
    this.#announcer = document.createElement('div');
    this.#announcer.setAttribute('role', 'status');
    this.#announcer.setAttribute('aria-live', 'polite');
    this.#announcer.setAttribute('aria-atomic', 'true');
    this.#announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.#announcer);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.#announcer.setAttribute('aria-live', priority);
    this.#announcer.textContent = '';
    
    // Force reflow
    void this.#announcer.offsetHeight;
    
    this.#announcer.textContent = message;
  }

  announceResourceChange(resource: string, amount: number, total: number) {
    const message = `${resource} changed by ${amount}. Total: ${total}`;
    this.announce(message);
  }

  announceEvent(event: GameEvent) {
    const message = `${event.title}: ${event.description}`;
    this.announce(message, 'assertive');
  }
}
```

**Week 7-8: Colorblind Modes**
```typescript
// src/ui/ColorblindMode.ts
export type ColorblindMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export class ColorblindMode {
  #currentMode: ColorblindMode = 'normal';
  #filters: Map<ColorblindMode, string>;

  constructor() {
    this.#filters = new Map([
      ['normal', 'none'],
      ['protanopia', 'url(#protanopia-filter)'],
      ['deuteranopia', 'url(#deuteranopia-filter)'],
      ['tritanopia', 'url(#tritanopia-filter)']
    ]);
    this.#setupFilters();
  }

  #setupFilters() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position: absolute; width: 0; height: 0;';
    
    // Protanopia filter
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567, 0.433, 0, 0, 0
            0.558, 0.442, 0, 0, 0
            0, 0.242, 0.758, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625, 0.375, 0, 0, 0
            0.7, 0.3, 0, 0, 0
            0, 0.3, 0.7, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95, 0.05, 0, 0, 0
            0, 0.433, 0.567, 0, 0
            0, 0.475, 0.525, 0, 0
            0, 0, 0, 1, 0
          "/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  setMode(mode: ColorblindMode) {
    this.#currentMode = mode;
    document.body.style.filter = this.#filters.get(mode) || 'none';
  }

  getMode(): ColorblindMode {
    return this.#currentMode;
  }
}
```

---

## 🔧 Phase 6: Infrastructure & Reliability (Weeks 45-52)

### 6.1 Error Handling System

**Current State:**
- Minimal error handling
- No error boundaries
- Poor error reporting

**Target State:**
- Comprehensive error handling
- Error boundaries
- Detailed error reporting
- Graceful degradation

#### Implementation

**Week 1-2: Error Handler**
```typescript
// src/utils/ErrorHandler.ts
export interface ErrorContext {
  component?: string;
  action?: string;
  data?: any;
}

export class ErrorHandler {
  #logger: Logger;
  #errorCallbacks: Map<string, (error: Error, context: ErrorContext) => void>;

  constructor(logger: Logger) {
    this.#logger = logger;
    this.#errorCallbacks = new Map();
    this.#setupGlobalHandlers();
  }

  #setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        component: 'global',
        action: 'uncaught'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandled-promise'
        }
      );
    });
  }

  handleError(error: Error, context: ErrorContext) {
    this.#logger.error(`Error in ${context.component}:`, error, context);

    // Call registered callbacks
    this.#errorCallbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (callbackError) {
        this.#logger.error('Error in error callback:', callbackError);
      }
    });

    // Report to error tracking service
    this.#reportError(error, context);
  }

  registerCallback(name: string, callback: (error: Error, context: ErrorContext) => void) {
    this.#errorCallbacks.set(name, callback);
  }

  #reportError(error: Error, context: ErrorContext) {
    // Send to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          component: context.component,
          action: context.action
        },
        extra: context.data
      });
    }
  }
}
```

**Week 3-4: Error Boundaries**
```typescript
// src/ui/ErrorBoundary.ts
export class ErrorBoundary {
  #container: HTMLElement;
  #fallback: (error: Error) => HTMLElement;

  constructor(container: HTMLElement, fallback: (error: Error) => HTMLElement) {
    this.#container = container;
    this.#fallback = fallback;
  }

  wrap(fn: () => void) {
    try {
      fn();
    } catch (error) {
      this.#handleError(error as Error);
    }
  }

  async wrapAsync(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (error) {
      this.#handleError(error as Error);
    }
  }

  #handleError(error: Error) {
    this.#container.innerHTML = '';
    const fallbackElement = this.#fallback(error);
    this.#container.appendChild(fallbackElement);
  }
}

// Usage
const boundary = new ErrorBoundary(
  document.getElementById('game-container'),
  (error) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h2>Something went wrong</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()">Reload</button>
    `;
    return div;
  }
);

boundary.wrap(() => {
  game.initialize();
});
```

**Week 5-6: Graceful Degradation**
```typescript
// src/systems/GracefulDegradation.ts
export class GracefulDegradation {
  #features: Map<string, { available: boolean; fallback?: () => void }>;

  constructor() {
    this.#features = new Map();
    this.#checkFeatures();
  }

  #checkFeatures() {
    // Check WebGL support
    const webglAvailable = this.#checkWebGL();
    this.#features.set('webgl', {
      available: webglAvailable,
      fallback: () => this.#fallbackTo2D()
    });

    // Check Web Workers
    const workersAvailable = typeof Worker !== 'undefined';
    this.#features.set('workers', {
      available: workersAvailable,
      fallback: () => this.#fallbackToMainThread()
    });

    // Check LocalStorage
    const storageAvailable = this.#checkLocalStorage();
    this.#features.set('storage', {
      available: storageAvailable,
      fallback: () => this.#fallbackToMemoryStorage()
    });
  }

  #checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  #checkLocalStorage(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  isAvailable(feature: string): boolean {
    return this.#features.get(feature)?.available ?? false;
  }

  useFallback(feature: string) {
    const featureData = this.#features.get(feature);
    if (featureData && !featureData.available && featureData.fallback) {
      featureData.fallback();
    }
  }

  #fallbackTo2D() {
    // Implement 2D canvas fallback
    console.warn('WebGL not available, falling back to 2D canvas');
  }

  #fallbackToMainThread() {
    // Disable worker-based features
    console.warn('Web Workers not available, running on main thread');
  }

  #fallbackToMemoryStorage() {
    // Use in-memory storage
    console.warn('LocalStorage not available, using memory storage');
  }
}
```

---

### 6.2 Offline Support

**Current State:**
- No offline mode
- Game breaks without internet
- No cached data

**Target State:**
- Full offline gameplay
- Cached assets
- Sync when online

#### Implementation

**Week 1-4: Service Worker**
```typescript
// sw.ts
const CACHE_NAME = 'exoplanet-pioneer-v1';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/assets/models/buildings/solar.glb',
  '/assets/textures/planet.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Week 5-6: Offline Manager**
```typescript
// src/core/OfflineManager.ts
export class OfflineManager extends EventEmitter {
  #isOnline: boolean = navigator.onLine;
  #syncQueue: SyncOperation[] = [];

  constructor() {
    super();
    this.#setupListeners();
  }

  #setupListeners() {
    window.addEventListener('online', () => {
      this.#isOnline = true;
      this.emit('online');
      this.#sync();
    });

    window.addEventListener('offline', () => {
      this.#isOnline = false;
      this.emit('offline');
    });
  }

  isOnline(): boolean {
    return this.#isOnline;
  }

  queueSync(operation: SyncOperation) {
    if (this.#isOnline) {
      this.#executeSync(operation);
    } else {
      this.#syncQueue.push(operation);
      this.emit('syncQueued', operation);
    }
  }

  async #sync() {
    while (this.#syncQueue.length > 0) {
      const operation = this.#syncQueue.shift();
      if (operation) {
        try {
          await this.#executeSync(operation);
          this.emit('syncCompleted', operation);
        } catch (error) {
          this.emit('syncFailed', { operation, error });
          this.#syncQueue.unshift(operation); // Retry later
        }
      }
    }
  }

  async #executeSync(operation: SyncOperation): Promise<void> {
    // Execute sync operation
    switch (operation.type) {
      case 'save':
        await this.#syncSave(operation.data);
        break;
      case 'trade':
        await this.#syncTrade(operation.data);
        break;
      case 'achievement':
        await this.#syncAchievement(operation.data);
        break;
    }
  }

  async #syncSave(data: any): Promise<void> {
    // Sync save to Cloudflare Functions API
    const response = await fetch('/api/saves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: this.userId,
        save_data: data
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync save: ${response.statusText}`);
    }
  }

  async #syncTrade(data: any): Promise<void> {
    // Sync trade to Cloudflare Functions API
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: this.userId,
        trade_data: data
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync trade: ${response.statusText}`);
    }
  }

  async #syncAchievement(data: any): Promise<void> {
    // Sync achievement to Cloudflare Functions API
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: this.userId,
        achievement_id: data.id
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync achievement: ${response.statusText}`);
    }
  }
}
```

**Week 7-8: Cached Data Manager**
```typescript
// src/core/CachedDataManager.ts
export class CachedDataManager {
  #cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor() {
    this.#cache = new Map();
  }

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 3600000): Promise<T> {
    const cached = this.#cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.#cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    return data;
  }

  invalidate(key: string) {
    this.#cache.delete(key);
  }

  clear() {
    this.#cache.clear();
  }

  persist() {
    const data = Array.from(this.#cache.entries());
    localStorage.setItem('cachedData', JSON.stringify(data));
  }

  restore() {
    const data = localStorage.getItem('cachedData');
    if (data) {
      const parsed = JSON.parse(data);
      this.#cache = new Map(parsed);
    }
  }
}
```

---

## 📊 Phase 7: Monitoring & Analytics (Weeks 53-56)

### 7.1 Performance Monitoring

**Current State:**
- No performance metrics
- No crash reporting
- No user analytics

**Target State:**
- Real-time performance monitoring
- Crash reporting
- User behavior analytics

#### Implementation

**Week 1-2: Performance Monitor**
```typescript
// src/monitoring/PerformanceMonitor.ts
export class PerformanceMonitor {
  #fps: number = 60;
  #frameTime: number = 0;
  #memoryUsage: number = 0;
  #fpsHistory: number[] = [];

  start() {
    this.#measureFPS();
    this.#measureMemory();
  }

  #measureFPS() {
    let lastTime = performance.now();
    let frames = 0;

    const measure = () => {
      const currentTime = performance.now();
      frames++;

      if (currentTime >= lastTime + 1000) {
        this.#fps = frames;
        this.#fpsHistory.push(this.#fps);
        
        if (this.#fpsHistory.length > 60) {
          this.#fpsHistory.shift();
        }

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  }

  #measureMemory() {
    if (!(performance as any).memory) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      this.#memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
    }, 1000);
  }

  getMetrics() {
    return {
      fps: this.#fps,
      avgFps: this.#calculateAverageFPS(),
      memoryUsage: this.#memoryUsage,
      frameTime: this.#frameTime
    };
  }

  #calculateAverageFPS(): number {
    if (this.#fpsHistory.length === 0) return 0;
    const sum = this.#fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.#fpsHistory.length;
  }
}
```

**Week 3-4: Analytics Tracker**
```typescript
// src/monitoring/AnalyticsTracker.ts
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export class AnalyticsTracker {
  #events: AnalyticsEvent[] = [];
  #batchSize: number = 10;
  #flushInterval: number = 30000;

  constructor() {
    this.#startFlushTimer();
  }

  track(event: AnalyticsEvent) {
    this.#events.push(event);
    
    if (this.#events.length >= this.#batchSize) {
      this.#flush();
    }
  }

  trackPageView(page: string) {
    this.track({
      category: 'navigation',
      action: 'page_view',
      label: page
    });
  }

  trackGameEvent(event: string, data?: any) {
    this.track({
      category: 'game',
      action: event,
      value: data?.value
    });
  }

  trackError(error: Error, context?: any) {
    this.track({
      category: 'error',
      action: error.name,
      label: error.message,
      value: context?.lineNumber
    });
  }

  #startFlushTimer() {
    setInterval(() => {
      this.#flush();
    }, this.#flushInterval);
  }

  async #flush() {
    if (this.#events.length === 0) return;

    const events = [...this.#events];
    this.#events = [];

    try {
      await this.#sendEvents(events);
    } catch (error) {
      console.error('Failed to send analytics:', error);
      this.#events.unshift(...events);
    }
  }

  async #sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // Send to analytics service
    // Could be Google Analytics, Mixpanel, etc.
  }
}
```

---

## 🎯 Success Metrics & KPIs

### Performance Metrics
- **Initial Load Time**: < 3 seconds (currently ~8 seconds)
- **Time to Interactive**: < 5 seconds
- **Frame Rate**: 60 FPS on mid-range devices
- **Memory Usage**: < 500 MB
- **Bundle Size**: < 2 MB (currently ~5 MB)

### Quality Metrics
- **Code Coverage**: > 90%
- **Critical Bugs**: 0 in production
- **Bug Fix Time**: < 24 hours for critical, < 7 days for major
- **Test Pass Rate**: > 95%

### User Experience Metrics
- **Session Duration**: > 15 minutes average
- **Retention Rate**: > 40% day 1, > 20% day 7
- **Crash Rate**: < 0.1%
- **Error Rate**: < 0.5%

### Development Metrics
- **Build Time**: < 30 seconds
- **Deployment Time**: < 5 minutes (static site deployment)
- **Code Review Time**: < 2 hours per PR
- **Feature Lead Time**: < 2 weeks

---

## 📅 Implementation Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Foundation | Weeks 1-8 | Build system, state management, dependency injection |
| Phase 2: Performance | Weeks 9-16 | Object pooling, Web Workers, asset optimization |
| Phase 3: Code Quality | Weeks 17-24 | Unit tests, TypeScript migration, integration tests |
| Phase 4: Game Systems | Weeks 25-36 | Progressive unlocking, tutorial system, economy refactor |
| Phase 5: UI/UX | Weeks 37-44 | Accessibility, keyboard nav, screen reader support |
| Phase 6: Infrastructure | Weeks 45-52 | Error handling, offline support, graceful degradation |
| Phase 7: Monitoring | Weeks 53-56 | Performance monitoring, analytics tracking |

**Total Duration**: 56 weeks (approximately 14 months)

---

## 🚀 Quick Wins (First 2 Weeks)

These can be implemented immediately for quick impact:

1. **Add console.log gating** - Remove debug logs in production
2. **Implement basic error boundary** - Prevent game crashes
3. **Add loading states** - Show progress during asset loading
4. **Optimize images** - Convert to WebP format
5. **Add keyboard shortcuts** - Basic game controls
6. **Implement save confirmation** - Prevent accidental data loss
7. **Add tooltips** - Help users understand UI elements
8. **Improve contrast** - Better readability

---

## 🌐 Free Hosting with Backend: Cloudflare Pages + Functions

**Recommended Solution: Cloudflare Pages with Functions**

Cloudflare Pages provides both static hosting AND serverless functions at the edge, making it perfect for Exoplanet Pioneer. You get:
- **Static Hosting**: Unlimited bandwidth, global CDN
- **Serverless Functions**: 100,000 requests/day on free tier
- **Edge Database**: Cloudflare D1 (SQLite) or KV storage
- **Real-time**: Cloudflare Durable Objects for multiplayer
- **Zero Cold Starts**: Functions run at the edge in <50ms

### Free Tier Limits
- **Functions**: 100,000 requests/day
- **CPU Time**: 10ms per request (can burst to 50ms)
- **D1 Database**: 5GB storage, 5M reads/day
- **KV Storage**: 1GB, 100K reads/day
- **Durable Objects**: 500ms CPU time per request

### Platform Comparison

| Platform | Backend Support | Functions/day | Best For |
|----------|-----------------|---------------|----------|
| **Cloudflare Pages** | ✅ Edge Functions | 100,000 | **Recommended** - Full backend + CDN |
| Netlify | ✅ Edge Functions | 125,000 | Great alternative |
| Vercel | ✅ Edge Functions | 100,000 | Fastest global CDN |
| GitHub Pages | ❌ No backend | N/A | Static only |
| Surge.sh | ❌ No backend | N/A | Static only |

### Cloudflare Pages + Functions Setup

**wrangler.toml:**
```toml
name = "exoplanet-pioneer"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.preview]
vars = { ENVIRONMENT = "preview" }

# D1 Database for saves and player data
[[d1_databases]]
binding = "DB"
database_name = "exoplanet-pioneer-db"
database_id = "your-database-id"

# KV Storage for caching and leaderboards
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# Durable Objects for real-time multiplayer
[[durable_objects.bindings]]
name = "GAME_ROOM"
class_name = "GameRoom"
script_name = "game-room-worker"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[build.upload]
format = "modules"
main = "./_worker.js"
rules = [
  { type = "ESModule", globs = ["**/*.js"], fallthrough = true }
]
```

**Project Structure:**
```
exoplanet-pioneer/
├── functions/
│   ├── api/
│   │   ├── saves.ts          # Save/load game data
│   │   ├── trades.ts         # Trade operations
│   │   ├── achievements.ts   # Achievement tracking
│   │   ├── leaderboard.ts    # Leaderboard queries
│   │   └── multiplayer.ts    # Real-time multiplayer
│   ├── middleware/
│   │   ├── auth.ts           # Authentication
│   │   └── rate-limit.ts     # Rate limiting
│   └── utils/
│       ├── db.ts             # D1 database helpers
│       └── cache.ts          # KV cache helpers
├── src/                      # Frontend code
├── public/                   # Static assets
├── wrangler.toml
└── package.json
```

**Deployment Commands:**
```bash
# Create D1 database
wrangler d1 create exoplanet-pioneer-db

# Create KV namespace
wrangler kv:namespace create CACHE

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=exoplanet-pioneer

# Deploy with functions
wrangler pages deploy dist --project-name=exoplanet-pioneer --functions=functions

# Local development
wrangler pages dev dist --functions=functions --local

# Tail logs
wrangler pages deployment tail --project-name=exoplanet-pioneer
```

### Cloudflare D1 Database Implementation

**Database Schema (schema.sql):**
```sql
-- Players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  stats TEXT NOT NULL DEFAULT '{}'
);

-- Saves table
CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  save_name TEXT NOT NULL,
  save_data TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  trade_data TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saves_player_id ON saves(player_id);
CREATE INDEX IF NOT EXISTS idx_achievements_player_id ON achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_trades_player_id ON trades(player_id);
```

**Apply Schema:**
```bash
wrangler d1 execute exoplanet-pioneer-db --file=schema.sql
```

**Function Example: Save/Load (functions/api/saves.ts):**
```typescript
import { Env } from '../types';

export interface SaveData {
  resources: Record<string, number>;
  buildings: any[];
  colonists: any[];
  day: number;
  // ... other game state
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const saveId = url.searchParams.get('save_id');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'player_id required' }), { status: 400 });
  }

  if (saveId) {
    // Load specific save
    const result = await env.DB.prepare(
      'SELECT * FROM saves WHERE id = ? AND player_id = ?'
    ).bind(saveId, playerId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Save not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    // List all saves for player
    const results = await env.DB.prepare(
      'SELECT id, save_name, created_at, updated_at FROM saves WHERE player_id = ? ORDER BY updated_at DESC'
    ).bind(playerId).all();

    return new Response(JSON.stringify(results.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { player_id, save_id, save_name, save_data } = await request.json();

  if (!player_id || !save_data) {
    return new Response(JSON.stringify({ error: 'player_id and save_data required' }), { status: 400 });
  }

  const id = save_id || crypto.randomUUID();
  const name = save_name || `Save ${new Date().toLocaleDateString()}`;

  await env.DB.prepare(`
    INSERT INTO saves (id, player_id, save_name, save_data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      save_data = excluded.save_data,
      updated_at = excluded.updated_at
  `).bind(id, player_id, name, JSON.stringify(save_data), new Date().toISOString()).run();

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('player_id');
  const saveId = url.searchParams.get('save_id');

  if (!playerId || !saveId) {
    return new Response(JSON.stringify({ error: 'player_id and save_id required' }), { status: 400 });
  }

  await env.DB.prepare(
    'DELETE FROM saves WHERE id = ? AND player_id = ?'
  ).bind(saveId, playerId).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Function Example: Leaderboard (functions/api/leaderboard.ts):**
```typescript
import { Env } from '../types';

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'total_score';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  // Try to get from KV cache first
  const cacheKey = `leaderboard:${category}:${limit}`;
  const cached = await env.CACHE.get(cacheKey, 'json');

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      }
    });
  }

  // Query from D1
  const results = await env.DB.prepare(`
    SELECT 
      p.username,
      p.id,
      json_extract(p.stats, '$.${category}') as score
    FROM players p
    WHERE json_extract(p.stats, '$.${category}') IS NOT NULL
    ORDER BY score DESC
    LIMIT ?
  `).bind(limit).all();

  const leaderboard = results.results;

  // Cache for 5 minutes
  await env.CACHE.put(cacheKey, JSON.stringify(leaderboard), {
    expirationTtl: 300
  });

  return new Response(JSON.stringify(leaderboard), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Cache': 'MISS'
    }
  });
}
```

**Function Example: Real-time Multiplayer (functions/api/multiplayer.ts):**
```typescript
import { Env } from '../types';

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const { action, player_id, room_id, data } = await request.json();

  switch (action) {
    case 'join_room':
      return await handleJoinRoom(env, player_id, room_id);
    case 'leave_room':
      return await handleLeaveRoom(env, player_id, room_id);
    case 'broadcast':
      return await handleBroadcast(env, player_id, room_id, data);
    default:
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  }
}

async function handleJoinRoom(env: Env, playerId: string, roomId: string) {
  // Use Durable Object for room management
  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'POST',
    body: JSON.stringify({ action: 'join', player_id: playerId })
  }));

  return new Response(await response.text(), response);
}

async function handleBroadcast(env: Env, playerId: string, roomId: string, data: any) {
  const id = env.GAME_ROOM.idFromName(roomId);
  const stub = env.GAME_ROOM.get(id);

  const response = await stub.fetch(new Request('https://dummy/', {
    method: 'POST',
    body: JSON.stringify({ 
      action: 'broadcast', 
      player_id: playerId, 
      data 
    })
  }));

  return new Response(await response.text(), response);
}
```

**TypeScript Types (functions/types.ts):**
```typescript
export interface Env {
  // D1 Database binding
  DB: D1Database;

  // KV Storage binding
  CACHE: KVNamespace;

  // Durable Objects binding
  GAME_ROOM: DurableObjectNamespace;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(sql: string): Promise<D1Result>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = any> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    last_row_id: number;
    changes: number;
    served_by: string;
  };
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}
```

**Durable Objects Implementation (functions/game-room-worker.ts):**
```typescript
export class GameRoom {
  private state: {
    players: Map<string, PlayerState>;
    gameState: any;
    lastUpdate: number;
  };

  constructor(state: DurableObjectState, env: Env) {
    this.state = state.storage || {
      players: new Map(),
      gameState: null,
      lastUpdate: Date.now()
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'unknown';

    switch (action) {
      case 'join':
        return this.handleJoin(request);
      case 'leave':
        return this.handleLeave(request);
      case 'broadcast':
        return this.handleBroadcast(request);
      case 'getState':
        return this.handleGetState();
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }
  }

  private async handleJoin(request: Request): Promise<Response> {
    const { player_id, player_name } = await request.json();

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { status: 400 });
    }

    this.state.players.set(player_id, {
      id: player_id,
      name: player_name || `Player ${this.state.players.size + 1}`,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    });

    // Broadcast to all players
    await this.broadcast({
      type: 'player_joined',
      player: this.state.players.get(player_id)
    });

    return new Response(JSON.stringify({ 
      success: true, 
      players: Array.from(this.state.players.values()) 
    }));
  }

  private async handleLeave(request: Request): Promise<Response> {
    const { player_id } = await request.json();

    if (!player_id) {
      return new Response(JSON.stringify({ error: 'player_id required' }), { status: 400 });
    }

    const player = this.state.players.get(player_id);
    this.state.players.delete(player_id);

    // Broadcast to all players
    await this.broadcast({
      type: 'player_left',
      player_id
    });

    return new Response(JSON.stringify({ success: true }));
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    const { player_id, data } = await request.json();

    if (!player_id || !data) {
      return new Response(JSON.stringify({ error: 'player_id and data required' }), { status: 400 });
    }

    await this.broadcast({
      type: 'message',
      player_id,
      data,
      timestamp: Date.now()
    });

    return new Response(JSON.stringify({ success: true }));
  }

  private async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify({
      players: Array.from(this.state.players.values()),
      gameState: this.state.gameState,
      lastUpdate: this.state.lastUpdate
    }));
  }

  private async broadcast(message: any): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    // In a real implementation, you'd use WebSockets or Server-Sent Events
    // For now, we store messages that clients can poll
    const timestamp = Date.now();
    // Store in Durable Object storage for polling
    // await this.state.storage.put(`message:${timestamp}`, messageStr);
  }
}

export interface PlayerState {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface DurableObjectState {
  storage: any;
}
```

---

## 📝 Notes & Considerations

### Risk Mitigation
- **Backward Compatibility**: Maintain save file compatibility during refactoring
- **Feature Flags**: Use feature flags to roll out changes gradually
- **A/B Testing**: Test major UI/UX changes with subset of users
- **Rollback Plan**: Keep previous version available for quick rollback

### Resource Requirements
- **Development Team**: 2-3 full-time developers
- **QA Team**: 1-2 testers
- **Timeline**: 14 months for full implementation
- **Budget**: $0 - All services use free tiers (Cloudflare Pages + Functions, D1 Database, KV Storage)

### Dependencies
- **External APIs**: Plan for API rate limits and outages
- **Browser Support**: Target modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Device Support**: Optimize for desktop first, mobile second

---

## 🎓 Learning Resources

### Build Systems
- [Vite Documentation](https://vitejs.dev/)
- [Rollup Documentation](https://rollupjs.org/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Performance
- [Web.dev Performance](https://web.dev/performance/)
- [MDN Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11Y Project](https://www.a11yproject.com/)

---

**Document Version**: 1.0  
**Last Updated**: January 13, 2026  
**Next Review**: February 13, 2026  
**Maintained By**: Development Team
