/**
 * XR Core Logic
 * Handles Three.js scene setup and WebXR session management.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js';

export class XRManager {
    constructor(containerId, mode = 'VR') {
        this.container = document.getElementById(containerId);
        this.mode = mode; // 'VR' or 'AR'
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controllers = [];
        this.controllerGrips = [];

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        if (this.mode === 'VR') {
            this.scene.background = new THREE.Color(0x101010);
            this.scene.fog = new THREE.Fog(0x101010, 10, 50);
        }

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 1.6, 3);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: this.mode === 'AR' });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // Soft white light
        light.position.set(0, 20, 0);
        this.scene.add(light);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(3, 10, 10);
        this.scene.add(dirLight);

        // XR Button
        if (this.mode === 'VR') {
            document.body.appendChild(VRButton.createButton(this.renderer));
            this.setupVRScene();
        } else {
            document.body.appendChild(ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] }));
            this.setupARScene();
        }

        // Controllers
        this.setupControllers();

        // Loop
        this.renderer.setAnimationLoop(this.render.bind(this));

        // Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupControllers() {
        const controllerModelFactory = new XRControllerModelFactory();

        // Controller 1
        const controller1 = this.renderer.xr.getController(0);
        this.scene.add(controller1);
        this.controllers.push(controller1);

        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        this.scene.add(controllerGrip1);
        this.controllerGrips.push(controllerGrip1);

        // Controller 2
        const controller2 = this.renderer.xr.getController(1);
        this.scene.add(controller2);
        this.controllers.push(controller2);

        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        this.scene.add(controllerGrip2);
        this.controllerGrips.push(controllerGrip2);

        // Raycaster lines for VR
        if (this.mode === 'VR') {
            const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
            const line = new THREE.Line(geometry);
            line.name = 'line';
            line.scale.z = 5;

            controller1.add(line.clone());
            controller2.add(line.clone());
        }
    }

    setupVRScene() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = - Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Random floated cubes to represent "Alien Structure"
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshNormalMaterial();

        for (let i = 0; i < 50; i++) {
            const object = new THREE.Mesh(geometry, material);
            object.position.x = Math.random() * 20 - 10;
            object.position.y = Math.random() * 4 + 0.5;
            object.position.z = Math.random() * 20 - 10;

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;

            this.scene.add(object);
        }
    }

    setupARScene() {
        // AR Reticle
        this.reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // Green reticle
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);

        this.hitTestSource = null;
        this.hitTestSourceRequested = false;

        // Tap to place object
        const controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', this.onSelectAR.bind(this));
    }

    onSelectAR() {
        if (this.reticle.visible) {
            // Place a star model
            const geometry = new THREE.IcosahedronGeometry(0.1, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.5 });
            const mesh = new THREE.Mesh(geometry, material);
            this.reticle.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
            this.scene.add(mesh);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(timestamp, frame) {
        if (this.mode === 'AR' && frame) {
            this.handleARHitTest(frame);
        }

        // Interactive animations could go here

        this.renderer.render(this.scene, this.camera);
    }

    handleARHitTest(frame) {
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        const session = this.renderer.xr.getSession();

        if (this.hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    this.hitTestSource = source;
                });
            });
            session.addEventListener('end', () => {
                this.hitTestSourceRequested = false;
                this.hitTestSource = null;
            });
            this.hitTestSourceRequested = true;
        }

        if (this.hitTestSource) {
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
