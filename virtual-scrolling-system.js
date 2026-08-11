/**
 * Virtual Scrolling System for Large Lists
 * 
 * Implements virtual scrolling for large planet lists and other data tables.
 * 
 * @module VirtualScrollingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class VirtualScrollingSystem {
    constructor() {
        this.instances = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize virtual scrolling system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('VirtualScrollingSystem already initialized');
            return;
        }

        this.isInitialized = true;
        console.log('✅ Virtual Scrolling System initialized');
    }

    /**
     * Create virtual scroll instance
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} items - Items to display
     * @param {Function} renderItem - Function to render each item
     * @param {Object} options - Configuration options
     * @returns {Object} Virtual scroll instance
     */
    create(container, items, renderItem, options = {}) {
        const config = {
            itemHeight: options.itemHeight || 50,
            overscan: options.overscan || 5,
            containerHeight: options.containerHeight || container.clientHeight,
            ...options
        };

        const instance = {
            container,
            items,
            renderItem,
            config,
            scrollTop: 0,
            startIndex: 0,
            endIndex: 0,
            visibleItems: [],
            wrapper: null,
            content: null,
            spacerTop: null,
            spacerBottom: null
        };

        this.setupInstance(instance);
        this.instances.set(container, instance);

        return instance;
    }

    /**
     * Set up virtual scroll instance
     * @private
     * @param {Object} instance - Instance object
     */
    setupInstance(instance) {
        const { container, items, config } = instance;

        // Create wrapper
        instance.wrapper = document.createElement('div');
        instance.wrapper.style.cssText = `
            height: ${config.containerHeight}px;
            overflow-y: auto;
            position: relative;
        `;

        // Create content container
        instance.content = document.createElement('div');
        instance.content.style.cssText = `
            position: relative;
            height: ${items.length * config.itemHeight}px;
        `;

        // Create spacers
        instance.spacerTop = document.createElement('div');
        instance.spacerBottom = document.createElement('div');

        // Append to wrapper
        instance.wrapper.appendChild(instance.content);
        instance.content.appendChild(instance.spacerTop);
        instance.content.appendChild(instance.spacerBottom);

        // Replace container content
        container.innerHTML = '';
        container.appendChild(instance.wrapper);

        // Set up scroll handler
        instance.wrapper.addEventListener('scroll', () => {
            this.handleScroll(instance);
        });

        // Initial render
        this.updateVisibleItems(instance);
    }

    /**
     * Handle scroll event
     * @private
     * @param {Object} instance - Instance object
     */
    handleScroll(instance) {
        instance.scrollTop = instance.wrapper.scrollTop;
        this.updateVisibleItems(instance);
    }

    /**
     * Update visible items
     * @private
     * @param {Object} instance - Instance object
     */
    updateVisibleItems(instance) {
        const { items, config, scrollTop } = instance;
        const { itemHeight, overscan, containerHeight } = config;

        // Calculate visible range
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            items.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        );

        instance.startIndex = startIndex;
        instance.endIndex = endIndex;

        // Update spacers
        instance.spacerTop.style.height = `${startIndex * itemHeight}px`;
        instance.spacerBottom.style.height = `${(items.length - endIndex - 1) * itemHeight}px`;

        // Render visible items
        this.renderVisibleItems(instance);
    }

    /**
     * Render visible items
     * @private
     * @param {Object} instance - Instance object
     */
    renderVisibleItems(instance) {
        const { items, renderItem, startIndex, endIndex, content, spacerTop, spacerBottom } = instance;

        // Remove existing visible items
        const existingItems = content.querySelectorAll('.virtual-scroll-item');
        existingItems.forEach(item => item.remove());

        // Render new visible items
        for (let i = startIndex; i <= endIndex; i++) {
            const item = items[i];
            if (!item) continue;

            const itemElement = document.createElement('div');
            itemElement.className = 'virtual-scroll-item';
            itemElement.style.cssText = `
                position: absolute;
                top: ${i * instance.config.itemHeight}px;
                left: 0;
                right: 0;
                height: ${instance.config.itemHeight}px;
            `;

            const rendered = renderItem(item, i);
            if (typeof rendered === 'string') {
                itemElement.innerHTML = rendered;
            } else if (rendered instanceof HTMLElement) {
                itemElement.appendChild(rendered);
            }

            content.insertBefore(itemElement, spacerBottom);
        }
    }

    /**
     * Update items
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} newItems - New items array
     */
    updateItems(container, newItems) {
        const instance = this.instances.get(container);
        if (!instance) {
            console.warn('Virtual scroll instance not found');
            return;
        }

        instance.items = newItems;
        instance.content.style.height = `${newItems.length * instance.config.itemHeight}px`;
        this.updateVisibleItems(instance);
    }

    /**
     * Scroll to index
     * @public
     * @param {HTMLElement} container - Container element
     * @param {number} index - Item index
     */
    scrollToIndex(container, index) {
        const instance = this.instances.get(container);
        if (!instance) {
            console.warn('Virtual scroll instance not found');
            return;
        }

        const scrollTop = index * instance.config.itemHeight;
        instance.wrapper.scrollTop = scrollTop;
    }

    /**
     * Destroy instance
     * @public
     * @param {HTMLElement} container - Container element
     */
    destroy(container) {
        const instance = this.instances.get(container);
        if (instance) {
            instance.wrapper.remove();
            this.instances.delete(container);
        }
    }
}

// Create global instance
window.VirtualScrollingSystem = VirtualScrollingSystem;
window.virtualScrolling = new VirtualScrollingSystem();
window.virtualScrolling.init();

