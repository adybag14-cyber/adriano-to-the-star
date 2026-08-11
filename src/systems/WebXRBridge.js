/**
 * 🥽 WEBXR BRIDGE
 * Era II: The Living Cosmos - The Metaverse Interface
 * 
 * VR Cockpit mode and AR "Stellar Projector" for immersive
 * exoplanet exploration and interaction.
 */

import * as THREE from 'three';

class WebXRBridge {
    constructor(game) {
        this.game = game;
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.xrViewerSpace = null;
        
        this.vrEnabled = false;
        this.arEnabled = false;
        this.cockpitMode = false;
        this.stellarProjectorMode = false;
        
        this.cockpitMesh = null;
        this.hudElements = new Map();
        this.controllerMeshes = new Map();
        
        this.arMarkers = new Map();
        this.arPlanets = new Map();
        
        this.inputSources = new Map();
        this.controllerStates = new Map();
        
        this.hapticFeedbackEnabled = true;
        
        this.xrSupported = false;
        this.vrSupported = false;
        this.arSupported = false;
        
        console.log('🥽 WebXR Bridge: Initialized');
    }

    /**
     * Initialize the WebXR bridge
     */
    async initialize() {
        await this.checkXRSupport();
        this.setupEventListeners();
        this.createCockpitModel();
    }

    /**
     * Check WebXR support
     */
    async checkXRSupport() {
        if ('xr' in navigator) {
            this.xrSupported = true;
            
            // Check VR support
            this.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
            
            // Check AR support
            this.arSupported = await navigator.xr.isSessionSupported('immersive-ar');
            
            console.log(`🥽 WebXR Support: VR=${this.vrSupported}, AR=${this.arSupported}`);
        } else {
            console.warn('🥽 WebXR not supported in this browser');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.game.events.on('enter_vr', this.enterVR.bind(this));
        this.game.events.on('exit_vr', this.exitVR.bind(this));
        this.game.events.on('enter_ar', this.enterAR.bind(this));
        this.game.events.on('exit_ar', this.exitAR.bind(this));
        this.game.events.on('toggle_cockpit', this.toggleCockpitMode.bind(this));
        this.game.events.on('toggle_stellar_projector', this.toggleStellarProjector.bind(this));
    }

    /**
     * Enter VR mode
     */
    async enterVR() {
        if (!this.vrSupported || this.xrSession) {
            return false;
        }
        
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
            });
            
            this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local-floor');
            this.xrViewerSpace = await this.xrSession.requestReferenceSpace('viewer');
            
            // Setup render loop
            this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
            
            // Setup input
            this.xrSession.addEventListener('inputsourceschange', this.onInputSourcesChange.bind(this));
            
            this.vrEnabled = true;
            this.cockpitMode = true;
            
            console.log('🥽 Entered VR mode');
            
            this.game.events.emit('vr_entered');
            
            return true;
        } catch (error) {
            console.error('Failed to enter VR:', error);
            return false;
        }
    }

    /**
     * Exit VR mode
     */
    async exitVR() {
        if (!this.xrSession) {
            return false;
        }
        
        try {
            await this.xrSession.end();
            this.onSessionEnd();
            
            console.log('🥽 Exited VR mode');
            
            return true;
        } catch (error) {
            console.error('Failed to exit VR:', error);
            return false;
        }
    }

    /**
     * Enter AR mode
     */
    async enterAR() {
        if (!this.arSupported || this.xrSession) {
            return false;
        }
        
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                optionalFeatures: ['dom-overlay', 'hit-test'],
                domOverlay: { root: document.body }
            });
            
            this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local');
            this.xrViewerSpace = await this.xrSession.requestReferenceSpace('viewer');
            
            // Setup render loop
            this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
            
            // Setup input
            this.xrSession.addEventListener('inputsourceschange', this.onInputSourcesChange.bind(this));
            
            this.arEnabled = true;
            this.stellarProjectorMode = true;
            
            // Initialize AR markers
            this.initializeARMarkers();
            
            console.log('🥽 Entered AR mode');
            
            this.game.events.emit('ar_entered');
            
            return true;
        } catch (error) {
            console.error('Failed to enter AR:', error);
            return false;
        }
    }

    /**
     * Exit AR mode
     */
    async exitAR() {
        if (!this.xrSession) {
            return false;
        }
        
        try {
            await this.xrSession.end();
            this.onSessionEnd();
            
            console.log('🥽 Exited AR mode');
            
            return true;
        } catch (error) {
            console.error('Failed to exit AR:', error);
            return false;
        }
    }

    /**
     * Handle session end
     */
    onSessionEnd() {
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.xrViewerSpace = null;
        this.vrEnabled = false;
        this.arEnabled = false;
        this.cockpitMode = false;
        this.stellarProjectorMode = false;
        
        this.game.events.emit('xr_exited');
    }

    /**
     * Handle XR frame
     */
    onXRFrame(time, frame) {
        if (!this.xrSession) return;
        
        const session = this.xrSession;
        const pose = frame.getViewerPose(this.xrReferenceSpace);
        
        if (pose) {
            // Update camera
            this.updateXRCamera(pose);
            
            // Update controllers
            this.updateControllers(frame);
            
            // Render scene
            this.game.renderer.render(this.game.scene, this.game.camera);
            
            // Update HUD
            if (this.cockpitMode) {
                this.updateHUD(pose);
            }
            
            // Update AR content
            if (this.arEnabled && this.stellarProjectorMode) {
                this.updateARContent(frame);
            }
        }
        
        // Request next frame
        session.requestAnimationFrame(this.onXRFrame.bind(this));
    }

    /**
     * Update XR camera
     */
    updateXRCamera(pose) {
        for (const view of pose.views) {
            const viewport = this.xrSession.renderState.baseLayer.getViewport(view);
            
            this.game.camera.viewport = viewport;
            this.game.camera.projectionMatrix.fromArray(view.projectionMatrix);
            this.game.camera.matrix.fromArray(view.transform.matrix);
            this.game.camera.matrix.decompose(
                this.game.camera.position,
                this.game.camera.quaternion,
                this.game.camera.scale
            );
        }
    }

    /**
     * Handle input sources change
     */
    onInputSourcesChange(event) {
        for (const inputSource of event.added) {
            this.inputSources.set(inputSource, inputSource);
            this.createControllerMesh(inputSource);
        }
        
        for (const inputSource of event.removed) {
            this.inputSources.delete(inputSource);
            this.removeControllerMesh(inputSource);
        }
    }

    /**
     * Create controller mesh
     */
    createControllerMesh(inputSource) {
        const controllerGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.1, 8);
        const controllerMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const controller = new THREE.Mesh(controllerGeometry, controllerMaterial);
        
        // Add grip buttons
        const gripGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        const grip1 = new THREE.Mesh(gripGeometry, gripMaterial);
        grip1.position.set(0.02, 0, 0);
        controller.add(grip1);
        
        const grip2 = new THREE.Mesh(gripGeometry, gripMaterial);
        grip2.position.set(-0.02, 0, 0);
        controller.add(grip2);
        
        // Add trigger
        const triggerGeometry = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const triggerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
        trigger.position.set(0, 0.02, 0.02);
        controller.add(trigger);
        
        this.controllerMeshes.set(inputSource, controller);
        this.game.scene.add(controller);
        
        // Setup controller events
        inputSource.addEventListener('select', () => this.onControllerSelect(inputSource));
        inputSource.addEventListener('squeeze', () => this.onControllerSqueeze(inputSource));
        inputSource.addEventListener('grip', () => this.onControllerGrip(inputSource));
    }

    /**
     * Remove controller mesh
     */
    removeControllerMesh(inputSource) {
        const controller = this.controllerMeshes.get(inputSource);
        if (controller) {
            this.game.scene.remove(controller);
            controller.geometry.dispose();
            controller.material.dispose();
            this.controllerMeshes.delete(inputSource);
        }
    }

    /**
     * Update controllers
     */
    updateControllers(frame) {
        for (const [inputSource, controller] of this.controllerMeshes) {
            const pose = frame.getPose(inputSource.gripSpace, this.xrReferenceSpace);
            
            if (pose) {
                controller.matrix.fromArray(pose.transform.matrix);
                controller.matrix.decompose(
                    controller.position,
                    controller.quaternion,
                    controller.scale
                );
            }
            
            // Update controller state
            const gamepad = inputSource.gamepad;
            if (gamepad) {
                this.controllerStates.set(inputSource, {
                    buttons: gamepad.buttons.map(b => b.pressed),
                    axes: gamepad.axes
                });
            }
        }
    }

    /**
     * Handle controller select (trigger)
     */
    onControllerSelect(inputSource) {
        const controller = this.controllerMeshes.get(inputSource);
        if (controller && this.hapticFeedbackEnabled) {
            this.triggerHapticFeedback(inputSource, 0.5, 100);
        }
        
        // Raycast for interaction
        const raycastResult = this.raycastFromController(inputSource);
        if (raycastResult) {
            this.game.events.emit('vr_interaction', {
                source: inputSource,
                target: raycastResult.object,
                point: raycastResult.point
            });
        }
    }

    /**
     * Handle controller squeeze
     */
    onControllerSqueeze(inputSource) {
        if (this.hapticFeedbackEnabled) {
            this.triggerHapticFeedback(inputSource, 0.3, 50);
        }
        
        // Grab or interact with objects
        this.game.events.emit('vr_grab', { source: inputSource });
    }

    /**
     * Handle controller grip
     */
    onControllerGrip(inputSource) {
        if (this.hapticFeedbackEnabled) {
            this.triggerHapticFeedback(inputSource, 0.2, 30);
        }
        
        // Teleport or special action
        this.game.events.emit('vr_grip', { source: inputSource });
    }

    /**
     * Raycast from controller
     */
    raycastFromController(inputSource) {
        const controller = this.controllerMeshes.get(inputSource);
        if (!controller) return null;
        
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(controller.quaternion);
        
        raycaster.set(controller.position, direction);
        
        const intersects = raycaster.intersectObjects(this.game.scene.children, true);
        
        return intersects.length > 0 ? intersects[0] : null;
    }

    /**
     * Trigger haptic feedback
     */
    triggerHapticFeedback(inputSource, intensity, duration) {
        if (inputSource && inputSource.gamepad && inputSource.gamepad.hapticActuators) {
            const actuator = inputSource.gamepad.hapticActuators[0];
            if (actuator) {
                actuator.pulse(intensity, duration);
            }
        }
    }

    /**
     * Create cockpit model
     */
    createCockpitModel() {
        const cockpitGroup = new THREE.Group();
        
        // Main frame
        const frameGeometry = new THREE.BoxGeometry(2, 1.5, 2);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        cockpitGroup.add(frame);
        
        // Window
        const windowGeometry = new THREE.BoxGeometry(1.8, 1, 0.1);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.9
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.z = 1;
        cockpitGroup.add(window);
        
        // Control panel
        const panelGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.5);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, -0.5, 0.7);
        cockpitGroup.add(panel);
        
        // Add HUD elements
        this.createHUDElements(cockpitGroup);
        
        this.cockpitMesh = cockpitGroup;
        cockpitGroup.visible = false;
        this.game.scene.add(cockpitGroup);
    }

    /**
     * Create HUD elements
     */
    createHUDElements(cockpit) {
        // Speed indicator
        const speedGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const speedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const speedIndicator = new THREE.Mesh(speedGeometry, speedMaterial);
        speedIndicator.position.set(-0.5, 0.3, 0.95);
        cockpit.add(speedIndicator);
        this.hudElements.set('speed', speedIndicator);
        
        // Shield indicator
        const shieldGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const shieldMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff });
        const shieldIndicator = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shieldIndicator.position.set(0, 0.3, 0.95);
        cockpit.add(shieldIndicator);
        this.hudElements.set('shield', shieldIndicator);
        
        // Health indicator
        const healthGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const healthIndicator = new THREE.Mesh(healthGeometry, healthMaterial);
        healthIndicator.position.set(0.5, 0.3, 0.95);
        cockpit.add(healthIndicator);
        this.hudElements.set('health', healthIndicator);
        
        // Crosshair
        const crosshairGeometry = new THREE.RingGeometry(0.02, 0.03, 32);
        const crosshairMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        const crosshair = new THREE.Mesh(crosshairGeometry, crosshairMaterial);
        crosshair.position.set(0, 0, 0.95);
        cockpit.add(crosshair);
        this.hudElements.set('crosshair', crosshair);
    }

    /**
     * Update HUD
     */
    updateHUD(pose) {
        if (!this.cockpitMesh) return;
        
        // Get player ship data
        const playerShip = this.game.player?.ship;
        if (!playerShip) return;
        
        // Update speed indicator
        const speedIndicator = this.hudElements.get('speed');
        if (speedIndicator) {
            const speedRatio = playerShip.speed / playerShip.maxSpeed;
            speedIndicator.scale.x = speedRatio;
            speedIndicator.material.color.setHSL(0.3 * (1 - speedRatio), 1, 0.5);
        }
        
        // Update shield indicator
        const shieldIndicator = this.hudElements.get('shield');
        if (shieldIndicator) {
            const shieldRatio = playerShip.shields / playerShip.maxShields;
            shieldIndicator.scale.x = shieldRatio;
        }
        
        // Update health indicator
        const healthIndicator = this.hudElements.get('health');
        if (healthIndicator) {
            const healthRatio = playerShip.health / playerShip.maxHealth;
            healthIndicator.scale.x = healthRatio;
        }
    }

    /**
     * Toggle cockpit mode
     */
    toggleCockpitMode() {
        if (!this.vrEnabled) {
            console.warn('Cockpit mode requires VR');
            return;
        }
        
        this.cockpitMode = !this.cockpitMode;
        
        if (this.cockpitMesh) {
            this.cockpitMesh.visible = this.cockpitMode;
        }
        
        console.log(`🥽 Cockpit mode: ${this.cockpitMode ? 'enabled' : 'disabled'}`);
    }

    /**
     * Initialize AR markers
     */
    initializeARMarkers() {
        // Create marker for planet visualization
        const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        
        for (let i = 0; i < 5; i++) {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
            marker.visible = false;
            this.game.scene.add(marker);
            this.arMarkers.set(`marker_${i}`, marker);
        }
    }

    /**
     * Update AR content
     */
    updateARContent(frame) {
        if (!this.stellarProjectorMode) return;
        
        // Update planet projections
        this.updatePlanetProjections();
        
        // Update markers
        this.updateARMarkers(frame);
    }

    /**
     * Update planet projections
     */
    updatePlanetProjections() {
        const planets = this.game.galaxy?.planets || [];
        
        for (const [id, planetMesh] of this.arPlanets) {
            const planet = planets.find(p => p.id === id);
            
            if (planet) {
                // Update planet visualization
                planetMesh.rotation.y += 0.001;
            } else {
                // Remove non-existent planet
                this.game.scene.remove(planetMesh);
                this.arPlanets.delete(id);
            }
        }
        
        // Add new planets
        for (const planet of planets) {
            if (!this.arPlanets.has(planet.id)) {
                this.createARPlanet(planet);
            }
        }
    }

    /**
     * Create AR planet visualization
     */
    createARPlanet(planet) {
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: planet.color || 0x4444ff,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const planetMesh = new THREE.Mesh(geometry, material);
        planetMesh.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            -1 - Math.random() * 2
        );
        
        // Add atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: planet.color || 0x4444ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planetMesh.add(atmosphere);
        
        // Add label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.fillText(planet.name, 10, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.scale.set(0.5, 0.125, 1);
        label.position.y = 0.3;
        planetMesh.add(label);
        
        this.game.scene.add(planetMesh);
        this.arPlanets.set(planet.id, planetMesh);
    }

    /**
     * Update AR markers
     */
    updateARMarkers(frame) {
        // Use hit testing to place markers on real surfaces
        // This requires the 'hit-test' feature
    }

    /**
     * Toggle stellar projector mode
     */
    toggleStellarProjector() {
        if (!this.arEnabled) {
            console.warn('Stellar projector requires AR');
            return;
        }
        
        this.stellarProjectorMode = !this.stellarProjectorMode;
        
        // Toggle planet visibility
        for (const planetMesh of this.arPlanets.values()) {
            planetMesh.visible = this.stellarProjectorMode;
        }
        
        console.log(`🥽 Stellar Projector: ${this.stellarProjectorMode ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get controller state
     */
    getControllerState(inputSource) {
        return this.controllerStates.get(inputSource);
    }

    /**
     * Check if WebXR is available
     */
    isAvailable() {
        return this.xrSupported;
    }

    /**
     * Check if VR is supported
     */
    isVRSupported() {
        return this.vrSupported;
    }

    /**
     * Check if AR is supported
     */
    isARSupported() {
        return this.arSupported;
    }

    /**
     * Check if currently in VR
     */
    isInVR() {
        return this.vrEnabled;
    }

    /**
     * Check if currently in AR
     */
    isInAR() {
        return this.arEnabled;
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.xrSession) {
            this.xrSession.end();
        }
        
        for (const controller of this.controllerMeshes.values()) {
            this.game.scene.remove(controller);
            controller.geometry.dispose();
            controller.material.dispose();
        }
        this.controllerMeshes.clear();
        
        for (const planet of this.arPlanets.values()) {
            this.game.scene.remove(planet);
            planet.geometry.dispose();
            planet.material.dispose();
        }
        this.arPlanets.clear();
        
        for (const marker of this.arMarkers.values()) {
            this.game.scene.remove(marker);
            marker.geometry.dispose();
            marker.material.dispose();
        }
        this.arMarkers.clear();
        
        if (this.cockpitMesh) {
            this.game.scene.remove(this.cockpitMesh);
            this.cockpitMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

export default WebXRBridge;
