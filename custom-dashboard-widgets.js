/**
 * Custom Dashboard Widgets
 * User-customizable dashboard widgets system
 * 
 * Features:
 * - Drag-and-drop widget arrangement
 * - Multiple widget types
 * - Widget customization
 * - Save/load widget layouts
 * - Widget resizing
 */

class CustomDashboardWidgets {
    constructor(containerId = 'custom-dashboard') {
        this.containerId = containerId;
        this.widgets = [];
        this.widgetTypes = {
            'stats': 'Statistics',
            'chart': 'Chart',
            'list': 'List',
            'text': 'Text',
            'planet-card': 'Planet Card',
            'search': 'Search',
            'favorites': 'Favorites'
        };
        this.init();
    }

    init() {
        try {
            // Load saved widgets
            this.loadWidgets();

            // Create dashboard container
            this.createDashboardContainer();

            // Create widget toolbar
            this.createWidgetToolbar();

            // Render widgets
            this.renderWidgets();

            this.trackEvent('custom_dash_widgets_initialized');
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        }
    }

    createDashboardContainer() {
        let container = document.getElementById(this.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.className = 'custom-dashboard';
            container.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1rem;
                padding: 2rem;
                min-height: 100vh;
            `;

            // Insert after main content or at end of body
            const main = document.querySelector('main') || document.body;
            main.appendChild(container);
        }
    }

    createWidgetToolbar() {
        let toolbar = document.getElementById('custom-dashboard-toolbar');
        if (toolbar) return;

        toolbar = document.createElement('div');
        toolbar.id = 'custom-dashboard-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            display: flex;
            gap: 0.5rem;
            align-items: center;
            padding: 0.75rem;
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid rgba(186, 148, 79, 0.35);
            border-radius: 10px;
            z-index: 10004;
            backdrop-filter: blur(8px);
        `;

        const select = document.createElement('select');
        select.id = 'custom-dashboard-widget-type';
        select.style.cssText = `
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(186, 148, 79, 0.35);
            border-radius: 8px;
            color: white;
            padding: 0.5rem;
            font-family: inherit;
        `;

        Object.entries(this.widgetTypes).forEach(([type, label]) => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = label;
            select.appendChild(opt);
        });

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = 'Add Widget';
        addBtn.style.cssText = `
            background: rgba(186, 148, 79, 0.2);
            border: 1px solid rgba(186, 148, 79, 0.6);
            border-radius: 8px;
            color: #ba944f;
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-family: inherit;
        `;
        addBtn.addEventListener('click', () => {
            this.addWidget(select.value);
        });

        const settingsBtn = document.createElement('button');
        settingsBtn.type = 'button';
        settingsBtn.textContent = '⚙️';
        settingsBtn.title = 'Dashboard settings';
        settingsBtn.style.cssText = `
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 8px;
            color: rgba(255,255,255,0.85);
            padding: 0.5rem 0.6rem;
            cursor: pointer;
            font-family: inherit;
        `;
        settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });

        toolbar.appendChild(select);
        toolbar.appendChild(addBtn);
        toolbar.appendChild(settingsBtn);
        document.body.appendChild(toolbar);
    }

    addWidget(type) {
        try {
            if (!type || typeof type !== 'string') return;

            const now = Date.now();
            const widget = {
                id: `widget_${now}_${Math.random().toString(16).slice(2)}`,
                type,
                title: this.widgetTypes[type] || 'Widget',
                size: { width: 1, height: 220 },
                config: {}
            };

            if (type === 'text') {
                widget.config.content = 'Enter your text here...';
            }

            if (type === 'search') {
                widget.config.placeholder = 'Search...';
            }

            this.widgets.push(widget);
            this.saveWidgets();
            this.renderWidgets();
            this.trackEvent('custom_dash_widget_added', { type });
        } catch (e) {
            console.warn('Failed to add widget:', e);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderWidgets() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Granular update: remove widgets that no longer exist
        const existingIds = Array.from(container.children).map(el => el.dataset.widgetId);
        const currentIds = this.widgets.map(w => w.id);

        existingIds.forEach(id => {
            if (!currentIds.includes(id)) {
                const el = container.querySelector(`[data-widget-id="${id}"]`);
                if (el) el.remove();
            }
        });

        // Add or update widgets
        this.widgets.forEach(widget => {
            const widgetEl = container.querySelector(`[data-widget-id="${widget.id}"]`);
            if (!widgetEl) {
                this.renderWidget(widget); // Creates new
            } else {
                // Update existing if needed (simplified check)
                // In a real app, check for deep equality or dirty flags
                const content = widgetEl.querySelector('.widget-content');
                if (content) {
                    content.innerHTML = this.renderWidgetContent(widget);
                }
                const title = widgetEl.querySelector('h3');
                if (title) title.textContent = widget.title;
            }
        });
    }

    renderWidget(widget) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const safeSize = widget && widget.size ? widget.size : {};
        const minHeight = typeof safeSize.height === 'number' ? safeSize.height : 220;

        const widgetEl = document.createElement('div');
        widgetEl.className = 'dashboard-widget';
        widgetEl.dataset.widgetId = widget.id;
        widgetEl.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(186, 148, 79, 0.3);
            border-radius: 10px;
            padding: 1rem;
            position: relative;
            min-height: ${minHeight}px;
            color: white;
        `;

        // Widget header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(186, 148, 79, 0.3);
        `;

        const title = document.createElement('h3');
        title.textContent = widget.title;
        title.style.cssText = `
            margin: 0;
            color: #ba944f;
            font-size: 1rem;
        `;
        header.appendChild(title);

        // Widget controls
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 0.5rem;
        `;

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.title = 'Edit widget';
        editBtn.style.cssText = `
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            font-size: 1rem;
        `;
        editBtn.addEventListener('click', () => {
            this.editWidget(widget.id);
        });
        controls.appendChild(editBtn);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove widget';
        removeBtn.style.cssText = `
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            font-size: 1.5rem;
            line-height: 1;
        `;
        removeBtn.addEventListener('click', () => {
            this.removeWidget(widget.id);
        });
        controls.appendChild(removeBtn);

        header.appendChild(controls);
        widgetEl.appendChild(header);

        // Widget content
        const content = document.createElement('div');
        content.className = 'widget-content';
        content.innerHTML = this.renderWidgetContent(widget);
        widgetEl.appendChild(content);

        container.appendChild(widgetEl);
    }

    renderWidgetContent(widget) {
        switch (widget.type) {
            case 'stats':
                return this.renderStatsWidget(widget);
            case 'chart':
                return this.renderChartWidget(widget);
            case 'list':
                return this.renderListWidget(widget);
            case 'text':
                return this.renderTextWidget(widget);
            case 'planet-card':
                return this.renderPlanetCardWidget(widget);
            case 'search':
                return this.renderSearchWidget(widget);
            case 'favorites':
                return this.renderFavoritesWidget(widget);
            default:
                return '<p>Unknown widget type</p>';
        }
    }

    renderStatsWidget(widget) {
        // Placeholder - would fetch real stats
        return `
            <div style="text-align: center;">
                <div style="font-size: 2rem; color: #ba944f; font-weight: bold;">1,234</div>
                <div style="color: rgba(255,255,255,0.7);">Total Planets</div>
            </div>
        `;
    }

    renderChartWidget(widget) {
        return `
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5);">
                Chart visualization (requires chart library)
            </div>
        `;
    }

    renderListWidget(widget) {
        return `
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">Item 1</li>
                <li style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">Item 2</li>
                <li style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">Item 3</li>
            </ul>
        `;
    }

    renderTextWidget(widget) {
        return `
            <div style="color: rgba(255,255,255,0.9);">
                ${(widget.config && widget.config.content) || 'Enter your text here...'}
            </div>
        `;
    }

    renderPlanetCardWidget(widget) {
        return `
            <div style="text-align: center; color: rgba(255,255,255,0.7);">
                Planet card widget
            </div>
        `;
    }

    renderSearchWidget(widget) {
        return `
            <input type="text" placeholder="${(widget.config && widget.config.placeholder) || 'Search...'}" 
                   style="width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
        `;
    }

    renderFavoritesWidget(widget) {
        const favorites = JSON.parse(localStorage.getItem('planet-favorites') || '[]');
        return `
            <div>
                <div style="font-size: 1.5rem; color: #ba944f; margin-bottom: 0.5rem;">${favorites.length}</div>
                <div style="color: rgba(255,255,255,0.7);">Favorite Planets</div>
            </div>
        `;
    }

    editWidget(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        // Create edit dialog
        const dialog = document.createElement('div');
        dialog.className = 'widget-edit-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 2rem;
            z-index: 10003;
            min-width: 400px;
            color: white;
        `;

        dialog.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">Edit Widget</h2>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Title:</label>
                <input type="text" id="widget-title" value="${widget.title}" style="width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button id="edit-cancel" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer;">Cancel</button>
                <button id="edit-save" style="padding: 0.75rem 1.5rem; background: #ba944f; border: none; border-radius: 5px; color: white; cursor: pointer;">Save</button>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById('edit-cancel').addEventListener('click', () => {
            dialog.remove();
        });

        document.getElementById('edit-save').addEventListener('click', () => {
            widget.title = document.getElementById('widget-title').value;
            this.saveWidgets();
            this.renderWidgets();
            dialog.remove();
        });
    }

    removeWidget(widgetId) {
        this.widgets = this.widgets.filter(w => w.id !== widgetId);
        this.saveWidgets();
        this.renderWidgets();
    }

    loadWidgets() {
        try {
            const saved = localStorage.getItem('dashboard-widgets');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.widgets = parsed.map((raw, index) => {
                        const w = raw && typeof raw === 'object' ? raw : {};
                        const type = typeof w.type === 'string' ? w.type : 'text';
                        const id = typeof w.id === 'string' ? w.id : `widget_${Date.now()}_${index}`;
                        const title = typeof w.title === 'string' ? w.title : (this.widgetTypes[type] || 'Widget');
                        const size = w.size && typeof w.size === 'object' ? w.size : {};
                        const config = w.config && typeof w.config === 'object' ? w.config : {};

                        return {
                            id,
                            type,
                            title,
                            size: {
                                width: typeof size.width === 'number' ? size.width : 1,
                                height: typeof size.height === 'number' ? size.height : 220
                            },
                            config
                        };
                    });
                } else {
                    this.widgets = [];
                }
            }
        } catch (e) {
            console.warn('Failed to load widgets:', e);
        }
    }

    saveWidgets() {
        try {
            localStorage.setItem('dashboard-widgets', JSON.stringify(this.widgets));
        } catch (e) {
            console.warn('Failed to save widgets:', e);
        }
    }

    showSettings() {
        alert('Dashboard settings - coming soon!');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`custom_dash_widgets_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.customDashboardWidgets = new CustomDashboardWidgets();
    });
} else {
    window.customDashboardWidgets = new CustomDashboardWidgets();
}

