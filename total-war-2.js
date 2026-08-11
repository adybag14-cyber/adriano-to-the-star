/* global MEDIA_PATHS */

/**
 * Total War 2 Game Page Manager
 * Handles game file listing and download functionality
 */

class TotalWar2Manager {
    constructor() {
        this.gameFiles = [];
        // Use external media URL if configured, otherwise use local
        this.gameBasePath = (typeof MEDIA_PATHS !== 'undefined' && MEDIA_PATHS.totalWar) 
            ? MEDIA_PATHS.totalWar 
            : 'total-war-2';
        this.init();
    }

    async init() {
        this.trackEvent('t_ot_al_wa_r2m_an_ag_er_initialized');
        
        // Load game files list
        await this.loadGameFiles();
        
        // Setup download functionality
        this.setupDownloadButtons();
        
        console.log(`✅ Total War 2 Manager initialized with ${this.gameFiles.length}

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ot_al_wa_r2m_an_ag_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
 files`);
    }

    async loadGameFiles() {
        try {
            // Try to load a manifest file (try external first, then local)
            const manifestPaths = [
                `${this.gameBasePath}/game-manifest.json`,
                `${this.gameBasePath}/HOW TO RUN GAME!!.txt`,
                'total-war-2/game-manifest.json',
                'total-war-2/HOW TO RUN GAME!!.txt'
            ];
            
            let response = null;
            for (const manifestPath of manifestPaths) {
                try {
                    response = await fetch(manifestPath);
                    if (response.ok) break;
                } catch (e) {
                    continue;
                }
            }
            
            if (response && response.ok) {
                const manifest = await response.json();
                this.gameFiles = manifest.files || [];
                console.log(`✅ Loaded ${this.gameFiles.length} files from manifest`);
            } else {
                // Generate file list from common game structure
                this.gameFiles = this.generateFileList();
                console.log(`✅ Generated file list with ${this.gameFiles.length} files`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load manifest, using generated list:', error);
            this.gameFiles = this.generateFileList();
        }
        
        this.renderDownloadOptions();
    }

    generateFileList() {
        // Generate list of important game files based on the game structure
        return [
            // Main game executable
            { path: 'Medieval II - Total War/medieval2.exe', name: 'medieval2.exe', category: 'executable', size: '~50 MB' },
            
            // DLL files
            { path: 'Medieval II - Total War/binkw32.dll', name: 'binkw32.dll', category: 'library' },
            { path: 'Medieval II - Total War/cine.dll', name: 'cine.dll', category: 'library' },
            { path: 'Medieval II - Total War/granny2.dll', name: 'granny2.dll', category: 'library' },
            { path: 'Medieval II - Total War/IDV.dll', name: 'IDV.dll', category: 'library' },
            { path: 'Medieval II - Total War/mss32.dll', name: 'mss32.dll', category: 'library' },
            { path: 'Medieval II - Total War/mfc71.dll', name: 'mfc71.dll', category: 'library' },
            { path: 'Medieval II - Total War/msvcp71.dll', name: 'msvcp71.dll', category: 'library' },
            { path: 'Medieval II - Total War/msvcr71.dll', name: 'msvcr71.dll', category: 'library' },
            
            // Configuration files
            { path: 'Medieval II - Total War/medieval2.preference.cfg', name: 'medieval2.preference.cfg', category: 'config' },
            { path: 'Medieval II - Total War/steam_api.ini', name: 'steam_api.ini', category: 'config' },
            
            // Instructions
            { path: 'HOW TO RUN GAME!!.txt', name: 'HOW TO RUN GAME!!.txt', category: 'documentation' },
            
            // DirectX setup
            { path: '_Redist/dxsetup.exe', name: 'dxsetup.exe', category: 'redistributable', size: '~50 MB' },
            
            // Data folder (large)
            { path: 'Medieval II - Total War/data/', name: 'data/', category: 'data', size: '~5 GB', isDirectory: true },
            
            // Mods
            { path: 'Medieval II - Total War/mods/', name: 'mods/', category: 'mods', isDirectory: true },
            
            // Miles audio
            { path: 'Medieval II - Total War/miles/', name: 'miles/', category: 'audio', isDirectory: true }
        ];
    }

    renderDownloadOptions() {
        const container = document.getElementById('download-options');
        if (!container) return;

        // Group files by category
        const grouped = this.groupFilesByCategory();
        
        container.innerHTML = '';
        
        Object.keys(grouped).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'download-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = this.getCategoryName(category);
            categoryDiv.appendChild(categoryTitle);
            
            const filesList = document.createElement('div');
            filesList.className = 'files-list';
            
            grouped[category].forEach(file => {
                const fileItem = this.createFileItem(file);
                filesList.appendChild(fileItem);
            });
            
            categoryDiv.appendChild(filesList);
            container.appendChild(categoryDiv);
        });
    }

    groupFilesByCategory() {
        const grouped = {};
        this.gameFiles.forEach(file => {
            const category = file.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(file);
        });
        return grouped;
    }

    getCategoryName(category) {
        const names = {
            'executable': '🎮 Executable Files',
            'library': '📚 Library Files (DLL)',
            'config': '⚙️ Configuration Files',
            'documentation': '📄 Documentation',
            'redistributable': '🔧 DirectX Redistributables',
            'data': '💾 Game Data',
            'mods': '🎯 Mods & DLCs',
            'audio': '🔊 Audio Files',
            'other': '📦 Other Files'
        };
        return names[category] || '📦 Other Files';
    }

    createFileItem(file) {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        fileInfo.appendChild(fileName);
        
        if (file.size) {
            const fileSize = document.createElement('span');
            fileSize.className = 'file-size';
            fileSize.textContent = file.size;
            fileInfo.appendChild(fileSize);
        }
        
        item.appendChild(fileInfo);
        
        if (!file.isDirectory) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-file-btn';
            downloadBtn.textContent = 'Download';
            downloadBtn.addEventListener('click', () => {
                this.downloadFile(file.path, file.name);
            });
            item.appendChild(downloadBtn);
        } else {
            const dirNote = document.createElement('span');
            dirNote.className = 'directory-note';
            dirNote.textContent = '📁 Directory (contains multiple files)';
            item.appendChild(dirNote);
        }
        
        return item;
    }

    downloadFile(filePath, fileName) {
        const fullPath = `${this.gameBasePath}${filePath}`;
        console.log(`⬇️ Downloading: ${fullPath}`);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = fullPath;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    setupDownloadButtons() {
        const downloadAllBtn = document.getElementById('download-all-btn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                this.downloadAllFiles();
            });
        }
    }

    async downloadAllFiles() {
        const btn = document.getElementById('download-all-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Preparing downloads...</span>';
        }
        
        console.log('📦 Starting batch download of all files...');
        
        // Download files one by one with a small delay
        const filesToDownload = this.gameFiles.filter(f => !f.isDirectory);
        
        for (let i = 0; i < filesToDownload.length; i++) {
            const file = filesToDownload[i];
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
            this.downloadFile(file.path, file.name);
        }
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">📦</span><span class="btn-text">Download All Game Files</span>';
        }
        
        alert(`✅ Download initiated for ${filesToDownload.length} files. Please check your browser's download folder.`);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TotalWar2Manager();
});

