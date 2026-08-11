/**
 * Floating Action Button (FAB) System
 * Floating action buttons for quick actions
 */

class FloatingActionButtonSystem {
    constructor() {
        this.fabs = [];
        this.init();
    }
    
    init() {
        this.createMainFAB();
    }
    
    createMainFAB() {
        const fab = document.createElement('button');
        fab.id = 'main-fab';
        fab.innerHTML = '+';
        fab.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(186, 148, 79, 0.9);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease;
        `;
        
        fab.addEventListener('click', () => this.toggleFABMenu());
        document.body.appendChild(fab);
    }
    
    toggleFABMenu() {
        const menu = document.getElementById('fab-menu');
        if (menu) {
            menu.remove();
        } else {
            this.showFABMenu();
        }
    }
    
    showFABMenu() {
        const menu = document.createElement('div');
        menu.id = 'fab-menu';
        menu.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.8);
            border-radius: 12px;
            padding: 10px;
            z-index: 9998;
            min-width: 200px;
        `;
        
        const actions = [
            { label: 'New Planet', icon: '🌍', action: () => console.log('New Planet') },
            { label: 'New Post', icon: '📝', action: () => console.log('New Post') },
            { label: 'Upload File', icon: '📁', action: () => console.log('Upload File') }
        ];
        
        actions.forEach(action => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:10px;color:white;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:10px;';
            item.innerHTML = `<span>${action.icon}</span><span>${action.label}</span>`;
            item.addEventListener('click', () => { action.action(); menu.remove(); });
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.floatingActionButtonSystem = new FloatingActionButtonSystem(); });
} else {
    window.floatingActionButtonSystem = new FloatingActionButtonSystem();
}


