/**
 * Flashcard System
 * @class FlashcardSystem
 * @description Manages flashcards for studying and memorization.
 */
class FlashcardSystem {
    constructor() {
        this.decks = new Map();
        this.cards = new Map();
        this.studyProgress = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_la_sh_ca_rd_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_la_sh_ca_rd_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create flashcard deck.
     * @param {string} deckId - Deck identifier.
     * @param {object} deckData - Deck data.
     */
    createDeck(deckId, deckData) {
        this.decks.set(deckId, {
            ...deckData,
            id: deckId,
            name: deckData.name,
            courseId: deckData.courseId,
            cards: [],
            createdAt: new Date()
        });
        console.log(`Flashcard deck created: ${deckId}`);
    }

    /**
     * Add card to deck.
     * @param {string} deckId - Deck identifier.
     * @param {object} cardData - Card data.
     */
    addCard(deckId, cardData) {
        const deck = this.decks.get(deckId);
        if (!deck) {
            throw new Error(`Deck not found: ${deckId}`);
        }

        const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.cards.set(cardId, {
            id: cardId,
            deckId,
            front: cardData.front,
            back: cardData.back,
            difficulty: 'new',
            createdAt: new Date()
        });

        deck.cards.push(cardId);
        console.log(`Card added to deck ${deckId}`);
    }

    /**
     * Study card.
     * @param {string} cardId - Card identifier.
     * @param {string} userId - User identifier.
     * @param {boolean} correct - Whether answer was correct.
     */
    studyCard(cardId, userId, correct) {
        const progressKey = `${userId}_${cardId}`;
        const progress = this.studyProgress.get(progressKey) || {
            userId,
            cardId,
            timesStudied: 0,
            timesCorrect: 0,
            lastStudied: null
        };

        progress.timesStudied++;
        if (correct) {
            progress.timesCorrect++;
        }
        progress.lastStudied = new Date();

        this.studyProgress.set(progressKey, progress);
        console.log(`Card studied: ${cardId} by user ${userId}`);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.flashcardSystem = new FlashcardSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardSystem;
}

