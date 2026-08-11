/**
 * Customizable Dashboard Widget Library
 * Library of reusable dashboard widgets
 */

class DashboardWidgetLibrary {
    constructor() {
        this.widgets = new Map();
        this.init();
    }
    
    init() {
        this.registerDefaultWidgets();
    }
    
    registerDefaultWidgets() {
        this.registerWidget('stats', this.createStatsWidget);
        this.registerWidget('chart', this.createChartWidget);
        this.registerWidget('list', this.createListWidget);
        this.registerWidget('progress', this.createProgressWidget);
    }
    
    registerWidget(name, factory) {
        this.widgets.set(name, factory);
    }
    
    createWidget(type, config) {
        const factory = this.widgets.get(type);
        if (!factory) return null;
        return factory(config);
    }
    
    createStatsWidget(config) {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget stats-widget';
        widget.innerHTML = `
            <h3>${config.title || 'Stats'}</h3>
            <div class="stats-grid">
                ${(config.stats || []).map(stat => `
                    <div class="stat-item">
                        <div class="stat-value">${stat.value}</div>
                        <div class="stat-label">${stat.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
        return widget;
    }
    
    createChartWidget(config) {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget chart-widget';
        widget.innerHTML = `<h3>${config.title || 'Chart'}</h3><canvas id="chart-${Date.now()}"></canvas>`;
        return widget;
    }
    
    createListWidget(config) {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget list-widget';
        widget.innerHTML = `
            <h3>${config.title || 'List'}</h3>
            <ul>${(config.items || []).map(item => `<li>${item}</li>`).join('')}</ul>
        `;
        return widget;
    }
    
    createProgressWidget(config) {
        const widget = document.createElement('div');
        widget.className = 'dashboard-widget progress-widget';
        widget.innerHTML = `
            <h3>${config.title || 'Progress'}</h3>
            <div class="progress-bar"><div class="progress-fill" style="width: ${config.percent || 0}%"></div></div>
        `;
        return widget;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.dashboardWidgetLibrary = new DashboardWidgetLibrary(); });
} else {
    window.dashboardWidgetLibrary = new DashboardWidgetLibrary();
}


