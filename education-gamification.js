/**
 * Education Gamification System
 * Tracks User XP, Levels, and Badges for the Space Education Academy.
 */
class EducationGamification {
    constructor() {
        this.profile = this.loadProfile();
        this.ranks = [
            { level: 1, title: "Observer", xp: 0 },
            { level: 2, title: "Sky Watcher", xp: 100 },
            { level: 3, title: "Apprentice Astronomer", xp: 300 },
            { level: 4, title: "Surveyor", xp: 600 },
            { level: 5, title: "Stellar Cartographer", xp: 1000 },
            { level: 10, title: "Cosmic Voyager", xp: 5000 },
            { level: 50, title: "Time Lord", xp: 100000 }
        ];
        this.init();
    }

    init() {
        this.renderProfileWidget();
    }

    loadProfile() {
        const saved = localStorage.getItem('education-profile');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            xp: 0,
            level: 1,
            badges: []
        };
    }

    saveProfile() {
        localStorage.setItem('education-profile', JSON.stringify(this.profile));
        this.updateProfileWidget();
    }

    /**
     * Award XP to user
     * @param {number} amount - Amount of XP to award
     * @param {string} reason - Reason for award (e.g., "Lesson Completed")
     */
    awardXP(amount, reason) {
        this.profile.xp += amount;

        // Show notification
        this.showNotification(`+${amount} XP: ${reason}`);

        this.checkLevelUp();
        this.saveProfile();
    }

    checkLevelUp() {
        // Find highest rank reachable with current XP
        let newLevel = 1;
        let newTitle = "Observer";

        for (const rank of this.ranks) {
            if (this.profile.xp >= rank.xp) {
                newLevel = rank.level;
                newTitle = rank.title;
            }
        }

        if (newLevel > this.profile.level) {
            this.profile.level = newLevel;
            this.showNotification(`🎉 LEVEL UP! You are now a ${newTitle} (Level ${newLevel})!`, 5000);

            // Trigger confetti or sound effect here in future
        }
    }

    renderProfileWidget() {
        const container = document.getElementById('education-profile-widget');
        if (!container) return; // Silent fail if container doesn't exist yet

        this.updateProfileWidget();
    }

    updateProfileWidget() {
        const container = document.getElementById('education-profile-widget');
        if (!container) return;

        const currentRank = this.ranks.find(r => r.level === this.profile.level) || this.ranks[0];
        const nextRank = this.ranks.find(r => r.xp > this.profile.xp) || { xp: this.profile.xp * 2 }; // Fallback

        const progress = Math.min(100, (this.profile.xp / nextRank.xp) * 100);

        container.innerHTML = `
            <div class="gamification-profile" style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; border: 1px solid #ba944f; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <h3 style="margin: 0; color: #ba944f;">${currentRank.title}</h3>
                        <span style="font-size: 0.8em; color: #888;">Level ${this.profile.level} Cadet</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 1.2em; font-weight: bold; color: #4ade80;">${this.profile.xp} XP</span>
                    </div>
                </div>
                <!-- Progress Bar -->
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: #ba944f; width: ${progress}%; height: 100%; transition: width 0.5s ease;"></div>
                </div>
                <div style="text-align: right; font-size: 0.7em; color: #666; margin-top: 4px;">Next Rank: ${nextRank.xp} XP</div>
            </div>
        `;
    }

    showNotification(message, duration = 3000) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(10, 10, 20, 0.95);
            border: 1px solid #ba944f;
            border-left: 4px solid #ba944f;
            padding: 15px 20px;
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            z-index: 10001;
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            font-family: 'Raleway', sans-serif;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);

        // Animate in
        requestAnimationFrame(() => {
            notif.style.transform = 'translateX(0)';
        });

        // Remove
        setTimeout(() => {
            notif.style.transform = 'translateX(120%)';
            setTimeout(() => notif.remove(), 300);
        }, duration);
    }
}

// Initialize
window.EducationGamification = EducationGamification;
window.educationGamification = new EducationGamification();
