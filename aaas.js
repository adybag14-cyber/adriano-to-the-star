/**
 * AaaS
 * Analytics as a Service
 */

class AaaS {
    constructor() {
        this.workspaces = new Map();
        this.datasets = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('aaas_initialized');
    }

    createWorkspace(workspaceId, workspaceData) {
        const workspace = {
            id: workspaceId,
            ...workspaceData,
            name: workspaceData.name || workspaceId,
            datasets: [],
            analyses: [],
            createdAt: new Date()
        };
        
        this.workspaces.set(workspaceId, workspace);
        this.trackEvent('workspace_created', { workspaceId, name: workspaceData.name });
        return workspace;
    }

    createDataset(workspaceId, datasetId, datasetData) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        
        const dataset = {
            id: datasetId,
            workspaceId,
            ...datasetData,
            name: datasetData.name || datasetId,
            source: datasetData.source || '',
            rows: datasetData.rows || 0,
            columns: datasetData.columns || [],
            createdAt: new Date()
        };
        
        this.datasets.set(datasetId, dataset);
        workspace.datasets.push(datasetId);
        this.trackEvent('dataset_created', { workspaceId, datasetId, rows: dataset.rows });
        return dataset;
    }

    createAnalysis(workspaceId, analysisId, analysisData) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        
        const analysis = {
            id: analysisId,
            workspaceId,
            ...analysisData,
            name: analysisData.name || analysisId,
            type: analysisData.type || 'statistical',
            datasetId: analysisData.datasetId || null,
            results: null,
            createdAt: new Date()
        };
        
        this.analyses.set(analysisId, analysis);
        workspace.analyses.push(analysisId);
        this.trackEvent('analysis_created', { workspaceId, analysisId, type: analysis.type });
        return analysis;
    }

    getWorkspace(workspaceId) {
        return this.workspaces.get(workspaceId);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }

    getAnalysis(analysisId) {
        return this.analyses.get(analysisId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`aaas_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'aaas', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.aaas = new AaaS();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AaaS;
}

