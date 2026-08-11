class SlackNotifications {
    constructor() {
        this.sent = [];
        this.enabled = true;
    }
    configure(config) {
        this.enabled = config?.enabled !== false;
        this.defaultChannel = config?.channel || this.defaultChannel;
    }
    async send({ channel, text }) {
        if (!this.enabled) return { success: false };
        const msg = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), channel: channel || this.defaultChannel || 'general', text: String(text || ''), timestamp: new Date() };
        this.sent.push(msg);
        return { success: true, id: msg.id };
    }
    getSent(limit = 20) {
        return this.sent.slice(-limit).reverse();
    }
}
const slackNotifications = new SlackNotifications();
if (typeof window !== 'undefined') {
    window.slackNotifications = slackNotifications;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlackNotifications;
}
