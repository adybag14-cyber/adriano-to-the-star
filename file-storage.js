/** Private, browser-local mission vault backed by IndexedDB. */
(function () {
  'use strict';

  const DB_NAME = 'ita-local-mission-vault';
  const STORE_NAME = 'files';
  const DB_VERSION = 1;
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  const byId = id => document.getElementById(id);
  const formatBytes = value => {
    const bytes = Number(value) || 0;
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  };

  class LocalMissionVault {
    constructor() {
      this.db = null;
      this.files = [];
      this.usage = 0;
      this.quota = 0;
    }

    async init() {
      if (!('indexedDB' in window)) {
        this.renderFatal('This browser does not support the private file vault.');
        return;
      }
      this.db = await this.openDatabase();
      this.bindControls();
      await this.refresh();
    }

    openDatabase() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt');
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open browser storage.'));
      });
    }

    transaction(mode, operation) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let result;
        try { result = operation(store); } catch (error) { reject(error); return; }
        transaction.oncomplete = () => resolve(result?.result);
        transaction.onerror = () => reject(transaction.error || result?.error || new Error('Browser storage operation failed.'));
        transaction.onabort = () => reject(transaction.error || new Error('Browser storage operation was cancelled.'));
      });
    }

    bindControls() {
      const uploadArea = byId('upload-area');
      const input = byId('file-input');
      const browse = byId('browse-btn');

      browse?.addEventListener('click', event => {
        event.stopPropagation();
        input?.click();
      });
      input?.addEventListener('change', async () => {
        await this.addFiles([...input.files]);
        input.value = '';
      });
      ['dragenter', 'dragover'].forEach(type => uploadArea?.addEventListener(type, event => {
        event.preventDefault();
        uploadArea.classList.add('drag-over');
      }));
      ['dragleave', 'drop'].forEach(type => uploadArea?.addEventListener(type, event => {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');
      }));
      uploadArea?.addEventListener('drop', event => this.addFiles([...event.dataTransfer.files]));

      byId('search-files')?.addEventListener('input', () => this.renderFiles());
      byId('sort-files')?.addEventListener('change', () => this.renderFiles());
      byId('clear-vault')?.addEventListener('click', () => this.clearVault());
      byId('files-list')?.addEventListener('click', event => this.handleFileAction(event));
    }

    async addFiles(files) {
      const status = byId('upload-progress');
      for (const file of files) {
        if (!file.size || file.size > MAX_FILE_SIZE) {
          status.textContent = `${file.name}: file must be between 1 byte and 100 MB.`;
          continue;
        }
        const id = crypto.randomUUID();
        status.textContent = `Saving ${file.name} on this device…`;
        try {
          await this.transaction('readwrite', store => store.put({
            id,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            createdAt: new Date().toISOString(),
            blob: file
          }));
          status.textContent = `${file.name} is stored locally.`;
        } catch (error) {
          status.textContent = `${file.name} could not be saved: ${error.message}`;
        }
      }
      await this.refresh();
    }

    async refresh() {
      this.files = await new Promise((resolve, reject) => {
        const request = this.db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      this.usage = this.files.reduce((sum, file) => sum + (file.size || 0), 0);
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        this.quota = estimate.quota || 0;
      }
      this.renderStats();
      this.renderFiles();
    }

    renderStats() {
      const percentage = this.quota ? Math.min(100, (this.usage / this.quota) * 100) : 0;
      byId('storage-used').textContent = formatBytes(this.usage);
      byId('storage-limit').textContent = this.quota ? formatBytes(this.quota) : 'Browser managed';
      byId('file-count').textContent = String(this.files.length);
      byId('storage-percentage').textContent = `${percentage.toFixed(1)}%`;
      byId('progress-text').textContent = this.quota
        ? `${formatBytes(this.usage)} of approximately ${formatBytes(this.quota)} browser quota`
        : `${formatBytes(this.usage)} stored on this device`;
      byId('progress-fill').style.width = `${percentage}%`;
      const progressbar = document.querySelector('.progress-bar[role="progressbar"]');
      progressbar?.setAttribute('aria-valuenow', percentage.toFixed(1));
    }

    renderFiles() {
      const target = byId('files-list');
      const query = (byId('search-files')?.value || '').trim().toLocaleLowerCase();
      const sort = byId('sort-files')?.value || 'date-desc';
      const files = this.files.filter(file => file.name.toLocaleLowerCase().includes(query));
      const directions = {
        'date-desc': (a, b) => b.createdAt.localeCompare(a.createdAt),
        'date-asc': (a, b) => a.createdAt.localeCompare(b.createdAt),
        'name-asc': (a, b) => a.name.localeCompare(b.name),
        'name-desc': (a, b) => b.name.localeCompare(a.name),
        'size-desc': (a, b) => b.size - a.size,
        'size-asc': (a, b) => a.size - b.size
      };
      files.sort(directions[sort]);
      if (!files.length) {
        target.innerHTML = `<div class="empty-state"><div class="empty-icon" aria-hidden="true">📁</div><h3>${query ? 'No matching files' : 'Your local vault is empty'}</h3><p>${query ? 'Try a different search.' : 'Add a file to store it privately in this browser.'}</p></div>`;
        return;
      }
      target.replaceChildren(...files.map(file => {
        const card = document.createElement('article');
        card.className = 'file-card';
        const icon = document.createElement('div');
        icon.className = 'file-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = this.iconFor(file.name);
        const info = document.createElement('div');
        info.className = 'file-info';
        const name = document.createElement('div');
        name.className = 'file-name';
        name.title = file.name;
        name.textContent = file.name;
        const meta = document.createElement('div');
        meta.className = 'file-meta';
        meta.textContent = `${formatBytes(file.size)} · ${new Date(file.createdAt).toLocaleString()}`;
        info.append(name, meta);
        const actions = document.createElement('div');
        actions.className = 'file-actions';
        actions.innerHTML = `<button class="action-btn download-btn" type="button" data-file-action="download" data-id="${file.id}" aria-label="Download ${this.attributeText(file.name)}">↓</button><button class="action-btn delete-btn" type="button" data-file-action="delete" data-id="${file.id}" aria-label="Delete ${this.attributeText(file.name)}">×</button>`;
        card.append(icon, info, actions);
        return card;
      }));
    }

    async handleFileAction(event) {
      const button = event.target.closest('[data-file-action]');
      if (!button) return;
      const file = this.files.find(item => item.id === button.dataset.id);
      if (!file) return;
      if (button.dataset.fileAction === 'download') {
        const url = URL.createObjectURL(file.blob);
        const anchor = Object.assign(document.createElement('a'), { href: url, download: file.name });
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      if (button.dataset.fileAction === 'delete' && confirm(`Delete “${file.name}” from this browser?`)) {
        await this.transaction('readwrite', store => store.delete(file.id));
        await this.refresh();
      }
    }

    async clearVault() {
      if (!this.files.length || !confirm('Permanently delete every file from this browser-local vault?')) return;
      await this.transaction('readwrite', store => store.clear());
      byId('upload-progress').textContent = 'The local vault has been cleared.';
      await this.refresh();
    }

    iconFor(fileName) {
      const extension = fileName.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(extension)) return '🖼️';
      if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return '🎵';
      if (['mp4', 'webm', 'mov'].includes(extension)) return '🎞️';
      if (['zip', '7z', 'tar', 'gz'].includes(extension)) return '📦';
      if (['txt', 'md', 'pdf', 'doc', 'docx'].includes(extension)) return '📄';
      return '🛰️';
    }

    attributeText(value) {
      return String(value).replace(/["'<>]/g, '');
    }

    renderFatal(message) {
      byId('files-list').innerHTML = `<div class="error-state"><h2>Local vault unavailable</h2><p>${String(message)}</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const vault = new LocalMissionVault();
    window.localMissionVault = vault;
    vault.init().catch(error => vault.renderFatal(error.message));
  }, { once: true });
})();
