/**
 * Planet Naming System
 * Allow users to suggest names for planets
 */

class PlanetNamingSystem {
    constructor() {
        this.nameSuggestions = [];
        this.votes = {};
        this.currentUser = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
            }
        }

        this.loadSuggestions();
        this.isInitialized = true;
        console.log('✏️ Planet Naming System initialized');
    }

    loadSuggestions() {
        try {
            const stored = localStorage.getItem('planet-name-suggestions');
            if (stored) {
                this.nameSuggestions = JSON.parse(stored);
            }

            const storedVotes = localStorage.getItem('planet-name-votes');
            if (storedVotes) {
                this.votes = JSON.parse(storedVotes);
            }
        } catch (error) {
            console.error('Error loading name suggestions:', error);
        }
    }

    saveSuggestions() {
        try {
            localStorage.setItem('planet-name-suggestions', JSON.stringify(this.nameSuggestions));
            localStorage.setItem('planet-name-votes', JSON.stringify(this.votes));
        } catch (error) {
            console.error('Error saving suggestions:', error);
        }
    }

    /**
     * Suggest a name for a planet
     */
    suggestName(kepid, suggestedName, reason = '') {
        if (!this.currentUser) {
            throw new Error('Please log in to suggest names');
        }

        // Check if name already suggested
        const existing = this.nameSuggestions.find(s => 
            s.kepid === kepid && 
            s.suggestedName.toLowerCase() === suggestedName.toLowerCase()
        );

        if (existing) {
            throw new Error('This name has already been suggested');
        }

        const suggestion = {
            id: `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            kepid: kepid,
            suggestedName: suggestedName,
            reason: reason,
            suggesterId: this.currentUser.id,
            suggesterEmail: this.currentUser.email,
            votes: 0,
            status: 'pending', // pending, approved, rejected
            createdAt: new Date().toISOString()
        };

        this.nameSuggestions.push(suggestion);
        this.saveSuggestions();

        return suggestion;
    }

    /**
     * Vote on a name suggestion
     */
    voteOnSuggestion(suggestionId, voteType = 'upvote') {
        if (!this.currentUser) {
            throw new Error('Please log in to vote');
        }

        const suggestion = this.nameSuggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            throw new Error('Suggestion not found');
        }

        const voteKey = `${suggestionId}-${this.currentUser.id}`;
        const existingVote = this.votes[voteKey];

        if (existingVote) {
            // Remove previous vote
            if (existingVote === 'upvote') {
                suggestion.votes--;
            } else if (existingVote === 'downvote') {
                suggestion.votes++;
            }
        }

        // Apply new vote
        if (voteType === 'upvote') {
            suggestion.votes++;
            this.votes[voteKey] = 'upvote';
        } else if (voteType === 'downvote') {
            suggestion.votes--;
            this.votes[voteKey] = 'downvote';
        }

        this.saveSuggestions();
        return suggestion.votes;
    }

    /**
     * Get suggestions for a planet
     */
    getPlanetSuggestions(kepid) {
        return this.nameSuggestions
            .filter(s => s.kepid === kepid)
            .sort((a, b) => b.votes - a.votes);
    }

    /**
     * Render naming system UI
     */
    renderNamingSystem(containerId, kepid) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const suggestions = this.getPlanetSuggestions(kepid);

        container.innerHTML = `
            <div class="planet-naming-system" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">✏️ Planet Naming System</h3>
                
                ${this.currentUser ? `
                    <div class="suggest-name-form" style="margin-bottom: 2rem; padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border-radius: 10px;">
                        <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Suggest a Name</h4>
                        <input type="text" id="suggested-name-input" placeholder="Enter planet name..." style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; margin-bottom: 1rem;">
                        <textarea id="suggestion-reason-input" placeholder="Reason for this name (optional)..." style="width: 100%; min-height: 80px; padding: 0.75rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; margin-bottom: 1rem; resize: vertical;"></textarea>
                        <button id="submit-suggestion-btn" class="btn-primary" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            ✏️ Submit Suggestion
                        </button>
                    </div>
                ` : ''}

                <div class="suggestions-list">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Name Suggestions (${suggestions.length})</h4>
                    ${this.renderSuggestions(suggestions)}
                </div>
            </div>
        `;

        this.setupNamingEventListeners(kepid);
    }

    renderSuggestions(suggestions) {
        if (suggestions.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No name suggestions yet. Be the first to suggest a name!</p>';
        }

        return suggestions.map(suggestion => {
            const userVote = this.votes[`${suggestion.id}-${this.currentUser?.id}`];
            const upvoteColor = userVote === 'upvote' ? '#4ade80' : 'rgba(255, 255, 255, 0.6)';
            const downvoteColor = userVote === 'downvote' ? '#ef4444' : 'rgba(255, 255, 255, 0.6)';

            return `
                <div class="suggestion-item" style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h5 style="color: #ba944f; margin: 0 0 0.5rem 0; font-size: 1.2rem;">${suggestion.suggestedName}</h5>
                            ${suggestion.reason ? `<p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0;">${suggestion.reason}</p>` : ''}
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #4ade80; font-size: 1.5rem; font-weight: bold;">${suggestion.votes}</div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">votes</div>
                        </div>
                    </div>
                    ${this.currentUser ? `
                        <div style="display: flex; gap: 1rem;">
                            <button class="upvote-btn" data-suggestion-id="${suggestion.id}" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid ${upvoteColor}; border-radius: 10px; color: ${upvoteColor}; cursor: pointer; font-weight: 600;">
                                👍 Upvote
                            </button>
                            <button class="downvote-btn" data-suggestion-id="${suggestion.id}" style="flex: 1; padding: 0.75rem; background: rgba(239, 68, 68, 0.2); border: 2px solid ${downvoteColor}; border-radius: 10px; color: ${downvoteColor}; cursor: pointer; font-weight: 600;">
                                👎 Downvote
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    setupNamingEventListeners(kepid) {
        const submitBtn = document.getElementById('submit-suggestion-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const nameInput = document.getElementById('suggested-name-input');
                const reasonInput = document.getElementById('suggestion-reason-input');
                
                if (nameInput && nameInput.value.trim()) {
                    try {
                        this.suggestName(kepid, nameInput.value.trim(), reasonInput?.value || '');
                        alert('Name suggestion submitted!');
                        nameInput.value = '';
                        if (reasonInput) reasonInput.value = '';
                        this.renderNamingSystem('naming-system-container', kepid);
                    } catch (error) {
                        alert('Error: ' + error.message);
                    }
                }
            });
        }

        document.querySelectorAll('.upvote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestionId = btn.dataset.suggestionId;
                this.voteOnSuggestion(suggestionId, 'upvote');
                this.renderNamingSystem('naming-system-container', kepid);
            });
        });

        document.querySelectorAll('.downvote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestionId = btn.dataset.suggestionId;
                this.voteOnSuggestion(suggestionId, 'downvote');
                this.renderNamingSystem('naming-system-container', kepid);
            });
        });
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.PlanetNamingSystem = PlanetNamingSystem;
    window.planetNamingSystem = new PlanetNamingSystem();
}

