/** Educational celestial registry. Browsing only; no ownership or payment system. */
(function () {
  'use strict';
  const systems = [
    ['Kepler-186 f', '8120608'], ['TRAPPIST-1 e', 'TRAPPIST-1'], ['Proxima Centauri b', 'Proxima Cen'],
    ['TOI-700 d', 'TOI-700'], ['Kepler-452 b', '8311864'], ['LHS 1140 b', 'LHS 1140'],
    ['K2-18 b', 'K2-18'], ['55 Cancri e', '55 Cnc'], ['WASP-39 b', 'WASP-39'],
    ['HD 209458 b', 'HD 209458']
  ];
  const types = ['sell', 'trade', 'auction'];
  const examples = Array.from({ length: 30 }, (_, index) => {
    const [name, catalogId] = systems[index % systems.length];
    const type = types[index % types.length];
    return {
      id: `teaching-${index + 1}`,
      kepid: catalogId,
      planet_data: { pl_name: name },
      listing_type: type,
      price: 25 + index * 7.5,
      trade_description: 'Exchange research notes, observing plans, or educational mission designs.',
      created_at: new Date(Date.UTC(2026, 7, Math.max(1, 30 - index))).toISOString(),
      seller_username: 'Educational registry example',
      sourceUrl: `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(name)}`
    };
  });

  class Marketplace {
    constructor() {
      this.listings = examples;
      this.filter = 'all';
      this.sortBy = 'newest';
      this.currentPage = 1;
      this.pageSize = 18;
    }

    init() {
      if (!document.getElementById('marketplace-container')) return;
      this.setupFeatureTabs();
      this.render();
    }

    render() {
      const container = document.getElementById('marketplace-container');
      container.innerHTML = `<section class="marketplace" aria-labelledby="registry-title"><header class="marketplace-header"><div><h2 id="registry-title">Astronomical registry teaching models</h2><p>Explore how a future catalogue interface might organize non-legal claim, exchange, and auction concepts.</p></div></header><div class="marketplace-filters"><div class="filter-group"><label for="filter-select">Model type</label><select id="filter-select"><option value="all">All models</option><option value="sell">Fixed-price examples</option><option value="trade">Research exchanges</option><option value="auction">Auction examples</option></select></div><div class="filter-group"><label for="sort-select">Sort</label><select id="sort-select"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="price_low">Display value: low to high</option><option value="price_high">Display value: high to low</option></select></div></div><p class="marketplace-boundary"><strong>Browsing-only boundary:</strong> display values are fictional teaching data. There is no checkout, wallet, payment processor, ownership transfer, account write, or legal registry behind this page.</p><div id="listings-container" class="listings-container"></div></section>`;
      document.getElementById('filter-select').addEventListener('change', event => {
        this.filter = event.target.value;
        this.currentPage = 1;
        this.renderListings();
      });
      document.getElementById('sort-select').addEventListener('change', event => {
        this.sortBy = event.target.value;
        this.currentPage = 1;
        this.renderListings();
      });
      this.renderListings();
    }

    setupFeatureTabs() {
      const views = {
        'view-all-listings': 'marketplace-container',
        'view-rentals': 'rentals-container',
        'view-investments': 'investments-container',
        'view-crowdfunding': 'crowdfunding-container'
      };
      const buttons = Object.keys(views).map(id => document.getElementById(id)).filter(Boolean);
      const activate = button => {
        buttons.forEach(item => {
          const selected = item === button;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-selected', String(selected));
          item.tabIndex = selected ? 0 : -1;
          document.getElementById(views[item.id]).hidden = !selected;
        });
        this.renderPanel(button.id);
      };
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => activate(button));
        button.addEventListener('keydown', event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
          if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = buttons.length - 1;
          buttons[next].focus();
          activate(buttons[next]);
        });
      });
      activate(buttons[0]);
    }

    renderPanel(id) {
      const panels = {
        'view-rentals': ['Rental mission models', 'Compare fictional time-bounded access to observatory schedules, simulated habitats, and classroom mission assets. No real property or observing time is offered.', ['Duration and renewal scenarios', 'Mission-resource allocation', 'Transparent non-ownership status']],
        'view-investments': ['Research portfolio simulator', 'Explore how a hypothetical science portfolio could distribute a fixed classroom budget across spectroscopy, transit timing, atmospheric models, and outreach.', ['Risk and uncertainty notes', 'No securities or financial return', 'Browser-local planning only']],
        'view-crowdfunding': ['Mission-funding design lab', 'Study the components of an accountable public science campaign: milestones, open data, peer review, risk disclosure, and refund rules.', ['Milestone-based releases', 'Source and methods disclosure', 'No donations are collected here']]
      };
      if (id === 'view-all-listings') return;
      const panel = document.getElementById({ 'view-rentals': 'rentals-container', 'view-investments': 'investments-container', 'view-crowdfunding': 'crowdfunding-container' }[id]);
      const [title, description, items] = panels[id];
      panel.innerHTML = `<section class="marketplace-panel-card"><h2>${title}</h2><p>${description}</p><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul><a href="business-promise.html">Read the platform transparency commitment</a></section>`;
    }

    renderListings() {
      let filtered = this.filter === 'all' ? [...this.listings] : this.listings.filter(item => item.listing_type === this.filter);
      const sorters = {
        newest: (a, b) => b.created_at.localeCompare(a.created_at),
        oldest: (a, b) => a.created_at.localeCompare(b.created_at),
        price_low: (a, b) => a.price - b.price,
        price_high: (a, b) => b.price - a.price
      };
      filtered.sort(sorters[this.sortBy]);
      const pageCount = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      this.currentPage = Math.min(pageCount, Math.max(1, this.currentPage));
      const visible = filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
      const target = document.getElementById('listings-container');
      target.innerHTML = `<div class="listings-grid">${visible.map(listing => this.card(listing)).join('')}</div>`;
      if (pageCount > 1) {
        const pager = document.createElement('nav');
        pager.className = 'marketplace-pager';
        pager.setAttribute('aria-label', 'Registry pages');
        pager.innerHTML = `<button type="button" data-page="previous" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button><span aria-live="polite">Page ${this.currentPage} of ${pageCount}</span><button type="button" data-page="next" ${this.currentPage === pageCount ? 'disabled' : ''}>Next</button>`;
        pager.addEventListener('click', event => {
          const action = event.target.closest('[data-page]')?.dataset.page;
          if (!action) return;
          this.currentPage += action === 'next' ? 1 : -1;
          this.renderListings();
          target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
        target.append(pager);
      }
    }

    card(listing) {
      const labels = { sell: 'Fixed-value model', trade: 'Research exchange', auction: 'Auction model' };
      const name = this.escape(listing.planet_data.pl_name);
      return `<article class="listing-card"><div class="listing-header"><span class="listing-type-badge ${listing.listing_type}">${labels[listing.listing_type]}</span><time datetime="${listing.created_at}">${new Date(listing.created_at).toLocaleDateString()}</time></div><div class="listing-planet"><h3>${name}</h3><p class="kepid">Catalogue: ${this.escape(listing.kepid)}</p></div>${listing.listing_type === 'trade' ? `<div class="listing-trade"><p>${this.escape(listing.trade_description)}</p></div>` : `<div class="listing-price"><span class="price">${listing.price.toFixed(2)}</span><span class="currency">fictional credits</span></div>`}<p class="listing-seller">Educational example; not legal title.</p><a class="buy-btn" href="${listing.sourceUrl}" target="_blank" rel="noopener noreferrer">View NASA archive record</a></article>`;
    }

    escape(value) {
      return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
    }
  }

  window.Marketplace = Marketplace;
  const start = () => {
    if (!window.marketplace) {
      window.marketplace = new Marketplace();
      window.marketplace.init();
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
