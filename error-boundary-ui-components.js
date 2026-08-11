/**
 * Error Boundary UI Components
 * User-friendly error displays
 */

class ErrorBoundaryUIComponents {
    constructor() {
        this.errors = [];
        this.init();
    }
    
    init() {
        this.setupErrorHandling();
        this.trackEvent('error_boundary_ui_comp_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_boundary_ui_comp_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            this.handleError(e.error || e.message, 'JavaScript Error');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError(e.reason, 'Promise Rejection');
        });
    }
    
    handleError(error, type) {
        const errorInfo = {
            id: Date.now(),
            message: error.message || error.toString(),
            type,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        
        this.errors.push(errorInfo);
        this.showErrorUI(errorInfo);
    }
    
    showErrorUI(error) {
        const container = document.createElement('div');
        container.id = `error-${error.id}`;
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(239, 68, 68, 0.95);
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 15px 20px;
            color: white;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        container.innerHTML = `
            <strong>⚠️ ${error.type}</strong>
            <p style="margin:5px 0;font-size:0.9rem;">${error.message}</p>
            <button onclick="this.parentElement.remove()" style="padding:5px 10px;background:rgba(0,0,0,0.3);border:1px solid white;color:white;border-radius:4px;cursor:pointer;margin-top:10px;">Dismiss</button>
        `;
        
        document.body.appendChild(container);
        
        setTimeout(() => {
            if (container.parentElement) container.remove();
        }, 10000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.errorBoundaryUIComponents = new ErrorBoundaryUIComponents(); });
} else {
    window.errorBoundaryUIComponents = new ErrorBoundaryUIComponents();
}


