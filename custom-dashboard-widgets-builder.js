/**
 * Custom Dashboard Widgets Builder
 * Create and customize dashboard widgets
 */
(function() {
    'use strict';

    class CustomDashboardWidgetsBuilder {
        constructor() {
            this.widgets = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('widgets_builder_initialized');
        }

        setupUI() {
            if (!document.getElementById('widgets-builder')) {
                const builder = document.createElement('div');
                builder.id = 'widgets-builder';
                builder.className = 'widgets-builder';
                builder.innerHTML = `
                    <div class="builder-header">
                        <h2>Dashboard Widgets</h2>
                        <button class="create-widget-btn" id="create-widget-btn">Create Widget</button>
                    </div>
                    <div class="widgets-grid" id="widgets-grid"></div>
                `;
                document.body.appendChild(builder);
            }
        }

        createWidget(config) {
            const widget = {
                id: this.generateId(),
                type: config.type,
                title: config.title,
                config: config.config || {},
                position: config.position || { x: 0, y: 0 }
            };
            this.widgets.push(widget);
            this.saveWidgets();
            this.renderWidgets();
            return widget;
        }

        renderWidgets() {
            const grid = document.getElementById('widgets-grid');
            if (!grid) return;

            grid.innerHTML = this.widgets.map(widget => `
                <div class="widget-item" data-widget-id="${widget.id}">
                    <div class="widget-header">
                        <h3>${widget.title}</h3>
                        <button class="remove-widget-btn" data-widget-id="${widget.id}">×</button>
                    </div>
                    <div class="widget-content" id="widget-content-${widget.id}"></div>
                </div>
            `).join('');

            // Render widget content
            this.widgets.forEach(widget => {
                this.renderWidgetContent(widget);
            });
        }

        renderWidgetContent(widget) {
            const content = document.getElementById(`widget-content-${widget.id}`);
            if (!content) return;

            switch (widget.type) {
                case 'metric':
                    content.innerHTML = `<div class="metric-value">${widget.config.value || 0}</div>`;
                    break;
                case 'chart':
                    content.innerHTML = `<div class="chart-placeholder">Chart Widget</div>`;
                    break;
                case 'list':
                    content.innerHTML = `<div class="list-placeholder">List Widget</div>`;
                    break;
            }
        }

        generateId() {
            return 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveWidgets() {
            localStorage.setItem('dashboardWidgets', JSON.stringify(this.widgets));
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`widgets_builder_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.widgetsBuilder = new CustomDashboardWidgetsBuilder();
        });
    } else {
        window.widgetsBuilder = new CustomDashboardWidgetsBuilder();
    }
})();


