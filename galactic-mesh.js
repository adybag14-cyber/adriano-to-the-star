/**
 * GalacticMesh.js
 * Simulates a P2P Mesh Network for the "Serverless MMO" layer.
 * Manages "Peers", "Packets", and simulated latency.
 */

class GalacticMeshNetwork {
    constructor(game) {
        this.game = game;
        this.peers = [];
        this.isConnected = false;
        this.networkLatency = 50; // ms
        this.crdt = null; // Will be assigned
        this.msgQueue = [];
    }

    init(crdtManager) {
        this.crdt = crdtManager;
        console.log("Galactic Mesh: Booting Network Stack...");

        // Simulate discovery
        setTimeout(() => this.connectToSwarm(), 1500);
    }

    connectToSwarm() {
        this.isConnected = true;
        this.game.notify("Connected to Galactic Mesh Network.", "success");

        // Generate mock peers
        const peerNames = ["Alpha-Station", "Nebula-Miner-99", "Void-Walker", "Star-Lord-X", "Deep-Space-9"];
        peerNames.forEach(name => {
            this.peers.push({
                id: Math.random().toString(36).substr(2, 9),
                name: name,
                latency: Math.floor(Math.random() * 200 + 20),
                lastSeen: Date.now()
            });
        });

        // Start heartbeat loop
        setInterval(() => this.heartbeat(), 1000);
        // Start incoming packet simulation
        setInterval(() => this.simulateIncomingTraffic(), 3000);
    }

    heartbeat() {
        // Update peer status
        this.peers.forEach(p => {
            p.lastSeen = Date.now();
            // jitter latency
            p.latency += (Math.random() - 0.5) * 10;
        });
    }

    simulateIncomingTraffic() {
        if (!this.isConnected) return;

        // Random peer sends a resource update
        const peer = this.peers[Math.floor(Math.random() * this.peers.length)];
        const resourceType = Math.random() > 0.5 ? "Iron" : "Energy";
        const amount = Math.floor(Math.random() * 1000);

        this.receivePacket({
            type: "CRDT_UPDATE",
            sender: peer.name,
            data: { resource: resourceType, value: amount }
        });
    }

    receivePacket(packet) {
        // Simulate network delay
        setTimeout(() => {
            if (packet.type === "CRDT_UPDATE") {
                this.crdt.mergeRemote(packet.data);
                this.game.notify(`Mesh: Received update from ${packet.sender}`, "info");
            }
        }, this.networkLatency);
    }
}

window.GalacticMeshNetwork = GalacticMeshNetwork;
