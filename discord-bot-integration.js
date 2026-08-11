class DiscordBotIntegration {
    constructor() {
        this.messages = [];
        this.enabled = true;
    }
    configure(config) {
        this.enabled = config?.enabled !== false;
        this.defaultChannel = config?.channel || this.defaultChannel;
    }
    async send({ channel, content }) {
        if (!this.enabled) return { success: false };
        const msg = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), channel: channel || this.defaultChannel || 'general', content: String(content || ''), timestamp: new Date() };
        this.messages.push(msg);
        return { success: true, id: msg.id };
    }
    getSent(limit = 20) {
        return this.messages.slice(-limit).reverse();
    }
}
const discordBot = new DiscordBotIntegration();
if (typeof window !== 'undefined') {
    window.discordBot = discordBot;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordBotIntegration;
}
