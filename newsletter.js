/** Browser-local newsletter preference planner for the static Pages site. */
(function () {
  'use strict';
  const STORAGE_KEY = 'ita_newsletter_preferences_v2';
  const categories = [
    ['features', 'New features and releases'],
    ['discoveries', 'Space discoveries'],
    ['launches', 'Rocket launches'],
    ['marketplace', 'Marketplace experiments'],
    ['community', 'Community news']
  ];
  const read = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  };
  const save = value => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));

  class NewsletterManager {
    constructor() {
      this.container = document.getElementById('newsletter-container');
      this.preference = read();
    }

    init() {
      if (!this.container) return;
      this.render();
      this.bind();
    }

    render() {
      const selected = new Set(this.preference?.categories || ['features', 'discoveries']);
      const email = this.preference?.email || window.authManager?.getCurrentUser?.()?.email || '';
      this.container.innerHTML = `
        <div class="newsletter-manager">
          <header class="newsletter-header">
            <h2>Newsletter preference planner</h2>
            <p>This static GitLab Pages release has no mailing backend. Your address and preferences stay in this browser and no email is sent to the site.</p>
          </header>
          <section class="subscription-form" aria-labelledby="newsletter-plan-title">
            <h3 id="newsletter-plan-title">Create a local update plan</h3>
            <form id="newsletter-form">
              <div class="form-group"><label for="newsletter-email">Email label</label><input type="email" id="newsletter-email" autocomplete="email" value="${this.escape(email)}" required><small>Stored only on this device; optional account data is not transmitted.</small></div>
              <fieldset class="form-group"><legend>Topics</legend><div class="checkbox-group">
                ${categories.map(([value, label]) => `<label class="checkbox-label"><input type="checkbox" name="categories" value="${value}" ${selected.has(value) ? 'checked' : ''}><span>${label}</span></label>`).join('')}
              </div></fieldset>
              <div class="form-group"><label for="newsletter-frequency">Preferred frequency</label><select id="newsletter-frequency"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="important">Important releases only</option></select></div>
              <div class="newsletter-actions"><button type="submit" class="subscribe-btn">Save on this device</button><button type="button" class="subscribe-btn" id="export-newsletter-plan">Export plan</button><button type="button" class="unsubscribe-btn" id="remove-newsletter-plan">Remove local plan</button></div>
              <p id="newsletter-status" role="status" aria-live="polite"></p>
            </form>
          </section>
          <section class="subscriptions-list" aria-labelledby="saved-plan-title"><h3 id="saved-plan-title">Saved plan</h3><div id="newsletter-saved-plan"></div></section>
        </div>`;
      const frequency = document.getElementById('newsletter-frequency');
      if (this.preference?.frequency) frequency.value = this.preference.frequency;
      this.renderSaved();
    }

    bind() {
      document.getElementById('newsletter-form')?.addEventListener('submit', event => {
        event.preventDefault();
        this.subscribe();
      });
      document.getElementById('remove-newsletter-plan')?.addEventListener('click', () => this.unsubscribe());
      document.getElementById('export-newsletter-plan')?.addEventListener('click', () => this.exportPlan());
    }

    subscribe() {
      const email = document.getElementById('newsletter-email').value.trim().toLowerCase();
      const chosen = [...document.querySelectorAll('input[name="categories"]:checked')].map(input => input.value);
      if (!/^\S+@\S+\.\S+$/.test(email)) return this.status('Enter a valid email label.', true);
      if (!chosen.length) return this.status('Choose at least one topic.', true);
      this.preference = {
        schemaVersion: 2,
        email,
        categories: chosen,
        frequency: document.getElementById('newsletter-frequency').value,
        savedAt: new Date().toISOString(),
        delivery: 'disabled-browser-local-plan'
      };
      try {
        save(this.preference);
        this.status('Preference plan saved on this device. No subscription or network request was made.');
        this.renderSaved();
      } catch {
        this.status('Browser storage is unavailable; the plan was not saved.', true);
      }
    }

    unsubscribe() {
      if (!this.preference) return this.status('There is no local plan to remove.');
      localStorage.removeItem(STORAGE_KEY);
      this.preference = null;
      this.status('Local newsletter plan removed.');
      this.renderSaved();
    }

    exportPlan() {
      if (!this.preference) return this.status('Save a local plan before exporting.', true);
      const blob = new Blob([`${JSON.stringify(this.preference, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement('a'), { href: url, download: 'ita-newsletter-plan.json' });
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.status('Local plan exported.');
    }

    renderSaved() {
      const target = document.getElementById('newsletter-saved-plan');
      target.replaceChildren();
      if (!this.preference) {
        target.textContent = 'No browser-local plan is saved.';
        return;
      }
      const card = document.createElement('article');
      card.className = 'subscription-card';
      const title = document.createElement('h4');
      title.textContent = this.preference.email;
      const details = document.createElement('p');
      const labels = this.preference.categories.map(value => categories.find(item => item[0] === value)?.[1] || value);
      details.textContent = `${this.preference.frequency} · ${labels.join(', ')} · saved ${new Date(this.preference.savedAt).toLocaleString()}`;
      const disclosure = document.createElement('p');
      disclosure.textContent = 'Delivery is disabled. This is a device-local preference record, not an active mailing-list subscription.';
      card.append(title, details, disclosure);
      target.append(card);
    }

    status(message, error = false) {
      const target = document.getElementById('newsletter-status');
      target.textContent = message;
      target.classList.toggle('error', error);
    }

    escape(value) {
      return String(value || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }
  }

  const init = () => {
    const manager = new NewsletterManager();
    manager.init();
    window.newsletterManager = manager;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.NewsletterManager = NewsletterManager;
})();
