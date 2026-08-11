/**
 * Database Connection Pooling
 * Advanced database connection pooling and management
 */

class DatabaseConnectionPooling {
    constructor() {
        this.pools = new Map();
        this.connections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('db_conn_pool_initialized');
    }

    createPool(poolId, config) {
        const pool = {
            id: poolId,
            minConnections: config.minConnections || 5,
            maxConnections: config.maxConnections || 20,
            idleTimeout: config.idleTimeout || 30000,
            connectionTimeout: config.connectionTimeout || 10000,
            activeConnections: 0,
            idleConnections: [],
            waitingQueue: [],
            stats: {
                totalCreated: 0,
                totalDestroyed: 0,
                totalAcquired: 0,
                totalReleased: 0
            },
            createdAt: new Date()
        };
        
        this.pools.set(poolId, pool);
        console.log(`Connection pool created: ${poolId}`);
        return pool;
    }

    async acquireConnection(poolId) {
        const pool = this.pools.get(poolId);
        if (!pool) {
            throw new Error('Pool does not exist');
        }
        
        // Check for idle connection
        if (pool.idleConnections.length > 0) {
            const connection = pool.idleConnections.pop();
            pool.activeConnections++;
            pool.stats.totalAcquired++;
            console.log(`Connection acquired from pool: ${poolId}`);
            return connection;
        }
        
        // Create new connection if under limit
        if (pool.activeConnections < pool.maxConnections) {
            const connection = await this.createConnection(poolId);
            pool.activeConnections++;
            pool.stats.totalCreated++;
            pool.stats.totalAcquired++;
            console.log(`New connection created and acquired: ${poolId}`);
            return connection;
        }
        
        // Wait for available connection
        return new Promise((resolve) => {
            pool.waitingQueue.push(resolve);
            console.log(`Connection request queued for pool: ${poolId}`);
        });
    }

    async createConnection(poolId) {
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connection = {
            id: connectionId,
            poolId,
            createdAt: new Date(),
            lastUsed: new Date(),
            status: 'active'
        };
        
        this.connections.set(connectionId, connection);
        return connection;
    }

    releaseConnection(poolId, connection) {
        const pool = this.pools.get(poolId);
        if (!pool) {
            throw new Error('Pool does not exist');
        }
        
        pool.activeConnections--;
        pool.stats.totalReleased++;
        
        // Add to idle or destroy if pool is full
        if (pool.idleConnections.length < pool.minConnections) {
            connection.lastUsed = new Date();
            pool.idleConnections.push(connection);
            console.log(`Connection released to idle pool: ${poolId}`);
        } else {
            this.destroyConnection(poolId, connection);
        }
        
        // Process waiting queue
        if (pool.waitingQueue.length > 0) {
            const resolve = pool.waitingQueue.shift();
            this.acquireConnection(poolId).then(resolve);
        }
    }

    destroyConnection(poolId, connection) {
        const pool = this.pools.get(poolId);
        if (pool) {
            pool.stats.totalDestroyed++;
        }
        
        this.connections.delete(connection.id);
        console.log(`Connection destroyed: ${connection.id}`);
    }

    getPoolStats(poolId) {
        const pool = this.pools.get(poolId);
        if (!pool) {
            throw new Error('Pool does not exist');
        }
        
        return {
            id: pool.id,
            activeConnections: pool.activeConnections,
            idleConnections: pool.idleConnections.length,
            waitingQueue: pool.waitingQueue.length,
            stats: pool.stats
        };
    }

    getPool(poolId) {
        return this.pools.get(poolId);
    }

    getAllPools() {
        return Array.from(this.pools.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_conn_pool_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.databaseConnectionPooling = new DatabaseConnectionPooling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseConnectionPooling;
}
