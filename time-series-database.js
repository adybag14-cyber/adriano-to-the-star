/**
 * Time Series Database
 * Time series data storage and retrieval
 */

class TimeSeriesDatabase {
    constructor() {
        this.databases = new Map();
        this.series = new Map();
        this.data = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_im_es_er_ie_sd_at_ab_as_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_im_es_er_ie_sd_at_ab_as_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createDatabase(databaseId, databaseData) {
        const database = {
            id: databaseId,
            ...databaseData,
            name: databaseData.name || databaseId,
            retention: databaseData.retention || 365,
            series: [],
            createdAt: new Date()
        };
        
        this.databases.set(databaseId, database);
        console.log(`Time series database created: ${databaseId}`);
        return database;
    }

    createSeries(databaseId, seriesId, seriesData) {
        const database = this.databases.get(databaseId);
        if (!database) {
            throw new Error('Database not found');
        }
        
        const series = {
            id: seriesId,
            databaseId,
            ...seriesData,
            name: seriesData.name || seriesId,
            tags: seriesData.tags || {},
            createdAt: new Date()
        };
        
        this.series.set(seriesId, series);
        database.series.push(seriesId);
        
        return series;
    }

    async writePoint(seriesId, timestamp, value, tags = {}) {
        const series = this.series.get(seriesId);
        if (!series) {
            throw new Error('Series not found');
        }
        
        const point = {
            id: `point_${Date.now()}`,
            seriesId,
            timestamp: timestamp || new Date(),
            value,
            tags: { ...series.tags, ...tags },
            createdAt: new Date()
        };
        
        if (!this.data.has(seriesId)) {
            this.data.set(seriesId, []);
        }
        
        this.data.get(seriesId).push(point);
        
        return point;
    }

    query(seriesId, startTime = null, endTime = null, tags = {}) {
        const series = this.series.get(seriesId);
        if (!series) {
            throw new Error('Series not found');
        }
        
        let points = this.data.get(seriesId) || [];
        
        if (startTime) {
            points = points.filter(p => p.timestamp >= startTime);
        }
        
        if (endTime) {
            points = points.filter(p => p.timestamp <= endTime);
        }
        
        if (Object.keys(tags).length > 0) {
            points = points.filter(p => {
                return Object.keys(tags).every(key => 
                    p.tags[key] === tags[key]
                );
            });
        }
        
        return points.sort((a, b) => a.timestamp - b.timestamp);
    }

    getDatabase(databaseId) {
        return this.databases.get(databaseId);
    }

    getSeries(seriesId) {
        return this.series.get(seriesId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.timeSeriesDatabase = new TimeSeriesDatabase();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeSeriesDatabase;
}

