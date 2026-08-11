/**
 * Data Visualization Gallery with Templates
 * Gallery of visualization templates
 */
(function() {
    'use strict';

    class DataVisualizationGallery {
        constructor() {
            this.templates = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.loadTemplates();
            this.trackEvent('data_viz_gallery_initialized');
        }

        setupUI() {
            if (!document.getElementById('viz-gallery')) {
                const gallery = document.createElement('div');
                gallery.id = 'viz-gallery';
                gallery.className = 'viz-gallery';
                gallery.innerHTML = `
                    <div class="gallery-header">
                        <h2>Visualization Gallery</h2>
                    </div>
                    <div class="templates-grid" id="templates-grid"></div>
                `;
                document.body.appendChild(gallery);
            }
        }

        loadTemplates() {
            this.templates = [
                { id: 'bar', name: 'Bar Chart', type: 'bar' },
                { id: 'line', name: 'Line Chart', type: 'line' },
                { id: 'pie', name: 'Pie Chart', type: 'pie' },
                { id: 'scatter', name: 'Scatter Plot', type: 'scatter' }
            ];
            this.renderTemplates();
        }

        renderTemplates() {
            const grid = document.getElementById('templates-grid');
            if (!grid) return;
            grid.innerHTML = this.templates.map(t => `
                <div class="template-card" data-template-id="${t.id}">
                    <h3>${t.name}</h3>
                </div>
            `).join('');
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_viz_gallery_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.vizGallery = new DataVisualizationGallery();
        });
    } else {
        window.vizGallery = new DataVisualizationGallery();
    }
})();

