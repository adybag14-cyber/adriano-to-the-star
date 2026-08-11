/**
 * RESTful API v2
 * RESTful API v2 implementation
 */

class RESTfulAPIV2 {
    constructor() {
        this.baseURL = '/api/v2';
        this.endpoints = new Map();
        this.init();
    }
    
    init() {
        this.setupEndpoints();
    }
    
    setupEndpoints() {
        // Setup API endpoints
        this.endpoints.set('planets', `${this.baseURL}/planets`);
        this.endpoints.set('users', `${this.baseURL}/users`);
        this.endpoints.set('discoveries', `${this.baseURL}/discoveries`);
    }
    
    async get(resource, id = null) {
        // GET request
        const endpoint = this.endpoints.get(resource);
        if (!endpoint) throw new Error(`Resource ${resource} not found`);
        
        const url = id ? `${endpoint}/${id}` : endpoint;
        const response = await fetch(url);
        return await response.json();
    }
    
    async post(resource, data) {
        // POST request
        const endpoint = this.endpoints.get(resource);
        if (!endpoint) throw new Error(`Resource ${resource} not found`);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
    
    async put(resource, id, data) {
        // PUT request
        const endpoint = this.endpoints.get(resource);
        if (!endpoint) throw new Error(`Resource ${resource} not found`);
        
        const response = await fetch(`${endpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
    
    async delete(resource, id) {
        // DELETE request
        const endpoint = this.endpoints.get(resource);
        if (!endpoint) throw new Error(`Resource ${resource} not found`);
        
        const response = await fetch(`${endpoint}/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.restfulAPIV2 = new RESTfulAPIV2(); });
} else {
    window.restfulAPIV2 = new RESTfulAPIV2();
}

