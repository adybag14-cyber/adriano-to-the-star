/**
 * Customizable Dashboard Layouts System
 * Allows users to customize dashboard widget positions and layouts
 * 
 * Features:
 * - Drag and drop widgets
 * - Multiple layout presets
 * - Save custom layouts
 * - Grid system
 * - Responsive layouts
 */

class CustomizableDashboardLayouts {
    constructor() {
        this.layouts = {
            default: { name: 'Default', widgets: [] },
            compact: { name: 'Compact', widgets: [] },
            wide: { name: 'Wide', widgets: [] },
            custom: { name: 'Custom', widgets: [] }
        };
        this.currentLayout = 'default';
        this.isDragging = false;
        this.init();
    }
    
    init() {
        this.loadLayout();
        this.setupDragAndDrop();
        this.createLayoutControls();
        this.applyLayout(this.currentLayout);
        console.log('📊 Customizable Dashboard Layouts initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_us_to_mi_za_bl_ed_as_hb_oa_rd_la_yo_ut_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadLayout() {
        try {
            const saved = localStorage.getItem('dashboard-layout');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.currentLayout = parsed.currentLayout || 'default';
                if (parsed.customLayouts) {
                    this.layouts = { ...this.layouts, ...parsed.customLayouts };
                }
            }
        } catch (e) {
            console.warn('Failed to load dashboard layout:', e);
        }
    }
    
    saveLayout() {
        try {
            localStorage.setItem('dashboard-layout', JSON.stringify({
                currentLayout: this.currentLayout,
                customLayouts: this.layouts
            }));
        } catch (e) {
            console.warn('Failed to save dashboard layout:', e);
        }
    }
    
    setupDragAndDrop() {
        // Make dashboard widgets draggable
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.dashboard-widget, [class*="widget"], [data-widget]').forEach(widget => {
                if (!widget.hasAttribute('data-draggable')) {
                    widget.setAttribute('data-draggable', 'true');
                    widget.setAttribute('draggable', 'true');
                    widget.style.cursor = 'move';
                    
                    widget.addEventListener('dragstart', (e) => {
                        this.isDragging = true;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/html', widget.outerHTML);
                        widget.classList.add('dragging');
                    });
                    
                    widget.addEventListener('dragend', () => {
                        this.isDragging = false;
                        widget.classList.remove('dragging');
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Setup drop zones
        document.addEventListener('dragover', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                const widget = document.querySelector('.dragging');
                const afterElement = this.getDragAfterElement(e.clientY);
                const container = document.querySelector('.dashboard-container, [class*="dashboard"]');
                if (container && widget) {
                    if (afterElement == null) {
                        container.appendChild(widget);
                    } else {
                        container.insertBefore(widget, afterElement);
                    }
                }
            }
        });
    }
    
    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('[data-draggable="true"]:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    createLayoutControls() {
        const controls = document.createElement('div');
        controls.id = 'dashboard-layout-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 320px;
            right: 20px;
            width: 200px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid rgba(186, 148, 79, 0.8);
            border-radius: 12px;
            padding: 15px;
            z-index: 9996;
            display: none;
        `;
        
        controls.innerHTML = `
            <h4 style="color: #ba944f; margin: 0 0 10px 0; font-size: 1rem;">Layout</h4>
            <select id="layout-selector" style="
                width: 100%;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                color: white;
                margin-bottom: 10px;
            ">
                ${Object.keys(this.layouts).map(key => `
                    <option value="${key}" ${this.currentLayout === key ? 'selected' : ''}>${this.layouts[key].name}</option>
                `).join('')}
            </select>
            <button id="save-layout" style="
                width: 100%;
                padding: 8px;
                background: rgba(186, 148, 79, 0.3);
                border: 1px solid #ba944f;
                color: white;
                border-radius: 6px;
                cursor: pointer;
                margin-bottom: 5px;
            ">Save Layout</button>
            <button id="reset-layout" style="
                width: 100%;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 6px;
                cursor: pointer;
            ">Reset</button>
        `;
        
        controls.querySelector('#layout-selector').addEventListener('change', (e) => {
            this.setLayout(e.target.value);
        });
        
        controls.querySelector('#save-layout').addEventListener('click', () => {
            this.saveCurrentLayout();
        });
        
        controls.querySelector('#reset-layout').addEventListener('click', () => {
            this.resetLayout();
        });
        
        document.body.appendChild(controls);
        
        // Show controls when dashboard is present
        const checkDashboard = () => {
            const dashboard = document.querySelector('.dashboard, [class*="dashboard"], [id*="dashboard"]');
            if (dashboard) {
                controls.style.display = 'block';
            } else {
                controls.style.display = 'none';
            }
        };
        
        setInterval(checkDashboard, 1000);
        checkDashboard();
    }
    
    setLayout(layoutName) {
        this.currentLayout = layoutName;
        this.applyLayout(layoutName);
        this.saveLayout();
    }
    
    applyLayout(layoutName) {
        const layout = this.layouts[layoutName];
        if (!layout) return;
        
        const container = document.querySelector('.dashboard-container, [class*="dashboard"]');
        if (!container) return;
        
        // Apply grid layout
        if (layoutName === 'compact') {
            container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
            container.style.gap = '10px';
        } else if (layoutName === 'wide') {
            container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
            container.style.gap = '20px';
        } else {
            container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            container.style.gap = '15px';
        }
        
        // Apply widget positions if saved
        if (layout.widgets && layout.widgets.length > 0) {
            layout.widgets.forEach((widgetData, index) => {
                const widget = document.querySelector(`[data-widget-id="${widgetData.id}"]`);
                if (widget && container) {
                    if (index === 0) {
                        container.insertBefore(widget, container.firstChild);
                    } else {
                        const prevWidget = document.querySelector(`[data-widget-id="${layout.widgets[index - 1].id}"]`);
                        if (prevWidget) {
                            prevWidget.insertAdjacentElement('afterend', widget);
                        }
                    }
                }
            });
        }
    }
    
    saveCurrentLayout() {
        const container = document.querySelector('.dashboard-container, [class*="dashboard"]');
        if (!container) return;
        
        const widgets = Array.from(container.querySelectorAll('[data-draggable="true"], .dashboard-widget, [class*="widget"]'));
        const widgetData = widgets.map((widget, index) => ({
            id: widget.id || `widget-${index}`,
            type: widget.getAttribute('data-widget-type') || 'unknown',
            order: index
        }));
        
        this.layouts.custom = {
            name: 'Custom',
            widgets: widgetData
        };
        
        this.saveLayout();
        alert('Layout saved!');
    }
    
    resetLayout() {
        this.currentLayout = 'default';
        this.applyLayout('default');
        this.saveLayout();
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.customizableDashboardLayouts = new CustomizableDashboardLayouts();
    });
} else {
    window.customizableDashboardLayouts = new CustomizableDashboardLayouts();
}
