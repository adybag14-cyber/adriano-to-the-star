/**
 * Reference Data Management
 * Reference data management system
 */

class ReferenceDataManagement {
    constructor() {
        this.repositories = new Map();
        this.datasets = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ef_er_en_ce_da_ta_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ef_er_en_ce_da_ta_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createRepository(repositoryId, repositoryData) {
        const repository = {
            id: repositoryId,
            ...repositoryData,
            name: repositoryData.name || repositoryId,
            datasets: [],
            createdAt: new Date()
        };
        
        this.repositories.set(repositoryId, repository);
        console.log(`Reference data repository created: ${repositoryId}`);
        return repository;
    }

    createDataset(repositoryId, datasetId, datasetData) {
        const repository = this.repositories.get(repositoryId);
        if (!repository) {
            throw new Error('Repository not found');
        }
        
        const dataset = {
            id: datasetId,
            repositoryId,
            ...datasetData,
            name: datasetData.name || datasetId,
            type: datasetData.type || 'code',
            values: datasetData.values || [],
            createdAt: new Date()
        };
        
        this.datasets.set(datasetId, dataset);
        repository.datasets.push(datasetId);
        
        return dataset;
    }

    getValue(datasetId, key) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        return dataset.values.find(v => v.key === key);
    }

    getRepository(repositoryId) {
        return this.repositories.get(repositoryId);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.referenceDataManagement = new ReferenceDataManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReferenceDataManagement;
}

