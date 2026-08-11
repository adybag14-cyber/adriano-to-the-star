/**
 * Planet Ownership History Tracker
 * Track ownership changes over time
 */

class PlanetOwnershipHistory {
    constructor() {
        this.history = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadHistory();
        this.isInitialized = true;
        console.log('📜 Planet Ownership History initialized');
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem('planet-ownership-history');
            if (stored) this.history = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('planet-ownership-history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    addHistoryEntry(planetId, planetName, action, fromUser, toUser, details = {}) {
        const entry = {
            id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            planetId: planetId,
            planetName: planetName,
            action: action, // 'claimed', 'transferred', 'sold', 'rented'
            fromUser: fromUser,
            toUser: toUser,
            details: details,
            timestamp: new Date().toISOString()
        };

        this.history.unshift(entry);
        if (this.history.length > 1000) {
            this.history = this.history.slice(0, 1000);
        }
        this.saveHistory();
        return entry;
    }

    getPlanetHistory(planetId) {
        return this.history.filter(h => h.planetId === planetId);
    }

    getUserHistory(userId) {
        return this.history.filter(h => h.fromUser === userId || h.toUser === userId);
    }

    renderHistory(containerId, planetId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const history = planetId ? this.getPlanetHistory(planetId) : this.history.slice(0, 50);

        container.innerHTML = `
            <div class="ownership-history" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📜 Ownership History</h3>
                <div class="history-timeline">${this.renderTimeline(history)}</div>
            </div>
        `;
    }

    renderTimeline(history) {
        if (history.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No history available</p>';
        }

        return history.map(entry => {
            const actionColors = {
                'claimed': '#4ade80',
                'transferred': '#4a90e2',
                'sold': '#fbbf24',
                'rented': '#a855f7'
            };
            const color = actionColors[entry.action] || '#ba944f';

            return `
                <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border-left: 3px solid ${color}; border-radius: 5px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.25rem;">${entry.planetName}</div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                                ${entry.action} ${entry.toUser ? `to ${entry.toUser}` : ''}
                            </div>
                        </div>
                        <span style="padding: 0.25rem 0.75rem; background: ${color}20; border: 1px solid ${color}50; border-radius: 6px; color: ${color}; font-size: 0.75rem; font-weight: 600;">
                            ${entry.action}
                        </span>
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.75rem;">${new Date(entry.timestamp).toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetOwnershipHistory = PlanetOwnershipHistory;
    window.planetOwnershipHistory = new PlanetOwnershipHistory();
}

