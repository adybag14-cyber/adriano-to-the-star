/**
 * Query Result Pagination Optimization
 * Optimizes database queries with efficient pagination
 */

class QueryPaginationOptimization {
    constructor() {
        this.defaultPageSize = 20;
        this.maxPageSize = 100;
        this.init();
    }
    
    init() {
        // Initialize pagination system
    }
    
    async paginateQuery(query, options = {}) {
        const {
            page = 1,
            pageSize = this.defaultPageSize,
            orderBy = null,
            orderDirection = 'asc'
        } = options;
        
        const limit = Math.min(pageSize, this.maxPageSize);
        const offset = (page - 1) * limit;
        
        try {
            // Build optimized query
            let optimizedQuery = query.limit(limit).range(offset, offset + limit - 1);
            
            if (orderBy) {
                optimizedQuery = optimizedQuery.order(orderBy, { ascending: orderDirection === 'asc' });
            }
            
            // Execute query
            const { data, error, count } = await optimizedQuery;
            
            if (error) {
                throw error;
            }
            
            return {
                data: data || [],
                pagination: {
                    page,
                    pageSize: limit,
                    total: count || data?.length || 0,
                    totalPages: Math.ceil((count || data?.length || 0) / limit),
                    hasNext: data && data.length === limit,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Pagination query error:', error);
            throw error;
        }
    }
    
    async cursorBasedPagination(query, cursor = null, pageSize = this.defaultPageSize) {
        const limit = Math.min(pageSize, this.maxPageSize);
        
        try {
            let optimizedQuery = query.limit(limit + 1); // Fetch one extra to check for next page
            
            if (cursor) {
                optimizedQuery = optimizedQuery.gt('id', cursor);
            }
            
            const { data, error } = await optimizedQuery;
            
            if (error) {
                throw error;
            }
            
            const hasNext = data && data.length > limit;
            const results = hasNext ? data.slice(0, limit) : data;
            const nextCursor = hasNext ? results[results.length - 1].id : null;
            
            return {
                data: results,
                cursor: nextCursor,
                hasNext,
                hasPrev: cursor !== null
            };
        } catch (error) {
            console.error('Cursor pagination error:', error);
            throw error;
        }
    }
    
    optimizeQuery(query, filters = {}) {
        // Apply filters efficiently
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                if (Array.isArray(filters[key])) {
                    query = query.in(key, filters[key]);
                } else {
                    query = query.eq(key, filters[key]);
                }
            }
        });
        
        return query;
    }
    
    async getTotalCount(query) {
        try {
            const { count, error } = await query.select('*', { count: 'exact', head: true });
            return error ? 0 : count;
        } catch (e) {
            return 0;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.queryPaginationOptimization = new QueryPaginationOptimization(); });
} else {
    window.queryPaginationOptimization = new QueryPaginationOptimization();
}

