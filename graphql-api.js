/**
 * GraphQL API
 * GraphQL API implementation
 */

class GraphQLAPI {
    constructor() {
        this.endpoint = '/api/graphql';
        this.init();
    }
    
    init() {
        this.setupGraphQL();
    }
    
    setupGraphQL() {
        // Setup GraphQL API
    }
    
    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[graphql-api] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[graphql-api] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[graphql-api] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async query(query, variables = {}) {
        // Execute GraphQL query
        return await this.fetchJSON(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
    }
    
    async mutate(mutation, variables = {}) {
        // Execute GraphQL mutation
        return await this.query(mutation, variables);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.graphqlAPI = new GraphQLAPI(); });
} else {
    window.graphqlAPI = new GraphQLAPI();
}

