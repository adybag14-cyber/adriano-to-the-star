/**
 * Carrier Flight Deck Manager (UPGRADED)
 * High-fidelity management of launch sequences, recovery windows, 
 * and deck-crew fatigue.
 */
class CarrierDeckManager {
    constructor(deckCapacity = 4) {
        this.decks = Array(deckCapacity).fill(null).map((_, i) => ({
            id: i,
            status: 'IDLE', // IDLE, PREPARING, LAUNCHING, RECOVERING, REFUELING, REARMING
            activeCraft: null,
            deckIntegrity: 100,
            lastActionTime: Date.now()
        }));

        this.launchQueue = [];
        this.recoveryQueue = [];
        this.deckFatigue = 0; // Crew fatigue impacts speed
    }

    /**
     * Schedules a squadron craft for launch. 
     * Includes time-to-launch (TTL) based on deck state.
     */
    requestLaunch(craft) {
        const availableDeck = this.decks.find(d => d.status === 'IDLE');
        if (availableDeck) {
            this.prepareDeck(availableDeck, craft, 'LAUNCH');
            return { success: true, deckId: availableDeck.id, eta: 30 + this.deckFatigue };
        }
        this.launchQueue.push(craft);
        return { success: false, message: 'QUEUED', queuePos: this.launchQueue.length };
    }

    prepareDeck(deck, craft, type) {
        deck.status = (type === 'LAUNCH') ? 'PREPARING' : 'RECOVERING';
        deck.activeCraft = craft;
        deck.lastActionTime = Date.now();

        // Simulate preparation time
        setTimeout(() => {
            if (type === 'LAUNCH') {
                deck.status = 'IDLE';
                deck.activeCraft = null;
                this.deckFatigue += 0.5;
                this.processQueues();
            }
        }, 10000 + (this.deckFatigue * 100));
    }

    processQueues() {
        if (this.launchQueue.length > 0) {
            const next = this.launchQueue.shift();
            this.requestLaunch(next);
        }
    }

    applyDeckDamage(amount) {
        const targetDeck = this.decks[Math.floor(Math.random() * this.decks.length)];
        targetDeck.deckIntegrity -= amount;
        if (targetDeck.deckIntegrity < 50) targetDeck.status = 'DISABLED';
    }
}

if (typeof module !== 'undefined') module.exports = CarrierDeckManager;