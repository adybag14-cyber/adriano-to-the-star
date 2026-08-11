/**
 * Exoplanet XR Experience
 * Manages Virtual Reality and Augmented Reality sessions for the Exoplanet Database.
 * Allows users to view and manipulate planets in VR/AR.
 */
if (typeof ExoplanetXRExperience === 'undefined') {
    window.ExoplanetXRExperience = class ExoplanetXRExperience {
        constructor(viewer) {
            this.viewer = viewer; // Instance of Planet3DViewer
            this.session = null;
            this.controllers = [];
            this.raycaster = new THREE.Raycaster();
            this.cockpitGroup = null;

            // AR Hit Test
            this.hitTestSource = null;
            this.hitTestSourceRequested = false;
            this.reticle = null;

            // Interaction state
            this.isSelecting = false;

            this.init();
        }

        init() {
            if (!navigator.xr) {
                console.log('WebXR not available');
                return;
            }

            // Check VR availability
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    this.enableVRButton();
                }
            });

            // Check AR availability
            navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                if (supported) {
                    this.enableARButton();
                }
            });
        }

        enableVRButton() {
            const btn = document.getElementById('vr-mode-btn');
            if (btn) {
                btn.style.display = 'block';
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', () => this.enterSession('immersive-vr'));
            }
        }

        enableARButton() {
            const btn = document.getElementById('ar-mode-btn');
            if (btn) {
                btn.style.display = 'block';
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', () => this.enterSession('immersive-ar'));
            }
        }

        async enterSession(mode) {
            if (this.session) return;

            try {
                const sessionInit = {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'dom-overlay'],
                    domOverlay: { root: document.body }
                };

                if (mode === 'immersive-ar') {
                    sessionInit.requiredFeatures = ['hit-test'];
                    sessionInit.optionalFeatures.push('dom-overlay');
                }

                const session = await navigator.xr.requestSession(mode, sessionInit);
                this.session = session;

                this.setupXRScene(mode);

                session.addEventListener('end', () => this.exitSession(mode));

                // Notify viewer to switch renderer to XR
                if (this.viewer.renderer) {
                    this.viewer.renderer.xr.enabled = true;
                    this.viewer.renderer.xr.setSession(session);
                }

                console.log(`✅ Entered XR Session (${mode})`);

                // Set update hook if not already
                if (this.viewer) {
                    // We inject our update loop into the viewer's render call if possible,
                    // or ensure viewer calls us. 
                    // Currently assuming viewer.animate() calls us or we rely on events.
                    // BEST PRACTICE: The main loop should call this.update().
                }

            } catch (e) {
                console.error(`Failed to enter ${mode}:`, e);
                alert(`Could not enter ${mode} mode: ` + e.message);
            }
        }

        exitSession(mode) {
            if (!this.session) return;

            // Cleanup Cockpit
            if (this.cockpitGroup) {
                this.viewer.scene.remove(this.cockpitGroup);
                this.cockpitGroup = null;
            }

            // Cleanup AR Reticle
            if (this.reticle) {
                this.viewer.scene.remove(this.reticle);
                this.reticle = null;
            }
            this.hitTestSourceRequested = false;
            this.hitTestSource = null;

            // Reset renderer
            if (this.viewer.renderer) {
                this.viewer.renderer.xr.enabled = false;
            }

            this.session = null;
            this.cleanUpControllers();

            console.log('Exited XR Session');
        }

        setupXRScene(mode) {
            // Setup controllers
            const controller1 = this.viewer.renderer.xr.getController(0);
            controller1.addEventListener('select', this.onSelect.bind(this)); // Use 'select' for tap
            this.viewer.scene.add(controller1);

            const controller2 = this.viewer.renderer.xr.getController(1);
            controller2.addEventListener('select', this.onSelect.bind(this));
            this.viewer.scene.add(controller2);

            this.controllers = [controller1, controller2];

            if (mode === 'immersive-vr') {
                // VR: Eye level & Cockpit
                if (this.viewer.planet) {
                    this.viewer.planet.position.set(0, 1.5, -3);
                    this.viewer.planet.scale.set(1, 1, 1);
                }
                this.createCockpit();

                // Controllers visual
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)
                ]);
                const line = new THREE.Line(geometry);
                line.scale.z = 5;
                controller1.add(line.clone());
                controller2.add(line.clone());

            } else if (mode === 'immersive-ar') {
                // AR: Reticle for placement
                this.createReticle();

                // Hide planet initially until placed? Or float it in front?
                // Let's float it small in front initially
                if (this.viewer.planet) {
                    this.viewer.planet.position.set(0, 0, -1);
                    this.viewer.planet.scale.set(0.1, 0.1, 0.1);
                }
            }
        }

        createCockpit() {
            this.cockpitGroup = new THREE.Group();
            const frameGeo = new THREE.BoxGeometry(2, 1.5, 2);
            const edges = new THREE.EdgesGeometry(frameGeo);
            const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
            frame.position.set(0, 1.5, 0);
            this.cockpitGroup.add(frame);

            // Dashboard
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.3), new THREE.MeshBasicMaterial({ color: 0x002200, opacity: 0.7, transparent: true }));
            dash.position.set(0, 1.1, -0.6);
            dash.rotation.x = -Math.PI / 4;
            this.cockpitGroup.add(dash);

            this.viewer.scene.add(this.cockpitGroup);
        }

        createReticle() {
            const ring = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
            const dot = new THREE.CircleGeometry(0.05, 32).rotateX(-Math.PI / 2);

            this.reticle = new THREE.Group();
            this.reticle.add(new THREE.Mesh(ring, new THREE.MeshBasicMaterial()));
            this.reticle.add(new THREE.Mesh(dot, new THREE.MeshBasicMaterial()));

            this.reticle.visible = false;
            this.reticle.matrixAutoUpdate = false;
            this.viewer.scene.add(this.reticle);
        }

        onSelect(event) {
            if (this.session && this.session.mode === 'immersive-ar' && this.reticle && this.reticle.visible) {
                // AR Place Planet
                if (this.viewer.planet) {
                    this.viewer.planet.position.setFromMatrixPosition(this.reticle.matrix);
                    this.viewer.planet.scale.set(0.5, 0.5, 0.5); // Bigger when placed
                    this.viewer.planet.visible = true;
                    console.log('🌍 Planet placed in AR at', this.reticle.position);
                }
            }
        }

        update() {
            if (!this.session) return;

            // AR Hit Testing
            if (this.session.mode === 'immersive-ar') {
                if (!this.hitTestSourceRequested) {
                    this.session.requestReferenceSpace('viewer').then((referenceSpace) => {
                        this.session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                            this.hitTestSource = source;
                        });
                    });
                    this.session.addEventListener('end', () => {
                        this.hitTestSourceRequested = false;
                        this.hitTestSource = null;
                    });
                    this.hitTestSourceRequested = true;
                }

                if (this.hitTestSource && this.reticle) {
                    const frame = this.viewer.renderer.xr.getFrame();
                    if (frame) {
                        const referenceSpace = this.viewer.renderer.xr.getReferenceSpace();
                        const hitTestResults = frame.getHitTestResults(this.hitTestSource);

                        if (hitTestResults.length > 0) {
                            const hit = hitTestResults[0];
                            this.reticle.visible = true;
                            this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                        } else {
                            this.reticle.visible = false;
                        }
                    }
                }
            }

            // Auto-rotation
            if (this.viewer.planet) {
                this.viewer.planet.rotation.y += 0.002;
            }
        }

        cleanUpControllers() {
            this.controllers.forEach(c => {
                if (c.parent) c.parent.remove(c);
            });
            this.controllers = [];
        }
    }
}

if (typeof window !== 'undefined') {
    window.ExoplanetXRExperience = ExoplanetXRExperience;
}
