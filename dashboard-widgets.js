/**
 * Custom Dashboard Widgets
 * Drag-and-drop dashboard customization with widget library
 */

class DashboardWidgets {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.widgets = [];
        this.availableWidgets = [
            { id: 'user-stats', name: 'User Statistics', icon: '👤', category: 'user' },
            { id: 'planet-claims', name: 'Planet Claims', icon: '🪐', category: 'planets' },
            { id: 'marketplace', name: 'Marketplace Activity', icon: '🛒', category: 'marketplace' },
            { id: 'reputation', name: 'Reputation Progress', icon: '⭐', category: 'user' },
            { id: 'activity-timeline', name: 'Activity Timeline', icon: '📅', category: 'activity' },
            { id: 'trending-planets', name: 'Trending Planets', icon: '🔥', category: 'planets' },
            { id: 'discovery-rate', name: 'Discovery Rate', icon: '📈', category: 'analytics' },
            { id: 'recent-claims', name: 'Recent Claims', icon: '🆕', category: 'planets' }
        ];
        this.isEditMode = false;
        this.init();
    }

    async init() {
        // Wait for container to be available (retry up to 10 times)
        let container = document.getElementById('analytics-container');
        let attempts = 0;
        while (!container && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            container = document.getElementById('analytics-container');
            attempts++;
        }

        if (!container) {
            console.warn('Analytics container not found, will retry later');
            // Retry after page fully loads
            setTimeout(() => this.init(), 1000);
            return;
        }

        // Check authentication (with fallback if supabase not available)
        try {
            if (this.supabase && this.supabase.auth) {
                const { data: { user } } = await this.supabase.auth.getUser();
                this.currentUser = user;
            } else {
                // Supabase not available, try to get user from authManager
                if (typeof authManager !== 'undefined' && authManager.getCurrentUser) {
                    this.currentUser = authManager.getCurrentUser();
                }
            }
        } catch (error) {
            console.warn('Could not check authentication:', error);
            // Continue anyway - widgets can work without auth
        }

        await this.loadWidgetLayout();
        this.setupEditMode();
        this.renderWidgets();
    }

    /**
     * Load widget layout from storage
     */
    async loadWidgetLayout() {
        try {
            // Try Supabase first
            if (this.currentUser && this.supabase) {
                const { data, error } = await this.supabase
                    .from('user_dashboard_layouts')
                    .select('layout, updated_at')
                    .eq('user_id', this.currentUser.id)
                    .single()
                    .catch(() => ({ data: null, error: null }));

                if (data && data.layout) {
                    try {
                        this.widgets = JSON.parse(data.layout);
                        console.log('✅ Dashboard layout loaded from Supabase');
                        
                        // Also update localStorage with Supabase data
                        localStorage.setItem(`dashboard-layout-${this.currentUser.id}`, data.layout);
                        if (data.updated_at) {
                            localStorage.setItem(`dashboard-layout-timestamp-${this.currentUser.id}`, data.updated_at);
                        }
                        return;
                    } catch (parseError) {
                        console.warn('Error parsing Supabase layout:', parseError);
                    }
                }
            }
        } catch (error) {
            console.warn('Could not load layout from database:', error);
        }

        // Fallback to localStorage
        const storageKey = `dashboard-layout-${this.currentUser?.id || 'guest'}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                this.widgets = JSON.parse(saved);
                console.log('💾 Dashboard layout loaded from localStorage');
                
                // Try to sync to Supabase in background (don't wait)
                if (this.currentUser && this.supabase) {
                    this.syncToSupabase(saved).catch(err => {
                        console.warn('Background sync to Supabase failed:', err);
                    });
                }
            } catch (e) {
                console.warn('Error parsing localStorage layout:', e);
                this.widgets = this.getDefaultLayout();
            }
        } else {
            this.widgets = this.getDefaultLayout();
        }
    }

    /**
     * Sync localStorage layout to Supabase (background operation)
     */
    async syncToSupabase(layoutJson) {
        if (!this.currentUser || !this.supabase) return;
        
        try {
            await this.supabase
                .from('user_dashboard_layouts')
                .upsert({
                    user_id: this.currentUser.id,
                    layout: layoutJson,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });
            console.log('✅ Layout synced to Supabase');
        } catch (error) {
            // Silent fail - this is a background operation
            console.warn('Background sync failed:', error);
        }
    }

    /**
     * Get default widget layout
     */
    getDefaultLayout() {
        return [
            { id: 'user-stats', x: 0, y: 0, w: 2, h: 1 },
            { id: 'planet-claims', x: 2, y: 0, w: 2, h: 1 },
            { id: 'marketplace', x: 0, y: 1, w: 2, h: 1 },
            { id: 'reputation', x: 2, y: 1, w: 2, h: 1 }
        ];
    }

    /**
     * Save widget layout with enhanced Supabase persistence
     */
    async saveWidgetLayout() {
        try {
            if (this.currentUser && this.supabase) {
                // First, try to create the table if it doesn't exist (graceful handling)
                const { error: upsertError } = await this.supabase
                    .from('user_dashboard_layouts')
                    .upsert({
                        user_id: this.currentUser.id,
                        layout: JSON.stringify(this.widgets),
                        widget_config: JSON.stringify({
                            gridColumns: 4,
                            gridRows: 'auto',
                            theme: 'default'
                        }),
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    })
                    .catch((err) => {
                        // If table doesn't exist, that's okay - we'll use localStorage
                        console.warn('Dashboard layouts table may not exist:', err);
                        return { error: err };
                    });

                if (!upsertError) {
                    console.log('✅ Dashboard layout saved to Supabase');
                    // Also save to localStorage as backup
                    localStorage.setItem(`dashboard-layout-${this.currentUser.id}`, JSON.stringify(this.widgets));
                    localStorage.setItem(`dashboard-layout-timestamp-${this.currentUser.id}`, new Date().toISOString());
                    return; // Successfully saved
                } else {
                    console.warn('Could not save to Supabase, using localStorage:', upsertError);
                }
            }
        } catch (error) {
            console.warn('Error saving layout to database:', error);
        }

        // Fallback to localStorage (always save here as backup)
        const storageKey = `dashboard-layout-${this.currentUser?.id || 'guest'}`;
        localStorage.setItem(storageKey, JSON.stringify(this.widgets));
        localStorage.setItem(`${storageKey}-timestamp`, new Date().toISOString());
        console.log('💾 Dashboard layout saved to localStorage');
    }

    /**
     * Render dashboard with widgets
     */
    renderDashboard(container) {
        if (!container) return;

        container.innerHTML = `
            <div class="dashboard-widgets-container">
                <div class="dashboard-header">
                    <h2>📊 Custom Dashboard</h2>
                    <div class="dashboard-controls">
                        <button class="edit-mode-btn" id="toggle-edit-mode">
                            ${this.isEditMode ? '💾 Save Layout' : '✏️ Edit Layout'}
                        </button>
                        <button class="add-widget-btn" id="add-widget-btn" style="${this.isEditMode ? '' : 'display: none;'}">
                            ➕ Add Widget
                        </button>
                    </div>
                </div>

                <div class="widgets-grid" id="widgets-grid">
                    ${this.renderWidgets()}
                </div>

                <div class="widget-library" id="widget-library" style="display: none;">
                    <h3>Available Widgets</h3>
                    <div class="widget-list">
                        ${this.availableWidgets.map(widget => `
                            <div class="widget-item" data-widget-id="${widget.id}">
                                <span class="widget-icon">${widget.icon}</span>
                                <span class="widget-name">${widget.name}</span>
                                <button class="add-widget-item-btn" onclick="dashboardWidgets.addWidget('${widget.id}')">
                                    Add
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.setupDragAndDrop();
        this.setupEventListeners();
    }

    /**
     * Render widgets
     */
    renderWidgets() {
        return this.widgets.map((widget, index) => {
            const widgetDef = this.availableWidgets.find(w => w.id === widget.id);
            if (!widgetDef) return '';

            return `
                <div class="dashboard-widget" 
                     data-widget-id="${widget.id}"
                     data-index="${index}"
                     style="grid-column: ${widget.x + 1} / ${widget.x + widget.w + 1}; grid-row: ${widget.y + 1} / ${widget.y + widget.h + 1};">
                    <div class="widget-header">
                        <span class="widget-icon">${widgetDef.icon}</span>
                        <span class="widget-title">${widgetDef.name}</span>
                        ${this.isEditMode ? `
                            <button class="remove-widget-btn" onclick="dashboardWidgets.removeWidget(${index})">×</button>
                        ` : ''}
                    </div>
                    <div class="widget-content" id="widget-content-${widget.id}">
                        ${this.renderWidgetContent(widget.id)}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render widget content
     */
    renderWidgetContent(widgetId) {
        // This will be populated by the analytics dashboard
        return '<div class="widget-loading">Loading...</div>';
    }

    /**
     * Setup drag and drop
     */
    setupDragAndDrop() {
        if (!this.isEditMode) return;

        const widgets = document.querySelectorAll('.dashboard-widget');
        widgets.forEach(widget => {
            widget.draggable = true;
            widget.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', widget.dataset.index);
                widget.classList.add('dragging');
            });

            widget.addEventListener('dragend', () => {
                widget.classList.remove('dragging');
            });
        });

        const grid = document.getElementById('widgets-grid');
        if (grid) {
            grid.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            grid.addEventListener('drop', (e) => {
                e.preventDefault();
                const index = parseInt(e.dataTransfer.getData('text/plain'));
                // Calculate new position based on drop location
                // Simplified - in production, use a proper grid library
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const editBtn = document.getElementById('toggle-edit-mode');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }

        const addWidgetBtn = document.getElementById('add-widget-btn');
        if (addWidgetBtn) {
            addWidgetBtn.addEventListener('click', () => {
                this.toggleWidgetLibrary();
            });
        }
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        if (!this.isEditMode) {
            // Save layout
            this.saveWidgetLayout();
        }

        // Re-render dashboard
        const container = document.getElementById('analytics-container');
        if (container) {
            this.renderDashboard(container);
        }
    }

    /**
     * Toggle widget library
     */
    toggleWidgetLibrary() {
        const library = document.getElementById('widget-library');
        if (library) {
            library.style.display = library.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Add widget
     */
    addWidget(widgetId) {
        // Check if widget already exists
        if (this.widgets.find(w => w.id === widgetId)) {
            alert('Widget already added');
            return;
        }

        // Add widget to layout
        const newWidget = {
            id: widgetId,
            x: 0,
            y: this.widgets.length,
            w: 2,
            h: 1
        };

        this.widgets.push(newWidget);
        this.saveWidgetLayout();

        // Re-render
        const container = document.getElementById('analytics-container');
        if (container) {
            this.renderDashboard(container);
        }

        this.toggleWidgetLibrary();
    }

    /**
     * Remove widget
     */
    removeWidget(index) {
        this.widgets.splice(index, 1);
        this.saveWidgetLayout();

        // Re-render
        const container = document.getElementById('analytics-container');
        if (container) {
            this.renderDashboard(container);
        }
    }

    /**
     * Setup edit mode in analytics dashboard
     */
    setupEditMode() {
        // This will be called by analytics dashboard to enable widget customization
        if (window.analyticsDashboard) {
            // Integrate with existing analytics dashboard
        }
    }
}

// Initialize dashboard widgets
let dashboardWidgetsInstance = null;

function initDashboardWidgets() {
    if (!dashboardWidgetsInstance) {
        dashboardWidgetsInstance = new DashboardWidgets();
    }
    return dashboardWidgetsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardWidgets);
} else {
    initDashboardWidgets();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardWidgets;
}

// Make available globally
window.DashboardWidgets = DashboardWidgets;
window.dashboardWidgets = () => dashboardWidgetsInstance;

