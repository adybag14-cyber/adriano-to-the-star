/**
 * Enhanced Pagination System
 * 
 * Adds comprehensive pagination with customizable page sizes.
 * 
 * @module PaginationEnhanced
 * @version 1.0.0
 * @author Adriano To The Star
 */

class PaginationEnhanced {
    constructor() {
        this.instances = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize pagination system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('PaginationEnhanced already initialized');
            return;
        }

        this.isInitialized = true;
        console.log('✅ Enhanced Pagination System initialized');
    }

    /**
     * Create pagination instance
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} data - Data array
     * @param {Object} options - Configuration options
     * @returns {Object} Pagination instance
     */
    create(container, data, options = {}) {
        const config = {
            itemsPerPage: options.itemsPerPage || 10,
            pageSizes: options.pageSizes || [10, 25, 50, 100],
            currentPage: 1,
            showPageSizeSelector: options.showPageSizeSelector !== false,
            showPageNumbers: options.showPageNumbers !== true,
            maxPageNumbers: options.maxPageNumbers || 10,
            ...options
        };

        const instance = {
            container,
            data,
            config,
            currentPage: config.currentPage,
            itemsPerPage: config.itemsPerPage,
            totalPages: Math.ceil(data.length / config.itemsPerPage),
            render: null
        };

        this.setupInstance(instance);
        this.instances.set(container, instance);

        return instance;
    }

    /**
     * Set up pagination instance
     * @private
     * @param {Object} instance - Instance object
     */
    setupInstance(instance) {
        const { container, config } = instance;

        // Create pagination UI
        const paginationUI = document.createElement('div');
        paginationUI.className = 'pagination-enhanced';
        paginationUI.innerHTML = this.generatePaginationHTML(instance);

        // Add event listeners
        this.setupEventListeners(paginationUI, instance);

        // Append to container or create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'pagination-wrapper';
        container.parentNode.insertBefore(wrapper, container.nextSibling);
        wrapper.appendChild(paginationUI);

        instance.paginationUI = paginationUI;
    }

    /**
     * Generate pagination HTML
     * @private
     * @param {Object} instance - Instance object
     * @returns {string} HTML string
     */
    generatePaginationHTML(instance) {
        const { config, currentPage, totalPages, itemsPerPage } = instance;
        let html = '<div class="pagination-controls">';

        // Page size selector
        if (config.showPageSizeSelector) {
            html += `
                <div class="page-size-selector">
                    <label>Items per page:</label>
                    <select class="page-size-select">
                        ${config.pageSizes.map(size => 
                            `<option value="${size}" ${size === itemsPerPage ? 'selected' : ''}>${size}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }

        // Page info
        html += `<div class="page-info">Page ${currentPage} of ${totalPages}</div>`;

        // Navigation buttons
        html += '<div class="pagination-buttons">';
        
        // First page
        html += `<button class="page-btn first" ${currentPage === 1 ? 'disabled' : ''}>««</button>`;
        
        // Previous page
        html += `<button class="page-btn prev" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;

        // Page numbers
        if (config.showPageNumbers) {
            const pageNumbers = this.getPageNumbers(currentPage, totalPages, config.maxPageNumbers);
            pageNumbers.forEach(page => {
                html += `<button class="page-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
            });
        }

        // Next page
        html += `<button class="page-btn next" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
        
        // Last page
        html += `<button class="page-btn last" ${currentPage === totalPages ? 'disabled' : ''}>»»</button>`;

        html += '</div></div>';

        return html;
    }

    /**
     * Get page numbers to display
     * @private
     * @param {number} currentPage - Current page
     * @param {number} totalPages - Total pages
     * @param {number} maxNumbers - Maximum page numbers
     * @returns {Array} Page numbers array
     */
    getPageNumbers(currentPage, totalPages, maxNumbers) {
        const numbers = [];
        const half = Math.floor(maxNumbers / 2);
        let start = Math.max(1, currentPage - half);
        const end = Math.min(totalPages, start + maxNumbers - 1);

        if (end - start < maxNumbers - 1) {
            start = Math.max(1, end - maxNumbers + 1);
        }

        for (let i = start; i <= end; i++) {
            numbers.push(i);
        }

        return numbers;
    }

    /**
     * Set up event listeners
     * @private
     * @param {HTMLElement} paginationUI - Pagination UI element
     * @param {Object} instance - Instance object
     */
    setupEventListeners(paginationUI, instance) {
        // Page size change
        const pageSizeSelect = paginationUI.querySelector('.page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                instance.itemsPerPage = parseInt(e.target.value);
                instance.totalPages = Math.ceil(instance.data.length / instance.itemsPerPage);
                instance.currentPage = 1;
                this.updatePagination(instance);
                this.renderPage(instance);
            });
        }

        // Page button clicks
        paginationUI.addEventListener('click', (e) => {
            const btn = e.target.closest('.page-btn');
            if (!btn || btn.disabled) return;

            const action = btn.className.split(' ').find(c => ['first', 'prev', 'next', 'last'].includes(c));
            const page = btn.dataset.page ? parseInt(btn.dataset.page) : null;

            if (action === 'first') {
                instance.currentPage = 1;
            } else if (action === 'prev') {
                instance.currentPage = Math.max(1, instance.currentPage - 1);
            } else if (action === 'next') {
                instance.currentPage = Math.min(instance.totalPages, instance.currentPage + 1);
            } else if (action === 'last') {
                instance.currentPage = instance.totalPages;
            } else if (page) {
                instance.currentPage = page;
            }

            this.updatePagination(instance);
            this.renderPage(instance);
        });
    }

    /**
     * Update pagination UI
     * @private
     * @param {Object} instance - Instance object
     */
    updatePagination(instance) {
        instance.paginationUI.innerHTML = this.generatePaginationHTML(instance);
        this.setupEventListeners(instance.paginationUI, instance);
    }

    /**
     * Render current page
     * @private
     * @param {Object} instance - Instance object
     */
    renderPage(instance) {
        const start = (instance.currentPage - 1) * instance.itemsPerPage;
        const end = start + instance.itemsPerPage;
        const pageData = instance.data.slice(start, end);

        if (instance.render) {
            instance.render(pageData, instance.currentPage, instance.totalPages);
        }

        // Dispatch event
        window.dispatchEvent(new CustomEvent('page-changed', {
            detail: {
                currentPage: instance.currentPage,
                totalPages: instance.totalPages,
                data: pageData
            }
        }));
    }

    /**
     * Set render function
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Function} renderFn - Render function
     */
    setRenderFunction(container, renderFn) {
        const instance = this.instances.get(container);
        if (instance) {
            instance.render = renderFn;
            this.renderPage(instance);
        }
    }

    /**
     * Update data
     * @public
     * @param {HTMLElement} container - Container element
     * @param {Array} newData - New data array
     */
    updateData(container, newData) {
        const instance = this.instances.get(container);
        if (instance) {
            instance.data = newData;
            instance.totalPages = Math.ceil(newData.length / instance.itemsPerPage);
            instance.currentPage = 1;
            this.updatePagination(instance);
            this.renderPage(instance);
        }
    }

    /**
     * Go to page
     * @public
     * @param {HTMLElement} container - Container element
     * @param {number} page - Page number
     */
    goToPage(container, page) {
        const instance = this.instances.get(container);
        if (instance) {
            instance.currentPage = Math.max(1, Math.min(page, instance.totalPages));
            this.updatePagination(instance);
            this.renderPage(instance);
        }
    }
}

// Create global instance
window.PaginationEnhanced = PaginationEnhanced;
window.paginationEnhanced = new PaginationEnhanced();
window.paginationEnhanced.init();

