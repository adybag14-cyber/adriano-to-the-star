/**
 * Progress Indicators for Long Operations
 * Progress bars and spinners for async operations
 */

class ProgressIndicatorsSystem {
    constructor() {
        this.indicators = new Map();
        this.init();
    }
    
    init() {
        this.createStyles();
    }
    
    createStyles() {
        const style = document.createElement('style');
        style.id = 'progress-styles';
        style.textContent = `
            .progress-indicator { position: fixed; top: 0; left: 0; width: 100%; height: 4px; z-index: 10000; }
            .progress-bar { height: 100%; background: linear-gradient(90deg, #ba944f, #ffd700); transition: width 0.3s ease; }
            .progress-spinner { width: 40px; height: 40px; border: 4px solid rgba(186,148,79,0.3); border-top-color: #ba944f; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }
    
    showProgress(id, initial = 0) {
        const indicator = document.createElement('div');
        indicator.id = `progress-${id}`;
        indicator.className = 'progress-indicator';
        indicator.innerHTML = `<div class="progress-bar" style="width: ${initial}%"></div>`;
        document.body.appendChild(indicator);
        this.indicators.set(id, indicator);
    }
    
    updateProgress(id, percent) {
        const indicator = this.indicators.get(id);
        if (indicator) {
            const bar = indicator.querySelector('.progress-bar');
            if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }
    
    hideProgress(id) {
        const indicator = this.indicators.get(id);
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
            this.indicators.delete(id);
        }
    }
    
    showSpinner(container) {
        const spinner = document.createElement('div');
        spinner.className = 'progress-spinner';
        if (container) {
            container.appendChild(spinner);
            return spinner;
        }
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.progressIndicatorsSystem = new ProgressIndicatorsSystem(); });
} else {
    window.progressIndicatorsSystem = new ProgressIndicatorsSystem();
}


