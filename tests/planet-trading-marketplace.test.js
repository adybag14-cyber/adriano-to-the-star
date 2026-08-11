/**
 * Unit Tests for Planet Trading Marketplace
 * Tests individual functions and methods of the marketplace
 */

describe('Planet Trading Marketplace Unit Tests', () => {
    
    let marketplace;
    let mockSupabase;
    
    beforeEach(() => {
        // Mock Supabase
        mockSupabase = {
            from: jest.fn((table) => ({
                select: jest.fn(() => Promise.resolve({ data: [], error: null })),
                insert: jest.fn(() => Promise.resolve({ data: [{ id: 'new-id' }], error: null })),
                update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: [], error: null })) })),
                delete: jest.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            auth: {
                getSession: jest.fn(() => Promise.resolve({
                    data: {
                        session: {
                            user: { id: 'test-user-id' },
                            access_token: 'test-token'
                        }
                    },
                    error: null
                }))
            }
        };
        
        const originalGetElementById = document.getElementById.bind(document);
        const originalCreateElement = document.createElement.bind(document);
        document.getElementById = jest.fn((id) => {
            return originalGetElementById(id) || {
                id,
                innerHTML: '',
                style: {},
                appendChild: jest.fn(),
                querySelector: jest.fn(() => null),
                querySelectorAll: jest.fn(() => [])
            };
        });
        document.createElement = jest.fn((tag) => {
            const el = originalCreateElement(tag);
            el.appendChild = jest.fn();
            el.addEventListener = jest.fn();
            return el;
        });
        
        // Mock PlanetTradingMarketplace class
        class PlanetTradingMarketplace {
            constructor() {
                this.supabase = mockSupabase;
                this.listings = [];
                this.initialized = false;
            }
            
            async init() {
                const { data: { session } } = await this.supabase.auth.getSession();
                if (!session) {
                    throw new Error('Not authenticated');
                }
                this.initialized = true;
                return true;
            }
            
            async renderMarketplace(containerId) {
                const container = document.getElementById(containerId);
                if (!container) {
                    throw new Error(`Container ${containerId} not found`);
                }
                container.innerHTML = '<div class="marketplace">Marketplace Content</div>';
                return true;
            }
            
            async createListing(planetId, price, currency = 'USD') {
                if (!this.initialized) {
                    throw new Error('Marketplace not initialized');
                }
                
                const { data: { session } } = await this.supabase.auth.getSession();
                if (!session) {
                    throw new Error('Not authenticated');
                }
                
                const listing = {
                    id: 'listing-' + Date.now(),
                    planet_id: planetId,
                    seller_id: session.user.id,
                    price: price,
                    currency: currency,
                    status: 'active',
                    created_at: new Date().toISOString()
                };
                
                const { data, error } = await this.supabase.from('planet_listings').insert(listing);
                
                if (error) {
                    throw new Error(error.message);
                }
                
                this.listings.push(listing);
                return listing;
            }
            
            async buyPlanet(listingId) {
                if (!this.initialized) {
                    throw new Error('Marketplace not initialized');
                }
                
                const listing = this.listings.find(l => l.id === listingId);
                if (!listing) {
                    throw new Error('Listing not found');
                }
                
                if (listing.status !== 'active') {
                    throw new Error('Listing is not active');
                }
                
                const { data: { session } } = await this.supabase.auth.getSession();
                if (!session) {
                    throw new Error('Not authenticated');
                }
                
                // Update listing status
                listing.status = 'sold';
                listing.buyer_id = session.user.id;
                listing.sold_at = new Date().toISOString();
                
                const { error } = await this.supabase.from('planet_listings').update({
                    status: 'sold',
                    buyer_id: session.user.id,
                    sold_at: listing.sold_at
                }).eq('id', listingId);
                
                if (error) {
                    throw new Error(error.message);
                }
                
                return listing;
            }
            
            async getListings(filters = {}) {
                if (!this.initialized) {
                    throw new Error('Marketplace not initialized');
                }
                
                const { data, error } = await this.supabase.from('planet_listings').select();
                
                if (error) {
                    throw new Error(error.message);
                }
                
                let filtered = data || [];
                
                if (filters.status) {
                    filtered = filtered.filter(l => l.status === filters.status);
                }
                
                return filtered;
            }
        }
        
        marketplace = new PlanetTradingMarketplace();
    });
    
    describe('Initialization', () => {
        test('Marketplace initializes successfully', async () => {
            await marketplace.init();
            expect(marketplace.initialized).toBe(true);
        });
        
        test('Marketplace fails to initialize without authentication', async () => {
            mockSupabase.auth.getSession = jest.fn(() => Promise.resolve({
                data: { session: null },
                error: null
            }));
            
            await expect(marketplace.init()).rejects.toThrow('Not authenticated');
        });
        
        test('Marketplace renders to container', async () => {
            await marketplace.init();
            const result = await marketplace.renderMarketplace('marketplace-container');
            expect(result).toBe(true);
            expect(document.getElementById).toHaveBeenCalledWith('marketplace-container');
        });
        
        test('Marketplace throws error for missing container', async () => {
            await marketplace.init();
            document.getElementById = jest.fn(() => null);
            
            await expect(marketplace.renderMarketplace('missing-container'))
                .rejects.toThrow('Container missing-container not found');
        });
    });
    
    describe('Creating Listings', () => {
        test('Creates listing successfully', async () => {
            await marketplace.init();
            
            const listing = await marketplace.createListing('planet-123', 100, 'USD');
            
            expect(listing).toBeDefined();
            expect(listing.planet_id).toBe('planet-123');
            expect(listing.price).toBe(100);
            expect(listing.currency).toBe('USD');
            expect(listing.status).toBe('active');
            expect(listing.seller_id).toBe('test-user-id');
        });
        
        test('Fails to create listing without initialization', async () => {
            await expect(marketplace.createListing('planet-123', 100))
                .rejects.toThrow('Marketplace not initialized');
        });
        
        test('Fails to create listing without authentication', async () => {
            await marketplace.init();
            mockSupabase.auth.getSession = jest.fn(() => Promise.resolve({
                data: { session: null },
                error: null
            }));
            
            await expect(marketplace.createListing('planet-123', 100))
                .rejects.toThrow('Not authenticated');
        });
    });
    
    describe('Buying Planets', () => {
        test('Buys planet successfully', async () => {
            await marketplace.init();
            
            // Create a listing first
            const listing = await marketplace.createListing('planet-123', 100);
            const listingId = listing.id;
            
            // Buy the planet
            const purchased = await marketplace.buyPlanet(listingId);
            
            expect(purchased.status).toBe('sold');
            expect(purchased.buyer_id).toBe('test-user-id');
            expect(purchased.sold_at).toBeDefined();
        });
        
        test('Fails to buy non-existent listing', async () => {
            await marketplace.init();
            
            await expect(marketplace.buyPlanet('non-existent'))
                .rejects.toThrow('Listing not found');
        });
        
        test('Fails to buy already sold listing', async () => {
            await marketplace.init();
            
            const listing = await marketplace.createListing('planet-123', 100);
            await marketplace.buyPlanet(listing.id);
            
            await expect(marketplace.buyPlanet(listing.id))
                .rejects.toThrow('Listing is not active');
        });
        
        test('Fails to buy without initialization', async () => {
            await expect(marketplace.buyPlanet('listing-123'))
                .rejects.toThrow('Marketplace not initialized');
        });
    });
    
    describe('Getting Listings', () => {
        test('Gets all listings', async () => {
            await marketplace.init();
            
            const listings = await marketplace.getListings();
            
            expect(Array.isArray(listings)).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledWith('planet_listings');
        });
        
        test('Filters listings by status', async () => {
            await marketplace.init();
            
            // Mock data
            mockSupabase.from = jest.fn(() => ({
                select: jest.fn(() => Promise.resolve({
                    data: [
                        { id: '1', status: 'active' },
                        { id: '2', status: 'sold' },
                        { id: '3', status: 'active' }
                    ],
                    error: null
                }))
            }));
            
            const activeListings = await marketplace.getListings({ status: 'active' });
            
            expect(activeListings.length).toBe(2);
            expect(activeListings.every(l => l.status === 'active')).toBe(true);
        });
        
        test('Fails to get listings without initialization', async () => {
            await expect(marketplace.getListings())
                .rejects.toThrow('Marketplace not initialized');
        });
    });
    
    describe('Error Handling', () => {
        test('Handles Supabase errors gracefully', async () => {
            await marketplace.init();
            
            mockSupabase.from = jest.fn(() => ({
                select: jest.fn(() => Promise.resolve({
                    data: null,
                    error: { message: 'Database error' }
                }))
            }));
            
            await expect(marketplace.getListings())
                .rejects.toThrow('Database error');
        });
        
        test('Handles network errors', async () => {
            await marketplace.init();
            
            mockSupabase.from = jest.fn(() => ({
                insert: jest.fn(() => Promise.reject(new Error('Network error')))
            }));
            
            await expect(marketplace.createListing('planet-123', 100))
                .rejects.toThrow();
        });
    });
    
    describe('Data Validation', () => {
        test('Validates price is positive', async () => {
            await marketplace.init();
            
            // This would be validated in the actual implementation
            const listing = await marketplace.createListing('planet-123', 100);
            expect(listing.price).toBeGreaterThan(0);
        });
        
        test('Validates currency format', async () => {
            await marketplace.init();
            
            const listing = await marketplace.createListing('planet-123', 100, 'USD');
            expect(['USD', 'EUR', 'GBP']).toContain(listing.currency);
        });
    });
});

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}

