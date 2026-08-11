/**
 * IoTManager.js
 * Handles WebBluetooth connections and Simulated Room Ambience.
 * Bridges the gap between the game and the physical world.
 */

class IoTManager {
    constructor(game) {
        this.game = game;
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.simulatedColor = "#000000";
    }

    init() {
        console.log("IoT Manager: Initializing Bio-Digital Interface...");
        this.updateVirtualRoom("#000000"); // Start dark
    }

    /**
     * Request Bluetooth Device Pairing
     * Note: Must be triggered by user gesture (click)
     */
    async connectBluetooth() {
        if (!navigator.bluetooth) {
            this.game.notify("WebBluetooth not supported on this device.", "error");
            return;
        }

        try {
            this.game.notify("Scanning for BLE devices...", "info");

            // Standard Generic Ble Light Service UUIDs
            // 0xFFE5 is common for cheap LED strips
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [0xFFE5] }],
                optionalServices: ['generic_access']
            });

            this.server = await this.device.gatt.connect();
            this.service = await this.server.getPrimaryService(0xFFE5);
            this.characteristic = await this.service.getCharacteristic(0xFFE9); // Color trait often here

            this.isConnected = true;
            this.game.notify(`Connected to ${this.device.name}!`, "success");

        } catch (error) {
            console.warn("Bluetooth Connection Failed:", error);
            this.game.notify("Connection failed or cancelled. Using Simulator.", "warning");
        }
    }

    /**
     * Set the room color (Physical + Virtual)
     * @param {number} r 0-255
     * @param {number} g 0-255
     * @param {number} b 0-255
     */
    setColor(r, g, b) {
        // 1. Update Virtual Simulator
        const hex = this.rgbToHex(r, g, b);
        this.simulatedColor = hex;
        this.updateVirtualRoom(hex);

        // 2. Update Physical Hardware (if connected)
        if (this.isConnected && this.characteristic) {
            // Very generic protocol: [0x56, R, G, B, 0x00, 0xF0, 0xAA] - varies wildly by vendor
            // This is a "best guess" for generic ELK-BLEDOM chips
            const buffer = new Uint8Array([0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, 0xef]);
            this.characteristic.writeValue(buffer).catch(e => console.error(e));
        }
    }

    updateVirtualRoom(color) {
        const room = document.getElementById('virtual-room-preview');
        if (room) {
            room.style.boxShadow = `0 0 50px 10px ${color}`;
            room.style.background = `radial-gradient(circle, ${color}33 0%, rgba(0,0,0,0.9) 100%)`;
            // Also update the icon itself
            const icon = document.getElementById('iot-icon-status');
            if (icon) icon.style.color = color;
        }
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

window.IoTManager = IoTManager;
