/**
 * Mega Menu System
 * Comprehensive mega menu with rich content, search, and animations
 * @author Agent 3 - Adriano To The Star
 */

class MegaMenuSystem {
    constructor(container, menuData, options = {}) {
        this.container = container;
        this.menuData = menuData;
        this.options = { ...this.defaultOptions, ...options };
        this.isOpen = false;
        this.activeMenu = null;
        this.searchResults = [];
        this.init();
    }

    get defaultOptions() {
        return {
            trigger: 'hover', // 'hover' or 'click'
            delay: 200,
            animationDuration: 300,
            searchable: true,
            multiColumn: true,
            responsive: true,
            mobileBreakpoint: 768,
            showIcons: true,
            showDescriptions: true,
            maxColumns: 4
        };
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.addStyles();
    }

    render() {
        const html = `
            <nav class="mega-menu">
                <ul class="mega-menu-main">
                    ${this.renderMainItems()}
                </ul>
                <div class="mega-menu-content">
                    ${this.renderMenuContent()}
                </div>
                ${this.options.searchable ? this.renderSearch() : ''}
            </nav>
        `;

        this.container.innerHTML = html;
    }

    renderMainItems() {
        return this.menuData.items.map(item => `
            <li class="mega-menu-item" data-menu="${item.id}">
                <a href="${item.url || '#'}" class="mega-menu-link">
                    ${this.options.showIcons && item.icon ? `<span class="menu-icon">${item.icon}</span>` : ''}
                    <span class="menu-label">${item.label}</span>
                    ${item.submenu ? '<span class="menu-arrow">▼</span>' : ''}
                </a>
            </li>
        `).join('');
    }

    renderMenuContent() {
        return this.menuData.items.map(item => {
            if (!item.submenu) return '';
            
            return `
                <div class="mega-menu-panel" data-panel="${item.id}">
                    <div class="mega-menu-panel-inner">
                        ${item.submenu.title ? `<h3 class="panel-title">${item.submenu.title}</h3>` : ''}
                        <div class="mega-menu-columns">
                            ${this.renderColumns(item.submenu)}
                        </div>
                        ${item.submenu.featured ? this.renderFeatured(item.submenu.featured) : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderColumns(submenu) {
        if (!submenu.columns) return '';
        
        return submenu.columns.map(column => `
            <div class="mega-menu-column">
                ${column.title ? `<h4 class="column-title">${column.title}</h4>` : ''}
                <ul class="column-links">
                    ${column.items.map(link => `
                        <li>
                            <a href="${link.url || '#'}" class="column-link">
                                ${this.options.showIcons && link.icon ? `<span class="link-icon">${link.icon}</span>` : ''}
                                <span class="link-content">
                                    <span class="link-label">${link.label}</span>
                                    ${this.options.showDescriptions && link.description ? 
                                        `<span class="link-description">${link.description}</span>` : ''}
                                </span>
                                ${link.badge ? `<span class="link-badge">${link.badge}</span>` : ''}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    }

    renderFeatured(featured) {
        return `
            <div class="mega-menu-featured">
                <div class="featured-content">
                    ${featured.image ? `<img src="${featured.image}" alt="${featured.title}" class="featured-image">` : ''}
                    <div class="featured-text">
                        <h4 class="featured-title">${featured.title}</h4>
                        ${featured.description ? `<p class="featured-description">${featured.description}</p>` : ''}
                        ${featured.cta ? `<a href="${featured.cta.url}" class="featured-cta">${featured.cta.label}</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderSearch() {
        return `
            <div class="mega-menu-search">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search menu...">
                    <button class="search-btn">🔍</button>
                </div>
                <div class="search-results" style="display: none;">
                    <div class="search-results-inner"></div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const mainItems = this.container.querySelectorAll('.mega-menu-item');
        const panels = this.container.querySelectorAll('.mega-menu-panel');
        const content = this.container.querySelector('.mega-menu-content');
        const searchInput = this.container.querySelector('.search-input');

        // Main menu interactions
        mainItems.forEach(item => {
            const menuId = item.dataset.menu;
            const panel = this.container.querySelector(`[data-panel="${menuId}"]`);

            if (this.options.trigger === 'hover') {
                let timeout;

                item.addEventListener('mouseenter', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.openMenu(menuId), this.options.delay);
                });

                item.addEventListener('mouseleave', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.closeMenu(), this.options.delay);
                });

                if (panel) {
                    panel.addEventListener('mouseenter', () => {
                        clearTimeout(timeout);
                    });

                    panel.addEventListener('mouseleave', () => {
                        timeout = setTimeout(() => this.closeMenu(), this.options.delay);
                    });
                }
            } else {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleMenu(menuId);
                });
            }
        });

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            searchInput.addEventListener('focus', () => {
                if (this.searchResults.length > 0) {
                    this.showSearchResults();
                }
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.mega-menu-search')) {
                    this.hideSearchResults();
                }
            });
        }

        // Mobile menu toggle
        if (this.options.responsive) {
            this.setupMobileMenu();
        }

        // Keyboard navigation
        this.setupKeyboardNavigation();
    }

    setupMobileMenu() {
        // Create mobile menu toggle
        const toggle = document.createElement('button');
        toggle.className = 'mega-menu-toggle';
        toggle.innerHTML = '☰';
        toggle.setAttribute('aria-label', 'Toggle menu');

        this.container.insertBefore(toggle, this.container.firstChild);

        toggle.addEventListener('click', () => {
            this.container.classList.toggle('mobile-open');
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > this.options.mobileBreakpoint) {
                this.container.classList.remove('mobile-open');
            }
        });
    }

    setupKeyboardNavigation() {
        const mainItems = this.container.querySelectorAll('.mega-menu-item');
        
        mainItems.forEach((item, index) => {
            const link = item.querySelector('.mega-menu-link');
            
            link.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextIndex = (index + 1) % mainItems.length;
                        mainItems[nextIndex].querySelector('.mega-menu-link').focus();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevIndex = (index - 1 + mainItems.length) % mainItems.length;
                        mainItems[prevIndex].querySelector('.mega-menu-link').focus();
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.openMenu(item.dataset.menu);
                        const firstLink = this.container.querySelector('.mega-menu-panel.active .column-link');
                        if (firstLink) firstLink.focus();
                        break;
                    case 'Escape':
                        this.closeMenu();
                        break;
                }
            });
        });
    }

    openMenu(menuId) {
        const panel = this.container.querySelector(`[data-panel="${menuId}"]`);
        const item = this.container.querySelector(`[data-menu="${menuId}"]`);

        if (!panel) return;

        // Close current menu
        if (this.activeMenu && this.activeMenu !== menuId) {
            this.closeMenu();
        }

        // Open new menu
        panel.classList.add('active');
        item.classList.add('active');
        this.activeMenu = menuId;
        this.isOpen = true;

        // Animate content
        const content = this.container.querySelector('.mega-menu-content');
        content.style.maxHeight = content.scrollHeight + 'px';

        this.triggerEvent('menuOpen', { menuId, panel, item });
    }

    closeMenu() {
        if (!this.activeMenu) return;

        const panel = this.container.querySelector(`[data-panel="${this.activeMenu}"]`);
        const item = this.container.querySelector(`[data-menu="${this.activeMenu}"]`);

        if (panel) panel.classList.remove('active');
        if (item) item.classList.remove('active');

        const content = this.container.querySelector('.mega-menu-content');
        content.style.maxHeight = '0';

        this.activeMenu = null;
        this.isOpen = false;

        this.triggerEvent('menuClose');
    }

    toggleMenu(menuId) {
        if (this.activeMenu === menuId) {
            this.closeMenu();
        } else {
            this.openMenu(menuId);
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.hideSearchResults();
            return;
        }

        const results = this.searchMenu(query.toLowerCase());
        this.searchResults = results;
        this.displaySearchResults(results);
    }

    searchMenu(query) {
        const results = [];

        this.menuData.items.forEach(item => {
            // Search main items
            if (item.label.toLowerCase().includes(query)) {
                results.push({
                    type: 'main',
                    label: item.label,
                    url: item.url,
                    icon: item.icon
                });
            }

            // Search submenu items
            if (item.submenu && item.submenu.columns) {
                item.submenu.columns.forEach(column => {
                    column.items.forEach(link => {
                        if (link.label.toLowerCase().includes(query) || 
                            (link.description && link.description.toLowerCase().includes(query))) {
                            results.push({
                                type: 'submenu',
                                label: link.label,
                                description: link.description,
                                url: link.url,
                                icon: link.icon,
                                category: column.title || item.label
                            });
                        }
                    });
                });
            }
        });

        return results.slice(0, 10); // Limit results
    }

    displaySearchResults(results) {
        const resultsContainer = this.container.querySelector('.search-results-inner');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
        } else {
            resultsContainer.innerHTML = results.map(result => `
                <a href="${result.url || '#'}" class="search-result-item">
                    ${result.icon ? `<span class="result-icon">${result.icon}</span>` : ''}
                    <div class="result-content">
                        <div class="result-label">${result.label}</div>
                        ${result.description ? `<div class="result-description">${result.description}</div>` : ''}
                        ${result.category ? `<div class="result-category">${result.category}</div>` : ''}
                    </div>
                </a>
            `).join('');
        }

        this.showSearchResults();
    }

    showSearchResults() {
        const resultsContainer = this.container.querySelector('.search-results');
        resultsContainer.style.display = 'block';
    }

    hideSearchResults() {
        const resultsContainer = this.container.querySelector('.search-results');
        resultsContainer.style.display = 'none';
    }

    triggerEvent(eventName, data) {
        const event = new CustomEvent(`megaMenu:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    addStyles() {
        if (document.querySelector('#mega-menu-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mega-menu-styles';
        style.textContent = `
            .mega-menu {
                position: relative;
                background: var(--color-surface);
                border-radius: 8px;
                box-shadow: var(--effect-shadow);
            }

            .mega-menu-main {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .mega-menu-item {
                position: relative;
            }

            .mega-menu-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                text-decoration: none;
                color: var(--color-text);
                transition: all 0.2s ease;
                font-weight: 500;
            }

            .mega-menu-link:hover {
                background: var(--color-primary);
                color: white;
            }

            .mega-menu-item.active .mega-menu-link {
                background: var(--color-primary);
                color: white;
            }

            .menu-arrow {
                font-size: 12px;
                transition: transform 0.2s ease;
            }

            .mega-menu-item.active .menu-arrow {
                transform: rotate(180deg);
            }

            .mega-menu-content {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--color-surface);
                border: 1px solid var(--color-background);
                border-radius: 0 0 8px 8px;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                z-index: 1000;
            }

            .mega-menu-panel {
                display: none;
                padding: 20px;
            }

            .mega-menu-panel.active {
                display: block;
            }

            .mega-menu-panel-inner {
                display: flex;
                gap: 40px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .mega-menu-columns {
                display: flex;
                gap: 30px;
                flex: 1;
            }

            .mega-menu-column {
                min-width: 200px;
            }

            .column-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--color-primary);
                margin: 0 0 12px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .column-links {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .column-link {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 8px 0;
                text-decoration: none;
                color: var(--color-text);
                transition: all 0.2s ease;
            }

            .column-link:hover {
                color: var(--color-primary);
                transform: translateX(4px);
            }

            .link-content {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .link-label {
                font-weight: 500;
            }

            .link-description {
                font-size: 12px;
                color: var(--color-text-secondary);
                line-height: 1.4;
            }

            .link-badge {
                background: var(--color-accent);
                color: white;
                padding: 2px 6px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                margin-left: auto;
            }

            .mega-menu-featured {
                flex: 0 0 300px;
                background: var(--color-background);
                border-radius: 8px;
                padding: 20px;
            }

            .featured-content {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .featured-image {
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 6px;
            }

            .featured-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--color-text);
                margin: 0;
            }

            .featured-description {
                color: var(--color-text-secondary);
                line-height: 1.5;
                margin: 0;
            }

            .featured-cta {
                display: inline-block;
                background: var(--color-primary);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            .featured-cta:hover {
                background: var(--color-accent);
                transform: translateY(-1px);
            }

            .mega-menu-search {
                position: absolute;
                top: 12px;
                right: 20px;
                z-index: 1001;
            }

            .search-container {
                display: flex;
                background: var(--color-background);
                border-radius: 6px;
                overflow: hidden;
            }

            .search-input {
                padding: 8px 12px;
                border: none;
                background: transparent;
                color: var(--color-text);
                outline: none;
                width: 200px;
            }

            .search-btn {
                padding: 8px 12px;
                border: none;
                background: var(--color-primary);
                color: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .search-btn:hover {
                background: var(--color-accent);
            }

            .search-results {
                position: absolute;
                top: 100%;
                right: 0;
                width: 300px;
                background: var(--color-surface);
                border: 1px solid var(--color-background);
                border-radius: 6px;
                box-shadow: var(--effect-shadow);
                max-height: 400px;
                overflow-y: auto;
            }

            .search-results-inner {
                padding: 8px;
            }

            .search-result-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px;
                text-decoration: none;
                color: var(--color-text);
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .search-result-item:hover {
                background: var(--color-background);
            }

            .result-content {
                flex: 1;
            }

            .result-label {
                font-weight: 500;
                margin-bottom: 2px;
            }

            .result-description {
                font-size: 12px;
                color: var(--color-text-secondary);
                margin-bottom: 2px;
            }

            .result-category {
                font-size: 10px;
                color: var(--color-primary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .search-no-results {
                padding: 20px;
                text-align: center;
                color: var(--color-text-secondary);
            }

            .mega-menu-toggle {
                display: none;
                background: var(--color-primary);
                color: white;
                border: none;
                padding: 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 18px;
            }

            @media (max-width: ${this.options.mobileBreakpoint}px) {
                .mega-menu-toggle {
                    display: block;
                }

                .mega-menu-main {
                    display: none;
                    flex-direction: column;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: var(--color-surface);
                    border: 1px solid var(--color-background);
                    border-radius: 0 0 8px 8px;
                }

                .mega-menu.mobile-open .mega-menu-main {
                    display: flex;
                }

                .mega-menu-content {
                    position: static;
                    max-height: none;
                    box-shadow: none;
                    border: none;
                }

                .mega-menu-panel {
                    display: block;
                    padding: 0;
                }

                .mega-menu-panel-inner {
                    flex-direction: column;
                    gap: 20px;
                }

                .mega-menu-columns {
                    flex-direction: column;
                    gap: 0;
                }

                .mega-menu-featured {
                    flex: 1;
                    width: 100%;
                }

                .mega-menu-search {
                    position: static;
                    margin: 12px;
                }

                .search-container {
                    width: 100%;
                }

                .search-input {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Public API methods
    open(menuId) {
        this.openMenu(menuId);
    }

    close() {
        this.closeMenu();
    }

    destroy() {
        this.container.innerHTML = '';
        this.isOpen = false;
        this.activeMenu = null;
        this.searchResults = [];
    }
}

// Initialize helper
window.MegaMenuSystem = MegaMenuSystem;
