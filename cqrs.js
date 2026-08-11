/**
 * CQRS
 * Command Query Responsibility Segregation
 */

class CQRS {
    constructor() {
        this.commands = new Map();
        this.queries = new Map();
        this.handlers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cqrs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cqrs_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    registerCommandHandler(commandType, handler) {
        this.handlers.set(`command_${commandType}`, handler);
        console.log(`Command handler registered: ${commandType}`);
    }

    registerQueryHandler(queryType, handler) {
        this.handlers.set(`query_${queryType}`, handler);
        console.log(`Query handler registered: ${queryType}`);
    }

    async executeCommand(commandType, commandData) {
        const handler = this.handlers.get(`command_${commandType}`);
        if (!handler) {
            throw new Error(`Command handler not found: ${commandType}`);
        }
        
        const command = {
            id: `command_${Date.now()}`,
            type: commandType,
            data: commandData,
            status: 'pending',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.commands.set(command.id, command);
        
        command.status = 'executing';
        const result = await handler(commandData);
        
        command.status = 'completed';
        command.result = result;
        command.completedAt = new Date();
        
        return command;
    }

    async executeQuery(queryType, queryData) {
        const handler = this.handlers.get(`query_${queryType}`);
        if (!handler) {
            throw new Error(`Query handler not found: ${queryType}`);
        }
        
        const query = {
            id: `query_${Date.now()}`,
            type: queryType,
            data: queryData,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.queries.set(query.id, query);
        
        const result = await handler(queryData);
        query.result = result;
        
        return query;
    }

    getCommand(commandId) {
        return this.commands.get(commandId);
    }

    getQuery(queryId) {
        return this.queries.get(queryId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cqrs = new CQRS();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CQRS;
}

