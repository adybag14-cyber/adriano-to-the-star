/**
 * Planet Discovery Leaderboard
 * Rank users by discoveries
 */

class PlanetDiscoveryLeaderboard {
    constructor() {
        this.leaderboard = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadLeaderboard();
        this.isInitialized = true;
        console.log('🏆 Planet Discovery Leaderboard initialized');
    }

    loadLeaderboard() {
        try {
            const stored = localStorage.getItem('discovery-leaderboard');
            if (stored) this.leaderboard = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    saveLeaderboard() {
        try {
            localStorage.setItem('discovery-leaderboard', JSON.stringify(this.leaderboard));
        } catch (error) {
            console.error('Error saving leaderboard:', error);
        }
    }

    updateUserScore(userId, userName, points) {
        let userEntry = this.leaderboard.find(u => u.userId === userId);
        
        if (!userEntry) {
            userEntry = {
                userId: userId,
                userName: userName,
                discoveries: 0,
                points: 0,
                rank: 0
            };
            this.leaderboard.push(userEntry);
        }

        userEntry.discoveries++;
        userEntry.points += points;
        this.sortLeaderboard();
        this.saveLeaderboard();
        return userEntry;
    }

    sortLeaderboard() {
        this.leaderboard.sort((a, b) => b.points - a.points);
        this.leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
    }

    getUserRank(userId) {
        const user = this.leaderboard.find(u => u.userId === userId);
        return user ? user.rank : null;
    }

    renderLeaderboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const topUsers = this.leaderboard.slice(0, 10);

        container.innerHTML = `
            <div class="discovery-leaderboard" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🏆 Discovery Leaderboard</h3>
                <div class="leaderboard-list">${this.renderLeaderboardList(topUsers)}</div>
            </div>
        `;
    }

    renderLeaderboardList(users) {
        if (users.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No rankings yet. Start discovering planets!</p>';
        }

        return users.map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const isCurrentUser = this.currentUser && user.userId === this.currentUser.id;

            return `
                <div style="padding: 1rem; background: ${isCurrentUser ? 'rgba(186, 148, 79, 0.2)' : 'rgba(0, 0, 0, 0.4)'}; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 1.5rem; width: 40px; text-align: center;">${medal || `#${user.rank}`}</div>
                        <div>
                            <div style="color: #ba944f; font-weight: 600;">${user.userName} ${isCurrentUser ? '(You)' : ''}</div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">${user.discoveries} discoveries</div>
                        </div>
                    </div>
                    <div style="color: #4ade80; font-size: 1.2rem; font-weight: bold;">${user.points} pts</div>
                </div>
            `;
        }).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryLeaderboard = PlanetDiscoveryLeaderboard;
    window.planetDiscoveryLeaderboard = new PlanetDiscoveryLeaderboard();
}

