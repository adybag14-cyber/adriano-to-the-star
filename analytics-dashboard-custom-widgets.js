/**
 * Analytics Dashboard with Custom Widgets
 * 
 * Implements comprehensive analytics dashboard with custom widgets.
 * 
 * @module AnalyticsDashboardCustomWidgets
 * @version 1.0.0
 * @author Adriano To The Star
 */

class AnalyticsDashboardCustomWidgets {
    constructor() {
        this.widgets = new Map();
        this.dashboard = null;
        this.isInitialized = false;
    }

    /**
     * Initialize analytics dashboard
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('AnalyticsDashboardCustomWidgets already initialized');
            return;
        }

        this.setupDefaultWidgets();
        this.injectStyles();
        
        this.isInitialized = true;
        this.trackEvent('dashboard_initialized');
    }

    /**
     * Set up default widgets
     * @private
     */
    setupDefaultWidgets() {
        // Page views widget
        this.registerWidget('page-views', {
            title: 'Page Views',
            render: this.renderPageViewsWidget.bind(this)
        });

        // User activity widget
        this.registerWidget('user-activity', {
            title: 'User Activity',
            render: this.renderUserActivityWidget.bind(this)
        });

        // Popular content widget
        this.registerWidget('popular-content', {
            title: 'Popular Content',
            render: this.renderPopularContentWidget.bind(this)
        });
    }

    /**
     * Register widget
     * @public
     * @param {string} id - Widget ID
     * @param {Object} config - Widget configuration
     */
    registerWidget(id, config) {
        this.widgets.set(id, config);
    }

    /**
     * Create dashboard
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} widgetIds - Widget IDs to display
     * @returns {HTMLElement} Dashboard element
     */
    createDashboard(container, widgetIds = null) {
        const dashboard = document.createElement('div');
        dashboard.className = 'analytics-dashboard';
        dashboard.innerHTML = '<div class="dashboard-grid"></div>';

        const grid = dashboard.querySelector('.dashboard-grid');
        const widgetsToShow = widgetIds || Array.from(this.widgets.keys());

        widgetsToShow.forEach(widgetId => {
            const widgetConfig = this.widgets.get(widgetId);
            if (widgetConfig) {
                const widget = this.createWidget(widgetId, widgetConfig);
                grid.appendChild(widget);
            }
        });

        container.appendChild(dashboard);
        this.dashboard = dashboard;

        return dashboard;
    }

    /**
     * Create widget
     * @private
     * @param {string} id - Widget ID
     * @param {Object} config - Widget configuration
     * @returns {HTMLElement} Widget element
     */
    createWidget(id, config) {
        const widget = document.createElement('div');
        widget.className = 'analytics-widget';
        widget.dataset.widgetId = id;
        widget.innerHTML = `
            <div class="widget-header">
                <h3>${config.title}</h3>
                <button class="widget-settings">⚙️</button>
            </div>
            <div class="widget-content"></div>
        `;

        const content = widget.querySelector('.widget-content');
        if (config.render) {
            config.render(content, config);
        }

        return widget;
    }

    /**
     * Render page views widget
     * @private
     * @param {HTMLElement} container - Container element
     * @param {Object} config - Widget config
     */
    renderPageViewsWidget(container, config) {
        // Get analytics data
        const pageViews = this.getPageViewsData();
        
        if (window.dataVisualization) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            container.appendChild(chartContainer);

            window.dataVisualization.createLineChart(
                chartContainer,
                pageViews.labels,
                [{ label: 'Page Views', data: pageViews.data, color: '#ba944f' }]
            );
        } else {
            container.textContent = 'Page views data will appear here';
        }
    }

    /**
     * Render user activity widget
     * @private
     * @param {HTMLElement} container - Container element
     * @param {Object} config - Widget config
     */
    renderUserActivityWidget(container, config) {
        const activity = this.getUserActivityData();
        container.innerHTML = `
            <div class="activity-stats">
                <div class="stat">
                    <div class="stat-value">${activity.activeUsers}</div>
                    <div class="stat-label">Active Users</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${activity.sessions}</div>
                    <div class="stat-label">Sessions</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${activity.pageViews}</div>
                    <div class="stat-label">Page Views</div>
                </div>
            </div>
        `;
    }

    /**
     * Render popular content widget
     * @private
     * @param {HTMLElement} container - Container element
     * @param {Object} config - Widget config
     */
    renderPopularContentWidget(container, config) {
        const popular = this.getPopularContentData();
        container.innerHTML = `
            <ul class="popular-content-list">
                ${popular.map(item => `
                    <li>
                        <span class="content-title">${item.title}</span>
                        <span class="content-views">${item.views} views</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    /**
     * Get page views data
     * @private
     * @returns {Object} Page views data
     */
    getPageViewsData() {
        // This would typically come from analytics
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [120, 190, 300, 250, 200, 180, 220]
        };
    }

    /**
     * Get user activity data
     * @private
     * @returns {Object} Activity data
     */
    getUserActivityData() {
        return {
            activeUsers: 1250,
            sessions: 3420,
            pageViews: 12800
        };
    }

    /**
     * Get popular content data
     * @private
     * @returns {Array} Popular content
     */
    getPopularContentData() {
        return [
            { title: 'Database - Exoplanets', views: 5420 },
            { title: 'Stellar AI Chat', views: 3200 },
            { title: 'Planet Claims', views: 2100 }
        ];
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('analytics-dashboard-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'analytics-dashboard-styles';
        style.textContent = `
            .analytics-dashboard {
                padding: 2rem;
            }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
            }

            .analytics-widget {
                background: rgba(0, 0, 0, 0.5);
                border-radius: 8px;
                padding: 1.5rem;
                border: 1px solid rgba(186, 148, 79, 0.3);
            }

            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .widget-header h3 {
                margin: 0;
                color: #ba944f;
            }

            .activity-stats {
                display: flex;
                justify-content: space-around;
                gap: 2rem;
            }

            .stat {
                text-align: center;
            }

            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #ba944f;
            }

            .stat-label {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 0.5rem;
            }

            .popular-content-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .popular-content-list li {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(style);
    }
}

AnalyticsDashboardCustomWidgets.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`dashboard_widgets_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'analytics_dashboard_custom_widgets', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Create global instance
window.AnalyticsDashboardCustomWidgets = AnalyticsDashboardCustomWidgets;
window.analyticsDashboard = new AnalyticsDashboardCustomWidgets();
window.analyticsDashboard.init();

