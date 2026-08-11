/**
 * Planet Trading Marketplace UI Integration
 * UI components and integration for the marketplace
 */

class MarketplaceUIIntegration {
    constructor() {
        this.marketplace = null;
        this.container = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        // Wait for marketplace to be available
        if (window.Marketplace) {
            this.marketplace = window.Marketplace;
        } else {
            // Wait a bit and try again
            setTimeout(() => {
                if (window.Marketplace) {
                    this.marketplace = window.Marketplace;
                    this.render();
                }
            }, 1000);
        }

        this.isInitialized = true;
        console.log('🛒 Marketplace UI Integration initialized');
    }

    /**
     * Render marketplace UI
     */
    render() {
        const container = document.getElementById('marketplace-container');
        if (!container) return;

        this.container = container;

        // Create UI structure
        container.innerHTML = `
            <div class="marketplace-header">
                <h2>Planet Trading Marketplace</h2>
                <button id="create-listing-btn" class="btn-primary">Create Listing</button>
            </div>
            
            <div class="marketplace-filters">
                <input type="text" id="search-listings" placeholder="Search planets..." class="search-input">
                <select id="filter-type" class="filter-select">
                    <option value="all">All Types</option>
                    <option value="terrestrial">Terrestrial</option>
                    <option value="gas-giant">Gas Giant</option>
                    <option value="neptune">Neptune-like</option>
                </select>
                <select id="sort-by" class="filter-select">
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                </select>
            </div>

            <div id="listings-grid" class="listings-grid">
                <!-- Listings will be rendered here -->
            </div>

            <div id="listing-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <div id="listing-details"></div>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupEventListeners();
        
        // Load and render listings
        this.loadAndRenderListings();
    }

    setupEventListeners() {
        // Create listing button
        const createBtn = document.getElementById('create-listing-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateListingForm());
        }

        // Search
        const searchInput = document.getElementById('search-listings');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterListings(e.target.value));
        }

        // Filters
        const filterType = document.getElementById('filter-type');
        const sortBy = document.getElementById('sort-by');
        if (filterType) {
            filterType.addEventListener('change', () => this.applyFilters());
        }
        if (sortBy) {
            sortBy.addEventListener('change', () => this.applyFilters());
        }

        // Modal close
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('listing-modal').style.display = 'none';
            });
        }
    }

    async loadAndRenderListings() {
        if (!this.marketplace) return;

        const listings = this.marketplace.getAllListings();
        this.renderListings(listings);
    }

    renderListings(listings) {
        const grid = document.getElementById('listings-grid');
        if (!grid) return;

        if (listings.length === 0) {
            grid.innerHTML = '<p class="empty-state">No listings available</p>';
            return;
        }

        grid.innerHTML = listings.map(listing => `
            <div class="listing-card" data-id="${listing.id}">
                <div class="listing-image">
                    <span class="planet-icon">🪐</span>
                </div>
                <div class="listing-info">
                    <h3>${this.escapeHtml(listing.planetData.kepoi_name || listing.planetData.kepler_name || 'Unknown Planet')}</h3>
                    <p class="listing-type">${this.escapeHtml(listing.planetData.koi_pdisposition || 'Unknown Type')}</p>
                    <p class="listing-price">$${listing.price.toFixed(2)}</p>
                    <p class="listing-seller">Seller: ${this.escapeHtml(listing.sellerName)}</p>
                    <button class="btn-view-listing" data-id="${listing.id}">View Details</button>
                </div>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.btn-view-listing').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const listingId = e.target.dataset.id;
                this.showListingDetails(listingId);
            });
        });
    }

    showListingDetails(listingId) {
        if (!this.marketplace) return;

        const listing = this.marketplace.getListing(listingId);
        if (!listing) return;

        const modal = document.getElementById('listing-modal');
        const details = document.getElementById('listing-details');
        
        if (!modal || !details) return;

        details.innerHTML = `
            <h2>${this.escapeHtml(listing.planetData.kepoi_name || listing.planetData.kepler_name || 'Unknown Planet')}</h2>
            <div class="listing-full-details">
                <p><strong>Type:</strong> ${this.escapeHtml(listing.planetData.koi_pdisposition || 'Unknown')}</p>
                <p><strong>Price:</strong> $${listing.price.toFixed(2)}</p>
                <p><strong>Seller:</strong> ${this.escapeHtml(listing.sellerName)}</p>
                <p><strong>Description:</strong> ${this.escapeHtml(listing.description || 'No description')}</p>
                <p><strong>Listed:</strong> ${new Date(listing.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="listing-actions">
                <button class="btn-buy" data-id="${listing.id}">Buy Now</button>
                <button class="btn-make-offer" data-id="${listing.id}">Make Offer</button>
                <button class="btn-add-watchlist" data-id="${listing.id}">Add to Watchlist</button>
            </div>
        `;

        // Add action handlers
        details.querySelector('.btn-buy')?.addEventListener('click', () => this.buyListing(listingId));
        details.querySelector('.btn-make-offer')?.addEventListener('click', () => this.showOfferForm(listingId));
        details.querySelector('.btn-add-watchlist')?.addEventListener('click', () => this.addToWatchlist(listingId));

        modal.style.display = 'block';
    }

    async buyListing(listingId) {
        if (!this.marketplace) return;
        
        const confirmed = confirm('Are you sure you want to buy this planet?');
        if (!confirmed) return;

        const success = await this.marketplace.purchaseListing(listingId);
        if (success) {
            alert('Purchase successful!');
            this.loadAndRenderListings();
            document.getElementById('listing-modal').style.display = 'none';
        } else {
            alert('Purchase failed. Please try again.');
        }
    }

    showOfferForm(listingId) {
        const offerAmount = prompt('Enter your offer amount:');
        if (!offerAmount) return;

        const amount = parseFloat(offerAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (this.marketplace) {
            this.marketplace.makeOffer(listingId, amount);
            alert('Offer submitted!');
        }
    }

    addToWatchlist(listingId) {
        if (this.marketplace) {
            this.marketplace.addToWatchlist(listingId);
            alert('Added to watchlist!');
        }
    }

    showCreateListingForm() {
        // This would show a form to create a new listing
        // Implementation would depend on having planet data available
        alert('Create listing form - Select a planet from your claims to list it');
    }

    filterListings(searchTerm) {
        if (!this.marketplace) return;
        
        const listings = this.marketplace.getAllListings();
        const filtered = listings.filter(listing => {
            const name = (listing.planetData.kepoi_name || listing.planetData.kepler_name || '').toLowerCase();
            return name.includes(searchTerm.toLowerCase());
        });
        
        this.renderListings(filtered);
    }

    applyFilters() {
        // Apply type and sort filters
        this.loadAndRenderListings();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.marketplaceUIIntegration) {
            window.marketplaceUIIntegration = new MarketplaceUIIntegration();
        }
    });
}


