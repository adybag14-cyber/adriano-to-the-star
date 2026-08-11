/**
 * Spaced Repetition Algorithm
 * @class SpacedRepetitionAlgorithm
 * @description Implements spaced repetition algorithm for optimal learning.
 */
class SpacedRepetitionAlgorithm {
    constructor() {
        this.intervals = [1, 3, 7, 14, 30, 90]; // Days
        this.easeFactors = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_pa_ce_dr_ep_et_it_io_na_lg_or_it_hm_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_pa_ce_dr_ep_et_it_io_na_lg_or_it_hm_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Calculate next review date.
     * @param {string} userId - User identifier.
     * @param {string} itemId - Item identifier.
     * @param {number} quality - Quality of recall (0-5).
     * @returns {Date} Next review date.
     */
    calculateNextReview(userId, itemId, quality) {
        const key = `${userId}_${itemId}`;
        const easeFactor = this.easeFactors.get(key) || 2.5;
        const interval = this.calculateInterval(easeFactor, quality);
        
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);
        
        // Update ease factor
        const newEaseFactor = this.updateEaseFactor(easeFactor, quality);
        this.easeFactors.set(key, newEaseFactor);
        
        return nextReview;
    }

    /**
     * Calculate interval.
     * @param {number} easeFactor - Ease factor.
     * @param {number} quality - Quality of recall.
     * @returns {number} Interval in days.
     */
    calculateInterval(easeFactor, quality) {
        if (quality < 3) {
            return 1; // Review again tomorrow
        }
        return Math.floor(easeFactor * this.intervals[Math.min(quality - 3, this.intervals.length - 1)]);
    }

    /**
     * Update ease factor.
     * @param {number} currentEase - Current ease factor.
     * @param {number} quality - Quality of recall.
     * @returns {number} New ease factor.
     */
    updateEaseFactor(currentEase, quality) {
        const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        return Math.max(1.3, newEase);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.spacedRepetitionAlgorithm = new SpacedRepetitionAlgorithm();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpacedRepetitionAlgorithm;
}

