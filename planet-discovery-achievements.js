/**
 * Planet Discovery Achievements System
 * Unlock achievements
 */

class PlanetDiscoveryAchievements {
    constructor() {
        this.achievements = this.initializeAchievements();
        this.unlockedAchievements = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) this.currentUser = user;
        }
        this.loadUnlocked();
        this.isInitialized = true;
        console.log('🏅 Planet Discovery Achievements initialized');
    }

    initializeAchievements() {
        return [
            { id: 'first-discovery', name: 'First Discovery', description: 'Discover your first planet', icon: '🌱', points: 10 },
            { id: 'ten-discoveries', name: 'Explorer', description: 'Discover 10 planets', icon: '🔍', points: 50 },
            { id: 'hundred-discoveries', name: 'Master Explorer', description: 'Discover 100 planets', icon: '⭐', points: 200 },
            { id: 'earth-like', name: 'Earth Finder', description: 'Discover an Earth-like planet', icon: '🌍', points: 100 },
            { id: 'confirmed', name: 'Confirmed', description: 'Discover a confirmed planet', icon: '✅', points: 25 },
            { id: 'rare-planet', name: 'Rare Finder', description: 'Discover a rare planet', icon: '💎', points: 150 }
        ];
    }

    loadUnlocked() {
        try {
            const stored = localStorage.getItem('unlocked-achievements');
            if (stored) this.unlockedAchievements = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    saveUnlocked() {
        try {
            localStorage.setItem('unlocked-achievements', JSON.stringify(this.unlockedAchievements));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    checkAchievements(discoveryCount, planetData) {
        const newlyUnlocked = [];

        // First discovery
        if (discoveryCount === 1 && !this.isUnlocked('first-discovery')) {
            newlyUnlocked.push(this.unlockAchievement('first-discovery'));
        }

        // Ten discoveries
        if (discoveryCount === 10 && !this.isUnlocked('ten-discoveries')) {
            newlyUnlocked.push(this.unlockAchievement('ten-discoveries'));
        }

        // Hundred discoveries
        if (discoveryCount === 100 && !this.isUnlocked('hundred-discoveries')) {
            newlyUnlocked.push(this.unlockAchievement('hundred-discoveries'));
        }

        // Earth-like
        const radius = parseFloat(planetData.radius) || 1;
        if (radius >= 0.8 && radius <= 1.2 && !this.isUnlocked('earth-like')) {
            newlyUnlocked.push(this.unlockAchievement('earth-like'));
        }

        // Confirmed
        if ((planetData.status === 'CONFIRMED' || planetData.status === 'Confirmed Planet') && !this.isUnlocked('confirmed')) {
            newlyUnlocked.push(this.unlockAchievement('confirmed'));
        }

        return newlyUnlocked;
    }

    unlockAchievement(achievementId) {
        if (this.isUnlocked(achievementId)) return null;

        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return null;

        const unlocked = {
            ...achievement,
            unlockedAt: new Date().toISOString(),
            userId: this.currentUser?.id
        };

        this.unlockedAchievements.push(unlocked);
        this.saveUnlocked();
        this.showAchievementNotification(achievement);
        return unlocked;
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.9); border: 2px solid #ba944f; border-radius: 15px; padding: 1.5rem; z-index: 10000; animation: slideIn 0.5s ease;';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 3rem;">${achievement.icon}</div>
                <div>
                    <div style="color: #ba944f; font-weight: 600; font-size: 1.2rem;">Achievement Unlocked!</div>
                    <div style="color: #e0e0e0; margin-top: 0.25rem;">${achievement.name}</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-top: 0.25rem;">${achievement.description}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => document.body.removeChild(notification), 500);
        }, 3000);
    }

    renderAchievements(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="achievements-system" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🏅 Achievements (${this.unlockedAchievements.length}/${this.achievements.length})</h3>
                <div class="achievements-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                    ${this.renderAchievementsList()}
                </div>
            </div>
        `;
    }

    renderAchievementsList() {
        return this.achievements.map(achievement => {
            const unlocked = this.isUnlocked(achievement.id);
            return `
                <div style="padding: 1.5rem; background: ${unlocked ? 'rgba(186, 148, 79, 0.2)' : 'rgba(0, 0, 0, 0.4)'}; border: 2px solid ${unlocked ? 'rgba(186, 148, 79, 0.5)' : 'rgba(186, 148, 79, 0.2)'}; border-radius: 10px; text-align: center; opacity: ${unlocked ? '1' : '0.5'};">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${achievement.icon}</div>
                    <div style="color: ${unlocked ? '#ba944f' : 'rgba(255, 255, 255, 0.5)'}; font-weight: 600; margin-bottom: 0.25rem;">${achievement.name}</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">${achievement.description}</div>
                    <div style="color: #4ade80; font-size: 0.9rem; font-weight: 600;">${achievement.points} pts</div>
                </div>
            `;
        }).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryAchievements = PlanetDiscoveryAchievements;
    window.planetDiscoveryAchievements = new PlanetDiscoveryAchievements();
}

