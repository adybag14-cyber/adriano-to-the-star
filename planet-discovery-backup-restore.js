/**
 * Planet Discovery Backup and Restore System
 * Backup and restore user data and planet claims
 */

class PlanetDiscoveryBackupRestore {
    constructor() {
        this.backups = [];
        this.init();
    }

    init() {
        this.loadBackups();
        console.log('💾 Backup and restore system initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ba_ck_up_re_st_or_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadBackups() {
        try {
            const saved = localStorage.getItem('backups');
            if (saved) {
                this.backups = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading backups:', error);
        }
    }

    saveBackups() {
        try {
            localStorage.setItem('backups', JSON.stringify(this.backups));
        } catch (error) {
            console.error('Error saving backups:', error);
        }
    }

    async createBackup() {
        const backup = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            data: {
                claims: await this.getUserClaims(),
                favorites: await this.getUserFavorites(),
                bookmarks: await this.getUserBookmarks(),
                settings: await this.getUserSettings()
            },
            size: 0
        };

        // Calculate size
        backup.size = JSON.stringify(backup.data).length;

        this.backups.push(backup);
        this.saveBackups();

        return backup;
    }

    async getUserClaims() {
        // Get user's planet claims
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data } = await supabase
                        .from('planet_claims')
                        .select('*')
                        .eq('user_id', session.user.id);
                    return data || [];
                }
            } catch (error) {
                console.error('Error getting claims:', error);
            }
        }
        return [];
    }

    async getUserFavorites() {
        try {
            const favorites = localStorage.getItem('favorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            return [];
        }
    }

    async getUserBookmarks() {
        try {
            const bookmarks = localStorage.getItem('bookmarks');
            return bookmarks ? JSON.parse(bookmarks) : [];
        } catch (error) {
            return [];
        }
    }

    async getUserSettings() {
        try {
            const settings = localStorage.getItem('user-settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            return {};
        }
    }

    async restoreBackup(backupId) {
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) {
            throw new Error('Backup not found');
        }

        // Restore data
        if (backup.data.claims) {
            await this.restoreClaims(backup.data.claims);
        }
        if (backup.data.favorites) {
            localStorage.setItem('favorites', JSON.stringify(backup.data.favorites));
        }
        if (backup.data.bookmarks) {
            localStorage.setItem('bookmarks', JSON.stringify(backup.data.bookmarks));
        }
        if (backup.data.settings) {
            localStorage.setItem('user-settings', JSON.stringify(backup.data.settings));
        }

        alert('Backup restored successfully!');
    }

    async restoreClaims(claims) {
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    // Restore claims to Supabase
                    for (const claim of claims) {
                        await supabase
                            .from('planet_claims')
                            .upsert({
                                ...claim,
                                user_id: session.user.id
                            });
                    }
                }
            } catch (error) {
                console.error('Error restoring claims:', error);
            }
        }
    }

    downloadBackup(backupId) {
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) return;

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planet-discovery-backup-${backup.timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async uploadBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    this.backups.push(backup);
                    this.saveBackups();
                    resolve(backup);
                } catch (error) {
                    reject(new Error('Invalid backup file'));
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    renderBackupRestore(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="backup-restore-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">💾 Backup & Restore</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Create backups of your planet claims, favorites, bookmarks, and settings. 
                        Restore from backups if you need to recover your data.
                    </p>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button id="create-backup-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            💾 Create Backup
                        </button>
                        <label style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            📤 Upload Backup
                            <input type="file" id="upload-backup-input" accept=".json" style="display: none;">
                        </label>
                    </div>
                </div>
                
                <div id="backups-list" class="backups-list" style="display: flex; flex-direction: column; gap: 1rem;">
        `;

        if (this.backups.length === 0) {
            html += `
                <div style="text-align: center; padding: 4rem; background: rgba(0, 0, 0, 0.5); border-radius: 15px; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">💾</div>
                    <p>No backups yet. Create your first backup!</p>
                </div>
            `;
        } else {
            this.backups.forEach(backup => {
                html += this.createBackupCard(backup);
            });
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('create-backup-btn')?.addEventListener('click', async () => {
            await this.createAndShowBackup();
        });

        document.getElementById('upload-backup-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.uploadBackup(file);
                    alert('Backup uploaded successfully!');
                    this.renderBackupRestore(containerId);
                } catch (error) {
                    alert('Error uploading backup: ' + error.message);
                }
            }
        });
    }

    createBackupCard(backup) {
        const sizeKB = (backup.size / 1024).toFixed(2);
        const date = new Date(backup.timestamp).toLocaleString();

        return `
            <div class="backup-card" data-backup-id="${backup.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">Backup ${new Date(backup.timestamp).toLocaleDateString()}</h4>
                        <p style="opacity: 0.7; font-size: 0.85rem; margin-bottom: 0.5rem;">${date}</p>
                        <div style="display: flex; gap: 1rem; font-size: 0.85rem; opacity: 0.7;">
                            <span>📦 ${sizeKB} KB</span>
                            <span>📝 ${backup.data.claims?.length || 0} claims</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="download-backup-btn" data-backup-id="${backup.id}" style="padding: 0.5rem; background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); border-radius: 8px; color: #3b82f6; cursor: pointer;">
                            📥
                        </button>
                        <button class="restore-backup-btn" data-backup-id="${backup.id}" style="padding: 0.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 8px; color: #4ade80; cursor: pointer;">
                            🔄
                        </button>
                        <button class="delete-backup-btn" data-backup-id="${backup.id}" style="padding: 0.5rem; background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 8px; color: #f87171; cursor: pointer;">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async createAndShowBackup() {
        const backup = await this.createBackup();
        alert(`Backup created successfully! Size: ${(backup.size / 1024).toFixed(2)} KB`);
        this.renderBackupRestore('backup-restore-container');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryBackupRestore = new PlanetDiscoveryBackupRestore();
    
    // Re-attach event listeners after rendering
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('download-backup-btn')) {
            const backupId = e.target.dataset.backupId;
            window.planetDiscoveryBackupRestore.downloadBackup(backupId);
        }
        if (e.target.classList.contains('restore-backup-btn')) {
            const backupId = e.target.dataset.backupId;
            if (confirm('Are you sure you want to restore this backup? This will overwrite your current data.')) {
                await window.planetDiscoveryBackupRestore.restoreBackup(backupId);
            }
        }
        if (e.target.classList.contains('delete-backup-btn')) {
            const backupId = e.target.dataset.backupId;
            if (confirm('Are you sure you want to delete this backup?')) {
                window.planetDiscoveryBackupRestore.backups = window.planetDiscoveryBackupRestore.backups.filter(b => b.id !== backupId);
                window.planetDiscoveryBackupRestore.saveBackups();
                window.planetDiscoveryBackupRestore.renderBackupRestore('backup-restore-container');
            }
        }
    });
}

