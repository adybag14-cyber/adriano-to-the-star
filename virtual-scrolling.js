/**
 * Virtual Scrolling for Large Datasets
 * Optimize rendering of large planet lists with virtual scrolling
 */

class VirtualScrolling {
    constructor() {
        this.container = null;
        this.itemHeight = 200; // Estimated height per item
        this.visibleItems = 10; // Number of visible items
        this.buffer = 5; // Buffer items above/below viewport
        this.scrollTop = 0;
        this.totalItems = 0;
        this.items = [];
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize virtual scrolling
     */
    init() {
        this.isInitialized = true;
        console.log('📜 Virtual Scrolling initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("v_ir_tu_al_sc_ro_ll_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Setup virtual scrolling for container
     */
    setupVirtualScrolling(containerId, items, renderItem) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        this.container = container;
        this.items = items;
        this.totalItems = items.length;
        this.renderItem = renderItem;

        // Create virtual scrolling structure
        this.createVirtualStructure();

        // Setup scroll listener
        this.setupScrollListener();

        // Initial render
        this.render();
    }

    /**
     * Create virtual scrolling structure
     */
    createVirtualStructure() {
        if (!this.container) return;

        const totalHeight = this.totalItems * this.itemHeight;
        const viewportHeight = this.container.clientHeight || 600;

        this.container.innerHTML = `
            <div class="virtual-scroll-viewport" style="height: ${viewportHeight}px; overflow-y: auto; position: relative;">
                <div class="virtual-scroll-spacer" style="height: ${totalHeight}px; position: relative;">
                    <div class="virtual-scroll-content" style="position: absolute; top: 0; left: 0; right: 0;">
                        <!-- Items will be rendered here -->
                    </div>
                </div>
            </div>
        `;

        this.viewport = this.container.querySelector('.virtual-scroll-viewport');
        this.content = this.container.querySelector('.virtual-scroll-content');
    }

    /**
     * Setup scroll listener
     */
    setupScrollListener() {
        if (!this.viewport) return;

        this.viewport.addEventListener('scroll', () => {
            this.scrollTop = this.viewport.scrollTop;
            this.render();
        });
    }

    /**
     * Calculate visible range
     */
    calculateVisibleRange() {
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
        const endIndex = Math.min(
            this.totalItems - 1,
            Math.ceil((this.scrollTop + this.viewport.clientHeight) / this.itemHeight) + this.buffer
        );

        return { startIndex, endIndex };
    }

    /**
     * Render visible items
     */
    render() {
        if (!this.content || !this.renderItem) return;

        const { startIndex, endIndex } = this.calculateVisibleRange();
        const visibleItems = [];

        // Render visible items
        for (let i = startIndex; i <= endIndex; i++) {
            if (this.items[i]) {
                visibleItems.push({
                    index: i,
                    item: this.items[i],
                    top: i * this.itemHeight
                });
            }
        }

        // Update content
        this.content.innerHTML = visibleItems.map(({ index, item, top }) => {
            return `
                <div class="virtual-scroll-item" data-index="${index}" style="position: absolute; top: ${top}px; left: 0; right: 0; height: ${this.itemHeight}px;">
                    ${this.renderItem(item, index)}
                </div>
            `;
        }).join('');

        // Update spacer height if needed
        const spacer = this.container.querySelector('.virtual-scroll-spacer');
        if (spacer) {
            const totalHeight = this.totalItems * this.itemHeight;
            spacer.style.height = `${totalHeight}px`;
        }
    }

    /**
     * Update items
     */
    updateItems(items) {
        this.items = items;
        this.totalItems = items.length;
        this.render();
    }

    /**
     * Scroll to item
     */
    scrollToItem(index) {
        if (!this.viewport) return;

        const targetScroll = index * this.itemHeight;
        this.viewport.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }

    /**
     * Get visible items
     */
    getVisibleItems() {
        const { startIndex, endIndex } = this.calculateVisibleRange();
        return this.items.slice(startIndex, endIndex + 1);
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.virtualScrolling = new VirtualScrolling();
    
    // Make available globally
    window.getVirtualScrolling = () => window.virtualScrolling;
}

