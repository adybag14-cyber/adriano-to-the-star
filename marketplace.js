/**
 * Planet Marketplace
 * Buy, sell, and trade exoplanet claims
 */

class Marketplace {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.listings = [];
        this.userClaims = [];
        this.filter = 'all'; // all, sell, trade, auction
        this.sortBy = 'newest'; // newest, oldest, price_low, price_high
        this.reputationSystem = null;
    }

    async init() {
        const container = document.getElementById('marketplace-container');
        if (!container) {
            console.error('Marketplace container not found');
            return;
        }

        this.supabase = this.supabase || window.supabaseClient || window.supabase;

        const supabaseAvailable =
            this.supabase &&
            this.supabase.auth &&
            typeof this.supabase.auth.getUser === 'function' &&
            typeof this.supabase.from === 'function';

        if (!supabaseAvailable) {
            console.warn('⚠️ Supabase client not available - Marketplace features disabled');
            container.innerHTML = '<div class="error-message">Marketplace is unavailable right now. Please try again later.</div>';
            return;
        }

        try {
            // Check authentication
            const userResult = await this.supabase.auth.getUser();
            this.currentUser = userResult && userResult.data ? userResult.data.user : null;

            // Initialize reputation system
            if (window.ReputationSystem) {
                this.reputationSystem = new window.ReputationSystem();
                await this.reputationSystem.init();
            }

            this.render();
            await this.loadListings();
            await this.loadUserClaims();
        } catch (error) {
            console.error('Error initializing marketplace:', error);
            container.innerHTML = '<div class="error-message">Failed to initialize marketplace. Please refresh the page.</div>';
        }
    }

    /**
     * Render the marketplace UI
     */
    render() {
        const container = document.getElementById('marketplace-container');
        if (!container) return;

        container.innerHTML = `
            <div class="marketplace">
                <div class="marketplace-header">
                    <h2>🌌 Planet Trading Marketplace</h2>
                    ${this.currentUser ? `
                        <button class="create-listing-btn" id="create-listing-btn">
                            + Create Listing
                        </button>
                    ` : `
                        <p class="login-prompt">Please <a href="login.html">login</a> to create listings</p>
                    `}
                </div>

                <div class="marketplace-filters">
                    <div class="filter-group">
                        <label>Filter:</label>
                        <select id="filter-select">
                            <option value="all">All Listings</option>
                            <option value="sell">For Sale</option>
                            <option value="trade">For Trade</option>
                            <option value="auction">Auctions</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort:</label>
                        <select id="sort-select">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div id="listings-container" class="listings-container">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading marketplace...</p>
                    </div>
                </div>
            </div>

            <!-- Create Listing Modal -->
            <div id="create-listing-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Listing</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="listing-form">
                            <div class="form-group">
                                <label>Select Your Planet Claim:</label>
                                <select id="claim-select" required>
                                    <option value="">-- Select a planet --</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Listing Type:</label>
                                <select id="listing-type" required>
                                    <option value="sell">For Sale</option>
                                    <option value="trade">For Trade</option>
                                    <option value="auction">Auction</option>
                                </select>
                            </div>
                            <div class="form-group" id="price-group">
                                <label>Price (USD):</label>
                                <input type="number" id="listing-price" min="0" step="0.01" placeholder="0.00">
                            </div>
                            <div class="form-group" id="trade-group" style="display: none;">
                                <label>Trade Description:</label>
                                <textarea id="trade-description" rows="4" placeholder="What are you looking for in trade?"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Expiration Date (optional):</label>
                                <input type="datetime-local" id="expires-at">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="submit-btn">Create Listing</button>
                                <button type="button" class="cancel-btn" id="cancel-listing">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter and sort
        const filterSelect = document.getElementById('filter-select');
        const sortSelect = document.getElementById('sort-select');
        
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filter = e.target.value;
                this.renderListings();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderListings();
            });
        }

        // Create listing button
        const createBtn = document.getElementById('create-listing-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Modal close
        const modalClose = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-listing');
        const modal = document.getElementById('create-listing-modal');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideCreateModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreateModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideCreateModal();
            });
        }

        // Listing type change
        const listingType = document.getElementById('listing-type');
        if (listingType) {
            listingType.addEventListener('change', (e) => {
                const priceGroup = document.getElementById('price-group');
                const tradeGroup = document.getElementById('trade-group');
                
                if (e.target.value === 'trade') {
                    priceGroup.style.display = 'none';
                    tradeGroup.style.display = 'block';
                    document.getElementById('listing-price').required = false;
                    document.getElementById('trade-description').required = true;
                } else {
                    priceGroup.style.display = 'block';
                    tradeGroup.style.display = 'none';
                    document.getElementById('listing-price').required = true;
                    document.getElementById('trade-description').required = false;
                }
            });
        }

        // Form submission
        const form = document.getElementById('listing-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createListing();
            });
        }
    }

    /**
     * Load marketplace listings
     */
    async loadListings() {
        try {
            const { data, error } = await this.supabase
                .from('marketplace_listings')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.listings = data || [];
            this.renderListings();
        } catch (error) {
            console.error('Error loading listings:', error);
            this.showError('Failed to load marketplace listings');
        }
    }

    /**
     * Load user's planet claims
     */
    async loadUserClaims() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('planet_claims')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('status', 'active');

            if (error) throw error;

            this.userClaims = data || [];
            this.populateClaimSelect();
        } catch (error) {
            console.error('Error loading user claims:', error);
        }
    }

    /**
     * Populate claim select dropdown
     */
    populateClaimSelect() {
        const select = document.getElementById('claim-select');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select a planet --</option>';
        
        this.userClaims.forEach(claim => {
            const planetName = claim.planet_data?.pl_name || `KEPID ${claim.kepid}`;
            const option = document.createElement('option');
            option.value = claim.id;
            option.textContent = `${planetName} (KEPID: ${claim.kepid})`;
            option.dataset.kepid = claim.kepid;
            option.dataset.planetData = JSON.stringify(claim.planet_data);
            select.appendChild(option);
        });
    }

    /**
     * Render listings
     */
    renderListings() {
        const container = document.getElementById('listings-container');
        if (!container) return;

        // Filter listings
        let filtered = this.listings;
        if (this.filter !== 'all') {
            filtered = filtered.filter(l => l.listing_type === this.filter);
        }

        // Sort listings
        filtered = [...filtered].sort((a, b) => {
            switch (this.sortBy) {
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'price_low':
                    return (a.price || 0) - (b.price || 0);
                case 'price_high':
                    return (b.price || 0) - (a.price || 0);
                default: // newest
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-listings">No listings found</div>';
            return;
        }

        container.innerHTML = `
            <div class="listings-grid">
                ${filtered.map(listing => this.renderListingCard(listing)).join('')}
            </div>
        `;

        // Add event listeners to listing cards
        container.querySelectorAll('.listing-card').forEach(card => {
            const buyBtn = card.querySelector('.buy-btn');
            if (buyBtn) {
                buyBtn.addEventListener('click', () => {
                    const listingId = card.dataset.listingId;
                    this.handlePurchase(listingId);
                });
            }
        });
    }

    /**
     * Render a single listing card
     */
    renderListingCard(listing) {
        const planetName = listing.planet_data?.pl_name || `KEPID ${listing.kepid}`;
        const listingTypeLabel = {
            'sell': 'For Sale',
            'trade': 'For Trade',
            'auction': 'Auction'
        }[listing.listing_type] || listing.listing_type;

        return `
            <div class="listing-card" data-listing-id="${listing.id}">
                <div class="listing-header">
                    <span class="listing-type-badge ${listing.listing_type}">${listingTypeLabel}</span>
                    <span class="listing-date">${new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
                <div class="listing-planet">
                    <h3>${planetName}</h3>
                    <p class="kepid">KEPID: ${listing.kepid}</p>
                </div>
                ${listing.listing_type === 'sell' || listing.listing_type === 'auction' ? `
                    <div class="listing-price">
                        <span class="price">$${parseFloat(listing.price || 0).toFixed(2)}</span>
                        <span class="currency">${listing.currency || 'USD'}</span>
                    </div>
                ` : ''}
                ${listing.listing_type === 'trade' ? `
                    <div class="listing-trade">
                        <p><strong>Looking for:</strong></p>
                        <p>${listing.trade_description || 'Open to any trade offers'}</p>
                    </div>
                ` : ''}
                <div class="listing-seller">
                    <span>Seller: ${listing.seller_username || 'Unknown'}</span>
                </div>
                ${this.currentUser && this.currentUser.id !== listing.seller_id ? `
                    <button class="buy-btn">${listing.listing_type === 'auction' ? 'Place Bid' : listing.listing_type === 'trade' ? 'Propose Trade' : 'Buy Now'}</button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Show create listing modal
     */
    showCreateModal() {
        if (!this.currentUser) {
            alert('Please login to create a listing');
            return;
        }

        if (this.userClaims.length === 0) {
            alert('You need to claim a planet first before creating a listing');
            return;
        }

        const modal = document.getElementById('create-listing-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide create listing modal
     */
    hideCreateModal() {
        const modal = document.getElementById('create-listing-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('listing-form')?.reset();
        }
    }

    /**
     * Create a new listing
     */
    async createListing() {
        if (!this.currentUser) return;

        const form = document.getElementById('listing-form');
        const formData = new FormData(form);
        
        const claimId = document.getElementById('claim-select').value;
        const listingType = document.getElementById('listing-type').value;
        const price = listingType !== 'trade' ? parseFloat(document.getElementById('listing-price').value) : null;
        const tradeDescription = listingType === 'trade' ? document.getElementById('trade-description').value : null;
        const expiresAt = document.getElementById('expires-at').value || null;

        if (!claimId) {
            alert('Please select a planet claim');
            return;
        }

        // Get claim data
        const claim = this.userClaims.find(c => c.id === claimId);
        if (!claim) {
            alert('Selected claim not found');
            return;
        }

        // Check if listing already exists for this claim
        const { data: existing } = await this.supabase
            .from('marketplace_listings')
            .select('id')
            .eq('claim_id', claimId)
            .eq('status', 'active')
            .single();

        if (existing) {
            alert('This planet already has an active listing');
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('marketplace_listings')
                .insert({
                    seller_id: this.currentUser.id,
                    seller_username: this.currentUser.user_metadata?.username || this.currentUser.email,
                    claim_id: claimId,
                    kepid: claim.kepid,
                    planet_data: claim.planet_data,
                    listing_type: listingType,
                    price: price,
                    trade_description: tradeDescription,
                    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;

            alert('Listing created successfully!');
            
            // Update reputation
            if (this.reputationSystem) {
                await this.reputationSystem.updateActivity('listing_created');
            }
            
            this.hideCreateModal();
            await this.loadListings();
        } catch (error) {
            console.error('Error creating listing:', error);
            alert('Failed to create listing: ' + error.message);
        }
    }

    /**
     * Handle purchase/trade/auction
     */
    async handlePurchase(listingId) {
        if (!this.currentUser) {
            alert('Please login to purchase');
            return;
        }

        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) {
            alert('Listing not found');
            return;
        }

        if (listing.seller_id === this.currentUser.id) {
            alert('You cannot purchase your own listing');
            return;
        }

        // For now, we'll just mark it as sold
        // In a real implementation, you'd handle payment processing here
        const confirmed = confirm(
            `Are you sure you want to ${listing.listing_type === 'trade' ? 'propose a trade for' : 'purchase'} this planet?`
        );

        if (!confirmed) return;

        try {
            // Update listing status
            const { error: updateError } = await this.supabase
                .from('marketplace_listings')
                .update({
                    status: 'sold',
                    buyer_id: this.currentUser.id,
                    buyer_username: this.currentUser.user_metadata?.username || this.currentUser.email,
                    sold_at: new Date().toISOString()
                })
                .eq('id', listingId);

            if (updateError) throw updateError;

            // Transfer the claim to the buyer
            const { error: transferError } = await this.supabase
                .from('planet_claims')
                .update({
                    user_id: this.currentUser.id,
                    username: this.currentUser.user_metadata?.username || this.currentUser.email,
                    email: this.currentUser.email,
                    updated_at: new Date().toISOString()
                })
                .eq('id', listing.claim_id);

            if (transferError) throw transferError;

            alert('Transaction completed successfully!');
            
            // Update reputation for both buyer and seller
            if (this.reputationSystem) {
                await this.reputationSystem.updateActivity('transaction_completed');
            }
            
            await this.loadListings();
        } catch (error) {
            console.error('Error processing purchase:', error);
            alert('Failed to process transaction: ' + error.message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('listings-container');
        if (container) {
            container.innerHTML = `<div class="error-state">⚠️ ${message}</div>`;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Marketplace;
}

// Make available globally
window.Marketplace = Marketplace;

