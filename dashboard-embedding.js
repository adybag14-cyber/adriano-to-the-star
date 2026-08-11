/**
 * Dashboard Embedding
 * Embeds dashboards in external sites
 */

class DashboardEmbedding {
    constructor() {
        this.embeds = [];
        this.init();
    }

    init() {
        this.trackEvent('dashboard_embedding_initialized');
    }

    createEmbed(dashboardId, config) {
        const embed = {
            id: `embed_${Date.now()}`,
            dashboardId,
            config: {
                width: config.width || '100%',
                height: config.height || '600px',
                theme: config.theme || 'light',
                allowFullscreen: config.allowFullscreen !== false
            },
            embedCode: this.generateEmbedCode(dashboardId, config),
            createdAt: new Date()
        };
        
        this.embeds.push(embed);
        return embed;
    }

    generateEmbedCode(dashboardId, config) {
        const url = `${window.location.origin}/dashboard/${dashboardId}/embed`;
        return `<iframe src="${url}" width="${config.width || '100%'}" height="${config.height || '600px'}" frameborder="0"></iframe>`;
    }

    getEmbed(embedId) {
        return this.embeds.find(e => e.id === embedId);
    }

    revokeEmbed(embedId) {
        const index = this.embeds.findIndex(e => e.id === embedId);
        if (index !== -1) {
            this.embeds.splice(index, 1);
            return true;
        }
        return false;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_embedding_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dashboardEmbedding = new DashboardEmbedding();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardEmbedding;
}


