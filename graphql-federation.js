/**
 * GraphQL Federation
 * GraphQL schema federation
 */

class GraphQLFederation {
    constructor() {
        this.schemas = new Map();
        this.services = new Map();
        this.federatedSchemas = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_ra_ph_ql_fe_de_ra_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_ra_ph_ql_fe_de_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerService(serviceId, serviceData) {
        const service = {
            id: serviceId,
            ...serviceData,
            name: serviceData.name || serviceId,
            schema: serviceData.schema || '',
            url: serviceData.url || '',
            createdAt: new Date()
        };
        
        this.services.set(serviceId, service);
        console.log(`GraphQL service registered: ${serviceId}`);
        return service;
    }

    createSchema(schemaId, schemaData) {
        const schema = {
            id: schemaId,
            ...schemaData,
            name: schemaData.name || schemaId,
            definition: schemaData.definition || '',
            services: [],
            createdAt: new Date()
        };
        
        this.schemas.set(schemaId, schema);
        console.log(`GraphQL schema created: ${schemaId}`);
        return schema;
    }

    federate(schemaId, serviceIds) {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            throw new Error('Schema not found');
        }
        
        const services = serviceIds
            .map(id => this.services.get(id))
            .filter(Boolean);
        
        if (services.length === 0) {
            throw new Error('No valid services found');
        }
        
        const federated = {
            id: `federated_${Date.now()}`,
            schemaId,
            services: services.map(s => s.id),
            mergedSchema: this.mergeSchemas(services),
            createdAt: new Date()
        };
        
        this.federatedSchemas.set(federated.id, federated);
        schema.services = serviceIds;
        
        return federated;
    }

    mergeSchemas(services) {
        return services.map(s => s.schema).join('\n\n');
    }

    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }

    getService(serviceId) {
        return this.services.get(serviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.graphqlFederation = new GraphQLFederation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphQLFederation;
}

