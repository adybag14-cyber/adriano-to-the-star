/**
 * Breadcrumb Navigation System
 * Creates dynamic breadcrumb navigation for pages
 * 
 * Features:
 * - Automatic generation from URL path
 * - Custom breadcrumb items support
 * - Home icon support
 * - Responsive design
 * - Accessibility support
 */

class BreadcrumbNavigation {
    constructor() {
        this.container = null;
        this.items = [];
        this.init();
    }

    init() {
        this.createContainer();
        this.generateFromURL();
        this.trackEvent('breadcrumb_initialized');
    }

    createContainer() {
        // Check if breadcrumb container already exists
        this.container = document.getElementById('breadcrumb-container') || 
                        document.querySelector('.breadcrumb-container') ||
                        document.querySelector('nav[aria-label="Breadcrumb"]');
        
        if (!this.container) {
            this.container = document.createElement('nav');
            this.container.id = 'breadcrumb-container';
            this.container.className = 'breadcrumb-container';
            this.container.setAttribute('aria-label', 'Breadcrumb');
            
            // Insert at the beginning of main or body
            const main = document.querySelector('main');
            if (main) {
                main.insertBefore(this.container, main.firstChild);
            } else {
                document.body.insertBefore(this.container, document.body.firstChild);
            }
        }

        this.container.style.cssText = `
            padding: 1rem 2rem;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid rgba(186, 148, 79, 0.2);
            font-family: 'Raleway', sans-serif;
        `;
    }

    generateFromURL() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s);
        
        this.items = [
            { label: 'Home', href: '/', icon: '🏠' }
        ];

        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += '/' + segment;
            const label = this.formatLabel(segment);
            this.items.push({
                label,
                href: currentPath,
                isLast: index === segments.length - 1
            });
        });

        this.render();
    }

    formatLabel(segment) {
        // Convert URL segment to readable label
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/\.html$/, '');
    }

    /**
     * Set custom breadcrumb items
     * @param {Array} items - Array of {label, href, icon}
     */
    setItems(items) {
        this.items = items;
        this.render();
    }

    /**
     * Add a breadcrumb item
     * @param {Object} item - {label, href, icon}
     */
    addItem(item) {
        this.items.push(item);
        this.render();
    }

    render() {
        if (!this.container) return;

        const breadcrumbList = document.createElement('ol');
        breadcrumbList.className = 'breadcrumb-list';
        breadcrumbList.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
        `;

        this.items.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'breadcrumb-item';
            listItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;

            if (index > 0) {
                const separator = document.createElement('span');
                separator.className = 'breadcrumb-separator';
                separator.setAttribute('aria-hidden', 'true');
                separator.textContent = '›';
                separator.style.cssText = `
                    color: rgba(186, 148, 79, 0.5);
                    margin: 0 0.25rem;
                `;
                listItem.appendChild(separator);
            }

            if (item.isLast || index === this.items.length - 1) {
                // Last item - no link
                const span = document.createElement('span');
                span.className = 'breadcrumb-current';
                span.setAttribute('aria-current', 'page');
                span.textContent = item.icon ? `${item.icon} ${item.label}` : item.label;
                span.style.cssText = `
                    color: #ba944f;
                    font-weight: 600;
                `;
                listItem.appendChild(span);
            } else {
                // Link item
                const link = document.createElement('a');
                link.href = item.href;
                link.className = 'breadcrumb-link';
                link.textContent = item.icon ? `${item.icon} ${item.label}` : item.label;
                link.style.cssText = `
                    color: rgba(255, 255, 255, 0.7);
                    text-decoration: none;
                    transition: color 0.2s;
                `;
                link.addEventListener('mouseenter', () => {
                    link.style.color = '#ba944f';
                });
                link.addEventListener('mouseleave', () => {
                    link.style.color = 'rgba(255, 255, 255, 0.7)';
                });
                listItem.appendChild(link);
            }

            breadcrumbList.appendChild(listItem);
        });

        this.container.innerHTML = '';
        this.container.appendChild(breadcrumbList);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`breadcrumb_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.breadcrumbNav = new BreadcrumbNavigation();
}

