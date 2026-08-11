/**
 * Bulk Operations System
 * Select multiple items and perform operations (delete, export, etc.)
 */
(function() {
    'use strict';

    class BulkOperationsSystem {
        constructor() {
            this.selectedItems = new Set();
            this.selectAllMode = false;
            this.operations = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.setupEventListeners();
            this.registerDefaultOperations();
            this.trackEvent('bulk_ops_initialized');
        }

        setupUI() {
            if (!document.getElementById('bulk-operations-bar')) {
                const bar = document.createElement('div');
                bar.id = 'bulk-operations-bar';
                bar.className = 'bulk-operations-bar';
                bar.style.display = 'none';
                bar.innerHTML = `
                    <div class="bulk-ops-info">
                        <span class="selected-count" id="selected-count">0</span>
                        <span>items selected</span>
                    </div>
                    <div class="bulk-ops-actions" id="bulk-ops-actions"></div>
                    <button class="bulk-ops-close" id="bulk-ops-close" aria-label="Close bulk operations">×</button>
                `;
                document.body.appendChild(bar);
            }
        }

        setupEventListeners() {
            // Close button
            document.getElementById('bulk-ops-close')?.addEventListener('click', () => {
                this.clearSelection();
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'a') {
                        e.preventDefault();
                        this.toggleSelectAll();
                    }
                }
                if (e.key === 'Escape') {
                    this.clearSelection();
                }
            });
        }

        registerDefaultOperations() {
            this.registerOperation({
                id: 'delete',
                label: 'Delete',
                icon: '🗑️',
                action: (items) => this.deleteItems(items),
                confirm: true,
                confirmMessage: 'Are you sure you want to delete {count} items?'
            });

            this.registerOperation({
                id: 'export',
                label: 'Export',
                icon: '📥',
                action: (items) => this.exportItems(items)
            });

            this.registerOperation({
                id: 'archive',
                label: 'Archive',
                icon: '📦',
                action: (items) => this.archiveItems(items)
            });

            this.registerOperation({
                id: 'tag',
                label: 'Add Tags',
                icon: '🏷️',
                action: (items) => this.tagItems(items)
            });
        }

        registerOperation(operation) {
            this.operations.push(operation);
            this.updateOperationsUI();
        }

        updateOperationsUI() {
            const actionsContainer = document.getElementById('bulk-ops-actions');
            if (!actionsContainer) return;

            actionsContainer.innerHTML = this.operations.map(op => `
                <button class="bulk-op-btn" data-operation="${op.id}" title="${op.label}">
                    ${op.icon ? `<span class="op-icon">${op.icon}</span>` : ''}
                    <span class="op-label">${op.label}</span>
                </button>
            `).join('');

            actionsContainer.querySelectorAll('.bulk-op-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const opId = btn.dataset.operation;
                    const operation = this.operations.find(op => op.id === opId);
                    if (operation) {
                        this.executeOperation(operation);
                    }
                });
            });
        }

        enableSelectionMode(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            // Add select checkboxes to items
            container.querySelectorAll('[data-item-id]').forEach(item => {
                if (!item.querySelector('.bulk-select-checkbox')) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'bulk-select-checkbox';
                    checkbox.dataset.itemId = item.dataset.itemId;
                    checkbox.addEventListener('change', (e) => {
                        this.toggleItemSelection(e.target.dataset.itemId, e.target.checked);
                    });
                    item.insertBefore(checkbox, item.firstChild);
                    item.classList.add('bulk-selectable');
                }
            });

            // Add select all checkbox to header if table
            const table = container.closest('table');
            if (table && !table.querySelector('.bulk-select-all')) {
                const header = table.querySelector('thead tr, tr:first-child');
                if (header) {
                    const selectAll = document.createElement('input');
                    selectAll.type = 'checkbox';
                    selectAll.className = 'bulk-select-all';
                    selectAll.addEventListener('change', (e) => {
                        this.toggleSelectAll(e.target.checked);
                    });
                    const th = document.createElement('th');
                    th.appendChild(selectAll);
                    header.insertBefore(th, header.firstChild);
                }
            }
        }

        toggleItemSelection(itemId, selected) {
            if (selected) {
                this.selectedItems.add(itemId);
            } else {
                this.selectedItems.delete(itemId);
            }
            this.updateUI();
        }

        toggleSelectAll(checked) {
            if (checked === undefined) {
                checked = !this.selectAllMode;
            }

            this.selectAllMode = checked;
            const checkboxes = document.querySelectorAll('.bulk-select-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = checked;
                if (checked) {
                    this.selectedItems.add(cb.dataset.itemId);
                } else {
                    this.selectedItems.delete(cb.dataset.itemId);
                }
            });

            const selectAll = document.querySelector('.bulk-select-all');
            if (selectAll) {
                selectAll.checked = checked;
            }

            this.updateUI();
        }

        clearSelection() {
            this.selectedItems.clear();
            this.selectAllMode = false;
            document.querySelectorAll('.bulk-select-checkbox').forEach(cb => {
                cb.checked = false;
            });
            const selectAll = document.querySelector('.bulk-select-all');
            if (selectAll) {
                selectAll.checked = false;
            }
            this.updateUI();
        }

        updateUI() {
            const bar = document.getElementById('bulk-operations-bar');
            const countEl = document.getElementById('selected-count');

            if (this.selectedItems.size > 0) {
                bar.style.display = 'flex';
                if (countEl) {
                    countEl.textContent = this.selectedItems.size;
                }
            } else {
                bar.style.display = 'none';
            }
        }

        async executeOperation(operation) {
            const items = Array.from(this.selectedItems);
            if (items.length === 0) {
                this.showNotification('No items selected', 'warning');
                return;
            }

            if (operation.confirm) {
                const message = operation.confirmMessage.replace('{count}', items.length);
                if (!confirm(message)) {
                    return;
                }
            }

            try {
                await operation.action(items);
                this.showNotification(`Operation "${operation.label}" completed successfully`, 'success');
                this.clearSelection();
            } catch (error) {
                console.error('Operation failed:', error);
                this.showNotification(`Operation "${operation.label}" failed: ${error.message}`, 'error');
            }
        }

        async deleteItems(itemIds) {
            // Integrate with your data source
            if (window.database?.deleteMultiple) {
                await window.database.deleteMultiple(itemIds);
            } else {
                // Fallback: delete from DOM
                itemIds.forEach(id => {
                    const element = document.querySelector(`[data-item-id="${id}"]`);
                    if (element) {
                        element.remove();
                    }
                });
            }

            // Dispatch event
            window.dispatchEvent(new CustomEvent('bulkDelete', {
                detail: { itemIds }
            }));
        }

        async exportItems(itemIds) {
            const items = this.getItemsData(itemIds);
            const format = await this.promptExportFormat();

            let data, filename, mimeType;

            switch (format) {
                case 'json':
                    data = JSON.stringify(items, null, 2);
                    filename = `export_${Date.now()}.json`;
                    mimeType = 'application/json';
                    break;
                case 'csv':
                    data = this.convertToCSV(items);
                    filename = `export_${Date.now()}.csv`;
                    mimeType = 'text/csv';
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            this.downloadFile(data, filename, mimeType);
        }

        async archiveItems(itemIds) {
            // Integrate with your data source
            if (window.database?.archiveMultiple) {
                await window.database.archiveMultiple(itemIds);
            }

            window.dispatchEvent(new CustomEvent('bulkArchive', {
                detail: { itemIds }
            }));
        }

        async tagItems(itemIds) {
            const tags = prompt('Enter tags (comma-separated):');
            if (!tags) return;

            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
            
            // Integrate with your data source
            if (window.database?.tagMultiple) {
                await window.database.tagMultiple(itemIds, tagArray);
            }

            window.dispatchEvent(new CustomEvent('bulkTag', {
                detail: { itemIds, tags: tagArray }
            }));
        }

        getItemsData(itemIds) {
            // Get actual data for selected items
            return itemIds.map(id => {
                const element = document.querySelector(`[data-item-id="${id}"]`);
                if (element) {
                    return this.extractItemData(element);
                }
                return { id };
            });
        }

        extractItemData(element) {
            // Extract data from element
            const data = { id: element.dataset.itemId };
            
            // Try to get from data attributes
            Object.keys(element.dataset).forEach(key => {
                if (key !== 'itemId') {
                    data[key] = element.dataset[key];
                }
            });

            // Try to get from text content
            const textElements = element.querySelectorAll('[data-field]');
            textElements.forEach(el => {
                data[el.dataset.field] = el.textContent.trim();
            });

            return data;
        }

        async promptExportFormat() {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'export-format-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Select Export Format</h3>
                        <button data-format="json">JSON</button>
                        <button data-format="csv">CSV</button>
                        <button class="cancel">Cancel</button>
                    </div>
                `;
                document.body.appendChild(modal);

                modal.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.dataset.format) {
                            resolve(btn.dataset.format);
                        } else {
                            resolve(null);
                        }
                        modal.remove();
                    });
                });
            });
        }

        convertToCSV(items) {
            if (items.length === 0) return '';

            const headers = Object.keys(items[0]);
            const rows = items.map(item => 
                headers.map(header => {
                    const value = item[header];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value).replace(/"/g, '""');
                }).map(v => `"${v}"`).join(',')
            );

            return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
        }

        downloadFile(data, filename, mimeType) {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('show');
            }, 10);

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`bulk_ops_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.bulkOperations = new BulkOperationsSystem();
        });
    } else {
        window.bulkOperations = new BulkOperationsSystem();
    }
})();


