/**
 * API Response Pagination
 * Pagination support for API responses
 */

class APIResponsePagination {
    constructor() {
        this.paginationConfigs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('pagination_initialized');
    }

    createPaginationConfig(configId, defaultPageSize = 20, maxPageSize = 100) {
        this.paginationConfigs.set(configId, {
            id: configId,
            defaultPageSize,
            maxPageSize,
            createdAt: new Date()
        });
        console.log(`Pagination config created: ${configId}`);
    }

    paginate(data, page = 1, pageSize = 20, configId = null) {
        const config = configId ? this.paginationConfigs.get(configId) : null;
        const size = config ? Math.min(pageSize, config.maxPageSize) : Math.min(pageSize, 100);
        const offset = (page - 1) * size;
        
        const total = data.length;
        const totalPages = Math.ceil(total / size);
        const paginatedData = data.slice(offset, offset + size);
        
        return {
            data: paginatedData,
            pagination: {
                page,
                pageSize: size,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1
            }
        };
    }

    createPaginationLinks(baseUrl, page, totalPages, queryParams = {}) {
        const links = {
            first: null,
            last: null,
            next: null,
            previous: null,
            self: null
        };
        
        const params = new URLSearchParams(queryParams);
        params.set('page', page);
        
        links.self = `${baseUrl}?${params.toString()}`;
        
        if (page > 1) {
            params.set('page', 1);
            links.first = `${baseUrl}?${params.toString()}`;
            
            params.set('page', page - 1);
            links.previous = `${baseUrl}?${params.toString()}`;
        }
        
        if (page < totalPages) {
            params.set('page', totalPages);
            links.last = `${baseUrl}?${params.toString()}`;
            
            params.set('page', page + 1);
            links.next = `${baseUrl}?${params.toString()}`;
        }
        
        return links;
    }

    parsePaginationRequest(request) {
        const page = parseInt(request.query?.page || request.body?.page || 1, 10);
        const pageSize = parseInt(request.query?.pageSize || request.body?.pageSize || 20, 10);
        
        return {
            page: Math.max(1, page),
            pageSize: Math.max(1, Math.min(100, pageSize))
        };
    }

    getPaginationConfig(configId) {
        return this.paginationConfigs.get(configId);
    }

    getAllPaginationConfigs() {
        return Array.from(this.paginationConfigs.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`pagination_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponsePagination = new APIResponsePagination();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponsePagination;
}

