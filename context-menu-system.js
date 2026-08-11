/**
 * Context Menus for Right-Click Actions
 * Right-click context menus
 */

class ContextMenuSystem {
    constructor() {
        this.activeMenu = null;
        this.init();
    }
    
    init() {
        this.setupContextMenu();
        this.setupClickOutside();
        this.trackEvent('context_menu_initialized');
    }
    
    setupContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            const target = e.target.closest('[data-context-menu]');
            if (target) {
                e.preventDefault();
                this.showContextMenu(target, e);
            }
        });
    }
    
    showContextMenu(element, event) {
        this.hideContextMenu();
        
        const menuId = element.getAttribute('data-context-menu');
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ba944f;
            border-radius: 8px;
            padding: 5px;
            z-index: 10000;
            min-width: 200px;
        `;
        
        const items = this.getMenuItems(menuId, element);
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.style.cssText = `
                padding: 10px 15px;
                color: white;
                cursor: pointer;
                border-radius: 4px;
            `;
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => {
                if (item.action) item.action(element);
                this.hideContextMenu();
            });
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = 'rgba(186, 148, 79, 0.3)';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX}px`;
        this.activeMenu = menu;
    }
    
    getMenuItems(menuId, element) {
        const defaultItems = [
            { label: 'Copy', action: () => navigator.clipboard.writeText(element.textContent) },
            { label: 'Select All', action: () => window.getSelection().selectAllChildren(element) }
        ];
        
        if (menuId === 'planet') {
            return [
                { label: 'View Details', action: () => console.log('View planet') },
                { label: 'Add to Favorites', action: () => console.log('Add favorite') },
                { label: 'Share', action: () => console.log('Share') },
                ...defaultItems
            ];
        }
        
        return defaultItems;
    }
    
    hideContextMenu() {
        if (this.activeMenu) {
            this.activeMenu.remove();
            this.activeMenu = null;
        }
    }
    
    setupClickOutside() {
        document.addEventListener('click', () => this.hideContextMenu());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`context_menu_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.contextMenuSystem = new ContextMenuSystem(); });
} else {
    window.contextMenuSystem = new ContextMenuSystem();
}


