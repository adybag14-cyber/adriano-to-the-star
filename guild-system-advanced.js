/**
 * Guild System Advanced
 * Advanced guild system
 */

class GuildSystemAdvanced {
    constructor() {
        this.guilds = new Map();
        this.members = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Guild System Advanced initialized' };
    }

    createGuild(name, description, maxMembers) {
        if (maxMembers < 2) {
            throw new Error('Guild must allow at least 2 members');
        }
        const guild = {
            id: Date.now().toString(),
            name,
            description,
            maxMembers,
            createdAt: new Date(),
            memberCount: 0,
            level: 1
        };
        this.guilds.set(guild.id, guild);
        return guild;
    }

    joinGuild(userId, guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) {
            throw new Error('Guild not found');
        }
        if (guild.memberCount >= guild.maxMembers) {
            throw new Error('Guild is full');
        }
        const membership = {
            id: Date.now().toString(),
            userId,
            guildId,
            joinedAt: new Date(),
            role: 'member'
        };
        this.members.set(membership.id, membership);
        guild.memberCount++;
        return membership;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuildSystemAdvanced;
}

