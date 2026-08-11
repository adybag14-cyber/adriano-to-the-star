/**
 * Achievement System
 * Tracks player accomplishments and rewards
 */

class Achievement {
    constructor(id, name, desc, category, condition, reward = {}) {
        this.id = id;
        this.name = name;
        this.desc = desc;
        this.category = category; // colony, exploration, economy, military, space
        this.condition = condition; // Function that returns true when unlocked
        this.reward = reward; // { resources: {}, unlocks: [] }
        this.unlocked = false;
        this.unlockedAt = null;
    }

    static ICONS = {
        colony: '🏠',
        exploration: '🔭',
        economy: '💰',
        military: '⚔️',
        space: '🚀'
    };
}

class AchievementManager {
    constructor(game) {
        this.game = game;
        this.achievements = [];
        this.recentUnlocks = [];
    }

    init() {
        this.registerAchievements();
        console.log("Achievement System Initialized:", this.achievements.length, "achievements");
    }

    registerAchievements() {
        const g = this.game;

        // Colony Achievements
        this.add('first_building', 'First Steps', 'Build your first structure', 'colony',
            () => g.structures.length >= 1, { resources: { minerals: 50 } });

        this.add('builder', 'Builder', 'Build 10 structures', 'colony',
            () => g.structures.length >= 10, { resources: { minerals: 200 } });

        this.add('metropolis', 'Metropolis', 'Build 50 structures', 'colony',
            () => g.structures.length >= 50, { resources: { alloys: 100 } });

        this.add('first_colonist', 'Population One', 'Have your first colonist', 'colony',
            () => g.colonists.length >= 1);

        this.add('small_colony', 'Small Colony', 'Reach 10 colonists', 'colony',
            () => g.colonists.length >= 10, { resources: { food: 100 } });

        this.add('growing_colony', 'Growing Colony', 'Reach 50 colonists', 'colony',
            () => g.colonists.length >= 50, { resources: { credits: 500 } });

        this.add('max_morale', 'Paradise', 'Reach 100% morale', 'colony',
            () => g.morale >= 100);

        // Exploration Achievements
        this.add('first_scan', 'First Discovery', 'Scan a tile for alien life', 'exploration',
            () => g.ecosystem?.xenodex?.flora?.length >= 1 || g.ecosystem?.xenodex?.fauna?.length >= 1);

        this.add('xenobiologist', 'Xenobiologist', 'Discover 5 species', 'exploration',
            () => (g.ecosystem?.xenodex?.flora?.length || 0) + (g.ecosystem?.xenodex?.fauna?.length || 0) >= 5,
            { resources: { data: 100 } });

        this.add('warp_drive', 'Warp Speed', 'Travel to another star system', 'exploration',
            () => g.currentSystemId !== 'kepler_186f');

        // Economy Achievements
        this.add('mineral_hoarder', 'Mineral Hoarder', 'Accumulate 1000 minerals', 'economy',
            () => g.resources.minerals >= 1000);

        this.add('energy_crisis_averted', 'Powered Up', 'Have 500+ energy', 'economy',
            () => g.resources.energy >= 500);

        this.add('first_trade', 'Open for Business', 'Establish a trade route', 'economy',
            () => g.trade?.routes?.length >= 1, { resources: { credits: 200 } });

        this.add('industrial', 'Industrial Revolution', 'Produce 100 alloys', 'economy',
            () => g.resources.alloys >= 100);

        // Military Achievements
        this.add('first_defense', 'Defender', 'Repel a hostile creature', 'military',
            () => g.military?.defensesBuilt >= 1);

        this.add('diplomat', 'Diplomat', 'Sign a treaty with a faction', 'military',
            () => g.diplomacy?.treaties?.length >= 1, { resources: { data: 50 } });

        // Space Achievements
        this.add('launch_satellite', 'Eyes in the Sky', 'Launch a satellite', 'space',
            () => g.orbit?.satellites?.length >= 1);

        this.add('moon_landing', 'One Small Step', 'Land on the moon', 'space',
            () => g.isOnMoon === true, { resources: { helium3: 50 } });

        this.add('shipwright', 'Shipwright', 'Build a spaceship', 'space',
            () => g.ships?.length >= 1);

        this.add('fleet_commander', 'Fleet Commander', 'Have 5 ships', 'space',
            () => g.ships?.length >= 5, { resources: { alloys: 200 } });
    }

    add(id, name, desc, category, condition, reward = {}) {
        this.achievements.push(new Achievement(id, name, desc, category, condition, reward));
    }

    check() {
        const newUnlocks = [];

        this.achievements.forEach(a => {
            if (a.unlocked) return;

            try {
                if (a.condition()) {
                    a.unlocked = true;
                    a.unlockedAt = this.game.day;
                    this.applyReward(a);
                    newUnlocks.push(a);
                    this.recentUnlocks.push(a);
                }
            } catch (e) {
                // Condition failed, ignore
            }
        });

        // Show notifications for new unlocks
        newUnlocks.forEach(a => {
            this.showUnlockNotification(a);
        });

        return newUnlocks;
    }

    applyReward(achievement) {
        if (achievement.reward.resources) {
            for (const [res, amount] of Object.entries(achievement.reward.resources)) {
                this.game.resources[res] = (this.game.resources[res] || 0) + amount;
            }
        }
    }

    showUnlockNotification(achievement) {
        const icon = Achievement.ICONS[achievement.category] || '🏆';
        const msg = `Achievement Unlocked: ${achievement.name}!`;

        // Notify UI
        this.game.notify(`${icon} ${msg}`, 'success');

        // Play sound
        if (this.game.audio?.playUnlock) this.game.audio.playUnlock();

        // Add to Captain's Log
        if (this.game.log) {
            this.game.log.add(`${icon} ${msg} - ${achievement.desc}`, 'success');
        }
    }

    getUnlocked() {
        return this.achievements.filter(a => a.unlocked);
    }

    getLocked() {
        return this.achievements.filter(a => !a.unlocked);
    }

    getProgress() {
        const unlocked = this.getUnlocked().length;
        const total = this.achievements.length;
        return { unlocked, total, percent: Math.round((unlocked / total) * 100) };
    }

    openUI() {
        let modal = document.getElementById('ep-achievements-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-achievements-modal';
            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #fbbf24;border-radius:15px;padding:30px;z-index:1000;min-width:500px;max-height:80vh;overflow-y:auto;';
            document.body.appendChild(modal);
        }

        const progress = this.getProgress();
        const categories = ['colony', 'exploration', 'economy', 'military', 'space'];

        modal.innerHTML = `
            <h2 style="color:#fbbf24;margin:0 0 10px 0;">🏆 Achievements</h2>
            <p style="color:#94a3b8;">Progress: ${progress.unlocked}/${progress.total} (${progress.percent}%)</p>
            <div style="background:#1e293b;height:10px;border-radius:5px;margin:15px 0;">
                <div style="background:linear-gradient(90deg,#fbbf24,#f59e0b);width:${progress.percent}%;height:100%;border-radius:5px;"></div>
            </div>
            ${categories.map(cat => this.renderCategory(cat)).join('')}
            <button onclick="document.getElementById('ep-achievements-modal').remove()" style="margin-top:20px;padding:10px 20px;background:#334155;color:#fff;border:none;border-radius:5px;cursor:pointer;">Close</button>
        `;
    }

    renderCategory(category) {
        const achievements = this.achievements.filter(a => a.category === category);
        const icon = Achievement.ICONS[category];

        return `
            <div style="margin:15px 0;">
                <h3 style="color:#64748b;font-size:0.9em;text-transform:uppercase;">${icon} ${category}</h3>
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    ${achievements.map(a => `
                        <div style="background:${a.unlocked ? '#1e293b' : '#0f172a'};border:1px solid ${a.unlocked ? '#fbbf24' : '#334155'};border-radius:8px;padding:10px;width:140px;opacity:${a.unlocked ? '1' : '0.5'};">
                            <div style="font-size:1.5em;">${a.unlocked ? icon : '🔒'}</div>
                            <div style="color:${a.unlocked ? '#fbbf24' : '#64748b'};font-weight:bold;font-size:0.9em;">${a.name}</div>
                            <div style="color:#94a3b8;font-size:0.75em;margin-top:5px;">${a.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

window.Achievement = Achievement;
window.AchievementManager = AchievementManager;
