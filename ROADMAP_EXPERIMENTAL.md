# The Event Horizon: Moving Beyond the Browser
## An Experimental Future Roadmap for "Adriano to the Stars"

> "The browser is no longer a document viewer. It is a distributed operating system."

This roadmap outlines a series of experimental projects designed to push the limits of modern web technologies. These features will test the boundaries of performance, interactivity, and integration, transforming the "Projects" page into a laboratory of the future.

---

## 🚀 Phase 1: The Quantum Web (Compute & Physics)
**Goal:** Leverage the GPU and low-level code for desktop-class simulation performance.

### 1.1. Galaxy-Scale N-Body Simulation (WebGPU)
*   **Technology:** **WebGPU** (Compute Shaders).
*   **Concept:** Simulate 100,000+ individual stars interacting gravitationally in real-time.
*   **Technical Limit:** Moving physics calculations from CPU (O(n^2) slow) to parallel GPU compute shaders.
*   **Documentation:** GLSL/WGSL shader optimization.

### 1.2. Procedural Planet Generation Core (WebAssembly/Rust)
*   **Technology:** **WebAssembly (Wasm)** compiled from Rust.
*   **Concept:** Generate valid geological terrain maps (height, moisture, biome) for entire planets in milliseconds on a background thread.
*   **Technical Limit:** Near-native performance for complex Perlin/Simplex noise algorithms that would choke JavaScript.

### 1.3. Real-Time Fluid Dynamics (Nebula Simulation)
*   **Technology:** **WebGL 2.0 / WebGPU** + **OffscreenCanvas**.
*   **Concept:** Interactive 3D nebulae that react to mouse movement (solar winds).
*   **Technical Limit:** Solving Navier-Stokes equations in real-time in the browser.

---

## 🧠 Phase 2: The Sentient Browser (Local AI)
**Goal:** Run Artificial Intelligence entirely on the client side, without server latency/cost.

### 2.1. "HAL" - The Ship's Computer (WebNN / WebLLM)
*   **Technology:** **WebLLM** (Running Llama-3-8b-quantized locally via WebGPU).
*   **Concept:** A conversational AI that knows the entire Kepler database, running partially or fully offline.
*   **Technical Limit:** Allocating VRAM buffers in browser for LLM weights; inference speed tuning.

### 2.2. Voice Command Bridge (Web Speech API + NLP)
*   **Technology:** **Web Speech API** (SpeechRecognition) + **TensorFlow.js**.
*   **Concept:** Control the star map purely by voice ("Computer, approach Kepler-186f").
*   **Technical Limit:** Noise cancellation, continuous listening without draining battery.

### 2.3. Eye-Tracking Navigation (Experimental)
*   **Technology:** **WebGazer.js** (Webcam Access).
*   **Concept:** Select planets just by looking at them.
*   **Technical Limit:** Privacy-preserving local processing of video feed usage.

---

## 🕶️ Phase 3: The Holographic Interface (Immersive XR)
**Goal:** Break the screen barrier.

### 3.1. Surface Exploration (WebXR)
*   **Technology:** **WebXR Device API** + **Three.js**.
*   **Concept:** Walk on the surface of generated planets in 6DoF VR.
*   **Technical Limit:** Maintaining 90Hz framerate while streaming procedural terrain data.

### 3.2. AR Star Chart (WebXR AR Module)
*   **Technology:** **WebXR Hit Test** + **Device Orientation**.
*   **Concept:** Point your phone at the sky to overlay known exoplanets on the real stars.
*   **Technical Limit:** Sensor fusion accuracy and drift correction.

---

## 🔗 Phase 4: The Connected Cosmos (P2P & Real-Time)
**Goal:** Multiplayer without a central server bottleneck.

### 4.1. "Interstellar Radio" (WebTransport)
*   **Technology:** **WebTransport** (QUIC).
*   **Concept:** Ultra-low latency binary streams for multiplayer ship positioning.
*   **Technical Limit:** Unreliable datagram transmission for speed > TCP reliability.

### 4.2. P2P Data Sharing (WebRTC)
*   **Technology:** **WebRTC Data Channels**.
*   **Concept:** Users "seed" planet data chunks to each other to reduce server load (creating a distributed database).
*   **Technical Limit:** NAT traversal and peer discovery logic in pure JS.

---

## 💿 Phase 5: The OS in a Tab (Native Integration)
**Goal:** Blur the line between "Website" and "Native App".

### 5.1. The Captain's Log (File System Access API)
*   **Technology:** `window.showSaveFilePicker()` / `FileSystemHandle`.
*   **Concept:** Save screenshots, videos, and mission logs directly to the user's real "Documents" folder.
*   **Technical Limit:** Security prompt handling and persistent permission management.

### 5.2. Telemetry Hardware Connection (WebSerial / WebHID)
*   **Technology:** **WebSerial API**.
*   **Concept:** Connect a physical Arduino/ESP32 device to control the ship's thrusters or display hull temp.
*   **Technical Limit:** Serial baud rate syncing and hardware handshake protocols.

### 5.3. Cinematic Mode (Window Controls Overlay)
*   **Technology:** **PWA Window Controls Overlay**.
*   **Concept:** Remove the browser title bar entirely for a custom, edge-to-edge UI that feels like a game launcher.
*   **Technical Limit:** CSS env() variables for different OS window button placements.

---

## 🛠️ HTML5 Documentation & Standards Project
As part of this roadmap, we will build a "Code Lab" section in `projects.html` that documents:
1.  **Semantic HTML5 deeply:** usage of `<dialog>`, `<details>`, `<picture>`, `<template>`.
2.  **CSS Houdini:** Generating custom paint worklets for starfields.
3.  **Service Worker internals:** Visualizing the cache lifecycle strategy.
