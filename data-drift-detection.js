/**
 * Data Drift Detection System
 * Detect data drift
 */
(function() {
    'use strict';

    class DataDriftDetection {
        constructor() {
            this.baseline = null;
            this.detections = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_drift_initialized');
        }

        setupUI() {
            if (!document.getElementById('drift-detection')) {
                const detection = document.createElement('div');
                detection.id = 'drift-detection';
                detection.className = 'drift-detection';
                detection.innerHTML = `<h2>Data Drift Detection</h2>`;
                document.body.appendChild(detection);
            }
        }

        setBaseline(data) {
            this.baseline = {
                data: data,
                statistics: this.calculateStatistics(data),
                timestamp: new Date().toISOString()
            };
        }

        calculateStatistics(data) {
            if (data.length === 0) return {};

            const numericFields = Object.keys(data[0]).filter(key => 
                typeof data[0][key] === 'number'
            );

            const stats = {};
            numericFields.forEach(field => {
                const values = data.map(d => d[field]).filter(v => !isNaN(v));
                stats[field] = {
                    mean: values.reduce((a, b) => a + b, 0) / values.length,
                    stdDev: this.calculateStdDev(values),
                    min: Math.min(...values),
                    max: Math.max(...values)
                };
            });

            return stats;
        }

        calculateStdDev(values) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        }

        detectDrift(currentData) {
            if (!this.baseline) {
                this.setBaseline(currentData);
                return null;
            }

            const currentStats = this.calculateStatistics(currentData);
            const drift = {};

            Object.keys(this.baseline.statistics).forEach(field => {
                const baselineStat = this.baseline.statistics[field];
                const currentStat = currentStats[field];

                if (currentStat) {
                    const meanDrift = Math.abs(currentStat.mean - baselineStat.mean) / baselineStat.stdDev;
                    if (meanDrift > 2) {
                        drift[field] = {
                            type: 'mean_shift',
                            severity: meanDrift > 3 ? 'high' : 'medium',
                            baseline: baselineStat.mean,
                            current: currentStat.mean
                        };
                    }
                }
            });

            if (Object.keys(drift).length > 0) {
                this.recordDrift(drift);
            }

            return drift;
        }

        recordDrift(drift) {
            const detection = {
                id: this.generateId(),
                drift: drift,
                timestamp: new Date().toISOString()
            };
            this.detections.push(detection);
        }

        generateId() {
            return 'drift_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_drift_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.driftDetection = new DataDriftDetection();
        });
    } else {
        window.driftDetection = new DataDriftDetection();
    }
})();

