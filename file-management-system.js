/**
 * File Management with Preview and Editing
 * 
 * Adds comprehensive file management with preview and editing.
 * 
 * @module FileManagementSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class FileManagementSystem {
    constructor() {
        this.files = new Map();
        this.previewers = new Map();
        this.editors = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize file management system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('FileManagementSystem already initialized');
            return;
        }

        this.setupPreviewers();
        this.setupEditors();
        this.loadFiles();
        
        this.isInitialized = true;
        console.log('✅ File Management System initialized');
    }

    /**
     * Set up previewers
     * @private
     */
    setupPreviewers() {
        // Image previewer
        this.previewers.set('image', (file, container) => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '500px';
            container.appendChild(img);
        });

        // Text previewer
        this.previewers.set('text', async (file, container) => {
            const text = await file.text();
            const pre = document.createElement('pre');
            pre.textContent = text;
            pre.style.overflow = 'auto';
            pre.style.maxHeight = '500px';
            container.appendChild(pre);
        });

        // JSON previewer
        this.previewers.set('json', async (file, container) => {
            const text = await file.text();
            try {
                const json = JSON.parse(text);
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(json, null, 2);
                pre.style.overflow = 'auto';
                pre.style.maxHeight = '500px';
                container.appendChild(pre);
            } catch (e) {
                container.textContent = 'Invalid JSON';
            }
        });
    }

    /**
     * Set up editors
     * @private
     */
    setupEditors() {
        // Text editor
        this.editors.set('text', (file, container) => {
            const textarea = document.createElement('textarea');
            textarea.style.width = '100%';
            textarea.style.height = '500px';
            textarea.style.fontFamily = 'monospace';
            
            file.text().then(text => {
                textarea.value = text;
            });

            container.appendChild(textarea);
            return textarea;
        });
    }

    /**
     * Upload file
     * @public
     * @param {File} file - File object
     * @param {Object} metadata - File metadata
     * @returns {Object} File object
     */
    uploadFile(file, metadata = {}) {
        const fileObj = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            file: file,
            uploadedAt: new Date().toISOString(),
            ...metadata
        };

        this.files.set(fileObj.id, fileObj);
        this.saveFiles();

        return fileObj;
    }

    /**
     * Get file
     * @public
     * @param {string} fileId - File ID
     * @returns {Object|null} File object
     */
    getFile(fileId) {
        return this.files.get(fileId) || null;
    }

    /**
     * Get all files
     * @public
     * @param {Object} filter - Filter options
     * @returns {Array} Files array
     */
    getAllFiles(filter = {}) {
        let files = Array.from(this.files.values());

        if (filter.type) {
            files = files.filter(f => f.type.startsWith(filter.type));
        }

        return files;
    }

    /**
     * Preview file
     * @public
     * @param {string} fileId - File ID
     * @param {HTMLElement} container - Container element
     * @returns {Promise} Preview result
     */
    async previewFile(fileId, container) {
        const fileObj = this.getFile(fileId);
        if (!fileObj) {
            return { success: false, error: 'File not found' };
        }

        container.innerHTML = '';

        const fileType = this.getFileType(fileObj.type);
        const previewer = this.previewers.get(fileType);

        if (previewer) {
            previewer(fileObj.file, container);
            return { success: true };
        } else {
            container.textContent = `Preview not available for ${fileType} files`;
            return { success: false, error: 'Preview not available' };
        }
    }

    /**
     * Edit file
     * @public
     * @param {string} fileId - File ID
     * @param {HTMLElement} container - Container element
     * @returns {Promise<HTMLElement>} Editor element
     */
    async editFile(fileId, container) {
        const fileObj = this.getFile(fileId);
        if (!fileObj) {
            return null;
        }

        container.innerHTML = '';

        const fileType = this.getFileType(fileObj.type);
        const editor = this.editors.get(fileType);

        if (editor) {
            return editor(fileObj.file, container);
        } else {
            container.textContent = `Editing not available for ${fileType} files`;
            return null;
        }
    }

    /**
     * Delete file
     * @public
     * @param {string} fileId - File ID
     * @returns {boolean} True if deleted
     */
    deleteFile(fileId) {
        const deleted = this.files.delete(fileId);
        if (deleted) {
            this.saveFiles();
        }
        return deleted;
    }

    /**
     * Download file
     * @public
     * @param {string} fileId - File ID
     */
    downloadFile(fileId) {
        const fileObj = this.getFile(fileId);
        if (!fileObj) {
            return;
        }

        const url = URL.createObjectURL(fileObj.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileObj.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get file type
     * @private
     * @param {string} mimeType - MIME type
     * @returns {string} File type
     */
    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'image';
        }
        if (mimeType === 'application/json') {
            return 'json';
        }
        if (mimeType.startsWith('text/')) {
            return 'text';
        }
        return 'unknown';
    }

    /**
     * Save files
     * @private
     */
    saveFiles() {
        try {
            // Save metadata only (not File objects)
            const files = {};
            this.files.forEach((fileObj, id) => {
                files[id] = {
                    id: fileObj.id,
                    name: fileObj.name,
                    type: fileObj.type,
                    size: fileObj.size,
                    uploadedAt: fileObj.uploadedAt
                };
            });
            localStorage.setItem('files', JSON.stringify(files));
        } catch (e) {
            console.warn('Failed to save files:', e);
        }
    }

    /**
     * Load files
     * @private
     */
    loadFiles() {
        try {
            const saved = localStorage.getItem('files');
            if (saved) {
                const files = JSON.parse(saved);
                // Note: File objects cannot be restored from localStorage
                // They would need to be re-uploaded
            }
        } catch (e) {
            console.warn('Failed to load files:', e);
        }
    }
}

// Create global instance
window.FileManagementSystem = FileManagementSystem;
window.fileManagement = new FileManagementSystem();
window.fileManagement.init();

