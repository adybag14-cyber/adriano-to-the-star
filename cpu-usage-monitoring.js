/**
 * CPU Usage Monitoring
 * Monitors CPU usage and performance
 */

class CPUUsageMonitoring {
    constructor() {
        this.samples = [];
        this.maxSamples = 100;
        this.init();
    }
    
    init() {
        this.startMonitoring();
        this.trackEvent('cpu_usage_mon_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cpu_usage_mon_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    startMonitoring() {
        // Monitor CPU usage via performance API
        if ('PerformanceObserver' in window) {
            this.observeLongTasks();
        }
        
        // Monitor frame rate
        this.monitorFrameRate();
    }
    
    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        this.recordLongTask(entry);
                    }
                });
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.warn('Long task observation not supported:', e);
        }
    }
    
    recordLongTask(entry) {
        this.samples.push({
            type: 'long-task',
            duration: entry.duration,
            timestamp: entry.startTime,
            name: entry.name
        });
        
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
        
        // Alert if too many long tasks
        const recentLongTasks = this.samples.filter(s => 
            s.type === 'long-task' && 
            (Date.now() - s.timestamp) < 10000
        );
        
        if (recentLongTasks.length > 5) {
            this.alertHighCPUUsage();
        }
    }
    
    monitorFrameRate() {
        let lastTime = performance.now();
        let frames = 0;
        let fps = 0;
        
        const measureFPS = (currentTime) => {
            frames++;
            const delta = currentTime - lastTime;
            
            if (delta >= 1000) {
                fps = Math.round((frames * 1000) / delta);
                frames = 0;
                lastTime = currentTime;
                
                this.recordFPS(fps);
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    recordFPS(fps) {
        this.samples.push({
            type: 'fps',
            value: fps,
            timestamp: Date.now()
        });
        
        if (fps < 30) {
            this.alertLowFPS(fps);
        }
    }
    
    alertHighCPUUsage() {
        console.warn('High CPU usage detected');
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                'High CPU usage detected. Performance may be affected.',
                'warning'
            );
        }
    }
    
    alertLowFPS(fps) {
        console.warn(`Low FPS detected: ${fps}`);
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                `Low frame rate: ${fps} FPS`,
                'warning'
            );
        }
    }
    
    getCPUStats() {
        const longTasks = this.samples.filter(s => s.type === 'long-task');
        const fpsSamples = this.samples.filter(s => s.type === 'fps');
        
        const avgFPS = fpsSamples.length > 0
            ? fpsSamples.reduce((sum, s) => sum + s.value, 0) / fpsSamples.length
            : 60;
        
        return {
            longTasks: longTasks.length,
            avgFPS: Math.round(avgFPS),
            recentLongTasks: longTasks.filter(t => 
                (Date.now() - t.timestamp) < 60000
            ).length
        };
    }
    
    getSamples() {
        return [...this.samples];
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cpuUsageMonitoring = new CPUUsageMonitoring(); });
} else {
    window.cpuUsageMonitoring = new CPUUsageMonitoring();
}

