/**
 * CQRS Pattern
 * Command Query Responsibility Segregation pattern
 */

class CQRSPattern {
    constructor() {
        this.commands = new Map();
        this.queries = new Map();
        this.events = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cqrs_pattern_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cqrs_pattern_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    registerCommand(commandId, commandData) {
        const command = {
            id: commandId,
            ...commandData,
            name: commandData.name || commandId,
            handler: commandData.handler || null,
            createdAt: new Date()
        };
        
        this.commands.set(commandId, command);
        console.log(`Command registered: ${commandId}`);
        return command;
    }

    registerQuery(queryId, queryData) {
        const query = {
            id: queryId,
            ...queryData,
            name: queryData.name || queryId,
            handler: queryData.handler || null,
            createdAt: new Date()
        };
        
        this.queries.set(queryId, query);
        console.log(`Query registered: ${queryId}`);
        return query;
    }

    async executeCommand(commandId, payload) {
        const command = this.commands.get(commandId);
        if (!command) {
            throw new Error('Command not found');
        }
        
        const execution = {
            id: `execution_${Date.now()}`,
            commandId,
            payload,
            status: 'executing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        if (command.handler) {
            await command.handler(payload);
        }
        
        execution.status = 'completed';
        execution.completedAt = new Date();
        
        return execution;
    }

    async executeQuery(queryId, payload) {
        const query = this.queries.get(queryId);
        if (!query) {
            throw new Error('Query not found');
        }
        
        const execution = {
            id: `execution_${Date.now()}`,
            queryId,
            payload,
            status: 'executing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        let result = null;
        if (query.handler) {
            result = await query.handler(payload);
        }
        
        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.result = result;
        
        return execution;
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
    window.cqrsPattern = new CQRSPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CQRSPattern;
}

