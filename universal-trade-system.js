/**
 * Universal Trade System
 * Phase 12: The Omni-Verse
 * Allows trading resources across parallel universes (mock P2P).
 */

class UniversalTradeSystem {
    constructor() {
        this.offers = [];
        this.init();
    }

    init() {
        console.log("🌌 Universal Trade System: ONLINE");
        this.generateMockOffers();
        this.createUI();
    }

    generateMockOffers() {
        // Mock data from "other players"
        const resources = ['Dark Matter', 'Antimatter', 'Exotic Matter', 'Void Crystals'];
        const players = ['CosmicVoyager', 'StarLord99', 'NebulaDrifter', 'EntropyWarden'];

        for (let i = 0; i < 5; i++) {
            this.offers.push({
                id: `trade-${Math.random().toString(36).substr(2, 9)}`,
                player: players[Math.floor(Math.random() * players.length)],
                offering: `${Math.floor(Math.random() * 100) + 10} ${resources[Math.floor(Math.random() * resources.length)]}`,
                requesting: `${Math.floor(Math.random() * 500) + 100} Energy Credits`,
                expires: Date.now() + Math.random() * 86400000
            });
        }
    }

    createUI() {
        // In a real app, this would be a full UI panel.
        // For now, we expose the API and log it.
        console.log(`📊 Market Active: ${this.offers.length} inter-universal trade offers available.`);
    }

    postTradeOffer(resource, amount, price) {
        console.log(`📤 Posting Offer: Selling ${amount} ${resource} for ${price} Credits...`);
        setTimeout(() => {
            console.log("✅ Offer listed on the Universal Market.");
            // Simulate a buy
            setTimeout(() => {
                console.log(`💰 Trade Complete! User 'XenonMaster' bought your ${resource}. +${price} Credits.`);
            }, 5000 + Math.random() * 5000);
        }, 1000);
    }

    showMarket() {
        alert("Universal Market Interface:\n\n" + this.offers.map(o =>
            `[${o.player}] Selling: ${o.offering} | Price: ${o.requesting}`
        ).join("\n"));
    }
}

if (typeof window !== 'undefined') {
    window.UniversalTradeSystem = UniversalTradeSystem;
    window.universalTradeSystem = new UniversalTradeSystem();
}
