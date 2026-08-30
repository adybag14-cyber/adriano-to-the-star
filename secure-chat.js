/** AES-GCM encrypted, browser-local notebook. No transport or remote storage. */
(function () {
  'use strict';
  const ITERATIONS = 600000;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const toBase64 = bytes => {
    let binary = '';
    for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
    return btoa(binary);
  };
  const fromBase64 = value => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  };

  class LocalEncryptedNotebook {
    constructor() {
      this.user = null;
      this.key = null;
      this.entries = [];
      this.record = null;
      this.setupModal = document.getElementById('key-setup-modal');
      this.unlockModal = document.getElementById('key-import-modal');
    }

    init() {
      this.bind();
      this.syncUser();
      addEventListener('ita:auth-changed', () => this.syncUser());
    }

    bind() {
      document.getElementById('manage-keys-btn')?.addEventListener('click', () => this.manage());
      document.getElementById('generate-keys-btn')?.addEventListener('click', () => this.createVault());
      document.getElementById('unlock-keys-btn')?.addEventListener('click', () => this.unlockVault());
      document.getElementById('refresh-users-btn')?.addEventListener('click', () => this.refresh());
      document.getElementById('send-btn')?.addEventListener('click', () => this.addEntry());
      document.getElementById('message-input')?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.addEntry();
        }
      });
      document.getElementById('messages-container')?.addEventListener('click', event => {
        const button = event.target.closest('[data-delete-entry]');
        if (button) this.deleteEntry(button.dataset.deleteEntry);
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') this.closePanels();
      });
    }

    storageKey() {
      return `ita_encrypted_notebook_v2:${this.user?.id || 'guest'}`;
    }

    associatedData() {
      return encoder.encode(`adrianotothestar.com:secure-notebook:v2:${this.user.id}`);
    }

    syncUser() {
      this.lock(false);
      this.user = window.authManager?.getCurrentUser?.() || null;
      this.record = this.user ? this.readRecord() : null;
      this.renderDirectory();
      this.updateState();
    }

    refresh() {
      this.record = this.user ? this.readRecord() : null;
      this.renderDirectory();
      this.updateState('Local vault status refreshed.');
    }

    readRecord() {
      try { return JSON.parse(localStorage.getItem(this.storageKey()) || 'null'); }
      catch { return null; }
    }

    manage() {
      if (!this.user) {
        window.showModal?.('login-modal');
        return;
      }
      if (this.key) {
        this.lock();
        return;
      }
      const panel = this.record ? this.unlockModal : this.setupModal;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('active');
      panel.querySelector('input')?.focus();
    }

    async derive(password, salt) {
      const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    async createVault() {
      if (!this.user) return;
      const password = document.getElementById('key-password').value;
      const confirmPassword = document.getElementById('key-password-confirm').value;
      if (password.length < 12) return this.panelStatus('setup-status', 'Use at least 12 characters.', true);
      if (password !== confirmPassword) return this.panelStatus('setup-status', 'Passwords do not match.', true);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      this.key = await this.derive(password, salt);
      this.entries = [];
      this.record = { version: 2, iterations: ITERATIONS, salt: toBase64(salt), updatedAt: new Date().toISOString() };
      try {
        await this.persist();
        this.closePanels();
        this.updateState('Encrypted notebook created and unlocked.');
        this.renderDirectory();
      } catch (error) {
        this.key = null;
        this.panelStatus('setup-status', `Could not create notebook: ${error.message}`, true);
      }
    }

    async unlockVault() {
      if (!this.user || !this.record) return;
      const password = document.getElementById('import-password').value;
      if (!password) return this.panelStatus('unlock-status', 'Enter the notebook password.', true);
      try {
        const salt = fromBase64(this.record.salt);
        const key = await this.derive(password, salt);
        const plaintext = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: fromBase64(this.record.iv),
            additionalData: this.associatedData(),
            tagLength: 128
          },
          key,
          fromBase64(this.record.ciphertext)
        );
        const entries = JSON.parse(decoder.decode(plaintext));
        if (!Array.isArray(entries)) throw new Error('Invalid notebook payload.');
        this.key = key;
        this.entries = entries;
        this.closePanels();
        this.updateState('Encrypted notebook unlocked in this tab.');
        this.renderDirectory();
      } catch {
        this.panelStatus('unlock-status', 'Incorrect password or damaged browser-local notebook.', true);
      }
    }

    async persist() {
      if (!this.key || !this.record) throw new Error('Notebook is locked.');
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: this.associatedData(), tagLength: 128 },
        this.key,
        encoder.encode(JSON.stringify(this.entries))
      );
      this.record = {
        ...this.record,
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey(), JSON.stringify(this.record));
    }

    async addEntry() {
      const input = document.getElementById('message-input');
      const text = input?.value.trim();
      if (!this.key || !text) return;
      this.entries.push({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() });
      try {
        await this.persist();
        input.value = '';
        this.renderEntries();
        this.updateState('Entry encrypted and saved on this device.');
      } catch (error) {
        this.entries.pop();
        this.updateState(`Entry could not be saved: ${error.message}`, true);
      }
    }

    async deleteEntry(id) {
      if (!this.key) return;
      const entry = this.entries.find(item => item.id === id);
      if (!entry || !confirm('Delete this encrypted notebook entry?')) return;
      this.entries = this.entries.filter(item => item.id !== id);
      await this.persist();
      this.renderEntries();
      this.updateState('Entry removed and vault re-encrypted.');
    }

    lock(announce = true) {
      this.key = null;
      this.entries = [];
      this.closePanels();
      this.renderEntries();
      if (announce) this.updateState('Notebook locked; the key was discarded from this tab.');
      else this.updateState();
      this.renderDirectory();
    }

    removeVault() {
      if (!this.user || !this.record || !confirm('Permanently delete this encrypted notebook from the browser?')) return;
      localStorage.removeItem(this.storageKey());
      this.record = null;
      this.lock(false);
      this.updateState('Encrypted notebook deleted from this browser.');
    }

    renderDirectory() {
      const target = document.getElementById('user-list');
      target.replaceChildren();
      if (!this.user) {
        const message = document.createElement('p');
        message.textContent = 'Open a browser-local profile to create an encrypted notebook.';
        target.append(message);
        return;
      }
      const card = document.createElement('article');
      card.className = 'chat-history-item';
      const heading = document.createElement('strong');
      heading.textContent = `${this.user.fullName || this.user.username} notebook`;
      const state = document.createElement('p');
      state.textContent = this.key ? `${this.entries.length} decrypted entries in memory` : this.record ? 'Encrypted and locked' : 'Not created';
      const manage = document.createElement('button');
      manage.type = 'button';
      manage.className = 'action-btn';
      manage.textContent = this.key ? 'Lock' : this.record ? 'Unlock' : 'Create';
      manage.addEventListener('click', () => this.manage());
      card.append(heading, state, manage);
      if (this.record) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'action-btn';
        remove.textContent = 'Delete vault';
        remove.addEventListener('click', () => this.removeVault());
        card.append(remove);
      }
      target.append(card);
    }

    renderEntries() {
      const target = document.getElementById('messages-container');
      if (!target) return;
      target.replaceChildren();
      if (!this.key) {
        const message = document.createElement('div');
        message.className = 'welcome-message';
        message.innerHTML = '<div class="welcome-icon" aria-hidden="true">[LOCKED]</div><h2>Encrypted local notebook</h2><p>Create or unlock the vault to view entries. No data is sent off this device.</p>';
        target.append(message);
        return;
      }
      if (!this.entries.length) {
        const empty = document.createElement('p');
        empty.textContent = 'The notebook is empty. Write an entry below.';
        target.append(empty);
        return;
      }
      for (const entry of this.entries) {
        const article = document.createElement('article');
        article.className = 'message-item sent';
        const body = document.createElement('p');
        body.textContent = entry.text;
        const time = document.createElement('time');
        time.dateTime = entry.createdAt;
        time.textContent = new Date(entry.createdAt).toLocaleString();
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.deleteEntry = entry.id;
        remove.setAttribute('aria-label', `Delete entry from ${time.textContent}`);
        remove.textContent = 'Delete';
        article.append(body, time, remove);
        target.append(article);
      }
      target.scrollTop = target.scrollHeight;
    }

    updateState(message = '', error = false) {
      const unlocked = Boolean(this.user && this.key);
      const input = document.getElementById('message-input');
      const send = document.getElementById('send-btn');
      if (input) input.disabled = !unlocked;
      if (send) send.disabled = !unlocked;
      document.getElementById('secure-indicator').style.display = unlocked ? 'inline-flex' : 'none';
      const keyStatus = document.getElementById('key-status');
      keyStatus.textContent = unlocked ? 'Unlocked in this tab' : this.record ? 'Encrypted and locked' : 'No notebook';
      keyStatus.style.color = error ? '#fca5a5' : unlocked ? '#4ade80' : '#a5b4fc';
      if (message) keyStatus.textContent = message;
      document.querySelectorAll('.user-display,.user-name').forEach(node => {
        node.textContent = this.user ? (this.user.fullName || this.user.username) : 'Guest';
      });
      this.renderEntries();
    }

    panelStatus(id, message, error = false) {
      const target = document.getElementById(id);
      target.textContent = message;
      target.style.color = error ? '#fca5a5' : '#4ade80';
    }

    closePanels() {
      [this.setupModal, this.unlockModal].forEach(panel => {
        if (!panel) return;
        panel.classList.remove('active');
        panel.hidden = true;
        panel.setAttribute('aria-hidden', 'true');
      });
      ['key-password', 'key-password-confirm', 'import-password'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
    }
  }

  const init = () => {
    const notebook = new LocalEncryptedNotebook();
    notebook.init();
    window.secureChat = notebook;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
