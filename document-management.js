/**
 * Document Management
 * Document management system
 */

class DocumentManagement {
    constructor() {
        this.repositories = new Map();
        this.documents = new Map();
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('doc_mgmt_initialized');
    }

    createRepository(repositoryId, repositoryData) {
        const repository = {
            id: repositoryId,
            ...repositoryData,
            name: repositoryData.name || repositoryId,
            documents: [],
            createdAt: new Date()
        };
        
        this.repositories.set(repositoryId, repository);
        console.log(`Document repository created: ${repositoryId}`);
        return repository;
    }

    uploadDocument(repositoryId, documentId, documentData) {
        const repository = this.repositories.get(repositoryId);
        if (!repository) {
            throw new Error('Repository not found');
        }
        
        const document = {
            id: documentId,
            repositoryId,
            ...documentData,
            name: documentData.name || documentId,
            type: documentData.type || 'pdf',
            size: documentData.size || 0,
            version: 1,
            versions: [],
            createdAt: new Date()
        };
        
        this.documents.set(documentId, document);
        repository.documents.push(documentId);
        
        const version = {
            id: `version_${Date.now()}`,
            documentId,
            version: 1,
            content: documentData.content || '',
            createdAt: new Date()
        };
        
        this.versions.set(version.id, version);
        document.versions.push(version.id);
        
        return { document, version };
    }

    createVersion(documentId, versionData) {
        const document = this.documents.get(documentId);
        if (!document) {
            throw new Error('Document not found');
        }
        
        const version = {
            id: `version_${Date.now()}`,
            documentId,
            version: document.version + 1,
            content: versionData.content || '',
            createdAt: new Date()
        };
        
        this.versions.set(version.id, version);
        document.versions.push(version.id);
        document.version = version.version;
        
        return version;
    }

    getDocument(documentId) {
        return this.documents.get(documentId);
    }

    getRepository(repositoryId) {
        return this.repositories.get(repositoryId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`doc_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.documentManagement = new DocumentManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentManagement;
}

