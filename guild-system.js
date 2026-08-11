/**
 * Guild System
 * @class GuildSystem
 * @description Manages guilds with members, ranks, and activities.
 */
class GuildSystem {
    constructor() {
        this.guilds = new Map();
        this.members = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_ui_ld_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_ui_ld_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a guild.
     * @param {string} guildId - Guild identifier.
     * @param {object} guildData - Guild data.
     */
    createGuild(guildId, guildData) {
        this.guilds.set(guildId, {
            ...guildData,
            id: guildId,
            name: guildData.name,
            description: guildData.description,
            members: [],
            level: 1,
            experience: 0,
            createdAt: new Date()
        });
        console.log(`Guild created: ${guildId}`);
    }

    /**
     * Join guild.
     * @param {string} userId - User identifier.
     * @param {string} guildId - Guild identifier.
     */
    joinGuild(userId, guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            throw new Error(`Guild not found: ${guildId}`);
        }

        if (!guild.members.includes(userId)) {
            guild.members.push(userId);
            this.members.set(`${userId}_${guildId}`, {
                userId,
                guildId,
                rank: 'member',
                joinedAt: new Date()
            });
            console.log(`User ${userId} joined guild ${guildId}`);
        }
    }

    /**
     * Add guild experience.
     * @param {string} guildId - Guild identifier.
     * @param {number} experience - Experience points.
     */
    addExperience(guildId, experience) {
        const guild = this.guilds.get(guildId);
        if (guild) {
            guild.experience += experience;
            // Check for level up (placeholder)
            console.log(`Guild experience added: ${guildId} = ${guild.experience}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.guildSystem = new GuildSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuildSystem;
}

