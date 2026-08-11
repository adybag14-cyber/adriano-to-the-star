/**
 * Download Manager
 * 
 * Track and manage file downloads with progress tracking,
 * download history, and download queue.
 * 
 * @class DownloadManager
 * @example
 * // Auto-initializes on page load
 * // Access via: window.downloadManager()
 * 
 * // Track download
 * const manager = window.downloadManager();
 * manager.trackDownload('file.pdf', 'https://example.com/file.pdf');
 */
class DownloadManager {
    constructor() {
        this.downloads = [];
        this.downloadQueue = [];
        this.maxHistory = 100;
        this.init();
    }

    init() {
        // Load download history
        this.loadHistory();
        
        // Create download manager button
        this.createDownloadButton();
        
        // Intercept download links
        this.interceptDownloads();
        
        console.log('✅ Download Manager initialized');
    }

    /**
     * Create download manager button
     * 
     * @method createDownloadButton
     * @returns {void}
     */
    createDownloadButton() {
        // Check if button already exists
        if (document.getElementById('download-manager-btn')) return;

        const button = document.createElement('button');
        button.id = 'download-manager-btn';
        button.className = 'download-manager-btn';
        button.setAttribute('aria-label', 'Download Manager');
        button.innerHTML = '📥';
        button.title = 'Download Manager';
        
        // Add badge for active downloads
        const badge = document.createElement('span');
        badge.className = 'download-badge';
        badge.id = 'download-badge';
        badge.style.display = 'none';
        button.appendChild(badge);

        button.addEventListener('click', () => this.showDownloadPanel());
        
        document.body.appendChild(button);
        
        // Update badge
        this.updateBadge();
    }

    /**
     * Intercept download links
     * 
     * @method interceptDownloads
     * @returns {void}
     */
    interceptDownloads() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[download], a[href*=".pdf"], a[href*=".zip"], a[href*=".jpg"], a[href*=".png"]');
            if (link && link.href) {
                // Track download
                this.trackDownload(link.download || link.href.split('/').pop(), link.href);
            }
        });
    }

    /**
     * Track download
     * 
     * @method trackDownload
     * @param {string} filename - File name
     * @param {string} url - Download URL
     * @returns {string} Download ID
     */
    trackDownload(filename, url) {
        const download = {
            id: `download-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            filename,
            url,
            status: 'pending',
            progress: 0,
            size: 0,
            startedAt: new Date().toISOString(),
            completedAt: null,
            error: null
        };

        this.downloads.push(download);
        this.downloadQueue.push(download.id);
        
        // Limit history size
        if (this.downloads.length > this.maxHistory) {
            this.downloads = this.downloads.slice(-this.maxHistory);
        }

        this.saveHistory();
        this.updateBadge();
        this.renderDownload(download);

        // Simulate download progress (in real app, track actual download)
        this.simulateProgress(download);
        this.trackEvent('download_started', { filename, downloadId: download.id });

        return download.id;
    }

    /**
     * Simulate download progress
     * 
     * @method simulateProgress
     * @param {Object} download - Download object
     * @returns {void}
     */
    simulateProgress(download) {
        download.status = 'downloading';
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                download.status = 'completed';
                download.completedAt = new Date().toISOString();
                clearInterval(interval);
                this.trackEvent('download_completed', { filename: download.filename, downloadId: download.id });
            }
            download.progress = Math.round(progress);
            this.updateDownload(download);
        }, 200);
    }

    /**
     * Show download panel
     * 
     * @method showDownloadPanel
     * @returns {void}
     */
    showDownloadPanel() {
        // Check if panel already exists
        let panel = document.getElementById('download-manager-panel');
        if (panel) {
            panel.classList.add('open');
            this.renderDownloads();
            return;
        }

        // Create panel
        panel = document.createElement('div');
        panel.id = 'download-manager-panel';
        panel.className = 'download-manager-panel';
        panel.innerHTML = `
            <div class="download-manager-header">
                <h3>📥 Downloads</h3>
                <button class="download-manager-close" aria-label="Close">×</button>
            </div>
            <div class="download-manager-content">
                <div class="download-list" id="download-list"></div>
            </div>
        `;

        document.body.appendChild(panel);

        // Setup event listeners
        const closeBtn = panel.querySelector('.download-manager-close');
        closeBtn.addEventListener('click', () => this.hideDownloadPanel());

        // Render downloads
        this.renderDownloads();

        // Show panel
        setTimeout(() => panel.classList.add('open'), 10);
    }

    /**
     * Hide download panel
     * 
     * @method hideDownloadPanel
     * @returns {void}
     */
    hideDownloadPanel() {
        const panel = document.getElementById('download-manager-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    }

    /**
     * Render downloads
     * 
     * @method renderDownloads
     * @returns {void}
     */
    renderDownloads() {
        const listContainer = document.getElementById('download-list');
        if (!listContainer) return;

        if (this.downloads.length === 0) {
            listContainer.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">No downloads yet</p>';
            return;
        }

        listContainer.innerHTML = this.downloads
            .slice()
            .reverse()
            .map(download => this.renderDownloadItem(download))
            .join('');

        // Add event listeners
        listContainer.querySelectorAll('.download-item').forEach(item => {
            const downloadId = item.dataset.downloadId;
            const download = this.downloads.find(d => d.id === downloadId);
            
            if (download) {
                const retryBtn = item.querySelector('.download-retry');
                const cancelBtn = item.querySelector('.download-cancel');
                
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        this.retryDownload(download.id);
                    });
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        this.cancelDownload(download.id);
                    });
                }
            }
        });
    }

    /**
     * Render download item
     * 
     * @method renderDownloadItem
     * @param {Object} download - Download object
     * @returns {string} HTML string
     */
    renderDownloadItem(download) {
        const statusIcon = {
            pending: '⏳',
            downloading: '⬇️',
            completed: '✅',
            failed: '❌',
            cancelled: '🚫'
        }[download.status] || '📥';

        return `
            <div class="download-item ${download.status}" data-download-id="${download.id}">
                <div class="download-item-icon">${statusIcon}</div>
                <div class="download-item-content">
                    <div class="download-item-filename">${download.filename}</div>
                    <div class="download-item-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${download.progress}%"></div>
                        </div>
                        <span class="progress-text">${download.progress}%</span>
                    </div>
                    <div class="download-item-status">${download.status}</div>
                </div>
                <div class="download-item-actions">
                    ${download.status === 'failed' ? '<button class="download-retry">🔄</button>' : ''}
                    ${download.status === 'downloading' ? '<button class="download-cancel">✖️</button>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render single download
     * 
     * @method renderDownload
     * @param {Object} download - Download object
     * @returns {void}
     */
    renderDownload(download) {
        const listContainer = document.getElementById('download-list');
        if (!listContainer) return;

        // Add to top of list
        const item = document.createElement('div');
        item.className = `download-item ${download.status}`;
        item.dataset.downloadId = download.id;
        item.innerHTML = this.renderDownloadItem(download);
        
        listContainer.insertBefore(item, listContainer.firstChild);
    }

    /**
     * Update download
     * 
     * @method updateDownload
     * @param {Object} download - Download object
     * @returns {void}
     */
    updateDownload(download) {
        const item = document.querySelector(`[data-download-id="${download.id}"]`);
        if (item) {
            item.outerHTML = this.renderDownloadItem(download);
        }
        this.updateBadge();
    }

    /**
     * Retry download
     * 
     * @method retryDownload
     * @param {string} id - Download ID
     * @returns {void}
     */
    retryDownload(id) {
        const download = this.downloads.find(d => d.id === id);
        if (download) {
            download.status = 'pending';
            download.progress = 0;
            download.error = null;
            this.simulateProgress(download);
        }
    }

    /**
     * Cancel download
     * 
     * @method cancelDownload
     * @param {string} id - Download ID
     * @returns {void}
     */
    cancelDownload(id) {
        const download = this.downloads.find(d => d.id === id);
        if (download) {
            download.status = 'cancelled';
            this.updateDownload(download);
            this.trackEvent('download_cancelled', { downloadId: id });
        }
    }

    /**
     * Update badge
     * 
     * @method updateBadge
     * @returns {void}
     */
    updateBadge() {
        const badge = document.getElementById('download-badge');
        if (!badge) return;

        const activeDownloads = this.downloads.filter(d => 
            d.status === 'downloading' || d.status === 'pending'
        ).length;

        if (activeDownloads > 0) {
            badge.textContent = activeDownloads > 99 ? '99+' : activeDownloads;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * Get downloads
     * 
     * @method getDownloads
     * @param {Object} [filters] - Filter options
     * @returns {Array} Array of downloads
     */
    getDownloads(filters = {}) {
        let result = [...this.downloads];

        if (filters.status) {
            result = result.filter(d => d.status === filters.status);
        }

        return result;
    }

    /**
     * Clear history
     * 
     * @method clearHistory
     * @returns {void}
     */
    clearHistory() {
        this.downloads = this.downloads.filter(d => 
            d.status === 'downloading' || d.status === 'pending'
        );
        this.saveHistory();
        this.renderDownloads();
        this.updateBadge();
    }

    /**
     * Load history from localStorage
     * 
     * @method loadHistory
     * @returns {void}
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem('download-history');
            if (stored) {
                this.downloads = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load download history:', error);
        }
    }

    /**
     * Save history to localStorage
     * 
     * @method saveHistory
     * @returns {void}
     */
    saveHistory() {
        try {
            localStorage.setItem('download-history', JSON.stringify(this.downloads));
        } catch (error) {
            console.warn('Failed to save download history:', error);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`download:${eventName}`, 1, {
                    source: 'download-manager',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record download event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Download Event', { event: eventName, ...data });
        }
    }
}

// Initialize globally
let downloadManagerInstance = null;

function initDownloadManager() {
    if (!downloadManagerInstance) {
        downloadManagerInstance = new DownloadManager();
    }
    return downloadManagerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDownloadManager);
} else {
    initDownloadManager();
}

// Export globally
window.DownloadManager = DownloadManager;
window.downloadManager = () => downloadManagerInstance;

