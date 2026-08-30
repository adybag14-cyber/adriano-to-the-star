/** Device-local message draft centre. No network delivery occurs. */
(function () {
  'use strict';
  const keyFor = user => `ita_message_drafts_v2:${user?.id || 'guest'}`;
  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  class LocalMessaging {
    constructor() {
      this.user = null;
      this.threads = [];
      this.activeId = null;
      this.dialog = null;
    }

    init() {
      this.bind();
      this.createDialog();
      this.refreshSession();
      addEventListener('ita:auth-changed', () => this.refreshSession());
    }

    bind() {
      document.getElementById('new-message-btn')?.addEventListener('click', () => this.openDialog());
      document.getElementById('close-conversation-btn')?.addEventListener('click', () => this.selectThread(null));
      document.getElementById('send-message-btn')?.addEventListener('click', () => this.saveDraft());
      document.getElementById('message-input')?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.saveDraft();
        }
      });
      document.getElementById('conversations-list')?.addEventListener('click', event => {
        const select = event.target.closest('[data-thread-id]');
        const remove = event.target.closest('[data-remove-thread]');
        if (remove) this.removeThread(remove.dataset.removeThread);
        else if (select) this.selectThread(select.dataset.threadId);
      });
    }

    refreshSession() {
      this.user = window.authManager?.getCurrentUser?.() || null;
      document.getElementById('not-logged-in').style.display = this.user ? 'none' : 'block';
      document.getElementById('messaging-interface').style.display = this.user ? 'block' : 'none';
      if (!this.user) {
        this.threads = [];
        this.activeId = null;
        return;
      }
      this.threads = read(keyFor(this.user));
      this.renderThreads();
      this.selectThread(this.threads[0]?.id || null);
    }

    createDialog() {
      const dialog = document.createElement('dialog');
      dialog.className = 'ita-new-thread-dialog';
      dialog.setAttribute('aria-labelledby', 'new-thread-title');
      dialog.innerHTML = `<form method="dialog"><h2 id="new-thread-title">Create a local thread</h2><p>Use a contact label to organize drafts. Nothing is delivered.</p><label for="new-thread-contact">Contact label</label><input id="new-thread-contact" maxlength="80" required autocomplete="off"><p id="new-thread-error" role="alert"></p><menu><button type="button" value="cancel">Cancel</button><button type="submit" value="create">Create thread</button></menu></form>`;
      document.body.append(dialog);
      dialog.querySelector('[value="cancel"]').addEventListener('click', () => dialog.close());
      dialog.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const value = dialog.querySelector('input').value.trim();
        if (!value) {
          dialog.querySelector('[role="alert"]').textContent = 'Enter a contact label.';
          return;
        }
        this.createThread(value);
        dialog.close();
      });
      this.dialog = dialog;
    }

    openDialog() {
      if (!this.user) return;
      this.dialog.querySelector('input').value = '';
      this.dialog.querySelector('[role="alert"]').textContent = '';
      this.dialog.showModal();
      this.dialog.querySelector('input').focus();
    }

    createThread(contact) {
      const existing = this.threads.find(thread => thread.contact.toLocaleLowerCase() === contact.toLocaleLowerCase());
      if (existing) return this.selectThread(existing.id);
      const thread = { id: crypto.randomUUID(), contact, createdAt: new Date().toISOString(), drafts: [] };
      this.threads.unshift(thread);
      this.persist();
      this.renderThreads();
      this.selectThread(thread.id);
    }

    selectThread(id) {
      this.activeId = id;
      const thread = this.threads.find(item => item.id === id);
      document.getElementById('no-conversation-selected').style.display = thread ? 'none' : 'grid';
      document.getElementById('active-conversation').style.display = thread ? 'flex' : 'none';
      document.querySelectorAll('[data-thread-id]').forEach(button => button.setAttribute('aria-current', String(button.dataset.threadId === id)));
      if (!thread) return;
      document.getElementById('chat-user-name').textContent = thread.contact;
      document.getElementById('message-input').value = '';
      this.renderDrafts(thread);
    }

    saveDraft() {
      const thread = this.threads.find(item => item.id === this.activeId);
      const input = document.getElementById('message-input');
      const text = input?.value.trim();
      if (!thread || !text) return;
      thread.drafts.push({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() });
      thread.updatedAt = new Date().toISOString();
      input.value = '';
      this.persist();
      this.renderDrafts(thread);
      this.renderThreads();
    }

    removeThread(id) {
      const thread = this.threads.find(item => item.id === id);
      if (!thread || !confirm(`Delete the local draft thread “${thread.contact}”?`)) return;
      this.threads = this.threads.filter(item => item.id !== id);
      this.persist();
      this.renderThreads();
      this.selectThread(this.threads[0]?.id || null);
    }

    renderThreads() {
      const target = document.getElementById('conversations-list');
      target.replaceChildren();
      if (!this.threads.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No local threads yet.';
        target.append(empty);
        return;
      }
      for (const thread of [...this.threads].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.threadId = thread.id;
        button.setAttribute('aria-current', String(thread.id === this.activeId));
        const latest = thread.drafts.at(-1)?.text || 'No drafts yet';
        button.textContent = `${thread.contact} — ${latest.slice(0, 54)}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.removeThread = thread.id;
        remove.setAttribute('aria-label', `Delete ${thread.contact} thread`);
        remove.textContent = '×';
        item.append(button, remove);
        target.append(item);
      }
    }

    renderDrafts(thread) {
      const target = document.getElementById('messages-container');
      target.replaceChildren();
      if (!thread.drafts.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No drafts. Write below to save a private note in this thread.';
        target.append(empty);
        return;
      }
      for (const draft of thread.drafts) {
        const article = document.createElement('article');
        article.className = 'message sent';
        const body = document.createElement('p');
        body.textContent = draft.text;
        const time = document.createElement('time');
        time.dateTime = draft.createdAt;
        time.textContent = new Date(draft.createdAt).toLocaleString();
        article.append(body, time);
        target.append(article);
      }
      target.scrollTop = target.scrollHeight;
    }

    persist() {
      try { write(keyFor(this.user), this.threads); }
      catch { alert('Browser storage is unavailable; this draft could not be saved.'); }
    }
  }

  const init = () => {
    const manager = new LocalMessaging();
    manager.init();
    window.messagingManager = manager;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
