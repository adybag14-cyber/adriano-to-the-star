/**
 * File Storage Manager
 * Provides 1GB free storage per user using Supabase Storage
 */

class FileStorageManager {
    constructor() {
        this.storageLimit = 1 * 1024 * 1024 * 1024; // 1GB in bytes
        this.maxFileSize = 100 * 1024 * 1024; // 100MB per file

        this.files = [];
        this.currentStorageUsed = 0;
        this.supabase = null;
        this.userId = null;
        this.bucketName = 'user-files';
        
        this.init();
    }
    
    async init() {
        await this.trackEvent('f_il_es_to_ra_ge_ma_na_ge_r_initialized');
        
        // Wait for auth manager to be ready (similar to dashboard.html)
        let attempts = 0;
        while (typeof authManager === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof authManager === 'undefined') {
            console.error('❌ Auth manager not available');
            this.showLoginRequired();
            return;
        }
        
        // Wait a bit more for auth manager to fully initialize
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check authentication - use both getCurrentUser and isAuthenticated
        const user = authManager.getCurrentUser();
        const isAuthenticated = authManager.isAuthenticated && authManager.isAuthenticated();
        
        console.log('🔍 Auth check:', { user: !!user, isAuthenticated, userId: user?.id });
        
        if (!user || !isAuthenticated) {
            console.log('⚠️ User not authenticated, showing login required');
            this.showLoginRequired();
            return;
        }
        
        this.userId = user.id;
        console.log('✅ User authenticated:', this.userId);
        
        // Initialize Supabase
        if (authManager.useSupabase && authManager.supabase) {
            this.supabase = authManager.supabase;
            console.log('✅ Supabase available');
            await this.setupStorage();
            this.showStorageDashboard();
            await this.loadFiles();
        } else {
            console.warn('⚠️ Supabase not available');
            this.showError('Supabase is not configured. Please check your configuration.');
        }
    }

    async trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_il_es_to_ra_ge_ma_na_ge_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    async setupStorage() {
        try {
            // Check if bucket exists, create if not
            const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
            
            if (listError) {
                console.error('Error listing buckets:', listError);
                return;
            }
            
            const bucketExists = buckets.some(b => b.name === this.bucketName);
            
            if (!bucketExists) {
                // Note: Bucket creation requires admin privileges
                // In production, create bucket via Supabase dashboard or admin API
                console.log('⚠️ Bucket does not exist. Please create it in Supabase dashboard.');
            }
        } catch (error) {
            console.error('Error setting up storage:', error);
        }
    }
    
    showLoginRequired() {
        const loginView = document.getElementById('login-required-view');
        const dashboard = document.getElementById('storage-dashboard');
        
        if (loginView) loginView.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
        
        // Login button is handled by onclick in HTML (showModal)
    }
    
    showStorageDashboard() {
        const loginView = document.getElementById('login-required-view');
        const dashboard = document.getElementById('storage-dashboard');
        
        if (loginView) loginView.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        this.setupUploadArea();
        this.setupFileList();
    }
    
    setupUploadArea() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.getElementById('browse-btn');
        
        if (!uploadArea || !fileInput || !browseBtn) return;
        
        // Click to browse
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
            fileInput.value = ''; // Reset input
        });
    }
    
    async handleFiles(files) {
        if (!files || files.length === 0) return;
        
        // Validate files
        const validFiles = [];
        for (const file of files) {
            if (file.size > this.maxFileSize) {
                alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
                continue;
            }
            
            if (this.currentStorageUsed + file.size > this.storageLimit) {
                alert(`Not enough storage space. You have ${this.formatBytes(this.storageLimit - this.currentStorageUsed)} remaining.`);
                continue;
            }
            
            validFiles.push(file);
        }
        
        if (validFiles.length === 0) return;
        
        // Show upload progress
        this.showUploadProgress(validFiles);
        
        // Upload files
        for (const file of validFiles) {
            await this.uploadFile(file);
        }
        
        // Reload file list
        await this.loadFiles();
    }
    
    async uploadFile(file) {
        const filePath = `${this.userId}/${Date.now()}_${file.name}`;
        const progressId = `progress-${file.name}`;
        
        try {
            // Update progress
            this.updateUploadProgress(progressId, 0, 'Uploading...');
            
            // Upload to Supabase Storage
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                throw error;
            }
            
            // Update progress
            this.updateUploadProgress(progressId, 100, 'Uploaded!');
            
            // Get file metadata
            const { data: _fileData } = await this.supabase.storage
                .from(this.bucketName)
                .list(this.userId, {
                    search: file.name
                });
            
            console.log('✅ File uploaded:', file.name);
            
            // Update storage used
            this.currentStorageUsed += file.size;
            this.updateStorageStats();
            
            return data;
        } catch (error) {
            console.error('Error uploading file:', error);
            this.updateUploadProgress(progressId, 0, `Error: ${error.message}`);
            alert(`Failed to upload "${file.name}": ${error.message}`);
        }
    }
    
    showUploadProgress(files) {
        const progressContainer = document.getElementById('upload-progress');
        if (!progressContainer) return;
        
        progressContainer.style.display = 'block';
        progressContainer.innerHTML = '';
        
        files.forEach(file => {
            const progressItem = document.createElement('div');
            progressItem.className = 'progress-item';
            progressItem.id = `progress-${file.name}`;
            progressItem.innerHTML = `
                <div class="progress-file-info">
                    <span class="progress-file-name">${this.escapeHtml(file.name)}</span>
                    <span class="progress-file-size">${this.formatBytes(file.size)}</span>
                </div>
                <div class="progress-bar-small">
                    <div class="progress-fill-small" style="width: 0%"></div>
                </div>
                <div class="progress-status">Waiting...</div>
            `;
            progressContainer.appendChild(progressItem);
        });
    }
    
    updateUploadProgress(progressId, percent, status) {
        const progressItem = document.getElementById(progressId);
        if (!progressItem) return;
        
        const fill = progressItem.querySelector('.progress-fill-small');
        const statusEl = progressItem.querySelector('.progress-status');
        
        if (fill) fill.style.width = `${percent}%`;
        if (statusEl) statusEl.textContent = status;
        
        if (percent === 100) {
            setTimeout(() => {
                progressItem.style.opacity = '0';
                setTimeout(() => {
                    if (progressItem.parentNode) {
                        progressItem.parentNode.removeChild(progressItem);
                    }
                }, 300);
            }, 2000);
        }
    }
    
    async loadFiles() {
        const filesList = document.getElementById('files-list');
        if (!filesList) return;
        
        filesList.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading files...</p></div>';
        
        try {
            // List files for this user
            const { data: files, error } = await this.supabase.storage
                .from(this.bucketName)
                .list(this.userId, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });
            
            if (error) {
                throw error;
            }
            
            this.files = files || [];
            await this.calculateStorageUsed();
            this.renderFiles();
            this.updateStorageStats();
        } catch (error) {
            console.error('Error loading files:', error);
            filesList.innerHTML = `
                <div class="error-state">
                    <p>❌ Error loading files: ${error.message}</p>
                    <button onclick="location.reload()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }
    
    async calculateStorageUsed() {
        let totalSize = 0;
        
        for (const file of this.files) {
            // Get file metadata to get actual size
            const { data } = await this.supabase.storage
                .from(this.bucketName)
                .list(this.userId, {
                    search: file.name
                });
            
            if (data && data[0] && data[0].metadata) {
                totalSize += data[0].metadata.size || 0;
            } else {
                // Fallback: estimate from file name or use metadata
                totalSize += file.metadata?.size || 0;
            }
        }
        
        this.currentStorageUsed = totalSize;
    }
    
    renderFiles() {
        const filesList = document.getElementById('files-list');
        if (!filesList) return;
        
        if (this.files.length === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>No files yet</h3>
                    <p>Upload your first file to get started!</p>
                </div>
            `;
            return;
        }
        
        // Apply search filter
        const searchTerm = document.getElementById('search-files')?.value.toLowerCase() || '';
        let filteredFiles = this.files.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
        
        // Apply sort
        const sortValue = document.getElementById('sort-files')?.value || 'date-desc';
        filteredFiles = this.sortFiles(filteredFiles, sortValue);
        
        filesList.innerHTML = filteredFiles.map(file => this.createFileCard(file)).join('');
        
        // Add event listeners
        this.attachFileListeners();
    }
    
    sortFiles(files, sortBy) {
        const sorted = [...files];
        
        switch (sortBy) {
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'size-desc':
                return sorted.sort((a, b) => (b.metadata?.size || 0) - (a.metadata?.size || 0));
            case 'size-asc':
                return sorted.sort((a, b) => (a.metadata?.size || 0) - (b.metadata?.size || 0));
            default:
                return sorted;
        }
    }
    
    createFileCard(file) {
        const fileSize = file.metadata?.size || 0;
        const fileName = this.escapeHtml(file.name);
        const fileDate = new Date(file.created_at).toLocaleDateString();
        const filePath = `${this.userId}/${file.name}`;
        
        return `
            <div class="file-card" data-file-name="${this.escapeHtml(file.name)}">
                <div class="file-icon">${this.getFileIcon(file.name)}</div>
                <div class="file-info">
                    <div class="file-name" title="${fileName}">${fileName}</div>
                    <div class="file-meta">
                        <span class="file-size">${this.formatBytes(fileSize)}</span>
                        <span class="file-date">${fileDate}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn download-btn" data-path="${this.escapeHtml(filePath)}" title="Download">
                        ⬇️
                    </button>
                    <button class="action-btn delete-btn" data-path="${this.escapeHtml(filePath)}" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }
    
    getFileIcon(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const icons = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'xls': '📊', 'xlsx': '📊',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
            'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
            'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵',
            'zip': '📦', 'rar': '📦', '7z': '📦',
            'txt': '📃', 'md': '📃',
            'html': '🌐', 'css': '🎨', 'js': '⚙️'
        };
        return icons[ext] || '📁';
    }
    
    attachFileListeners() {
        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const filePath = e.target.getAttribute('data-path');
                await this.downloadFile(filePath);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const filePath = e.target.getAttribute('data-path');
                await this.deleteFile(filePath);
            });
        });
    }
    
    async downloadFile(filePath) {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .download(filePath);
            
            if (error) {
                throw error;
            }
            
            // Create download link
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ File downloaded:', filePath);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert(`Failed to download file: ${error.message}`);
        }
    }
    
    async deleteFile(filePath) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }
        
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([filePath]);
            
            if (error) {
                throw error;
            }
            
            console.log('✅ File deleted:', filePath);
            
            // Reload files
            await this.loadFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert(`Failed to delete file: ${error.message}`);
        }
    }
    
    setupFileList() {
        const searchInput = document.getElementById('search-files');
        const sortSelect = document.getElementById('sort-files');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.renderFiles();
                }, 300);
            });
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.renderFiles();
            });
        }
    }
    
    updateStorageStats() {
        const storageUsed = document.getElementById('storage-used');
        const storageLimit = document.getElementById('storage-limit');
        const fileCount = document.getElementById('file-count');
        const storagePercentage = document.getElementById('storage-percentage');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        // const usedMB = this.currentStorageUsed / (1024 * 1024); // Unused
        const limitGB = this.storageLimit / (1024 * 1024 * 1024);
        const percentage = (this.currentStorageUsed / this.storageLimit) * 100;
        
        if (storageUsed) {
            storageUsed.textContent = this.formatBytes(this.currentStorageUsed);
        }
        if (storageLimit) {
            storageLimit.textContent = `${limitGB} GB`;
        }
        if (fileCount) {
            fileCount.textContent = this.files.length;
        }
        if (storagePercentage) {
            storagePercentage.textContent = `${percentage.toFixed(1)}%`;
        }
        if (progressFill) {
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
            if (percentage > 80) {
                progressFill.style.background = '#ff6b6b';
            } else if (percentage > 60) {
                progressFill.style.background = '#ffa500';
            }
        }
        if (progressText) {
            progressText.textContent = `${this.formatBytes(this.currentStorageUsed)} / ${limitGB} GB`;
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        const dashboard = document.getElementById('storage-dashboard');
        if (dashboard) {
            dashboard.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h2>Error</h2>
                    <p>${this.escapeHtml(message)}</p>
                    <button onclick="location.reload()" class="retry-button">Retry</button>
                </div>
            `;
        }
    }
}

// FileStorageManager will be initialized by the inline script in file-storage.html
// This ensures proper initialization order: DOM -> Auth -> FileStorage

