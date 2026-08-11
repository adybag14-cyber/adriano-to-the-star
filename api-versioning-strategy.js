/**
 * API Versioning Strategy
 * Manage API versioning strategies
 */

class APIVersioningStrategy {
    constructor() {
        this.versions = new Map();
        this.versionStrategies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('versioning_strategy_initialized');
    }

    createVersion(versionId, version, strategy = 'url') {
        const versionData = {
            id: versionId,
            version,
            strategy, // url, header, query
            basePath: strategy === 'url' ? `/v${version}` : null,
            headerName: strategy === 'header' ? 'API-Version' : null,
            queryParam: strategy === 'query' ? 'version' : null,
            status: 'active',
            deprecated: false,
            sunsetDate: null,
            createdAt: new Date()
        };

        this.versions.set(versionId, versionData);
        console.log(`API version created: ${versionId}`);
        return versionData;
    }

    getVersionFromRequest(request, strategy) {
        switch (strategy) {
            case 'url':
                return this.extractVersionFromUrl(request.path);
            case 'header':
                return request.headers?.['api-version'] || request.headers?.['API-Version'];
            case 'query':
                return request.query?.version;
            default:
                return null;
        }
    }

    extractVersionFromUrl(path) {
        // eslint-disable-next-line security/detect-unsafe-regex
        const match = path.match(/\/v(\d+(?:\.\d+)?)/);
        return match ? match[1] : null;
    }

    deprecateVersion(versionId, sunsetDate) {
        const version = this.versions.get(versionId);
        if (!version) {
            throw new Error('Version does not exist');
        }

        version.deprecated = true;
        version.sunsetDate = sunsetDate ? new Date(sunsetDate) : null;
        console.log(`Version ${versionId} deprecated`);
    }

    getVersion(versionId) {
        return this.versions.get(versionId);
    }

    getAllVersions() {
        return Array.from(this.versions.values());
    }

    getActiveVersions() {
        return Array.from(this.versions.values())
            .filter(v => v.status === 'active' && !v.deprecated);
    }

    getDeprecatedVersions() {
        return Array.from(this.versions.values())
            .filter(v => v.deprecated);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`versioning_strategy_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiVersioningStrategy = new APIVersioningStrategy();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIVersioningStrategy;
}

