/**
 * SBOM Generation
 * Software Bill of Materials generation
 */

class SBOMGeneration {
    constructor() {
        this.generators = new Map();
        this.sboms = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_bo_mg_en_er_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_bo_mg_en_er_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createGenerator(generatorId, generatorData) {
        const generator = {
            id: generatorId,
            ...generatorData,
            name: generatorData.name || generatorId,
            format: generatorData.format || 'spdx',
            enabled: generatorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.generators.set(generatorId, generator);
        console.log(`SBOM generator created: ${generatorId}`);
        return generator;
    }

    async generate(generatorId, projectData) {
        const generator = this.generators.get(generatorId);
        if (!generator) {
            throw new Error('Generator not found');
        }
        
        const sbom = {
            id: `sbom_${Date.now()}`,
            generatorId,
            format: generator.format,
            project: projectData.name || 'project',
            components: this.extractComponents(projectData),
            generatedAt: new Date(),
            createdAt: new Date()
        };
        
        this.sboms.set(sbom.id, sbom);
        
        return sbom;
    }

    extractComponents(projectData) {
        return (projectData.dependencies || []).map((dep, index) => ({
            id: `component_${Date.now()}_${index}`,
            name: dep.name || dep,
            version: dep.version || 'unknown',
            type: 'library',
            license: dep.license || 'unknown'
        }));
    }

    getGenerator(generatorId) {
        return this.generators.get(generatorId);
    }

    getSBOM(sbomId) {
        return this.sboms.get(sbomId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.sbomGeneration = new SBOMGeneration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SBOMGeneration;
}

