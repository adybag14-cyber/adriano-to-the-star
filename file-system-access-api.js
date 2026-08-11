/**
 * File System Access API
 * Provides access to the file system for reading and writing files
 */

class FileSystemAccessAPI {
    constructor() {
        this.supported = false;
        this.initialized = false;
    }

    /**
     * Initialize File System Access API
     */
    async initialize() {
        this.supported = this.isSupported();
        if (!this.supported) {
            throw new Error('File System Access API is not supported in this browser');
        }
        this.initialized = true;
        return { success: true, message: 'File System Access API initialized' };
    }

    /**
     * Check if File System Access API is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
    }

    /**
     * Open file picker
     * @param {Object} options - File picker options
     * @returns {Promise<FileSystemFileHandle[]>}
     */
    async openFilePicker(options = {}) {
        if (!this.supported) {
            throw new Error('File System Access API is not supported');
        }

        const pickerOptions = {
            types: options.types || [{
                description: 'All Files',
                accept: { '*/*': [] }
            }],
            excludeAcceptAllOption: options.excludeAcceptAllOption || false,
            multiple: options.multiple || false
        };

        try {
            const handles = await window.showOpenFilePicker(pickerOptions);
            return Array.isArray(handles) ? handles : [handles];
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('File picker cancelled by user');
            }
            throw new Error(`Failed to open file picker: ${error.message}`);
        }
    }

    /**
     * Save file picker
     * @param {Object} options - Save file picker options
     * @returns {Promise<FileSystemFileHandle>}
     */
    async saveFilePicker(options = {}) {
        if (!this.supported) {
            throw new Error('File System Access API is not supported');
        }

        const pickerOptions = {
            suggestedName: options.suggestedName || 'untitled',
            types: options.types || [{
                description: 'All Files',
                accept: { '*/*': [] }
            }],
            excludeAcceptAllOption: options.excludeAcceptAllOption || false
        };

        try {
            return await window.showSaveFilePicker(pickerOptions);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Save file picker cancelled by user');
            }
            throw new Error(`Failed to open save file picker: ${error.message}`);
        }
    }

    /**
     * Read file
     * @param {FileSystemFileHandle} fileHandle - File handle
     * @returns {Promise<File>}
     */
    async readFile(fileHandle) {
        try {
            return await fileHandle.getFile();
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    /**
     * Write file
     * @param {FileSystemFileHandle} fileHandle - File handle
     * @param {Blob|string} data - Data to write
     * @param {Object} options - Write options
     * @returns {Promise<void>}
     */
    async writeFile(fileHandle, data, options = {}) {
        try {
            const writable = await fileHandle.createWritable({
                keepExistingData: options.keepExistingData || false
            });
            
            if (typeof data === 'string') {
                await writable.write(data);
            } else {
                await writable.write(data);
            }
            
            await writable.close();
        } catch (error) {
            throw new Error(`Failed to write file: ${error.message}`);
        }
    }

    /**
     * Read file as text
     * @param {FileSystemFileHandle} fileHandle - File handle
     * @returns {Promise<string>}
     */
    async readFileAsText(fileHandle) {
        const file = await this.readFile(fileHandle);
        return await file.text();
    }

    /**
     * Read file as array buffer
     * @param {FileSystemFileHandle} fileHandle - File handle
     * @returns {Promise<ArrayBuffer>}
     */
    async readFileAsArrayBuffer(fileHandle) {
        const file = await this.readFile(fileHandle);
        return await file.arrayBuffer();
    }

    /**
     * Verify permission
     * @param {FileSystemFileHandle} fileHandle - File handle
     * @param {string} mode - Permission mode ('read' or 'readwrite')
     * @returns {Promise<string>}
     */
    async verifyPermission(fileHandle, mode = 'readwrite') {
        const options = {};
        if (mode === 'readwrite') {
            options.mode = 'readwrite';
        }

        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return 'granted';
        }

        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return 'granted';
        }

        return 'denied';
    }

    /**
     * Open directory picker
     * @param {Object} options - Directory picker options
     * @returns {Promise<FileSystemDirectoryHandle>}
     */
    async openDirectoryPicker(options = {}) {
        if (!this.supported) {
            throw new Error('File System Access API is not supported');
        }

        try {
            return await window.showDirectoryPicker(options);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Directory picker cancelled by user');
            }
            throw new Error(`Failed to open directory picker: ${error.message}`);
        }
    }

    /**
     * Get directory entries
     * @param {FileSystemDirectoryHandle} directoryHandle - Directory handle
     * @returns {AsyncIterable<[string, FileSystemHandle]>}
     */
    async* getDirectoryEntries(directoryHandle) {
        for await (const [name, handle] of directoryHandle.entries()) {
            yield [name, handle];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileSystemAccessAPI;
}

