/**
 * Interactive Data Tables
 * Advanced data grid with sorting, filtering, pagination
 * @author Agent 3 - Adriano To The Star
 */

class InteractiveDataTable {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = { ...this.defaultOptions, ...options };
        this.filteredData = [...data];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.selectedRows = new Set();
        this.init();
    }

    get defaultOptions() {
        return {
            pageSize: 25,
            sortable: true,
            filterable: true,
            selectable: true,
            searchable: true,
            exportable: true,
            responsive: true,
            theme: 'default'
        };
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const html = `
            <div class="data-table-container">
                <div class="data-table-header">
                    <div class="data-table-controls">
                        <input type="text" class="data-table-search" placeholder="Search...">
                        <select class="data-table-filter">
                            <option value="">All Columns</option>
                        </select>
                    </div>
                    <div class="data-table-actions">
                        <button class="export-btn">Export</button>
                        <button class="refresh-btn">Refresh</button>
                    </div>
                </div>
                <div class="data-table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${this.options.selectable ? '<th><input type="checkbox" class="select-all"></th>' : ''}
                                ${this.generateHeaders()}
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateRows()}
                        </tbody>
                    </table>
                </div>
                <div class="data-table-footer">
                    <div class="data-table-info">
                        Showing ${this.getStartIndex()}-${this.getEndIndex()} of ${this.filteredData.length} items
                    </div>
                    <div class="data-table-pagination">
                        ${this.generatePagination()}
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.addStyles();
    }

    generateHeaders() {
        if (!this.data.length) return '';
        
        return Object.keys(this.data[0]).map(key => `
            <th class="sortable" data-column="${key}">
                ${key}
                <span class="sort-indicator"></span>
            </th>
        `).join('');
    }

    generateRows() {
        const start = this.getStartIndex();
        const end = this.getEndIndex();
        const pageData = this.filteredData.slice(start, end);

        return pageData.map((row, index) => `
            <tr data-index="${start + index}">
                ${this.options.selectable ? `<td><input type="checkbox" class="row-select"></td>` : ''}
                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
            </tr>
        `).join('');
    }

    generatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        let pagination = '<div class="pagination-buttons">';

        // Previous button
        pagination += `<button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">Previous</button>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pagination += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pagination += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        pagination += `<button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">Next</button>`;
        pagination += '</div>';

        return pagination;
    }

    getStartIndex() {
        return (this.currentPage - 1) * this.options.pageSize;
    }

    getEndIndex() {
        return Math.min(this.currentPage * this.options.pageSize, this.filteredData.length);
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = this.container.querySelector('.data-table-search');
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Sorting
        this.container.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => this.handleSort(header.dataset.column));
        });

        // Pagination
        this.container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.render();
                }
            });
        });

        // Selection
        if (this.options.selectable) {
            const selectAll = this.container.querySelector('.select-all');
            selectAll?.addEventListener('change', (e) => this.handleSelectAll(e.target.checked));

            this.container.querySelectorAll('.row-select').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => this.handleRowSelect(e.target));
            });
        }

        // Export
        const exportBtn = this.container.querySelector('.export-btn');
        exportBtn?.addEventListener('click', () => this.exportData());
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredData = [...this.data];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredData = this.data.filter(row => 
                Object.values(row).some(value => 
                    String(value).toLowerCase().includes(lowerQuery)
                )
            );
        }
        this.currentPage = 1;
        this.render();
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            
            if (this.sortDirection === 'asc') {
                return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
            } else {
                return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
            }
        });

        this.render();
    }

    handleSelectAll(checked) {
        this.container.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.checked = checked;
            const row = checkbox.closest('tr');
            const index = parseInt(row.dataset.index);
            
            if (checked) {
                this.selectedRows.add(index);
            } else {
                this.selectedRows.delete(index);
            }
        });
    }

    handleRowSelect(checkbox) {
        const row = checkbox.closest('tr');
        const index = parseInt(row.dataset.index);
        
        if (checkbox.checked) {
            this.selectedRows.add(index);
        } else {
            this.selectedRows.delete(index);
        }
    }

    exportData() {
        const selectedData = Array.from(this.selectedRows).map(index => this.filteredData[index]);
        const dataToExport = selectedData.length > 0 ? selectedData : this.filteredData;
        
        const csv = this.convertToCSV(dataToExport);
        this.downloadCSV(csv, 'data-export.csv');
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? 
                    `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    addStyles() {
        if (document.querySelector('#data-table-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'data-table-styles';
        style.textContent = `
            .data-table-container {
                background: var(--color-surface);
                border-radius: 12px;
                padding: 20px;
                box-shadow: var(--effect-shadow);
            }

            .data-table-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                gap: 20px;
            }

            .data-table-controls {
                display: flex;
                gap: 10px;
                flex: 1;
            }

            .data-table-search {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--color-background);
                border-radius: 6px;
                background: var(--color-background);
                color: var(--color-text);
            }

            .data-table-filter {
                padding: 8px 12px;
                border: 1px solid var(--color-background);
                border-radius: 6px;
                background: var(--color-background);
                color: var(--color-text);
            }

            .data-table-actions {
                display: flex;
                gap: 10px;
            }

            .data-table-actions button {
                padding: 8px 16px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .data-table-actions button:hover {
                background: var(--color-accent);
            }

            .data-table-wrapper {
                overflow-x: auto;
                margin-bottom: 20px;
            }

            .data-table {
                width: 100%;
                border-collapse: collapse;
            }

            .data-table th,
            .data-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid var(--color-background);
            }

            .data-table th {
                background: var(--color-background);
                font-weight: 600;
                color: var(--color-text);
                position: sticky;
                top: 0;
                z-index: 10;
            }

            .data-table th.sortable {
                cursor: pointer;
                user-select: none;
            }

            .data-table th.sortable:hover {
                background: var(--color-primary);
                color: white;
            }

            .sort-indicator {
                margin-left: 8px;
                opacity: 0.5;
            }

            .data-table tbody tr:hover {
                background: var(--color-background);
            }

            .data-table-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 20px;
            }

            .data-table-info {
                color: var(--color-text-secondary);
            }

            .pagination-buttons {
                display: flex;
                gap: 5px;
            }

            .pagination-btn {
                padding: 6px 12px;
                background: var(--color-background);
                color: var(--color-text);
                border: 1px solid var(--color-background);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .pagination-btn:hover:not(:disabled) {
                background: var(--color-primary);
                color: white;
            }

            .pagination-btn.active {
                background: var(--color-primary);
                color: white;
            }

            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .pagination-ellipsis {
                padding: 6px 12px;
                color: var(--color-text-secondary);
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize
window.InteractiveDataTable = InteractiveDataTable;
