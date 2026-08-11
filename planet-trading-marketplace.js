/**
 * Planet Trading Marketplace
 * Marketplace for buying, selling, and trading planet claims
 * 
 * Features:
 * - Listing creation
 * - Search and filters
 * - Bidding system
 * - Transaction history
 * - Escrow system
 */

class PlanetTradingMarketplace {
    constructor() {
        if (typeof window !== 'undefined') {
            if (window.planetMarketplace) {
                window.planetTradingMarketplace = window.planetMarketplace;
                return window.planetMarketplace;
            }
            window.planetMarketplace = this;
            window.planetTradingMarketplace = this;
        }

        this.listings = [];
        this.bids = [];
        this.transactions = [];
        this._initPromise = null;
        this.supabase = (typeof window !== 'undefined' && (window.supabaseClient || window.supabase)) || null;
        this.init();
    }

    async init() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            await this.loadListings();
            this.createUI();
            console.log('🛒 Planet Trading Marketplace initialized');
        })();

        return this._initPromise;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tt_ra_di_ng_ma_rk_et_pl_ac_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    notify(msg, type = 'info') {
        try {
            if (typeof window !== 'undefined' && window.game && typeof window.game.notify === 'function') {
                window.game.notify(msg, type);
            } else {
                console.log(`[${type}] ${msg}`);
            }
        } catch (_) { /* ignore */ }
    }

    async currentUser() {
        if (!this.supabase || !this.supabase.auth) return null;
        try {
            const { data, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return data?.user || null;
        } catch (e) {
            console.warn('supabase auth getUser failed', e);
            return null;
        }
    }

    async persistAction(table, payload) {
        if (!this.supabase) return { ok: false, error: new Error('Supabase not configured') };
        try {
            const { error } = await this.supabase.from(table).insert(payload);
            if (error) throw error;
            return { ok: true };
        } catch (e) {
            console.warn(`Supabase insert to ${table} failed`, e);
            return { ok: false, error: e };
        }
    }

    escapeHtml(value) {
        try {
            const div = document.createElement('div');
            div.textContent = value == null ? '' : String(value);
            return div.innerHTML;
        } catch (_e) {
            return value == null ? '' : String(value);
        }
    }

    async loadListings() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('marketplace_listings')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (data && !error) {
                    this.listings = data;
                }
            }

            // Fallback seed listing if none loaded
            if (!Array.isArray(this.listings) || this.listings.length === 0) {
                this.listings = [{
                    id: 'seed-listing-1',
                    listing_type: 'sell',
                    kepid: 186,
                    price: 1000,
                    currency: 'credits',
                    seller_username: 'NPC Broker',
                    planet_data: { kepler_name: 'Kepler-186f', pl_name: 'Kepler-186f' },
                    description: 'Habitable-zone terrestrial world.'
                }];
            }
        } catch (e) {
            console.warn('Failed to load listings:', e);
        }
    }

    createUI() {
        const existingButtons = document.querySelectorAll('#marketplace-toggle');
        let button = existingButtons[0] || document.getElementById('marketplace-toggle');

        if (!button) {
            button = document.createElement('button');
            button.id = 'marketplace-toggle';
            document.body.appendChild(button);
        }

        if (existingButtons && existingButtons.length > 1) {
            existingButtons.forEach((btn, index) => {
                if (index > 0) btn.remove();
            });
        }

        button.textContent = '🛒 Marketplace';
        button.style.cssText = `
            position: fixed;
            bottom: 380px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9995;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;

        button.onclick = () => this.showMarketplace();
    }

    showMarketplace() {
        const existingModal = document.querySelector('.marketplace-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'marketplace-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 1200px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #ba944f; margin: 0;">Planet Trading Marketplace</h2>
                    <button id="close-marketplace" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 8px 15px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Close</button>
                </div>
                <div style="margin-bottom: 20px;">
                    <input type="text" id="marketplace-search" placeholder="Search planets..." style="
                        width: 100%;
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: 6px;
                        color: white;
                    ">
                </div>
                <div id="marketplace-listings" style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                    ${this.renderListings()}
                </div>
            </div>
        `;

        modal.querySelector('#close-marketplace').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    renderListings() {
        if (this.listings.length === 0) {
            return '<p>No listings available</p>';
        }

        return this.listings.map((listing) => {
            const planetData = listing.planet_data || listing.planetData || {};
            const name = planetData.pl_name || planetData.kepoi_name || planetData.kepler_name || (listing.kepid ? `KEPID ${listing.kepid}` : 'Unknown');
            const safeName = this.escapeHtml(name);
            const listingType = (listing.listing_type || listing.listingType || '').toString().toLowerCase();
            const safeType = this.escapeHtml(listingType || 'sell');
            const currency = listing.currency || 'USD';
            const safeCurrency = this.escapeHtml(currency);
            const parsedPrice = listing.price == null ? null : Number(listing.price);
            const safePrice = parsedPrice == null || Number.isNaN(parsedPrice) ? '' : this.escapeHtml(parsedPrice.toFixed(2));
            const safeDescription = this.escapeHtml(listing.trade_description || listing.description || '');

            return `
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(186, 148, 79, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                ">
                    <h3 style="color: #ba944f; margin: 0 0 10px 0;">${safeName}</h3>
                    <p style="margin: 5px 0;">Type: ${safeType}</p>
                    ${listingType === 'trade' ? `
                        <p style="margin: 5px 0; font-size: 0.9rem; color: #ccc;">${safeDescription}</p>
                    ` : `
                        <p style="margin: 5px 0;">Price: $${safePrice} ${safeCurrency}</p>
                        <button onclick="window.planetTradingMarketplace.buyListing('${listing.id}')" style="
                            width: 100%;
                            margin-top: 10px;
                            padding: 8px;
                            background: rgba(16, 185, 129, 0.3);
                            border: 1px solid #10b981;
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Buy</button>
                    `}
                    <button onclick="window.planetTradingMarketplace.viewListing('${listing.id}')" style="
                        width: 100%;
                        margin-top: 10px;
                        padding: 8px;
                        background: rgba(186, 148, 79, 0.3);
                        border: 1px solid #ba944f;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">View Details</button>
                </div>
            `;
        }).join('');
    }

    viewListing(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) {
            alert('Listing not found');
            return;
        }

        const existing = document.querySelector('.marketplace-listing-modal');
        if (existing) existing.remove();

        const planetData = listing.planet_data || listing.planetData || {};
        const name = planetData.pl_name || planetData.kepoi_name || planetData.kepler_name || (listing.kepid ? `KEPID ${listing.kepid}` : 'Unknown');
        const listingType = (listing.listing_type || listing.listingType || '').toString().toLowerCase();
        const currency = listing.currency || 'USD';
        const parsedPrice = listing.price == null ? null : Number(listing.price);

        const modal = document.createElement('div');
        modal.className = 'marketplace-listing-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 20px;
                max-width: 720px;
                width: 100%;
                color: white;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                    <h3 style="margin: 0; color: #ba944f;">${this.escapeHtml(name)}</h3>
                    <button id="close-listing-details" style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Close</button>
                </div>
                <div style="margin-top: 12px;">
                    <p style="margin: 6px 0;"><strong>Type:</strong> ${this.escapeHtml(listingType || 'sell')}</p>
                    ${listingType === 'trade' ? `
                        <p style="margin: 6px 0;"><strong>Trade:</strong> ${this.escapeHtml(listing.trade_description || '')}</p>
                    ` : `
                        <p style="margin: 6px 0;"><strong>Price:</strong> $${parsedPrice == null || Number.isNaN(parsedPrice) ? '' : parsedPrice.toFixed(2)} ${this.escapeHtml(currency)}</p>
                        <button id="buy-listing-btn" style="
                            margin-top: 10px;
                            padding: 10px 14px;
                            background: rgba(16, 185, 129, 0.25);
                            border: 1px solid #10b981;
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                            width: 100%;
                        ">Buy</button>
                    `}
                    <p style="margin: 6px 0;"><strong>Seller:</strong> ${this.escapeHtml(listing.seller_username || '')}</p>
                    <p style="margin: 6px 0;"><strong>KEPID:</strong> ${this.escapeHtml(listing.kepid || '')}</p>
                </div>
                <div style="margin-top:12px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                    <h4 style="color:#ba944f; margin:0 0 6px 0;">Ownership & Leasing</h4>
                    <div style="display:grid; gap:6px;">
                        <div>
                            <label style="font-size:0.85rem; color:#cbd5e1;">Transfer to user (email/username)</label>
                            <input id="transfer-user" type="text" placeholder="user@example.com" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff;">
                            <button id="transfer-btn" style="margin-top:6px; padding:8px; background:rgba(59,130,246,0.25); border:1px solid rgba(59,130,246,0.5); color:#3b82f6; border-radius:6px; cursor:pointer; width:100%;">Transfer Ownership</button>
                        </div>
                        <div>
                            <label style="font-size:0.85rem; color:#cbd5e1;">Start rental (credits/day)</label>
                            <input id="rental-rate" type="number" min="1" placeholder="100" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff;">
                            <input id="rental-days" type="number" min="1" placeholder="7 days" style="width:100%; margin-top:4px; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff;">
                            <button id="rental-btn" style="margin-top:6px; padding:8px; background:rgba(14,165,233,0.25); border:1px solid rgba(14,165,233,0.5); color:#0ea5e9; border-radius:6px; cursor:pointer; width:100%;">Start Rental</button>
                        </div>
                        <div>
                            <label style="font-size:0.85rem; color:#cbd5e1;">Invest (credits)</label>
                            <input id="invest-amount" type="number" min="1" placeholder="500" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff;">
                            <button id="invest-btn" style="margin-top:6px; padding:8px; background:rgba(234,179,8,0.2); border:1px solid rgba(234,179,8,0.5); color:#eab308; border-radius:6px; cursor:pointer; width:100%;">Invest</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('#close-listing-details')?.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const buyBtn = modal.querySelector('#buy-listing-btn');
        if (buyBtn && listingType !== 'trade') {
            buyBtn.addEventListener('click', () => {
                this.buyListing(listing.id);
                modal.remove();
            });
        }

        const transferBtn = modal.querySelector('#transfer-btn');
        if (transferBtn) {
            transferBtn.addEventListener('click', () => {
                const toUser = modal.querySelector('#transfer-user')?.value;
                this.transferListing(listing.id, toUser);
            });
        }

        const rentalBtn = modal.querySelector('#rental-btn');
        if (rentalBtn) {
            rentalBtn.addEventListener('click', () => {
                const rate = Number(modal.querySelector('#rental-rate')?.value);
                const days = Number(modal.querySelector('#rental-days')?.value || 1);
                this.startRental(listing.id, rate, days);
            });
        }

        const investBtn = modal.querySelector('#invest-btn');
        if (investBtn) {
            investBtn.addEventListener('click', () => {
                const amt = Number(modal.querySelector('#invest-amount')?.value);
                this.investListing(listing.id, amt);
            });
        }

        document.body.appendChild(modal);
    }

    buyListing(listingId) {
        const listing = this.listings.find((l) => l.id === listingId);
        if (!listing) {
            alert('Listing not found');
            return;
        }
        const price = Number(listing.price);
        if (!window.game || typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
            alert('Purchase unavailable.');
            return;
        }
        if (!window.game.resources) window.game.resources = {};
        const credits = typeof window.game.resources.credits === 'number' ? window.game.resources.credits : 0;
        if (credits < price) {
            if (window.game.notify) window.game.notify(`Not enough credits. Need ${price}.`, 'warning');
            else alert('Not enough credits.');
            return;
        }

        window.game.resources.credits = credits - price;
        if (!window.game.claims) window.game.claims = {};
        if (listing.kepid) {
            window.game.claims[listing.kepid] = 'player';
        }
        if (!window.game.claimedPlanets) window.game.claimedPlanets = [];
        const claimName = (listing.planet_data && (listing.planet_data.kepler_name || listing.planet_data.pl_name)) || listing.kepid || 'Planet';
        window.game.claimedPlanets.push({ kepid: listing.kepid, name: claimName, source: 'market' });

        if (window.game.notify) window.game.notify(`Purchased ${claimName} for ${price} credits.`, 'success');
        this.trackEvent('listing_purchased', { id: listing.id, price });
        this.persistAction('marketplace_transactions', {
            listing_id: listing.id,
            action: 'buy',
            amount: price,
            currency: listing.currency || 'credits',
            kepid: listing.kepid || null,
            planet_data: listing.planet_data || null,
            user_note: 'client-buy',
        }).then((res) => {
            if (!res.ok) this.notify('Purchase recorded locally; failed to persist.', 'warning');
        });
    }

    async transferListing(listingId, toUser) {
        const listing = this.listings.find((l) => l.id === listingId);
        if (!listing) return alert('Listing not found');
        if (!toUser || typeof toUser !== 'string') return alert('Enter a recipient username/email.');
        if (window.game && window.game.notify) window.game.notify(`Ownership transfer queued to ${toUser} for ${listing.kepid || listing.id}.`, 'info');
        this.trackEvent('ownership_transfer', { id: listingId, toUser });
        const user = await this.currentUser();
        const payload = {
            listing_id: listingId,
            to_user: toUser,
            from_user: user?.id || null,
            note: 'client-transfer',
        };
        this.persistAction('marketplace_transfers', payload).then((res) => {
            if (!res.ok) this.notify('Transfer queued locally; failed to persist.', 'warning');
            else this.notify('Transfer persisted to marketplace.', 'success');
        });
    }

    async startRental(listingId, rate, days) {
        const listing = this.listings.find((l) => l.id === listingId);
        if (!listing) return alert('Listing not found');
        const pricePerDay = Number(rate);
        const duration = Number(days);
        if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) return alert('Enter rental rate.');
        if (!Number.isFinite(duration) || duration <= 0) return alert('Enter rental days.');
        if (!window.game) window.game = {};
        if (!window.game.resources) window.game.resources = {};
        const credits = typeof window.game.resources.credits === 'number' ? window.game.resources.credits : 0;
        const total = pricePerDay * duration;
        if (credits < total) return window.game.notify ? window.game.notify(`Need ${total} credits for rental.`, 'warning') : alert('Not enough credits.');
        window.game.resources.credits = credits - total;
        if (!window.game.rentals) window.game.rentals = [];
        window.game.rentals.push({ listingId, pricePerDay, duration, startedAt: Date.now() });
        if (window.game.notify) window.game.notify(`Rental started for ${duration} days at ${pricePerDay}/day.`, 'success');
        this.trackEvent('rental_started', { id: listingId, pricePerDay, duration });
        const user = await this.currentUser();
        const payload = {
            listing_id: listingId,
            renter_id: user?.id || null,
            price_per_day: pricePerDay,
            duration_days: duration,
            amount: total,
            note: 'client-rental',
        };
        this.persistAction('marketplace_rentals', payload).then((res) => {
            if (!res.ok) this.notify('Rental recorded locally; failed to persist.', 'warning');
            else this.notify('Rental persisted to marketplace.', 'success');
        });
    }

    async investListing(listingId, amount) {
        const listing = this.listings.find((l) => l.id === listingId);
        if (!listing) return alert('Listing not found');
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) return alert('Enter investment amount.');
        if (!window.game) window.game = {};
        if (!window.game.resources) window.game.resources = {};
        const credits = typeof window.game.resources.credits === 'number' ? window.game.resources.credits : 0;
        if (credits < amt) return window.game.notify ? window.game.notify(`Need ${amt} credits to invest.`, 'warning') : alert('Not enough credits.');
        window.game.resources.credits = credits - amt;
        if (!window.game.investments) window.game.investments = [];
        window.game.investments.push({ listingId, amount: amt, at: Date.now() });
        if (window.game.notify) window.game.notify(`Invested ${amt} credits into ${listing.kepid || listing.id}.`, 'success');
        this.trackEvent('investment_made', { id: listingId, amount: amt });
        const user = await this.currentUser();
        const payload = {
            listing_id: listingId,
            investor_id: user?.id || null,
            amount: amt,
            note: 'client-invest',
        };
        this.persistAction('marketplace_investments', payload).then((res) => {
            if (!res.ok) this.notify('Investment recorded locally; failed to persist.', 'warning');
            else this.notify('Investment persisted to marketplace.', 'success');
        });
    }

    /**
     * Render the full marketplace UI into a container
     * @param {HTMLElement} container - Container element to render into
     */
    async renderMarketplace(container) {
        if (!container) return;

        // Add search bar
        const searchContainer = document.createElement('div');
        searchContainer.style.marginBottom = '20px';
        searchContainer.innerHTML = `
            <input type="text" id="marketplace-page-search" placeholder="Search planets..." style="
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 8px;
                color: white;
                font-family: inherit;
            ">
        `;
        container.innerHTML = ''; // Clear container
        container.appendChild(searchContainer);

        // Render listings grid
        const grid = document.createElement('div');
        grid.id = 'marketplace-page-listings';
        grid.style.cssText = 'display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));';
        grid.innerHTML = this.renderListings();
        container.appendChild(grid);

        // Add event listeners
        const searchInput = document.getElementById('marketplace-page-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                // Filter listings (simple client-side filter for now)
                const items = grid.children;
                Array.from(items).forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(term) ? 'block' : 'none';
                });
            });
        }
    }

    async createListing(planetId, price, description) {
        try {
            if (!window.supabase) return false;

            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                alert('Please login to create a listing');
                return false;
            }

            const isUuid = typeof planetId === 'string' &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planetId);

            let claim = null;
            if (isUuid) {
                const { data: claimData, error: claimError } = await window.supabase
                    .from('planet_claims')
                    .select('id, kepid, planet_data, user_id, status')
                    .eq('id', planetId)
                    .single();
                if (claimError) throw claimError;
                claim = claimData;
            } else {
                const kepid = Number(planetId);
                if (!Number.isNaN(kepid)) {
                    const { data: claimData, error: claimError } = await window.supabase
                        .from('planet_claims')
                        .select('id, kepid, planet_data, user_id, status')
                        .eq('kepid', kepid)
                        .eq('user_id', user.id)
                        .eq('status', 'active')
                        .single();
                    if (claimError) throw claimError;
                    claim = claimData;
                }
            }

            if (!claim) {
                alert('Planet claim not found');
                return false;
            }

            if (claim.user_id && claim.user_id !== user.id) {
                alert('You can only list your own claimed planets');
                return false;
            }

            const parsedPrice = price == null ? null : Number(price);
            const { error } = await window.supabase
                .from('marketplace_listings')
                .insert({
                    seller_id: user.id,
                    seller_username: user.user_metadata?.username || user.email,
                    claim_id: claim.id,
                    kepid: claim.kepid,
                    planet_data: claim.planet_data,
                    listing_type: 'sell',
                    price: parsedPrice,
                    currency: 'USD',
                    trade_description: description || null,
                    status: 'active'
                });

            if (error) throw error;

            await this.loadListings();
            return true;
        } catch (e) {
            console.error('Failed to create listing:', e);
            alert('Failed to create listing: ' + (e?.message || e));
        }
        return false;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetTradingMarketplace = PlanetTradingMarketplace;
}

