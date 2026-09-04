/** Stellar AI: browser-local Bonsai chat and transparent offline learning demo. */
(function () {
  'use strict';
  const CHATS_KEY = 'stellarAI_chats_v2';
  const CURRENT_KEY = 'stellarAI_currentChatId_v2';
  const MODEL_KEY = 'stellarAI_selectedModel_v2';
  const allowedModels = new Set(['fallback', 'bonsai-local']);
  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
  };

  class StellarAI {
    constructor() {
      this.chats = readJson(CHATS_KEY, []).filter(chat => chat && Array.isArray(chat.messages)).slice(0, 50);
      this.currentChatId = localStorage.getItem(CURRENT_KEY);
      this.selectedModel = allowedModels.has(localStorage.getItem(MODEL_KEY)) ? localStorage.getItem(MODEL_KEY) : 'fallback';
      this.attachments = [];
      this.isProcessing = false;
      this.voiceEnabled = false;
      this.recognition = null;
      this.welcomeTemplate = document.getElementById('messages-container')?.innerHTML || '';
      if (!this.chats.some(chat => chat.id === this.currentChatId)) this.currentChatId = this.chats[0]?.id || null;
      if (!this.currentChatId) this.createNewChat(false);
      this.bind();
      this.updateModelUi();
      this.renderCurrentChat();
      this.updateChatHistory();
      this.updateUserUI();
      this.dockUtilities();
    }

    dockUtilities() {
      const dock = document.getElementById('stellar-utility-dock');
      if (!dock) return;
      const mount = () => {
        const controls = ['.ita-language-switcher', '#theme-toggle-container', '#cosmic-music-player'].map(selector => document.querySelector(selector));
        controls.filter(Boolean).forEach(control => { if (control.parentElement !== dock) dock.append(control); });
        return controls.every(Boolean);
      };
      if (mount()) return;
      const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
      observer.observe(document.body, { childList: true, subtree: true });
      addEventListener('pagehide', () => observer.disconnect(), { once: true });
    }

    currentChat() { return this.chats.find(chat => chat.id === this.currentChatId) || null; }

    bind() {
      const input = document.getElementById('message-input');
      document.getElementById('send-btn')?.addEventListener('click', () => this.sendMessage());
      input?.addEventListener('input', () => this.updateCharCount());
      input?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.sendMessage(); }
      });
      document.getElementById('new-chat-btn')?.addEventListener('click', () => this.createNewChat());
      document.getElementById('clear-chat-btn')?.addEventListener('click', () => this.clearCurrentChat());
      document.getElementById('export-chat-btn')?.addEventListener('click', () => this.exportChat());
      document.getElementById('metrics-btn')?.addEventListener('click', () => this.showMetricsDashboard());
      document.getElementById('ai-usage-btn')?.addEventListener('click', () => this.showAIUsageDialog());
      document.getElementById('login-btn')?.addEventListener('click', () => { location.href = 'members.html'; });
      document.getElementById('download-cli-btn')?.addEventListener('click', () => this.downloadCLI());
      document.getElementById('attach-btn')?.addEventListener('click', () => document.getElementById('file-input')?.click());
      document.getElementById('file-input')?.addEventListener('change', event => this.attachFiles([...event.target.files]));
      document.getElementById('voice-input-btn')?.addEventListener('click', () => this.toggleVoiceInput());
      document.getElementById('voice-output-btn')?.addEventListener('click', () => this.toggleVoiceOutput());
      document.getElementById('model-selector')?.addEventListener('change', event => {
        this.selectedModel = allowedModels.has(event.target.value) ? event.target.value : 'fallback';
        localStorage.setItem(MODEL_KEY, this.selectedModel);
        this.updateModelUi();
        this.announce(`AI mode changed to ${this.modelName(this.selectedModel)}.`);
      });
      document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
        input.value = button.dataset.prompt || '';
        this.updateCharCount();
        input.focus();
      }));
      document.getElementById('chat-history-list')?.addEventListener('click', event => {
        const select = event.target.closest('[data-chat-id]');
        const remove = event.target.closest('[data-delete-chat]');
        if (remove) this.deleteChat(remove.dataset.deleteChat);
        else if (select) this.switchToChat(select.dataset.chatId);
      });
      document.getElementById('attachments-preview')?.addEventListener('click', event => {
        const remove = event.target.closest('[data-remove-attachment]');
        if (remove) { this.attachments.splice(Number(remove.dataset.removeAttachment), 1); this.renderAttachments(); }
      });
      addEventListener('ita:auth-changed', () => this.updateUserUI());
    }

    createNewChat(focus = true) {
      const chat = { id: crypto.randomUUID(), title: 'New local chat', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] };
      this.chats.unshift(chat);
      this.currentChatId = chat.id;
      this.chats = this.chats.slice(0, 50);
      this.save();
      this.renderCurrentChat();
      this.updateChatHistory();
      if (focus) document.getElementById('message-input')?.focus();
      return chat;
    }

    switchToChat(id) {
      if (!this.chats.some(chat => chat.id === id)) return;
      this.currentChatId = id;
      this.save();
      this.renderCurrentChat();
      this.updateChatHistory();
    }

    deleteChat(id) {
      const chat = this.chats.find(item => item.id === id);
      if (!chat || !confirm(`Delete “${chat.title}” from this browser?`)) return;
      this.chats = this.chats.filter(item => item.id !== id);
      if (!this.chats.length) this.createNewChat(false);
      else if (this.currentChatId === id) this.currentChatId = this.chats[0].id;
      this.save();
      this.renderCurrentChat();
      this.updateChatHistory();
    }

    clearCurrentChat() {
      const chat = this.currentChat();
      if (!chat || !chat.messages.length || !confirm('Clear every message in this local chat?')) return;
      chat.messages = [];
      chat.title = 'New local chat';
      chat.updatedAt = new Date().toISOString();
      window.stellarBonsai?.cancel?.();
      this.save();
      this.renderCurrentChat();
      this.updateChatHistory();
    }

    async sendMessage() {
      if (this.isProcessing) return;
      const input = document.getElementById('message-input');
      const visibleText = input.value.trim();
      if (!visibleText) { input.focus(); return; }
      const chat = this.currentChat() || this.createNewChat(false);
      const attachmentSummary = this.attachments.map(file => `${file.name} (${file.size.toLocaleString()} bytes)`);
      const excerpts = this.attachments.map(file => `--- ${file.name} ---\n${file.text.slice(0, 8000)}`).join('\n\n');
      const promptContent = excerpts ? `${visibleText}\n\nUser-selected local text excerpts:\n${excerpts}` : visibleText;
      const userMessage = { id: crypto.randomUUID(), role: 'user', content: visibleText, promptContent, attachments: attachmentSummary, timestamp: new Date().toISOString() };
      chat.messages.push(userMessage);
      chat.messages = chat.messages.slice(-200);
      if (chat.messages.length === 1) chat.title = visibleText.slice(0, 42) || 'Local chat';
      chat.updatedAt = new Date().toISOString();
      input.value = '';
      this.attachments = [];
      this.renderAttachments();
      this.appendMessage(userMessage);
      this.updateCharCount();
      this.save();
      this.updateChatHistory();
      this.setProcessing(true);
      const pending = this.appendPending();
      try {
        const content = await this.responseFor(chat);
        pending.remove();
        const reply = { id: crypto.randomUUID(), role: 'assistant', content, model: this.selectedModel, timestamp: new Date().toISOString() };
        chat.messages.push(reply);
        chat.updatedAt = new Date().toISOString();
        this.appendMessage(reply);
        this.save();
        this.updateChatHistory();
        if (this.voiceEnabled) this.speak(content);
      } catch (error) {
        pending.remove();
        const reply = { id: crypto.randomUUID(), role: 'assistant', content: `Unable to complete this turn: ${error.message}`, model: this.selectedModel, error: true, timestamp: new Date().toISOString() };
        chat.messages.push(reply);
        this.appendMessage(reply);
        this.save();
      } finally {
        this.setProcessing(false);
        input.focus();
      }
    }

    async responseFor(chat) {
      const latest = chat.messages.at(-1);
      if (this.selectedModel === 'bonsai-local') {
        if (!window.stellarBonsai?.isReady?.()) throw new Error('Choose a Bonsai size and press Load model before sending a local prompt.');
        const messages = [{ role: 'system', content: 'You are Stellar AI, a concise astronomy learning assistant. Distinguish observed facts from inference, avoid inventing citations, and direct users to NASA/ESA source links for research-grade values.' }];
        chat.messages.slice(-12).forEach(message => messages.push({ role: message.role, content: message.promptContent || message.content }));
        return window.stellarBonsai.generate(messages);
      }
      return this.getFallbackResponse(latest.content);
    }

    getFallbackResponse(message) {
      const value = String(message).toLocaleLowerCase();
      const prefix = 'Offline demo — this is a curated response, not generated AI. ';
      if (value.includes('exoplanet')) return `${prefix}An exoplanet orbits a star other than the Sun. Transit surveys infer a planet when a star dims periodically; radial-velocity observations measure the star’s line-of-sight motion. Detection catalogues are shaped by geometry, cadence, stellar activity, and instrument sensitivity.`;
      if (value.includes('andromeda')) return `${prefix}The Andromeda Galaxy (M31) is a large member of the Local Group roughly 2.5 million light-years away. It should not be confused with the Solar neighbourhood of individual nearby stars shown in the tracker.`;
      if (value.includes('kepler')) return `${prefix}NASA’s Kepler mission monitored stellar brightness for periodic transit signals. Use the Exoplanet Database for the shipped snapshot and the NASA Exoplanet Archive for current research-grade records and uncertainties.`;
      if (value.includes('webgpu') || value.includes('bonsai')) return `${prefix}WebGPU gives web applications lower-level GPU compute access. On this page it can run the opt-in Bonsai model locally after its weights are downloaded; model quality, browser support, storage, and GPU memory remain practical constraints.`;
      return `${prefix}I can explain the built-in topics “exoplanets”, “Kepler”, “Andromeda”, “WebGPU”, and “Bonsai”. For open-ended local generation, load a Bonsai model in the WebGPU panel.`;
    }

    async attachFiles(files) {
      const accepted = files.slice(0, Math.max(0, 4 - this.attachments.length));
      for (const file of accepted) {
        if (file.size > 1024 * 1024) { this.announce(`${file.name} exceeds the 1 MB local attachment limit.`); continue; }
        try {
          const text = (await file.text()).replace(/\u0000/g, '');
          this.attachments.push({ name: file.name, size: file.size, type: file.type, text });
        } catch { this.announce(`${file.name} could not be read as text.`); }
      }
      document.getElementById('file-input').value = '';
      this.renderAttachments();
    }

    renderAttachments() {
      const target = document.getElementById('attachments-preview');
      target.replaceChildren(...this.attachments.map((file, index) => {
        const chip = document.createElement('span');
        chip.className = 'attachment-chip';
        const label = document.createElement('span');
        label.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.removeAttachment = String(index);
        remove.setAttribute('aria-label', `Remove ${file.name}`);
        remove.textContent = '×';
        chip.append(label, remove);
        return chip;
      }));
    }

    renderCurrentChat() {
      const chat = this.currentChat();
      const container = document.getElementById('messages-container');
      container.replaceChildren();
      document.getElementById('current-chat-title').textContent = chat?.title || 'Stellar AI';
      if (!chat?.messages.length) {
        container.innerHTML = this.welcomeTemplate;
        container.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
          const input = document.getElementById('message-input');
          input.value = button.dataset.prompt || '';
          input.focus();
          this.updateCharCount();
        }));
        return;
      }
      chat.messages.forEach(message => this.appendMessage(message));
      container.scrollTop = container.scrollHeight;
    }

    appendMessage(message) {
      const container = document.getElementById('messages-container');
      const article = document.createElement('article');
      article.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}${message.error ? ' is-error' : ''}`;
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = message.role === 'user' ? '👤' : '🌟';
      const content = document.createElement('div');
      content.className = 'message-content';
      const header = document.createElement('div');
      header.className = 'message-header';
      const author = document.createElement('strong');
      author.textContent = message.role === 'user' ? 'You' : `Stellar AI · ${this.modelName(message.model || this.selectedModel)}`;
      const time = document.createElement('time');
      time.dateTime = message.timestamp;
      time.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      header.append(author, time);
      const text = document.createElement('div');
      text.className = 'message-text';
      text.textContent = message.content;
      content.append(header, text);
      if (message.attachments?.length) {
        const files = document.createElement('p');
        files.className = 'message-files';
        files.textContent = `Local attachments: ${message.attachments.join(', ')}`;
        content.append(files);
      }
      article.append(avatar, content);
      container.append(article);
      container.scrollTop = container.scrollHeight;
      return article;
    }

    appendPending() {
      const pending = { role: 'assistant', content: this.selectedModel === 'bonsai-local' ? 'Generating locally…' : 'Selecting a curated offline response…', model: this.selectedModel, timestamp: new Date().toISOString() };
      const element = this.appendMessage(pending);
      element.classList.add('loading-message');
      return element;
    }

    updateChatHistory() {
      const target = document.getElementById('chat-history-list');
      target.replaceChildren(...this.chats.map(chat => {
        const item = document.createElement('div');
        item.className = `history-item${chat.id === this.currentChatId ? ' active' : ''}`;
        const select = document.createElement('button');
        select.type = 'button';
        select.dataset.chatId = chat.id;
        select.setAttribute('aria-current', String(chat.id === this.currentChatId));
        select.textContent = chat.title;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.deleteChat = chat.id;
        remove.setAttribute('aria-label', `Delete ${chat.title}`);
        remove.textContent = '×';
        item.append(select, remove);
        return item;
      }));
    }

    save() {
      try {
        localStorage.setItem(CHATS_KEY, JSON.stringify(this.chats));
        localStorage.setItem(CURRENT_KEY, this.currentChatId);
      } catch { this.announce('Browser storage is unavailable; chat changes remain only until this page closes.'); }
    }

    exportChat() {
      const chat = this.currentChat();
      if (!chat) return;
      const payload = { schema: 'ita-stellar-chat', version: 2, exportedAt: new Date().toISOString(), chat };
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement('a'), { href: url, download: 'stellar-ai-local-chat.json' });
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.announce('Current local chat exported.');
    }

    showMetricsDashboard() {
      const messages = this.chats.flatMap(chat => chat.messages);
      this.showDialog('Local Stellar AI metrics', [
        `Chats stored in this browser: ${this.chats.length}`,
        `Messages stored in this browser: ${messages.length}`,
        `Bonsai ready in this tab: ${window.stellarBonsai?.isReady?.() ? 'yes' : 'no'}`,
        `Active mode: ${this.modelName(this.selectedModel)}`,
        'No global users, accuracy score, server latency, or cross-device activity is measured.'
      ]);
    }

    showAIUsageDialog() {
      this.showDialog('AI and data boundary', [
        'Offline demo mode uses fixed educational text and is not generative AI.',
        'Bonsai mode downloads model assets only after Load model is pressed; inference then runs through WebGPU in this page.',
        'Bonsai model assets come from the pinned BitGPU model manifests and Hugging Face repositories named in the panel.',
        'Chats and selected text excerpts remain in browser storage unless you export or clear them.',
        'Browser speech recognition may be processed by the browser vendor; a warning appears before it starts.'
      ]);
    }

    showDialog(title, lines) {
      const dialog = document.createElement('dialog');
      dialog.className = 'metrics-dialog metrics-dialog-native';
      const content = document.createElement('div');
      content.className = 'metrics-dialog-content ai-usage-dialog-content';
      const heading = document.createElement('h2');
      heading.textContent = title;
      const list = document.createElement('ul');
      lines.forEach(line => { const item = document.createElement('li'); item.textContent = line; list.append(item); });
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'ai-usage-close';
      close.setAttribute('aria-label', `Close ${title}`);
      close.textContent = '×';
      close.addEventListener('click', () => dialog.close());
      content.append(close, heading, list);
      dialog.append(content);
      dialog.addEventListener('close', () => dialog.remove(), { once: true });
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      document.body.append(dialog);
      dialog.showModal();
      close.focus();
    }

    toggleVoiceOutput() {
      this.voiceEnabled = !this.voiceEnabled;
      const button = document.getElementById('voice-output-btn');
      button.setAttribute('aria-pressed', String(this.voiceEnabled));
      button.setAttribute('aria-label', this.voiceEnabled ? 'Disable spoken responses' : 'Enable spoken responses');
      if (!this.voiceEnabled) speechSynthesis.cancel();
      this.announce(`Spoken responses ${this.voiceEnabled ? 'enabled' : 'disabled'}.`);
    }

    toggleVoiceInput() {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) { this.announce('Speech recognition is unavailable in this browser.'); return; }
      if (!this.recognition) {
        if (!confirm('Browser speech recognition may send audio to your browser or operating-system provider. Start only if you accept that separate privacy boundary.')) return;
        this.recognition = new Recognition();
        this.recognition.lang = document.documentElement.lang || 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.addEventListener('result', event => {
          const input = document.getElementById('message-input');
          input.value = event.results[0][0].transcript;
          this.updateCharCount();
          input.focus();
        });
        this.recognition.addEventListener('end', () => {
          const button = document.getElementById('voice-input-btn');
          button.setAttribute('aria-pressed', 'false');
          button.setAttribute('aria-label', 'Start voice input');
        });
      }
      document.getElementById('voice-input-btn').setAttribute('aria-pressed', 'true');
      document.getElementById('voice-input-btn').setAttribute('aria-label', 'Listening; stop voice input');
      try { this.recognition.start(); } catch { this.recognition.stop(); }
    }

    speak(text) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(String(text).slice(0, 4000));
      utterance.lang = document.documentElement.lang || 'en-US';
      speechSynthesis.speak(utterance);
    }

    downloadCLI() {
      const anchor = Object.assign(document.createElement('a'), { href: 'stellar-ai-cli.zip', download: 'stellar-ai-cli.zip' });
      anchor.click();
    }

    updateModelUi() {
      const selector = document.getElementById('model-selector');
      selector.value = this.selectedModel;
      document.getElementById('bonsai-local-panel').hidden = false;
    }

    updateUserUI() {
      const user = window.authManager?.getCurrentUser?.();
      document.querySelector('#user-info .user-name').textContent = user ? (user.fullName || user.username) : 'Guest browser';
      const button = document.getElementById('login-btn');
      button.textContent = user ? 'Manage local profile' : 'Create local profile';
    }

    setProcessing(active) {
      this.isProcessing = active;
      document.getElementById('send-btn').disabled = active;
      document.getElementById('message-input').disabled = active;
    }

    updateCharCount() {
      const input = document.getElementById('message-input');
      const count = [...input.value].length;
      if (count > 4000) input.value = [...input.value].slice(0, 4000).join('');
      document.getElementById('char-count').textContent = `${Math.min(count, 4000)} / 4000`;
    }

    modelName(model) { return model === 'bonsai-local' ? `Bonsai ${window.stellarBonsai?.activeModel?.() || 'WebGPU'}` : 'Offline demo'; }
    announce(message) {
      const target = document.getElementById('bonsai-status');
      if (target && this.selectedModel !== 'bonsai-local') { target.textContent = message; target.dataset.state = 'ready'; }
    }
  }

  const init = () => {
    if (window.stellarAI) return;
    window.stellarAI = new StellarAI();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.StellarAI = StellarAI;
})();
