/**
 * Voting System (Upvote/Downvote)
 * 
 * Adds comprehensive voting system (upvote/downvote).
 * 
 * @module VotingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class VotingSystem {
    constructor() {
        this.votes = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize voting system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('VotingSystem already initialized');
            return;
        }

        this.loadVotes();
        
        this.isInitialized = true;
        console.log('✅ Voting System initialized');
    }

    /**
     * Vote on item
     * @public
     * @param {string} itemId - Item ID
     * @param {string} type - Vote type ('upvote' or 'downvote')
     * @returns {Object} Vote result
     */
    vote(itemId, type) {
        const userId = this.getUserId();
        if (!userId) {
            return { success: false, error: 'User not logged in' };
        }

        const voteKey = `${itemId}-${userId}`;
        const existingVote = this.votes.get(voteKey);

        // Toggle vote if same type
        if (existingVote && existingVote.type === type) {
            this.votes.delete(voteKey);
            return {
                success: true,
                action: 'removed',
                vote: null
            };
        }

        // Update or create vote
        const vote = {
            itemId,
            userId,
            type,
            timestamp: new Date().toISOString()
        };

        this.votes.set(voteKey, vote);
        this.saveVotes();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('vote-changed', {
            detail: { itemId, vote }
        }));

        return {
            success: true,
            action: existingVote ? 'changed' : 'added',
            vote
        };
    }

    /**
     * Get vote for item
     * @public
     * @param {string} itemId - Item ID
     * @returns {Object|null} Vote object
     */
    getVote(itemId) {
        const userId = this.getUserId();
        if (!userId) {
            return null;
        }

        const voteKey = `${itemId}-${userId}`;
        return this.votes.get(voteKey) || null;
    }

    /**
     * Get vote counts
     * @public
     * @param {string} itemId - Item ID
     * @returns {Object} Vote counts
     */
    getVoteCounts(itemId) {
        let upvotes = 0;
        let downvotes = 0;

        this.votes.forEach(vote => {
            if (vote.itemId === itemId) {
                if (vote.type === 'upvote') {
                    upvotes++;
                } else if (vote.type === 'downvote') {
                    downvotes++;
                }
            }
        });

        return {
            upvotes,
            downvotes,
            total: upvotes - downvotes
        };
    }

    /**
     * Get user ID
     * @private
     * @returns {string|null} User ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch {
            return null;
        }
    }

    /**
     * Save votes
     * @private
     */
    saveVotes() {
        try {
            const votes = Object.fromEntries(this.votes);
            localStorage.setItem('votes', JSON.stringify(votes));
        } catch (e) {
            console.warn('Failed to save votes:', e);
        }
    }

    /**
     * Load votes
     * @private
     */
    loadVotes() {
        try {
            const saved = localStorage.getItem('votes');
            if (saved) {
                const votes = JSON.parse(saved);
                Object.entries(votes).forEach(([key, value]) => {
                    this.votes.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load votes:', e);
        }
    }
}

// Create global instance
window.VotingSystem = VotingSystem;
window.votingSystem = new VotingSystem();
window.votingSystem.init();

