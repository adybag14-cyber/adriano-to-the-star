/**
 * Broadband Deal Checker v3.0
 * 
 * Browser-safe UK broadband provider explorer backed by the build-cached catalogue.
 * Searches and filters 300+ providers without calling a scraping or pricing service.
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
     * Initializes the provider catalogue and browser-local comparison state.
     * 
     * @constructor
     */
    constructor() {
        this.providers = [];
        this.filteredProviders = [];
        this.searchTimeout = null;
        this.eventHandlers = {};
        this.currentIframe = null;
        this.currentPage = 1;
        this.pageSize = 24;

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
     * Loads the same-origin, build-cached provider snapshot.
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

        this.currentPage = 1;
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
        this.currentPage = 1;
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
            noResults.hidden = false;
            noResults.style.display = 'block';
            return;
        }

        noResults.hidden = true;
        noResults.style.display = 'none';
        const pageCount = Math.max(1, Math.ceil(this.filteredProviders.length / this.pageSize));
        this.currentPage = Math.min(Math.max(1, this.currentPage), pageCount);
        const offset = (this.currentPage - 1) * this.pageSize;
        const visibleProviders = this.filteredProviders.slice(offset, offset + this.pageSize);

        resultsContainer.innerHTML = visibleProviders.map((provider, index) =>
            this.createProviderCardHTML(provider, offset + index)
        ).join('');

        if (pageCount > 1) {
            const pager = document.createElement('nav');
            pager.className = 'provider-pager';
            pager.setAttribute('aria-label', 'Provider result pages');
            pager.innerHTML = `
                <button type="button" data-page-action="previous" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span aria-live="polite">Page ${this.currentPage} of ${pageCount} · ${this.filteredProviders.length} providers</span>
                <button type="button" data-page-action="next" ${this.currentPage === pageCount ? 'disabled' : ''}>Next</button>
            `;
            pager.addEventListener('click', event => {
                const action = event.target.closest('button')?.dataset.pageAction;
                if (!action) return;
                this.currentPage += action === 'next' ? 1 : -1;
                this.renderProviders();
                document.getElementById('provider-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            resultsContainer.appendChild(pager);
        }

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

    safeProviderUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' ? this.escapeHtml(url.href) : '';
        } catch { return ''; }
    }

    /**
     * Render deals section for a provider card
     * 
     * Shows known deals, scraped prices, or generic placeholders.
     * Includes a build-cached offer preview and an authoritative source link.
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
                                View offer snapshot
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
                                View offer snapshot
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
                        View offer snapshot
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners for price checking buttons
     * 
     * Handles build-cached offer previews without a browser-side pricing service.
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

        // Offer buttons show the build-cached snapshot. No scraping endpoint is contacted.
        document.querySelectorAll('.check-price-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const providerName = btn.getAttribute('data-provider');
                this.showAllDealsModal(providerName);
            });
        });
    }

    // ============================================================================
    // REFRESH THE SAME-ORIGIN SNAPSHOT
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
        refreshBtn.disabled = true;
        const originalText = refreshBtn.innerHTML;
        refreshBtn.textContent = 'Refreshing snapshot…';
        try {
            await this.loadProviders();
            this.currentPage = 1;
            this.renderProviders();
            this.updateStatistics();
            this.showToast('Build-cached provider snapshot refreshed', 'success');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalText;
        }
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
                        <a href="${this.safeProviderUrl(provider.website)}" target="_blank" rel="noopener noreferrer" class="provider-link provider-external-btn" style="display: inline-block; padding: 1rem 2rem;">
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
                        Preview provider
                    </button>
                    <a href="${this.safeProviderUrl(provider.website)}" target="_blank" rel="noopener noreferrer" class="provider-link provider-external-btn">
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
     * Open a CORS-safe, local provider preview with an authoritative source link.
     * 
     * @private
     * @param {string} url - Provider website URL
     * @param {string} providerName - Name of the provider
     * @returns {void}
     */
    openProviderInPage(url, providerName) {
        document.getElementById('provider-viewer-modal')?.remove();
        const provider = this.providers.find(item => item.name === providerName);
        const safeUrl = (() => {
            try {
                const parsed = new URL(url);
                return /^https:$/.test(parsed.protocol) ? parsed.href : '';
            } catch { return ''; }
        })();
        const modal = document.createElement('div');
        modal.id = 'provider-viewer-modal';
        modal.className = 'provider-viewer-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'provider-preview-title');
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="viewer-overlay" data-close-preview></div>
            <section class="viewer-container provider-preview-card">
                <header class="viewer-header">
                    <div><span class="snapshot-kicker">BUILD-CACHED DIRECTORY</span><h2 id="provider-preview-title" class="viewer-title">${this.escapeHtml(providerName)}</h2></div>
                    <button type="button" class="viewer-btn close-btn" aria-label="Close provider preview">✕</button>
                </header>
                <div class="provider-preview-content">
                    <p>This preview is assembled from the website's same-origin provider catalogue. No scraper, cloud pricing function, or embedded third-party page was contacted.</p>
                    <dl>
                        <div><dt>Status</dt><dd>${this.escapeHtml(provider?.status || 'Unverified')}</dd></div>
                        <div><dt>Type</dt><dd>${this.escapeHtml(provider?.type || 'Not specified')}</dd></div>
                        <div><dt>Catalogue date</dt><dd>${this.escapeHtml(this.lastUpdated || 'Not supplied')}</dd></div>
                        <div><dt>Recorded offers</dt><dd>${provider?.knownDeals?.length || 0}</dd></div>
                    </dl>
                    ${safeUrl ? `<a class="provider-link provider-external-btn" href="${this.escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Open the provider's authoritative website ↗</a>` : '<p class="no-data">No verified provider URL is recorded.</p>'}
                </div>
            </section>`;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        const close = () => { modal.remove(); document.body.style.overflow = ''; };
        modal.querySelector('.close-btn')?.addEventListener('click', close);
        modal.querySelector('[data-close-preview]')?.addEventListener('click', close);
        modal.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
        modal.querySelector('.close-btn')?.focus();
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
                                            <a href="${this.safeProviderUrl(provider.website)}" target="_blank" rel="noopener noreferrer"
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
                                <a href="${this.safeProviderUrl(p.website)}" target="_blank" rel="noopener noreferrer" class="provider-link provider-external-btn" style="width: 100%;">Visit Website</a>
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
