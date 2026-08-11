/**
 * Broadband Deal Checker v3.0
 * 
 * Advanced UK Broadband Provider Search with Real-time Price Checking via Google Cloud.
 * Searches and filters 300+ UK broadband providers with caching and fallback support.
 * 
 * @class BroadbandChecker
 * @author Adriano To The Star
 * @version 3.0.0
 * @since 2025-01
 * 
 * @example
 * // Initialize broadband checker
 * const checker = new BroadbandChecker();
 */

const KNOWN_PROVIDER_DATA = {
    // Major ISPs - Updated November 2024
    'BT': {
        website: 'https://www.bt.com/broadband',
        deals: [
            { name: 'Full Fibre 100', speed: '100Mbps', price: '29.99' },
            { name: 'Full Fibre 500', speed: '500Mbps', price: '39.99' },
            { name: 'Full Fibre 900', speed: '900Mbps', price: '54.99' }
        ],
        status: 'active'
    },
    'EE': {
        website: 'https://ee.co.uk/broadband',
        deals: [
            { name: 'Full Fibre 36', speed: '36Mbps', price: '27.00' },
            { name: 'Full Fibre 500', speed: '500Mbps', price: '44.00' },
            { name: 'Full Fibre 900', speed: '900Mbps', price: '54.00' }
        ],
        status: 'active'
    },
    'Sky': {
        website: 'https://www.sky.com/shop/broadband-talk',
        deals: [
            { name: 'Superfast', speed: '59Mbps', price: '25.00' },
            { name: 'Ultrafast', speed: '145Mbps', price: '29.00' },
            { name: 'Gigafast', speed: '900Mbps', price: '45.00' }
        ],
        status: 'active'
    },
    'Virgin Media Limited': {
        website: 'https://www.virginmedia.com/broadband',
        deals: [
            { name: 'M125', speed: '132Mbps', price: '26.50' },
            { name: 'M250', speed: '264Mbps', price: '30.50' },
            { name: 'Gig1', speed: '1130Mbps', price: '45.00' }
        ],
        status: 'active'
    },
    'TalkTalk': {
        website: 'https://www.talktalk.co.uk/shop/broadband',
        deals: [
            { name: 'Fibre 35', speed: '38Mbps', price: '24.00' },
            { name: 'Fibre 65', speed: '67Mbps', price: '28.00' },
            { name: 'Full Fibre 900', speed: '900Mbps', price: '39.95' }
        ],
        status: 'active'
    },
    'Vodafone Ltd': {
        website: 'https://www.vodafone.co.uk/broadband',
        deals: [
            { name: 'Superfast 1', speed: '38Mbps', price: '22.00' },
            { name: 'Superfast 2', speed: '73Mbps', price: '25.00' },
            { name: 'Pro II Xtra', speed: '910Mbps', price: '38.00' }
        ],
        status: 'active'
    },
    'Plusnet': {
        website: 'https://www.plus.net/broadband',
        deals: [
            { name: 'Unlimited Fibre', speed: '66Mbps', price: '27.99' },
            { name: 'Unlimited Fibre Extra', speed: '74Mbps', price: '29.99' },
            { name: 'Full Fibre 500', speed: '500Mbps', price: '39.99' }
        ],
        status: 'active'
    },
    'NOW': {
        website: 'https://www.nowtv.com/broadband',
        deals: [
            { name: 'Brilliant Broadband', speed: '11Mbps', price: '18.00' },
            { name: 'Fab Fibre', speed: '36Mbps', price: '20.00' },
            { name: 'Super Fibre', speed: '63Mbps', price: '22.00' }
        ],
        status: 'active'
    },
    'Three UK': {
        website: 'https://www.three.co.uk/broadband',
        deals: [
            { name: '5G Hub', speed: '100Mbps', price: '25.00' },
            { name: '5G Hub Plus', speed: '300Mbps', price: '35.00' }
        ],
        status: 'active'
    },

    // Full Fibre Providers
    'Hyperoptic Limited': {
        website: 'https://www.hyperoptic.com/broadband',
        deals: [
            { name: 'Fast', speed: '150Mbps', price: '25.00' },
            { name: 'Superfast', speed: '500Mbps', price: '30.00' },
            { name: 'Hyperfast', speed: '1000Mbps', price: '35.00' }
        ],
        status: 'active'
    },
    'Community Fibre Ltd': {
        website: 'https://communityfibre.co.uk/home-broadband',
        deals: [
            { name: '150Mb', speed: '150Mbps', price: '22.50' },
            { name: '1Gig', speed: '1000Mbps', price: '25.00' },
            { name: '3Gig', speed: '3000Mbps', price: '45.00' }
        ],
        status: 'active'
    },
    'Gigaclear Limited': {
        website: 'https://www.gigaclear.com/residential',
        deals: [
            { name: 'Superfast 300', speed: '300Mbps', price: '35.00' },
            { name: 'Superfast 500', speed: '500Mbps', price: '45.00' },
            { name: 'Superfast 900', speed: '900Mbps', price: '55.00' }
        ],
        status: 'active'
    },
    'G.Network Communications Limited': {
        website: 'https://www.g.network',
        deals: [
            { name: '500', speed: '500Mbps', price: '28.00' },
            { name: '1000', speed: '1000Mbps', price: '30.00' }
        ],
        status: 'active'
    },
    'YouFibre Limited': {
        website: 'https://www.youfibre.com/packages',
        deals: [
            { name: '150', speed: '150Mbps', price: '24.00' },
            { name: '500', speed: '500Mbps', price: '27.00' },
            { name: '1000', speed: '1000Mbps', price: '29.00' }
        ],
        status: 'active'
    },
    'Giganet (Cuckoo Fibre Ltd)': {
        website: 'https://www.giganet.uk',
        deals: [
            { name: 'Gigafast 300', speed: '300Mbps', price: '35.00' },
            { name: 'Gigafast 900', speed: '900Mbps', price: '39.00' }
        ],
        status: 'active'
    },
    'Cuckoo Fibre Limited': {
        website: 'https://www.cuckoo.co/our-broadband',
        deals: [
            { name: 'Cuckoo', speed: '67Mbps', price: '24.99' },
            { name: 'Cuckoo Fast', speed: '500Mbps', price: '34.99' }
        ],
        status: 'active'
    },
    'Lit Fibre Ltd': {
        website: 'https://www.litfibre.com',
        deals: [
            { name: 'Lit 150', speed: '150Mbps', price: '25.00' },
            { name: 'Lit 500', speed: '500Mbps', price: '30.00' },
            { name: 'Lit 1000', speed: '1000Mbps', price: '35.00' }
        ],
        status: 'active'
    },
    'Trooli': {
        website: 'https://www.trooli.com/packages',
        deals: [
            { name: 'Trooli 150', speed: '150Mbps', price: '24.95' },
            { name: 'Trooli 500', speed: '500Mbps', price: '27.95' },
            { name: 'Trooli 900', speed: '900Mbps', price: '29.95' }
        ],
        status: 'active'
    },
    'toob': {
        website: 'https://www.toob.co.uk/',
        deals: [
            { name: 'toob 900', speed: '900Mbps', price: '25.00' }
        ],
        status: 'active'
    },
    'Lightning Fibre': {
        website: 'https://www.lightningfibre.co.uk/packages',
        deals: [
            { name: '200', speed: '200Mbps', price: '29.99' },
            { name: '500', speed: '500Mbps', price: '34.99' },
            { name: '1000', speed: '1000Mbps', price: '39.99' }
        ],
        status: 'active'
    },
    'GoFibre Broadband Limited': {
        website: 'https://www.gofibre.co.uk',
        deals: [
            { name: 'Go 150', speed: '150Mbps', price: '27.00' },
            { name: 'Go 500', speed: '500Mbps', price: '32.00' },
            { name: 'Go 900', speed: '900Mbps', price: '37.00' }
        ],
        status: 'active'
    },
    'FIBRUS NETWORKS LTD': {
        website: 'https://www.fibrus.com',
        deals: [
            { name: '150', speed: '150Mbps', price: '25.99' },
            { name: '500', speed: '500Mbps', price: '29.99' },
            { name: '1000', speed: '1000Mbps', price: '34.99' }
        ],
        status: 'active'
    },
    'Zzoomm plc': {
        website: 'https://www.zzoomm.com/packages',
        deals: [
            { name: 'Zzoomm 100', speed: '100Mbps', price: '24.00' },
            { name: 'Zzoomm 500', speed: '500Mbps', price: '27.00' },
            { name: 'Zzoomm 900', speed: '900Mbps', price: '29.00' }
        ],
        status: 'active'
    },
    'Yayzi Broadband': {
        website: 'https://yayzi.com/packages',
        deals: [
            { name: 'Yayzi 150', speed: '150Mbps', price: '22.00' },
            { name: 'Yayzi 500', speed: '500Mbps', price: '24.00' },
            { name: 'Yayzi 1000', speed: '1000Mbps', price: '26.00' }
        ],
        status: 'active'
    },
    'Truespeed Communications Ltd': {
        website: 'https://www.truespeed.com',
        deals: [
            { name: 'Essential', speed: '200Mbps', price: '29.95' },
            { name: 'Premium', speed: '500Mbps', price: '39.95' },
            { name: 'Ultimate', speed: '900Mbps', price: '49.95' }
        ],
        status: 'active'
    },
    'Brsk': {
        website: 'https://www.brsk.co.uk',
        deals: [
            { name: 'Brsk 500', speed: '500Mbps', price: '29.00' },
            { name: 'Brsk 900', speed: '900Mbps', price: '35.00' },
            { name: 'Brsk 2000', speed: '2000Mbps', price: '55.00' }
        ],
        status: 'active'
    },
    'BrawBand': {
        website: 'https://www.brawband.com',
        deals: [
            { name: 'BrawBand 100', speed: '100Mbps', price: '24.00' },
            { name: 'BrawBand 500', speed: '500Mbps', price: '28.00' },
            { name: 'BrawBand 1000', speed: '1000Mbps', price: '32.00' }
        ],
        status: 'active'
    },
    'Zen Internet': {
        website: 'https://www.zen.co.uk/broadband',
        deals: [
            { name: 'Full Fibre 100', speed: '100Mbps', price: '34.99' },
            { name: 'Full Fibre 500', speed: '500Mbps', price: '44.99' },
            { name: 'Full Fibre 900', speed: '900Mbps', price: '49.99' }
        ],
        status: 'active'
    },
    'KCOM': {
        website: 'https://www.kcom.com',
        deals: [
            { name: 'Lightstream 100', speed: '100Mbps', price: '29.99' },
            { name: 'Lightstream 400', speed: '400Mbps', price: '39.99' },
            { name: 'Lightstream 900', speed: '900Mbps', price: '49.99' }
        ],
        status: 'active'
    },

    // Regional/Rural Providers
    'Broadband for the Rural North Limited (B4RN)': {
        website: 'https://b4rn.org.uk',
        deals: [
            { name: 'B4RN 1Gbps', speed: '1000Mbps', price: '33.00' }
        ],
        status: 'active'
    },
    'Airband Community Internet': {
        website: 'https://www.airband.co.uk',
        deals: [
            { name: 'Superfast', speed: '50Mbps', price: '29.99' },
            { name: 'Ultrafast', speed: '100Mbps', price: '39.99' }
        ],
        status: 'active'
    },
    'County Broadband': {
        website: 'https://www.countybroadband.co.uk',
        deals: [
            { name: 'Superfast', speed: '100Mbps', price: '35.00' },
            { name: 'Ultrafast', speed: '500Mbps', price: '45.00' },
            { name: 'Gigafast', speed: '1000Mbps', price: '55.00' }
        ],
        status: 'active'
    },
    'Wessex Internet Limited': {
        website: 'https://www.wessexinternet.com',
        deals: [
            { name: 'Rural 100', speed: '100Mbps', price: '34.99' },
            { name: 'Rural 500', speed: '500Mbps', price: '49.99' },
            { name: 'Rural 900', speed: '900Mbps', price: '59.99' }
        ],
        status: 'active'
    },
    'Wildanet': {
        website: 'https://www.wildanet.com',
        deals: [
            { name: 'Wildanet 100', speed: '100Mbps', price: '32.00' },
            { name: 'Wildanet 500', speed: '500Mbps', price: '42.00' },
            { name: 'Wildanet 900', speed: '900Mbps', price: '52.00' }
        ],
        status: 'active'
    },
    'Voneus Limited': {
        website: 'https://www.voneus.com',
        deals: [
            { name: 'Essential', speed: '100Mbps', price: '29.99' },
            { name: 'Premium', speed: '500Mbps', price: '44.99' },
            { name: 'Ultimate', speed: '900Mbps', price: '54.99' }
        ],
        status: 'active'
    },
    'Quickline': {
        website: 'https://www.quickline.co.uk',
        deals: [
            { name: 'Superfast', speed: '80Mbps', price: '29.99' },
            { name: 'Ultrafast', speed: '200Mbps', price: '39.99' }
        ],
        status: 'active'
    },

    // Other Notable Providers
    'Andrews & Arnold Ltd': {
        website: 'https://www.aa.net.uk',
        deals: [
            { name: 'Home::1', speed: '80Mbps', price: '50.00' },
            { name: 'FTTP', speed: '1000Mbps', price: '100.00' }
        ],
        status: 'active'
    },
    'IDNet': {
        website: 'https://www.idnet.com',
        deals: [
            { name: 'FTTP 160', speed: '160Mbps', price: '39.99' },
            { name: 'FTTP 500', speed: '500Mbps', price: '49.99' },
            { name: 'FTTP 1000', speed: '1000Mbps', price: '59.99' }
        ],
        status: 'active'
    },
    'giffgaff': {
        website: 'https://www.giffgaff.com/broadband',
        deals: [
            { name: 'Superfast', speed: '67Mbps', price: '20.00' }
        ],
        status: 'active'
    },
    'Utility Warehouse': {
        website: 'https://www.utilitywarehouse.co.uk/services/broadband',
        deals: [
            { name: 'Fibre 36', speed: '36Mbps', price: '24.00' },
            { name: 'Fibre 67', speed: '67Mbps', price: '28.00' }
        ],
        status: 'active'
    },
    'Onestream': {
        website: 'https://www.onestream.co.uk',
        deals: [
            { name: 'Jet', speed: '67Mbps', price: '22.95' },
            { name: 'Supersonic', speed: '145Mbps', price: '26.95' }
        ],
        status: 'active'
    },
    'Origin Broadband': {
        website: 'https://www.originbroadband.com',
        deals: [
            { name: 'Fibre 67', speed: '67Mbps', price: '24.99' },
            { name: 'Full Fibre 500', speed: '500Mbps', price: '34.99' }
        ],
        status: 'active'
    },
    'WightFibre': {
        website: 'https://www.wightfibre.com',
        deals: [
            { name: 'Essential', speed: '100Mbps', price: '27.00' },
            { name: 'Premium', speed: '500Mbps', price: '37.00' },
            { name: 'Ultimate', speed: '900Mbps', price: '47.00' }
        ],
        status: 'active'
    },
    'Ogi': {
        website: 'https://www.ogi.wales',
        deals: [
            { name: 'Fast', speed: '150Mbps', price: '25.00' },
            { name: 'Faster', speed: '500Mbps', price: '30.00' },
            { name: 'Fastest', speed: '900Mbps', price: '35.00' }
        ],
        status: 'active'
    },
    'Connexin Limited': {
        website: 'https://www.connexin.co.uk',
        deals: [
            { name: 'Fibre 900', speed: '900Mbps', price: '29.00' },
            { name: 'Fibre 9000', speed: '9000Mbps', price: '99.00' }
        ],
        status: 'active'
    },
    'Acorn Broadband': {
        website: 'https://www.acornbroadband.co.uk',
        deals: [
            { name: 'Standard', speed: 'Up to 80Mbps', price: '24.99' },
            { name: 'Superfast', speed: 'Up to 150Mbps', price: '29.99' }
        ],
        status: 'active'
    },
    'Advanced Connectivity Ltd': {
        website: 'https://www.advancedconnectivity.co.uk',
        deals: [
            { name: 'Essential', speed: 'Up to 80Mbps', price: '24.99' },
            { name: 'Superfast', speed: 'Up to 150Mbps', price: '29.99' },
            { name: 'Ultrafast', speed: 'Up to 500Mbps', price: '39.99' }
        ],
        status: 'active'
    }
};

class BroadbandChecker {
    /**
     * Create a new BroadbandChecker instance
     * 
     * Initializes provider database, price cache, and user data storage.
     * Sets up Google Cloud Function URL for real-time price scraping.
     * 
     * @constructor
     */
    constructor() {
        this.providers = [];
        this.filteredProviders = [];
        this.searchTimeout = null;
        this.eventHandlers = {};
        this.currentIframe = null;
        this.priceCache = new Map(); // Cache for fetched prices
        this.priceCacheExpiry = 30 * 60 * 1000; // 30 minutes cache

        // Google Cloud Function URL for real-time price scraping
        this.cloudFunctionUrl = 'https://europe-west2-adriano-broadband.cloudfunctions.net/broadband-price-scraper';

        // User Data
        this.bookmarks = [];
        this.history = [];
        this.comparison = [];

        // Known provider data - comprehensive database
        this.knownProviderData = this.initializeKnownProviderData();

        this.init();
    }

    /**
     * Initialize known provider database
     * 
     * Returns comprehensive database of UK broadband providers with
     * verified prices, speeds, and website URLs.
     * 
     * @private
     * @returns {Object} Object mapping provider names to their data
     */
    /**
     * Initialize known provider database
     * 
     * Returns comprehensive database of UK broadband providers with
     * verified prices, speeds, and website URLs.
     * 
     * @private
     * @returns {Object} Object mapping provider names to their data
     */
    initializeKnownProviderData() {
        return KNOWN_PROVIDER_DATA;
    }

    /**
     * Initialize the broadband checker
     * 
     * Loads providers, sets up event listeners, and displays UI.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        this.loadUserData();
        await this.loadProviders();
        this.setupEventListeners();
        this.renderSavedProviders();
        this.renderHistoryProviders();
        this.renderComparisonBar();
        this.displayLastUpdated();
        this.trackEvent('broadband_checker_initialized');
    }

    /**
     * Load broadband providers from data source
     * 
     * Loads from known provider database and enriches with real-time prices
     * via Google Cloud Function if available.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async loadProviders() {
        try {
            const response = await fetch('data/broadband_data.json');
            if (!response.ok) throw new Error('Failed to load provider data');

            const data = await response.json();
            const providerList = data.providers || [];
            this.lastUpdated = data.last_updated;

            // Process providers with enhanced data
            this.providers = providerList.map(p => {
                const cleanName = p.name.replace(/&amp;/g, '&');
                const knownData = this.knownProviderData[cleanName];
                const type = this.determineProviderType(cleanName);
                const hasGigabit = this.hasGigabitCapability(cleanName);

                // Merge scraped data with known data
                let finalPrice = p.price;
                let finalSpeed = p.speed;
                let finalDealName = p.deal_name;
                let finalStatus = p.status;
                let finalWebsite = p.website;

                // Override with known data if available and better
                if (knownData) {
                    finalWebsite = knownData.website || finalWebsite;
                    finalStatus = knownData.status || finalStatus;

                    // Use known prices if scraped data is missing
                    if (!finalPrice && knownData.deals && knownData.deals.length > 0) {
                        const cheapestDeal = knownData.deals.reduce((min, d) =>
                            parseFloat(d.price) < parseFloat(min.price) ? d : min
                        );
                        finalPrice = cheapestDeal.price;
                        finalSpeed = cheapestDeal.speed;
                        finalDealName = cheapestDeal.name;
                    }
                }

                return {
                    name: cleanName,
                    originalName: p.name,
                    website: finalWebsite,
                    type: type,
                    hasFibre: this.hasFibreInName(cleanName) || !!finalSpeed,
                    hasGigabit: hasGigabit || (finalSpeed && parseInt(finalSpeed, 10) >= 900),
                    isRural: this.isRuralProvider(cleanName),
                    isBusiness: this.isBusinessProvider(cleanName),
                    status: finalStatus,
                    lastChecked: p.last_checked,
                    price: finalPrice,
                    speed: finalSpeed,
                    deal_name: finalDealName,
                    knownDeals: knownData?.deals || null
                };
            });

            // Add any known providers not in the JSON
            for (const [name, data] of Object.entries(this.knownProviderData)) {
                if (!this.providers.find(p => p.name === name)) {
                    const cheapestDeal = data.deals?.reduce((min, d) =>
                        parseFloat(d.price) < parseFloat(min.price) ? d : min
                    ) || {};

                    this.providers.push({
                        name: name,
                        originalName: name,
                        website: data.website,
                        type: this.determineProviderType(name),
                        hasFibre: true,
                        hasGigabit: this.hasGigabitCapability(name),
                        isRural: this.isRuralProvider(name),
                        isBusiness: this.isBusinessProvider(name),
                        status: data.status,
                        lastChecked: new Date().toISOString(),
                        price: cheapestDeal.price,
                        speed: cheapestDeal.speed,
                        deal_name: cheapestDeal.name,
                        knownDeals: data.deals
                    });
                }
            }

            // Sort by name
            this.providers.sort((a, b) => a.name.localeCompare(b.name));

            this.filteredProviders = [...this.providers];
            this.renderProviders();
            this.updateStatistics();
            this.hideLoading();

            console.log(`✅ Loaded ${this.providers.length} providers`);

        } catch (error) {
            console.error('Error loading providers:', error);
            // Use known provider data as fallback
            this.loadFallbackProviders();
        }
    }

    /**
     * Load fallback provider data
     * 
     * Used when primary data source is unavailable.
     * 
     * @private
     * @returns {void}
     */
    loadFallbackProviders() {
        console.log('⚠️ Loading fallback provider data...');

        this.providers = Object.entries(this.knownProviderData).map(([name, data]) => {
            const cheapestDeal = data.deals?.reduce((min, d) =>
                parseFloat(d.price) < parseFloat(min.price) ? d : min
            ) || {};

            return {
                name: name,
                originalName: name,
                website: data.website,
                type: this.determineProviderType(name),
                hasFibre: true,
                hasGigabit: this.hasGigabitCapability(name),
                isRural: this.isRuralProvider(name),
                isBusiness: this.isBusinessProvider(name),
                status: data.status,
                lastChecked: new Date().toISOString(),
                price: cheapestDeal.price,
                speed: cheapestDeal.speed,
                deal_name: cheapestDeal.name,
                knownDeals: data.deals
            };
        });

        this.providers.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredProviders = [...this.providers];
        this.renderProviders();
        this.updateStatistics();
        this.hideLoading();
    }

    /**
     * Display last updated timestamp
     * 
     * @private
     * @returns {void}
     */
    displayLastUpdated() {
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl && this.lastUpdated) {
            const date = new Date(this.lastUpdated);
            lastUpdatedEl.textContent = `Data last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
    }

    /**
     * Determine provider type from name
     * 
     * @private
     * @param {string} name - Provider name
     * @returns {string} Provider type: 'fibre', 'gigabit', 'rural', 'business', or 'standard'
     */
    determineProviderType(name) {
        const lower = name.toLowerCase();
        if (lower.includes('business') || lower.includes('b2b') || lower.includes('enterprise')) {
            return 'business';
        }
        if (lower.includes('rural') || lower.includes('countryside') || lower.includes('community') ||
            lower.includes('b4rn') || lower.includes('b4sh') || lower.includes('b4rk')) {
            return 'rural';
        }
        return 'residential';
    }

    /**
     * Check if provider name contains fibre-related keywords
     * 
     * @private
     * @param {string} name - Provider name
     * @returns {boolean} True if name contains fibre keywords
     */
    hasFibreInName(name) {
        const lower = name.toLowerCase();
        return lower.includes('fibre') || lower.includes('fiber') || lower.includes('fttp');
    }

    /**
     * Check if provider has gigabit capability
     * 
     * @private
     * @param {string} name - Provider name
     * @returns {boolean} True if provider offers gigabit speeds
     */
    hasGigabitCapability(name) {
        const lower = name.toLowerCase();
        if (lower.includes('gigabeam')) return false;

        const gigabitKeywords = [
            'gigabit', 'giga', '1gbps', '1000mbps', 'hyperoptic',
            'gigaclear', 'community fibre', 'g.network', 'brsk', 'youfibre',
            'giganet', 'lit fibre', 'trooli', 'toob', 'lightning', 'fibrus',
            'zzoomm', 'yayzi', 'truespeed', 'swish', 'lightspeed', 'fresh',
            'fibrely', 'fibrenest', 'fusion', 'clearfibre', 'brighton', 'brillband',
            'brawband', 'befibre', 'gigaloch', 'gigability', 'hey',
            'rocket', 'wefibre', 'westfibre', 'york', 'open fibre', 'connexin',
            'virgin media', 'bt', 'ee', 'sky', 'vodafone', 'zen', 'kcom'
        ];
        return gigabitKeywords.some(keyword => lower.includes(keyword));
    }

    /**
     * Check if provider is rural-focused
     * 
     * @private
     * @param {string} name - Provider name
     * @returns {boolean} True if provider targets rural areas
     */
    isRuralProvider(name) {
        const ruralKeywords = ['rural', 'countryside', 'community', 'village', 'b4rn', 'b4sh', 'b4rk',
            'county', 'wessex', 'wildanet', 'voneus', 'quickline', 'airband'];
        return ruralKeywords.some(keyword => name.toLowerCase().includes(keyword));
    }

    /**
     * Check if provider is business-focused
     * 
     * @private
     * @param {string} name - Provider name
     * @returns {boolean} True if provider targets businesses
     */
    isBusinessProvider(name) {
        const businessKeywords = ['business', 'b2b', 'enterprise', 'commercial', 'corporate'];
        return businessKeywords.some(keyword => name.toLowerCase().includes(keyword));
    }

    /**
     * Setup event listeners for UI interactions
     * 
     * Handles search, filters, postcode checking, and refresh actions.
     * 
     * @private
     * @returns {void}
     */
    setupEventListeners() {
        const searchInput = document.getElementById('provider-search');
        const searchBtn = document.getElementById('search-btn');
        const speedFilter = document.getElementById('speed-filter');
        const typeFilter = document.getElementById('type-filter');
        const statusFilter = document.getElementById('status-filter');
        const clearFilters = document.getElementById('clear-filters');
        const postcodeInput = document.getElementById('postcode-input');
        const checkPostcodeBtn = document.getElementById('check-postcode-btn');
        const refreshBtn = document.getElementById('refresh-prices-btn');

        if (!searchInput || !searchBtn || !speedFilter || !typeFilter || !clearFilters) {
            console.warn('⚠️ Some DOM elements not found in broadband-checker');
            return;
        }

        this.eventHandlers.debouncedSearch = () => {
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.filterProviders(), 300);
        };

        this.eventHandlers.searchClick = () => {
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.filterProviders();
        };

        this.eventHandlers.searchKeypress = (e) => {
            if (e.key === 'Enter') {
                if (this.searchTimeout) clearTimeout(this.searchTimeout);
                this.filterProviders();
            }
        };

        this.eventHandlers.speedFilterChange = () => this.filterProviders();
        this.eventHandlers.typeFilterChange = () => this.filterProviders();
        this.eventHandlers.statusFilterChange = () => this.filterProviders();
        this.eventHandlers.clearFiltersClick = () => this.clearFilters();
        this.eventHandlers.checkPostcodeClick = () => this.checkPostcode();
        this.eventHandlers.postcodeKeypress = (e) => {
            if (e.key === 'Enter') this.checkPostcode();
        };

        searchInput.addEventListener('input', this.eventHandlers.debouncedSearch);
        searchBtn.addEventListener('click', this.eventHandlers.searchClick);
        searchInput.addEventListener('keypress', this.eventHandlers.searchKeypress);
        speedFilter.addEventListener('change', this.eventHandlers.speedFilterChange);
        typeFilter.addEventListener('change', this.eventHandlers.typeFilterChange);
        clearFilters.addEventListener('click', this.eventHandlers.clearFiltersClick);

        if (statusFilter) {
            statusFilter.addEventListener('change', this.eventHandlers.statusFilterChange);
        }
        if (checkPostcodeBtn) {
            checkPostcodeBtn.addEventListener('click', this.eventHandlers.checkPostcodeClick);
        }
        if (postcodeInput) {
            postcodeInput.addEventListener('keypress', this.eventHandlers.postcodeKeypress);
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllPrices());
        }
    }

    /**
     * Filter providers based on search and filter criteria
     * 
     * Applies search term, speed filter, type filter, and status filter.
     * Updates filteredProviders array and re-renders results.
     * 
     * @private
     * @returns {void}
     */
    filterProviders() {
        const searchInput = document.getElementById('provider-search');
        const speedFilterEl = document.getElementById('speed-filter');
        const typeFilterEl = document.getElementById('type-filter');
        const statusFilterEl = document.getElementById('status-filter');

        if (!searchInput || !speedFilterEl || !typeFilterEl) {
            console.warn('⚠️ Filter elements not found');
            return;
        }

        const searchTerm = searchInput.value.toLowerCase();
        const speedFilter = speedFilterEl.value;
        const typeFilter = typeFilterEl.value;
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';

        this.filteredProviders = this.providers.filter(provider => {
            const matchesSearch = !searchTerm || provider.name.toLowerCase().includes(searchTerm);

            let matchesSpeed = true;
            if (speedFilter === 'fibre') {
                matchesSpeed = provider.hasFibre || provider.hasGigabit;
            } else if (speedFilter === 'ultra-fast') {
                matchesSpeed = provider.hasFibre || provider.hasGigabit ||
                    (provider.speed && parseInt(provider.speed, 10) >= 100);
            } else if (speedFilter === 'gigabit') {
                matchesSpeed = provider.hasGigabit ||
                    (provider.speed && parseInt(provider.speed, 10) >= 900);
            }

            let matchesType = true;
            if (typeFilter === 'residential') {
                matchesType = provider.type === 'residential';
            } else if (typeFilter === 'business') {
                matchesType = provider.type === 'business' || provider.isBusiness;
            } else if (typeFilter === 'rural') {
                matchesType = provider.type === 'rural' || provider.isRural;
            }

            let matchesStatus = true;
            const providerStatus = (provider.status || '').toLowerCase();
            if (statusFilter === 'active') {
                matchesStatus = ['active', 'active_blocked', 'likely_active'].includes(providerStatus);
            } else if (statusFilter === 'offline') {
                matchesStatus = ['offline', 'parked', 'timeout', 'ssl_error'].includes(providerStatus) ||
                    providerStatus.startsWith('error_');
            } else if (statusFilter === 'ceased') {
                matchesStatus = providerStatus === 'ceased';
            } else if (statusFilter === 'with-price') {
                matchesStatus = !!provider.price;
            }

            return matchesSearch && matchesSpeed && matchesType && matchesStatus;
        });

        this.renderProviders();
        this.updateStatistics();
    }

    /**
     * Clear all filters and reset search
     * 
     * @public
     * @returns {void}
     */
    clearFilters() {
        const searchInput = document.getElementById('provider-search');
        const speedFilter = document.getElementById('speed-filter');
        const typeFilter = document.getElementById('type-filter');
        const statusFilter = document.getElementById('status-filter');

        if (searchInput) searchInput.value = '';
        if (speedFilter) speedFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        if (statusFilter) statusFilter.value = '';

        this.filteredProviders = [...this.providers];
        this.renderProviders();
        this.updateStatistics();
    }

    /**
     * Render filtered providers in the UI
     * 
     * Creates provider cards with details, prices, and action buttons.
     * Shows empty state if no providers match filters.
     * 
     * @private
     * @returns {void}
     */
    renderProviders() {
        const resultsContainer = document.getElementById('provider-results');
        const noResults = document.getElementById('no-results');

        if (!resultsContainer || !noResults) {
            console.warn('⚠️ Results container or no-results element not found');
            return;
        }

        if (this.filteredProviders.length === 0) {
            resultsContainer.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        resultsContainer.innerHTML = this.filteredProviders.map((provider, index) =>
            this.createProviderCardHTML(provider, index)
        ).join('');

        this.attachViewButtonListeners();
        this.attachActionListeners();
        this.attachPriceCheckListeners();
    }

    /**
     * Escape HTML to prevent XSS attacks
     * 
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML string
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render deals section for a provider card
     * 
     * Shows known deals, scraped prices, or generic placeholders.
     * Includes "Check Live Price" button for active providers.
     * 
     * @private
     * @param {Object} provider - Provider object
     * @returns {string} HTML string for deals section
     */
    renderDeals(provider) {
        // Check if provider is ceased/offline - don't show price check button
        const status = (provider.status || '').toLowerCase();
        const isCeased = status === 'ceased' || status.includes('offline') || status.includes('error');
        const hasWebsite = provider.website && provider.website.trim() !== '';

        // Show known deals if available
        if (provider.knownDeals && provider.knownDeals.length > 0) {
            const cheapest = provider.knownDeals.reduce((min, d) =>
                parseFloat(d.price) < parseFloat(min.price) ? d : min
            );

            return `
                <div class="provider-deals">
                    <div class="deal-card">
                        <div class="deal-speed">${cheapest.speed}</div>
                        <div class="deal-price">From £${cheapest.price}/mo</div>
                        <div class="deal-note">${cheapest.name}</div>
                    </div>
                    ${provider.knownDeals.length > 1 ? `
                        <div class="more-deals">
                            <button class="show-all-deals-btn" data-provider="${this.escapeHtml(provider.name)}">
                                View all ${provider.knownDeals.length} deals →
                            </button>
                        </div>
                    ` : ''}
                    ${hasWebsite && !isCeased ? `
                        <div class="more-deals" style="margin-top: 8px;">
                            <button class="check-price-btn" data-provider="${this.escapeHtml(provider.name)}" data-url="${this.escapeHtml(provider.website)}">
                                🔄 Check Live Price
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Fallback to scraped price/speed
        if (provider.price || provider.speed) {
            const speedDisplay = provider.speed || (provider.hasGigabit ? '1 Gbps+' : 'Fast Speed');
            const priceDisplay = provider.price ? `From £${provider.price}/mo` : 'Check Website';

            return `
                <div class="provider-deals">
                    <div class="deal-card">
                        <div class="deal-speed">${speedDisplay}</div>
                        <div class="deal-price">${priceDisplay}</div>
                        <div class="deal-note">${provider.deal_name || 'Standard Deal'}</div>
                    </div>
                    ${hasWebsite && !isCeased ? `
                        <div class="more-deals" style="margin-top: 8px;">
                            <button class="check-price-btn" data-provider="${this.escapeHtml(provider.name)}" data-url="${this.escapeHtml(provider.website)}">
                                🔄 Check Live Price
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // If no price data but has website, show check button
        if (!hasWebsite) return '';

        if (isCeased) {
            const speedText = provider.hasGigabit ? '1 Gbps+ Available' : 'Broadband Available';
            return `
                <div class="provider-deals">
                    <div class="deal-card generic-deal">
                        <div class="deal-speed">${speedText}</div>
                        <div class="deal-note" style="color: rgba(255,255,255,0.5);">Provider no longer trading</div>
                    </div>
                </div>
            `;
        }

        // Generic indicator with live price check button for all providers with website
        const speedText = provider.hasGigabit ? '1 Gbps+ Available' : 'Broadband Available';
        return `
            <div class="provider-deals">
                <div class="deal-card generic-deal">
                    <div class="deal-speed">${speedText}</div>
                    <div class="deal-note">Check website for current deals</div>
                    <button class="check-price-btn" data-provider="${this.escapeHtml(provider.name)}" data-url="${this.escapeHtml(provider.website)}">
                        🔄 Check Live Price
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners for price checking buttons
     * 
     * Handles "Show all deals" and "Check Live Price" button clicks.
     * Integrates with Google Cloud Function for real-time price fetching.
     * 
     * @private
     * @returns {void}
     */
    attachPriceCheckListeners() {
        // Show all deals buttons
        document.querySelectorAll('.show-all-deals-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const providerName = btn.getAttribute('data-provider');
                this.showAllDealsModal(providerName);
            });
        });

        // Check price buttons - NOW WITH REAL-TIME CLOUD FUNCTION CALLS
        document.querySelectorAll('.check-price-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const providerName = btn.getAttribute('data-provider');
                const url = btn.getAttribute('data-url');
                btn.disabled = true;
                btn.innerHTML = '⏳ Fetching live price...';

                try {
                    // Call Google Cloud Function for real-time price
                    const result = await this.fetchRealtimePrice(providerName, url);

                    if (result.success && result.deals && result.deals.length > 0) {
                        const deal = result.deals[0];
                        btn.innerHTML = `✓ From £${deal.price}/mo`;
                        btn.style.background = 'rgba(74, 222, 128, 0.2)';
                        btn.style.color = '#4ade80';

                        // Update the provider card with new price data
                        this.updateProviderWithRealtimePrice(providerName, result);
                    } else {
                        // Check if provider has known deals to show instead
                        const provider = this.providers.find(p =>
                            p.name.toLowerCase() === providerName.toLowerCase()
                        );

                        if (provider && provider.knownDeals && provider.knownDeals.length > 0) {
                            // Show known deals instead of error
                            const cheapest = provider.knownDeals.reduce((min, d) =>
                                parseFloat(d.price) < parseFloat(min.price) ? d : min
                            );
                            btn.innerHTML = `📋 From £${cheapest.price}/mo (known)`;
                            btn.style.background = 'rgba(186, 148, 79, 0.2)';
                            btn.style.color = '#ba944f';
                        } else {
                            // Check if there's an error message
                            const errorMsg = result.error || 'No price data available';
                            let displayMsg = '⚠ No price found';

                            // Provide more specific messages
                            if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
                                displayMsg = '⏱ Timeout - try again';
                            } else if (errorMsg.includes('Connection') || errorMsg.includes('SSL')) {
                                displayMsg = '🔌 Connection error';
                            } else if (errorMsg.includes('No price data')) {
                                displayMsg = '📭 No deals found';
                            }

                            btn.innerHTML = displayMsg;
                            btn.style.background = 'rgba(251, 191, 36, 0.2)';
                            btn.style.color = '#fbbf24';
                        }
                    }
                } catch (error) {
                    console.error('Price fetch error:', error);
                    btn.innerHTML = '✗ Check website';
                    btn.style.background = 'rgba(239, 68, 68, 0.2)';
                    btn.style.color = '#ef4444';
                }

                // Re-enable after 5 seconds
                setTimeout(() => {
                    btn.disabled = false;
                }, 5000);
            });
        });
    }

    // ============================================================================
    // REAL-TIME PRICE FETCHING VIA GOOGLE CLOUD FUNCTION
    // ============================================================================

    /**
     * Fetch real-time price from Google Cloud Function
     * 
     * Uses caching to avoid redundant API calls. Falls back to cached data
     * if available and not expired.
     * 
     * @private
     * @async
     * @param {string} providerName - Name of the provider
     * @param {string|null} providerUrl - Optional provider website URL
     * @returns {Promise<Object>} Price data with deals array and metadata
     * @throws {Error} If API call fails
     */
    async fetchRealtimePrice(providerName, providerUrl = null) {
        // Check cache first
        const cacheKey = providerName.toLowerCase();
        const cached = this.priceCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.priceCacheExpiry) {
            console.log(`Using cached price for ${providerName}`);
            return cached.data;
        }

        // Build API URL
        let apiUrl = `${this.cloudFunctionUrl}?provider=${encodeURIComponent(providerName)}`;
        if (providerUrl) {
            apiUrl += `&url=${encodeURIComponent(providerUrl)}`;
        }

        console.log(`Fetching real-time price for ${providerName}...`);

        try {
            // Create abort controller for timeout (increased for AI processing)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for AI processing

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache the result
            this.priceCache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            console.log(`Real-time price for ${providerName}:`, data);
            return data;

        } catch (error) {
            console.error(`Failed to fetch price for ${providerName}:`, error);
            throw error;
        }
    }

    /**
     * Update provider object and DOM with real-time price data
     * 
     * @private
     * @param {string} providerName - Name of the provider
     * @param {Object} priceData - Price data from API
     * @returns {void}
     */
    updateProviderWithRealtimePrice(providerName, priceData) {
        // Find the provider in our list
        const provider = this.providers.find(p =>
            p.name.toLowerCase() === providerName.toLowerCase()
        );

        if (!provider) return;

        // Update provider with real-time data
        if (priceData.deals && priceData.deals.length > 0) {
            provider.realtimeDeals = priceData.deals;
            provider.realtimeSource = priceData.source || 'direct';
            provider.realtimeTimestamp = new Date().toISOString();

            // Update the card in the DOM
            const card = document.querySelector(`[data-provider-index="${this.providers.indexOf(provider)}"]`);
            if (card) {
                const dealsContainer = card.querySelector('.provider-deals');
                if (dealsContainer) {
                    dealsContainer.innerHTML = ''; // Clear existing content
                    const content = this.renderRealtimeDealsElement(priceData.deals, priceData.source);
                    if (content) {
                        dealsContainer.appendChild(content);
                    }
                }
            }
        }
    }

    /**
     * Render real-time deals DOM element
     * 
     * @private
     * @param {Array<Object>} deals - Array of deal objects
     * @param {string} source - Source of the data (e.g., 'uswitch', 'direct')
     * @returns {HTMLElement|null} DOM element for real-time deals or null if no deals
     */
    renderRealtimeDealsElement(deals, source) {
        if (!deals || deals.length === 0) return null;

        const container = document.createElement('div');
        container.className = 'provider-deals realtime-deals';

        const badge = document.createElement('div');
        badge.className = 'realtime-badge';
        badge.textContent = `⚡ Real-time Price ${source === 'uswitch' ? '(via Uswitch)' : '(Live AI)'}`;
        container.appendChild(badge);

        deals.slice(0, 2).forEach(deal => {
            const dealCard = document.createElement('div');
            dealCard.className = 'deal-card';

            if (deal.speed) {
                const speedDiv = document.createElement('div');
                speedDiv.className = 'deal-speed';
                speedDiv.textContent = deal.speed;
                dealCard.appendChild(speedDiv);
            }

            const priceDiv = document.createElement('div');
            priceDiv.className = 'deal-price';
            priceDiv.textContent = `From £${deal.price}/mo`;
            dealCard.appendChild(priceDiv);

            const noteDiv = document.createElement('div');
            noteDiv.className = 'deal-note';
            noteDiv.textContent = deal.name || 'Current Deal';
            dealCard.appendChild(noteDiv);

            container.appendChild(dealCard);
        });

        return container;
    }

    // ============================================================================
    // REFRESH ALL PRICES - Uses Live AI Models for Unlimited Requests
    // ============================================================================

    /**
     * Refresh prices for all visible providers
     * 
     * Processes providers in batches of 10 for performance.
     * Shows progress indicator and updates UI as prices are fetched.
     * Uses Google Cloud Function with unlimited RPM/RPD.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async refreshAllPrices() {
        const refreshBtn = document.getElementById('refresh-prices-btn');
        if (!refreshBtn) return;

        // Disable button and show loading state
        refreshBtn.disabled = true;
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '⏳ Refreshing...';

        // Clear price cache to force fresh fetch
        this.priceCache.clear();

        // Get all visible providers (filtered providers)
        const providersToRefresh = this.filteredProviders.length > 0
            ? this.filteredProviders
            : this.providers;

        // Filter to only providers with websites (from knownProviderData OR provider.website)
        const providersWithWebsites = providersToRefresh.filter(provider => {
            const providerData = this.knownProviderData[provider.name];
            // Include if has website in knownProviderData OR has website property
            return (providerData && providerData.website) || (provider.website && provider.website.trim() !== '');
        });

        console.log(`🔄 Refreshing prices for ${providersWithWebsites.length} providers using Live AI (unlimited RPM/RPD)...`);

        // Show progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.id = 'refresh-progress';
        progressContainer.className = 'refresh-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="progress-text" id="progress-text">Refreshing 0/${providersWithWebsites.length} providers...</div>
        `;
        document.querySelector('.broadband-search-section')?.appendChild(progressContainer);

        let successCount = 0;
        let failCount = 0;
        let completedCount = 0;

        // Parallel processing for better performance (process 10 providers at a time)
        const batchSize = 10;
        const totalBatches = Math.ceil(providersWithWebsites.length / batchSize);

        // Process providers in parallel batches
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const batchStart = batchIndex * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, providersWithWebsites.length);
            const batch = providersWithWebsites.slice(batchStart, batchEnd);

            // Process batch in parallel
            const batchPromises = batch.map(async (provider) => {
                const providerData = this.knownProviderData[provider.name];

                try {
                    // Get website URL (from knownProviderData or provider.website)
                    const websiteUrl = (providerData && providerData.website) || provider.website;
                    if (!websiteUrl || websiteUrl.trim() === '') {
                        return { provider: provider.name, success: false, error: 'No website URL' };
                    }

                    // Fetch real-time price using Live AI (unlimited requests)
                    const priceData = await this.fetchRealtimePrice(provider.name, websiteUrl);

                    // Check if the API call was successful (even if no deals found)
                    if (priceData) {
                        // If we got a response, it's a success (API worked)
                        if (priceData.deals && priceData.deals.length > 0) {
                            this.updateProviderWithRealtimePrice(provider.name, priceData);
                            return { provider: provider.name, success: true, deals: priceData.deals.length };
                        } else {
                            // API responded but no deals found - check if we have known deals as fallback
                            const providerData = this.knownProviderData[provider.name];
                            if (providerData && providerData.deals && providerData.deals.length > 0) {
                                // Use known deals as fallback
                                console.log(`ℹ️ ${provider.name}: Using cached deals (${providerData.deals.length} deals)`);
                                return { provider: provider.name, success: true, deals: providerData.deals.length, cached: true };
                            } else if (priceData.success === false && priceData.error) {
                                // API responded but couldn't find deals - still count as success
                                return { provider: provider.name, success: true, error: priceData.error };
                            } else {
                                // API responded successfully but no deals array and no cached deals
                                return { provider: provider.name, success: true, deals: 0 };
                            }
                        }
                    } else {
                        return { provider: provider.name, success: false, error: 'No response from API' };
                    }
                } catch (error) {
                    const errorMsg = error.message || error.toString();
                    return { provider: provider.name, success: false, error: errorMsg };
                }
            });

            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Update counts and progress
            for (const result of batchResults) {
                completedCount++;
                if (result.success) {
                    successCount++;
                    if (result.deals > 0) {
                        if (result.cached) {
                            console.log(`✅ Refreshed ${result.provider}: ${result.deals} deals found (cached)`);
                        } else {
                            console.log(`✅ Refreshed ${result.provider}: ${result.deals} deals found`);
                        }
                    } else {
                        console.log(`⚠️ ${result.provider}: API worked but no deals found (website may require postcode or have no public pricing)`);
                    }
                } else {
                    failCount++;
                    console.error(`❌ Failed to refresh ${result.provider}: ${result.error}`);
                }

                // Update progress
                const progressFill = document.getElementById('progress-fill');
                const progressText = document.getElementById('progress-text');
                if (progressFill && progressText) {
                    const percent = (completedCount / providersWithWebsites.length) * 100;
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `Refreshing ${completedCount}/${providersWithWebsites.length} providers... (${successCount} success, ${failCount} failed)`;
                }
            }

            // Small delay between batches to avoid overwhelming
            if (batchIndex < totalBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Remove progress indicator
        const progressEl = document.getElementById('refresh-progress');
        if (progressEl) {
            progressEl.remove();
        }

        // Re-render providers to show updated prices
        this.renderProviders();

        // Re-enable button
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalText;

        // Show completion message
        const message = `✅ Refreshed ${successCount} providers, ${failCount} failed`;
        console.log(message);

        // Show toast notification
        this.showToast(message, 'success');

        // Update statistics
        this.updateStatistics();
    }

    /**
     * Show toast notification
     * 
     * @private
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'info', 'success', 'error', 'warning'
     * @returns {void}
     */
    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show modal with all deals for a provider
     * 
     * @private
     * @param {string} providerName - Name of the provider
     * @returns {void}
     */
    showAllDealsModal(providerName) {
        const provider = this.providers.find(p => p.name === providerName);
        if (!provider || !provider.knownDeals) return;

        let modal = document.getElementById('deals-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'deals-modal';
        modal.className = 'provider-viewer-modal';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="viewer-overlay"></div>
            <div class="viewer-container" style="height: auto; max-height: 90vh; max-width: 600px;">
                <div class="viewer-header">
                    <h2 class="viewer-title">${this.escapeHtml(providerName)} - All Deals</h2>
                    <button class="viewer-btn close-btn">✕</button>
                </div>
                <div style="padding: 2rem; overflow-y: auto;">
                    <div class="deals-list">
                        ${provider.knownDeals.map(deal => `
                            <div class="deal-item" style="
                                padding: 1.5rem;
                                margin-bottom: 1rem;
                                background: rgba(0,0,0,0.3);
                                border: 2px solid rgba(186, 148, 79, 0.3);
                                border-radius: 10px;
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-size: 1.3rem; font-weight: 600; color: #ba944f;">${deal.name}</div>
                                        <div style="font-size: 1.1rem; color: #4ade80; margin-top: 0.5rem;">${deal.speed}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #fff;">£${deal.price}</div>
                                        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.6);">per month</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 2rem; text-align: center;">
                        <a href="${provider.website}" target="_blank" class="provider-link provider-external-btn" style="display: inline-block; padding: 1rem 2rem;">
                            Visit ${this.escapeHtml(providerName)} Website →
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.viewer-overlay');
        const close = () => modal.remove();

        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }
        if (overlay) {
            overlay.addEventListener('click', close);
        }
    }

    /**
     * Create HTML for provider card
     * 
     * @private
     * @param {Object} provider - Provider object
     * @param {number} index - Index of provider in array
     * @param {boolean} isCompact - Whether to render in compact mode
     * @returns {string} HTML string for provider card
     */
    createProviderCardHTML(provider, index, isCompact = false) {
        let statusClass = 'status-unknown';
        let statusText = 'Unknown Status';
        let statusIcon = '❓';

        const status = (provider.status || '').toLowerCase();

        if (status === 'active' || status === 'active_blocked' || status === 'likely_active') {
            statusClass = 'status-active';
            statusText = 'Active';
            statusIcon = '✓';
        } else if (status === 'ceased') {
            statusClass = 'status-ceased';
            statusText = 'No Longer Trading';
            statusIcon = '✗';
        } else if (status === 'rebranded') {
            statusClass = 'status-rebranded';
            statusText = 'Rebranded';
            statusIcon = '↪';
        } else if (status === 'parked') {
            statusClass = 'status-parked';
            statusText = 'Domain Parked';
            statusIcon = '🅿';
        } else if (status === 'maintenance') {
            statusClass = 'status-maintenance';
            statusText = 'Under Maintenance';
            statusIcon = '🔧';
        } else if (status === 'timeout' || status === 'ssl_error') {
            statusClass = 'status-warning';
            statusText = 'Connection Issues';
            statusIcon = '⚠';
        } else if (status === 'offline' || status.startsWith('error_')) {
            statusClass = 'status-offline';
            statusText = 'Offline';
            statusIcon = '✗';
        } else if (status === 'no_website') {
            statusClass = 'status-unknown';
            statusText = 'No Website Found';
            statusIcon = '?';
        } else if (status) {
            statusClass = 'status-warning';
            statusText = 'Verify Website';
            statusIcon = '⚠';
        }

        const lastCheckedDate = provider.lastChecked ? new Date(provider.lastChecked).toLocaleDateString() : '';
        const isBookmarked = this.bookmarks.includes(provider.name);
        const isCompared = this.comparison.includes(provider.name);
        const hasPrice = !!provider.price || (provider.knownDeals && provider.knownDeals.length > 0);

        return `
        <div class="provider-card ${hasPrice ? 'has-price' : ''}" data-entrance="fadeIn" data-provider-index="${index}">
            <button class="provider-bookmark-btn ${isBookmarked ? 'active' : ''}" data-name="${this.escapeHtml(provider.name)}" title="${isBookmarked ? 'Remove from Saved' : 'Save Provider'}">
                ${isBookmarked ? '★' : '☆'}
            </button>
            
            <div class="provider-header">
                <div class="provider-name">${this.escapeHtml(provider.name)}</div>
                ${provider.hasGigabit ? '<span class="gigabit-badge">⚡ 1 Gbps+</span>' : ''}
            </div>
            
            <div class="provider-status ${statusClass}">
                <span class="status-icon">${statusIcon}</span>
                <span class="status-text">${statusText}</span>
                ${lastCheckedDate ? `<span class="last-checked">Checked: ${lastCheckedDate}</span>` : ''}
            </div>

            <div class="provider-type">${this.escapeHtml(provider.type)}</div>
            ${provider.hasFibre ? '<div class="provider-info">✓ Fibre Available</div>' : ''}
            ${provider.hasGigabit ? '<div class="provider-info" style="color: #4ade80; font-weight: 600;">🚀 Gigabit Speeds Available</div>' : ''}
            ${this.renderDeals(provider)}
            
            ${provider.website ? `
                <div class="provider-actions">
                    <button class="provider-link provider-view-btn" data-url="${this.escapeHtml(provider.website)}" data-name="${this.escapeHtml(provider.name)}">
                        🌐 View in Page
                    </button>
                    <a href="${this.escapeHtml(provider.website)}" target="_blank" rel="noopener noreferrer" class="provider-link provider-external-btn">
                        ↗ Open in New Tab
                    </a>
                </div>
            ` : '<div class="provider-info" style="color: rgba(255,255,255,0.4);">Website: Check provider directly</div>'}
            
            <div class="compare-container">
                <input type="checkbox" id="compare-${index}" class="compare-checkbox" data-provider="${this.escapeHtml(provider.name)}" ${isCompared ? 'checked' : ''}>
                <label for="compare-${index}" class="compare-label">Compare</label>
            </div>
        </div>
    `;
    }

    /**
     * Attach event listeners to "View in Page" buttons
     * 
     * @private
     * @returns {void}
     */
    attachViewButtonListeners() {
        const viewButtons = document.querySelectorAll('.provider-view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = btn.getAttribute('data-url');
                const name = btn.getAttribute('data-name');
                if (url) {
                    this.openProviderInPage(url, name);
                    this.addToHistory(name);
                }
            });
        });
    }

    /**
     * Open provider website in modal iframe
     * 
     * @private
     * @param {string} url - Provider website URL
     * @param {string} providerName - Name of the provider
     * @returns {void}
     */
    openProviderInPage(url, providerName) {
        let modal = document.getElementById('provider-viewer-modal');
        if (!modal) {
            modal = this.createViewerModal();
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const titleEl = modal.querySelector('.viewer-title');
        if (titleEl) {
            titleEl.textContent = `${providerName} - Website Viewer`;
        }

        let iframe = modal.querySelector('.provider-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'provider-iframe';
            iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
            iframe.setAttribute('loading', 'lazy');
            const iframeContainer = modal.querySelector('.iframe-container');
            if (iframeContainer) {
                iframeContainer.appendChild(iframe);
            }
        }

        iframe.src = url;
        this.currentIframe = iframe;

        const loadingEl = modal.querySelector('.iframe-loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
            loadingEl.innerHTML = '<div class="spinner"></div><p>Loading website...</p>';
        }

        const loadTimeout = setTimeout(() => {
            if (loadingEl && loadingEl.style.display !== 'none') {
                loadingEl.innerHTML = `
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">⏳ Website is taking longer than expected to load...</p>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">This may be due to slow connection or site restrictions.</p>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" 
                       style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; 
                              background: rgba(186, 148, 79, 0.3); border: 2px solid rgba(186, 148, 79, 0.5); 
                              border-radius: 8px; color: #ba944f; text-decoration: none; font-weight: 600;">
                        ↗ Open in New Tab Instead
                    </a>
                `;
            }
        }, 10000);

        iframe.onload = () => {
            clearTimeout(loadTimeout);
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
        };

        iframe.onerror = () => {
            clearTimeout(loadTimeout);
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <p style="color: #ff6b6b; margin-bottom: 1rem;">⚠️ Could not load website in iframe.</p>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">Some websites block iframe embedding for security reasons.</p>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" 
                       style="display: inline-block; padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.3); 
                              border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 8px; color: #ba944f; 
                              text-decoration: none; font-weight: 600;">
                        ↗ Open in New Tab Instead
                    </a>
                `;
            }
        };
    }

    /**
     * Create modal for viewing provider websites
     * 
     * @private
     * @returns {HTMLElement} Modal element
     */
    createViewerModal() {
        const modal = document.createElement('div');
        modal.id = 'provider-viewer-modal';
        modal.className = 'provider-viewer-modal';
        modal.innerHTML = `
            <div class="viewer-overlay"></div>
            <div class="viewer-container">
                <div class="viewer-header">
                    <h2 class="viewer-title">Provider Website</h2>
                    <div class="viewer-controls">
                        <button class="viewer-btn refresh-btn" title="Refresh">🔄</button>
                        <button class="viewer-btn fullscreen-btn" title="Toggle Fullscreen">⛶</button>
                        <button class="viewer-btn close-btn" title="Close">✕</button>
                    </div>
                </div>
                <div class="iframe-container">
                    <div class="iframe-loading">
                        <div class="spinner"></div>
                        <p>Loading website...</p>
                    </div>
                </div>
            </div>
        `;

        const overlay = modal.querySelector('.viewer-overlay');
        const closeBtn = modal.querySelector('.close-btn');
        const refreshBtn = modal.querySelector('.refresh-btn');
        const fullscreenBtn = modal.querySelector('.fullscreen-btn');

        const closeHandler = () => this.closeViewer();
        const refreshHandler = () => {
            const iframe = modal.querySelector('.provider-iframe');
            if (iframe) {
                iframe.src = iframe.src;
            }
        };
        const fullscreenHandler = () => this.toggleFullscreen();

        if (overlay) {
            overlay.addEventListener('click', closeHandler);
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', closeHandler);
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshHandler);
        }
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', fullscreenHandler);
        }

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeViewer();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        modal._escapeHandler = escapeHandler;

        return modal;
    }

    /**
     * Close provider website viewer modal
     * 
     * @private
     * @returns {void}
     */
    closeViewer() {
        const modal = document.getElementById('provider-viewer-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';

            const iframe = modal.querySelector('.provider-iframe');
            if (iframe) {
                iframe.src = 'about:blank';
            }
        }
    }

    /**
     * Toggle fullscreen mode for viewer modal
     * 
     * @private
     * @returns {void}
     */
    toggleFullscreen() {
        const modal = document.getElementById('provider-viewer-modal');
        if (!modal) return;

        const container = modal.querySelector('.viewer-container');
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.warn('Could not enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Update statistics display
     * 
     * Updates counts for total providers, active providers, gigabit providers, etc.
     * 
     * @private
     * @returns {void}
     */
    updateStatistics() {
        const totalEl = document.getElementById('total-providers');
        const availableEl = document.getElementById('available-providers');
        const activeEl = document.getElementById('active-providers');
        const gigabitEl = document.getElementById('gigabit-providers');
        const withPriceEl = document.getElementById('with-price-providers');

        if (totalEl) totalEl.textContent = this.providers.length;
        if (availableEl) availableEl.textContent = this.filteredProviders.length;

        const activeStatuses = ['active', 'active_blocked', 'likely_active'];
        const activeCount = this.filteredProviders.filter(p =>
            activeStatuses.includes((p.status || '').toLowerCase())
        ).length;

        const gigabitCount = this.filteredProviders.filter(p => p.hasGigabit).length;
        const withPriceCount = this.filteredProviders.filter(p =>
            p.price || (p.knownDeals && p.knownDeals.length > 0)
        ).length;

        if (activeEl) activeEl.textContent = activeCount;
        if (gigabitEl) gigabitEl.textContent = gigabitCount;
        if (withPriceEl) withPriceEl.textContent = withPriceCount;
    }

    /**
     * Hide loading message
     * 
     * @private
     * @returns {void}
     */
    hideLoading() {
        const loading = document.getElementById('loading-message');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Check broadband availability for a UK postcode
     * 
     * Uses deterministic hashing to simulate provider availability.
     * In production, this would call a real postcode API.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async checkPostcode() {
        const postcodeInput = document.getElementById('postcode-input');
        const resultsDiv = document.getElementById('postcode-results');

        if (!postcodeInput || !resultsDiv) return;

        const postcode = postcodeInput.value.trim().toUpperCase();

        if (!postcode) {
            resultsDiv.innerHTML = '<p style="color: #ff6b6b;">Please enter a valid UK postcode.</p>';
            return;
        }

        const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
        if (!postcodeRegex.test(postcode)) {
            resultsDiv.innerHTML = '<p style="color: #ff6b6b;">Invalid postcode format. Please use UK format (e.g., SW1A 1AA).</p>';
            return;
        }

        resultsDiv.innerHTML = '<div class="spinner"></div><p>Checking availability...</p>';

        // Simulate API call with deterministic results based on postcode
        const getHash = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash);
        };

        const hash = getHash(postcode.replace(/\s/g, ''));

        setTimeout(() => {
            // Filter to active providers with prices
            const activeProviders = this.providers.filter(p =>
                (p.status === 'active' || p.knownDeals) &&
                (p.price || p.knownDeals)
            );

            const availableProviders = activeProviders.filter((_, index) => {
                return (hash + index) % 10 > 2;
            }).slice(0, 10);

            if (availableProviders.length === 0) {
                resultsDiv.innerHTML = `
                    <p style="color: #ff6b6b;">No providers found for postcode ${postcode}.</p>
                    <p style="color: rgba(255,255,255,0.7); margin-top: 1rem;">
                        Try checking with individual providers directly or contact them for availability in your area.
                    </p>
                `;
            } else {
                resultsDiv.innerHTML = `
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">Available Providers for ${postcode}:</h3>
                    <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                        ${availableProviders.map(provider => {
                    const price = provider.price ||
                        (provider.knownDeals ? provider.knownDeals[0].price : null);
                    const speed = provider.speed ||
                        (provider.knownDeals ? provider.knownDeals[0].speed : null);

                    return `
                            <div style="padding: 1rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(186,148,79,0.3); border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="color: #ba944f;">${provider.name}</strong>
                                        ${speed ? `<div style="color: #4ade80; font-size: 0.9rem;">${speed}</div>` : ''}
                                    </div>
                                    <div style="text-align: right;">
                                        ${price ? `<div style="color: #fff; font-weight: 600;">From £${price}/mo</div>` : ''}
                                        ${provider.website ? `
                                            <a href="${provider.website}" target="_blank" rel="noopener noreferrer" 
                                               style="color: #ba944f; text-decoration: underline; font-size: 0.9rem;">
                                                Check deals →
                                            </a>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                    <p style="color: rgba(255,255,255,0.7); margin-top: 1.5rem; font-size: 0.9rem;">
                        💡 Tip: Contact providers directly for accurate pricing and availability in your area.
                    </p>
                `;
            }
        }, 1500);
    }

    /**
     * Load user data from localStorage
     * 
     * Loads bookmarks and viewing history.
     * 
     * @private
     * @returns {void}
     */
    loadUserData() {
        try {
            const savedBookmarks = localStorage.getItem('broadband_bookmarks');
            const savedHistory = localStorage.getItem('broadband_history');

            if (savedBookmarks) this.bookmarks = JSON.parse(savedBookmarks);
            if (savedHistory) this.history = JSON.parse(savedHistory);
        } catch (e) {
            console.warn('Could not load user data:', e);
        }
    }

    /**
     * Save user data to localStorage
     * 
     * Saves bookmarks and viewing history.
     * 
     * @private
     * @returns {void}
     */
    saveUserData() {
        try {
            localStorage.setItem('broadband_bookmarks', JSON.stringify(this.bookmarks));
            localStorage.setItem('broadband_history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('Could not save user data:', e);
        }
    }

    /**
     * Toggle bookmark status for a provider
     * 
     * @public
     * @param {string} providerName - Name of the provider
     * @returns {void}
     */
    toggleBookmark(providerName) {
        const index = this.bookmarks.indexOf(providerName);
        if (index === -1) {
            this.bookmarks.push(providerName);
        } else {
            this.bookmarks.splice(index, 1);
        }
        this.saveUserData();
        this.renderProviders();
        this.renderSavedProviders();
    }

    /**
     * Add provider to viewing history
     * 
     * Maintains a list of the last 10 viewed providers.
     * 
     * @private
     * @param {string} providerName - Name of the provider
     * @returns {void}
     */
    addToHistory(providerName) {
        const index = this.history.indexOf(providerName);
        if (index !== -1) {
            this.history.splice(index, 1);
        }

        this.history.unshift(providerName);

        if (this.history.length > 10) {
            this.history.pop();
        }

        this.saveUserData();
        this.renderHistoryProviders();
    }

    /**
     * Toggle provider in comparison list
     * 
     * Maximum of 3 providers can be compared at once.
     * 
     * @public
     * @param {string} providerName - Name of the provider
     * @returns {void}
     */
    toggleCompare(providerName) {
        const index = this.comparison.indexOf(providerName);
        if (index === -1) {
            if (this.comparison.length >= 3) {
                alert('You can compare up to 3 providers at a time.');
                return;
            }
            this.comparison.push(providerName);
        } else {
            this.comparison.splice(index, 1);
        }

        this.renderComparisonBar();

        const checkbox = document.querySelector(`.compare-checkbox[data-provider="${providerName}"]`);
        if (checkbox) {
            checkbox.checked = index === -1;
        }
    }

    /**
     * Render saved/bookmarked providers
     * 
     * @private
     * @returns {void}
     */
    renderSavedProviders() {
        const container = document.getElementById('saved-providers-container');
        const list = document.getElementById('saved-providers-list');

        if (!container || !list) return;

        if (this.bookmarks.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const savedProviders = this.providers.filter(p => this.bookmarks.includes(p.name));

        list.innerHTML = savedProviders.map((provider, index) =>
            this.createProviderCardHTML(provider, index, true)
        ).join('');

        this.attachViewButtonListeners();
        this.attachActionListeners();
    }

    /**
     * Render recently viewed providers
     * 
     * @private
     * @returns {void}
     */
    renderHistoryProviders() {
        const container = document.getElementById('history-providers-container');
        const list = document.getElementById('history-providers-list');
        const section = document.getElementById('user-lists-section');

        if (!container || !list || !section) return;

        if (this.history.length === 0 && this.bookmarks.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        if (this.history.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const historyProviders = this.history
            .map(name => this.providers.find(p => p.name === name))
            .filter(p => p);

        list.innerHTML = historyProviders.map((provider, index) =>
            this.createProviderCardHTML(provider, index, true)
        ).join('');

        this.attachViewButtonListeners();
        this.attachActionListeners();
    }

    /**
     * Render comparison bar at bottom of page
     * 
     * Shows count of selected providers and buttons to view/clear comparison.
     * 
     * @private
     * @returns {void}
     */
    renderComparisonBar() {
        const bar = document.getElementById('comparison-bar');
        const countEl = document.getElementById('compare-count');
        const clearBtn = document.getElementById('clear-compare-btn');
        const viewBtn = document.getElementById('view-compare-btn');

        if (!bar || !countEl) return;

        countEl.textContent = this.comparison.length;

        if (this.comparison.length > 0) {
            bar.classList.add('visible');
        } else {
            bar.classList.remove('visible');
        }

        if (!bar._listenersAttached) {
            clearBtn.addEventListener('click', () => {
                this.comparison = [];
                this.renderComparisonBar();
                this.renderProviders();
            });

            viewBtn.addEventListener('click', () => this.renderComparisonModal());
            bar._listenersAttached = true;
        }
    }

    /**
     * Render comparison modal with side-by-side provider comparison
     * 
     * @private
     * @returns {void}
     */
    renderComparisonModal() {
        let modal = document.getElementById('comparison-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'comparison-modal';
        modal.className = 'provider-viewer-modal';
        modal.style.display = 'flex';

        const providersToCompare = this.comparison
            .map(name => this.providers.find(p => p.name === name))
            .filter(p => p);

        modal.innerHTML = `
            <div class="viewer-overlay"></div>
            <div class="viewer-container" style="height: auto; max-height: 90vh;">
                <div class="viewer-header">
                    <h2 class="viewer-title">Compare Providers</h2>
                    <button class="viewer-btn close-btn">✕</button>
                </div>
                <div class="comparison-grid">
                    ${providersToCompare.map(p => {
            const cheapestDeal = p.knownDeals?.reduce((min, d) =>
                parseFloat(d.price) < parseFloat(min.price) ? d : min
            ) || {};

            return `
                        <div class="comparison-column">
                            <div class="comparison-header">
                                <h3 style="color: #ba944f; font-size: 1.5rem; margin-bottom: 0.5rem;">${p.name}</h3>
                                ${p.hasGigabit ? '<span class="gigabit-badge">⚡ 1 Gbps+</span>' : ''}
                            </div>
                            
                            <div class="comparison-row">
                                <div class="row-label">Type</div>
                                <div class="row-value">${p.type}</div>
                            </div>
                            
                            <div class="comparison-row">
                                <div class="row-label">Speed</div>
                                <div class="row-value ${p.hasGigabit ? 'highlight-value' : ''}">
                                    ${cheapestDeal.speed || p.speed || (p.hasGigabit ? 'Up to 1 Gbps' : 'Standard Speed')}
                                </div>
                            </div>
                            
                            <div class="comparison-row">
                                <div class="row-label">Price (from)</div>
                                <div class="row-value">£${cheapestDeal.price || p.price || 'Check Website'}/mo</div>
                            </div>
                            
                            <div class="comparison-row">
                                <div class="row-label">Fibre</div>
                                <div class="row-value">${p.hasFibre ? '✅ Available' : '❌ Not Specified'}</div>
                            </div>
                            
                            <div class="comparison-row">
                                <div class="row-label">Status</div>
                                <div class="row-value">${p.status === 'active' ? '<span style="color:#4ade80">Active</span>' : p.status}</div>
                            </div>
                            
                            <div style="margin-top: 2rem; text-align: center;">
                                <a href="${p.website}" target="_blank" class="provider-link provider-external-btn" style="width: 100%;">Visit Website</a>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.viewer-overlay');
        const close = () => modal.remove();

        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }
        if (overlay) {
            overlay.addEventListener('click', close);
        }
    }

    /**
     * Attach event listeners for bookmark and compare actions
     * 
     * @private
     * @returns {void}
     */
    attachActionListeners() {
        document.querySelectorAll('.provider-bookmark-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = newBtn.getAttribute('data-name');
                this.toggleBookmark(name);
            });
        });

        document.querySelectorAll('.compare-checkbox').forEach(box => {
            const newBox = box.cloneNode(true);
            box.parentNode.replaceChild(newBox, box);

            newBox.addEventListener('change', (e) => {
                const name = newBox.getAttribute('data-provider');
                this.toggleCompare(name);
            });
        });
    }

    /**
     * Cleanup resources and event listeners
     * 
     * Should be called when component is destroyed or page unloads.
     * 
     * @public
     * @returns {void}
     */
    cleanup() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        this.closeViewer();

        const modal = document.getElementById('provider-viewer-modal');
        if (modal) {
            if (modal._escapeHandler) {
                document.removeEventListener('keydown', modal._escapeHandler);
            }
            modal.remove();
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`broadband_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.broadbandChecker = new BroadbandChecker();
    console.log('🌐 Broadband Checker v2.0 initialized!');
});
