/**
 * P2P Core Logic
 * Handles WebRTC Data Channels and WebTransport connections.
 */

export class P2PManager {
    constructor(config = {}) {
        this.peers = new Map();
        this.nodeId = crypto.randomUUID().split('-')[0];
        this.discoveryChannel = new BroadcastChannel('cosmic-p2p-discovery');

        // WebTransport support check
        this.supportsWebTransport = 'WebTransport' in window;

        this.log = config.log || console.log;

        this.init();
    }

    init() {
        this.log(`Initializing P2P Node: ${this.nodeId}`);

        // 1. Local Discovery (Tab-to-Tab) via BroadcastChannel
        this.discoveryChannel.onmessage = (event) => this.handleDiscoveryMessage(event);
        this.announcePresence();

        // Re-announce periodically
        setInterval(() => this.announcePresence(), 5000);
    }

    announcePresence() {
        this.discoveryChannel.postMessage({
            type: 'HELLO',
            nodeId: this.nodeId,
            timestamp: Date.now()
        });
    }

    handleDiscoveryMessage(event) {
        const { type, nodeId, data } = event.data;
        if (nodeId === this.nodeId) return; // Ignore self

        if (type === 'HELLO') {
            if (!this.peers.has(nodeId)) {
                this.log(`New Peer Discovered: ${nodeId}`);
                this.peers.set(nodeId, { lastSeen: Date.now() });
                // Simulate "Connection" establishment
                this.onPeerConnected(nodeId);
            } else {
                this.peers.get(nodeId).lastSeen = Date.now();
            }
        }

        if (type === 'DATA_CHUNK') {
            this.log(`Received Data from ${nodeId}: ${data.length} bytes`);
            if (this.onDataReceived) this.onDataReceived(nodeId, data);
        }

        if (type === 'RADIO_WAVE') {
            if (this.onRadioReceived) this.onRadioReceived(nodeId, data);
        }
    }

    onPeerConnected(peerId) {
        // Callback for UI
        const event = new CustomEvent('peer-connected', { detail: { peerId } });
        window.dispatchEvent(event);
    }

    // Simulate sending data via P2P (uses BroadcastChannel for local simulation)
    broadcastData(data) {
        this.discoveryChannel.postMessage({
            type: 'DATA_CHUNK',
            nodeId: this.nodeId,
            data: data
        });
    }

    // Simulate Streaming Radio
    broadcastRadio(frequencyData) {
        this.discoveryChannel.postMessage({
            type: 'RADIO_WAVE',
            nodeId: this.nodeId,
            data: frequencyData
        });
    }
}
