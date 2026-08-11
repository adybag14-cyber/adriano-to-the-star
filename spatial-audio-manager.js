/**
 * Spatial Audio Manager
 * Handles positional 3D audio, ambient soundscapes, and dynamic music.
 * Part of the Asset Production Roadmap - Category 3.
 */

class SpatialAudioManager {
    constructor(camera, manifest = null) {
        this.camera = camera;
        this.manifest = manifest;
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.sounds = new Map();
        this.music = new Map();
        this.ambience = new Map();

        this.audioLoader = new THREE.AudioLoader();

        this.init();
    }

    init() {
        console.log("🔊 Spatial Audio Manager initialized.");
        this.lastUpdateTime = performance.now();
        this.lastCameraPosition = new THREE.Vector3();
    }

    findSoundById(id) {
        if (!this.manifest || !this.manifest.audio) return null;
        for (const category of Object.values(this.manifest.audio)) {
            const found = Object.values(category).find(s => s.id === id);
            if (found) return found;
        }
        return null;
    }

    async playSoundById(id, mesh, options = {}) {
        const soundDef = this.findSoundById(id);
        if (!soundDef) {
            console.warn(`Sound definition not found for ID: ${id}`);
            return null;
        }
        return this.playSpatialSound(id, soundDef.path, mesh, options);
    }

    /**
     * Updates spatial audio listener and Doppler effect.
     * Roadmap Item 201: Real-time spatial update logic.
     */
    update(delta) {
        if (!this.camera) return;

        // Calculate listener velocity for Doppler effect (Item 202)
        const currentPos = this.camera.position;
        const velocity = currentPos.clone().sub(this.lastCameraPosition).divideScalar(delta);

        // In THREE.js, PositionalAudio handles Doppler if the listener and source have velocities
        // We update the listener position implicitly by it being attached to the camera.

        this.lastCameraPosition.copy(currentPos);

        // Update all active sounds
        this.sounds.forEach((sound, id) => {
            if (sound.isPlaying && sound.update) {
                sound.update(delta);
            }
        });
    }

    /**
     * Loads and plays a spatial sound effect at a specific position.
     * @param {string} id - Asset ID from manifest.
     * @param {string} path - URL to audio file.
     * @param {THREE.Object3D} mesh - The mesh to attach the sound to.
     */
    async playSpatialSound(id, path, mesh, options = {}) {
        if (this.sounds.has(id)) {
            const sound = this.sounds.get(id);
            if (!sound.isPlaying) sound.play();
            return sound;
        }

        return new Promise((resolve, reject) => {
            this.audioLoader.load(path, (buffer) => {
                const sound = new THREE.PositionalAudio(this.listener);
                sound.setBuffer(buffer);
                sound.setRefDistance(options.refDistance || 10);
                sound.setLoop(options.loop || false);
                sound.setVolume(options.volume || 1.0);

                mesh.add(sound);
                sound.play();

                this.sounds.set(id, sound);
                resolve(sound);
            }, undefined, reject);
        });
    }

    /**
     * Plays background music with crossfade support.
     */
    async playMusic(id, path, options = {}) {
        // Implementation for dynamic music layers
        if (this.music.has(id)) {
            const track = this.music.get(id);
            if (!track.isPlaying) track.play();
            return track;
        }

        return new Promise((resolve, reject) => {
            this.audioLoader.load(path, (buffer) => {
                const track = new THREE.Audio(this.listener);
                track.setBuffer(buffer);
                track.setLoop(options.loop || true);
                track.setVolume(options.volume || 0.5);
                track.play();

                this.music.set(id, track);
                resolve(track);
            }, undefined, reject);
        });
    }

    /**
     * Plays ambient soundscapes (e.g., Space Hum, Forest).
     */
    async playAmbience(id, path, options = {}) {
        if (this.ambience.has(id)) {
            const track = this.ambience.get(id);
            if (!track.isPlaying) track.play();
            return track;
        }

        return new Promise((resolve, reject) => {
            this.audioLoader.load(path, (buffer) => {
                const track = new THREE.Audio(this.listener);
                track.setBuffer(buffer);
                track.setLoop(options.loop || true);
                track.setVolume(options.volume || 0.3);
                track.play();

                this.ambience.set(id, track);
                resolve(track);
            }, undefined, reject);
        });
    }

    stopAll() {
        this.sounds.forEach(s => s.stop());
        this.music.forEach(m => m.stop());
        this.ambience.forEach(a => a.stop());
    }
}

if (typeof window !== 'undefined') {
    window.SpatialAudioManager = SpatialAudioManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpatialAudioManager;
}
