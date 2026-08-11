/**
 * File Upload Service
 * @class FileUploadService
 * @description Handles file uploads with progress tracking and validation.
 */
class FileUploadService {
    constructor() {
        this.uploads = new Map();
        this.config = {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedTypes: ['image/*', 'application/pdf', 'text/*']
        };
        this.init();
    }

    init() {
        this.trackEvent('f_il_eu_pl_oa_ds_er_vi_ce_initialized');
    }

    /**
     * Upload file.
     * @param {string} uploadId - Upload identifier.
     * @param {File} file - File object.
     * @param {object} options - Upload options.
     * @returns {Promise<object>} Upload result.
     */
    async uploadFile(uploadId, file, options = {}) {
        // Validate file
        this.validateFile(file);

        const upload = {
            id: uploadId,
            filename: file.name,
            size: file.size,
            type: file.type,
            status: 'uploading',
            progress: 0,
            startedAt: new Date()
        };

        this.uploads.set(uploadId, upload);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            
            // Track progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    upload.progress = (e.loaded / e.total) * 100;
                }
            });

            await new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        upload.status = 'completed';
                        upload.url = JSON.parse(xhr.responseText).url;
                        upload.completedAt = new Date();
                        this.trackEvent('file_uploaded', { uploadId, filename: upload.filename, size: upload.size });
                        resolve();
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Upload failed'));
                xhr.open('POST', options.endpoint || '/api/upload');

                try {
                    const apiToken =
                        options.apiToken ||
                        window.STELLAR_AI_API_TOKEN ||
                        window.API_TOKEN ||
                        localStorage.getItem('stellarAiApiToken') ||
                        localStorage.getItem('puterAuthToken') ||
                        null;

                    if (apiToken) {
                        xhr.setRequestHeader('Authorization', `Bearer ${String(apiToken).trim()}`);
                    }
                } catch (_e) { }

                xhr.send(formData);
            });

            console.log(`File uploaded: ${uploadId}`);
            return upload;
        } catch (error) {
            upload.status = 'failed';
            upload.error = error.message;
            this.trackEvent('upload_failed', { uploadId, error: error.message });
            throw error;
        }
    }

    /**
     * Validate file.
     * @param {File} file - File object.
     */
    validateFile(file) {
        if (file.size > this.config.maxFileSize) {
            throw new Error(`File size exceeds maximum: ${this.config.maxFileSize} bytes`);
        }

        const allowed = this.config.allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -2));
            }
            return file.type === type;
        });

        if (!allowed) {
            throw new Error(`File type not allowed: ${file.type}`);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`fileUpload:${eventName}`, 1, {
                    source: 'file-upload-service',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record upload event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Upload Event', { event: eventName, ...data });
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.fileUploadService = new FileUploadService();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadService;
}

