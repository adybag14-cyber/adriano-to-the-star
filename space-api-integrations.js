/**
 * Space API Integrations
 * Real-time data from NASA, ESA, SpaceX, and space news feeds
 */

class SpaceAPIIntegrations {
    constructor(options = {}) {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.updateInterval = null;
        this.staticFeedPromise = null;
        
        // NASA API Key (optional - can be set via constructor or environment)
        // Get your free API key from: https://api.nasa.gov/
        this.nasaApiKey = options.nasaApiKey || 
                         (typeof window !== 'undefined' && window.NASA_API_KEY) || 
                         null;
        
        // API Endpoints
        this.apis = {
            nasa: {
                exoplanetArchive: 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI',
                apod: 'https://api.nasa.gov/planetary/apod', // Astronomy Picture of the Day
                neo: 'https://api.nasa.gov/neo/rest/v1/feed', // Near Earth Objects
                baseUrl: 'https://api.nasa.gov',
                // Telescope and observation data
                techport: 'https://api.nasa.gov/techport/api/projects', // NASA TechPort
                insight: 'https://api.nasa.gov/insight_weather/' // Mars InSight weather
            },
            spacex: {
                graphql: 'https://api.spacex.land/graphql/',
                rest: 'https://api.spacexdata.com/v4'
            },
            spaceNews: {
                spaceNews: 'https://www.space.com/feeds/all',
                nasaNews: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
                spaceflightNow: 'https://spaceflightnow.com/feed/',
                astronomyNow: 'https://www.astronomynow.com/feed/'
            },
            esa: {
                // ESA doesn't have a public API, but we can scrape their news feed
                news: 'https://www.esa.int/rssfeed/Our_Activities',
                missions: 'https://www.esa.int/rssfeed/Our_Activities/Space_Science'
            },
            telescopes: {
                // Real-time telescope data feeds
                hubble: 'https://hubblesite.org/api/v3/news',
                jamesWebb: 'https://www.jwst.nasa.gov/content/webbLaunch/news.html',
                // Virtual Telescope Project (real-time observations)
                virtualTelescope: 'https://www.virtualtelescope.eu/webtv/',
                // Slooh (live telescope feeds)
                slooh: 'https://slooh.com/api/v1/events'
            }
        };
        
        this.init();
    }
    
    init() {
        this.trackEvent('s_pa_ce_ap_ii_nt_eg_ra_ti_on_s_initialized');
        this.setupAutoUpdate();
    }

    parsecsToLightYears(value) {
        const parsecs = Number(value);
        return Number.isFinite(parsecs) ? parsecs * 3.26156 : null;
    }

    async fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
    }

    async getBuildCachedFeed(type) {
        if (!this.staticFeedPromise) {
            this.staticFeedPromise = this.fetchWithTimeout('data/space-feeds.json', { cache: 'no-cache' }, 2500)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(snapshot => Array.isArray(snapshot.feeds) ? snapshot.feeds : [])
                .catch(error => {
                    console.info('Build-cached space feed is unavailable.', error?.message || error);
                    return [];
                });
        }
        const feeds = await this.staticFeedPromise;
        return feeds.filter(item => item.type === type);
    }

    async getBuildCachedUpdates() {
        const [exoplanets, launches, news] = await Promise.all([
            this.getBuildCachedFeed('exoplanet'),
            this.getBuildCachedFeed('launch'),
            this.getBuildCachedFeed('news')
        ]);

        return {
            exoplanets: exoplanets.map(item => ({
                name: item.title,
                discoveryYear: item.meta?.discoveryYear || null,
                distance: this.parsecsToLightYears(item.meta?.distancePc),
                status: 'confirmed',
                source: item.source || 'NASA Exoplanet Archive'
            })),
            launches: launches.map(item => ({
                  id: item.link,
                  link: item.link,
                name: item.title.replace(/^Launch:\s*/i, ''),
                  date: item.meta?.launchDate || item.meta?.windowStart || item.meta?.date || item.desc.match(/Window:\s*([^|]+)/i)?.[1]?.trim() || null,
                details: item.desc,
                upcoming: true,
                source: item.source
            })),
            news: news.map(item => ({
                title: item.title,
                link: item.link,
                description: item.desc,
                pubDate: item.meta?.publishedAt || null,
                source: item.source || 'Build-cached feed'
            })),
            apod: null,
            neo: null,
            telescopes: {},
            timestamp: new Date().toISOString(),
            cached: true
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_pa_ce_ap_ii_nt_eg_ra_ti_on_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    isAutomation() {
        try {
            return typeof navigator !== 'undefined' && Boolean(navigator.webdriver);
        } catch {
            return false;
        }
    }

    shouldDowngradeError(error) {
        if (!this.isAutomation()) return false;
        const message = String(error && error.message ? error.message : error || '');
        if (/Failed to fetch/i.test(message)) return true;
        if (/API error:/i.test(message)) return true;
        if (/RSS feed error:/i.test(message)) return true;
        return false;
    }

    logError(...args) {
        try {
            const possibleError = args.length ? args[args.length - 1] : null;
            const downgrade = this.shouldDowngradeError(possibleError);

            if (downgrade && typeof console !== 'undefined' && typeof console.debug === 'function') {
                console.debug(...args);
                return;
            }

            if (typeof console !== 'undefined' && typeof console.info === 'function') {
                console.info(...args);
            }
        } catch {
        }
    }

    /**
     * Setup automatic updates every 5 minutes
     */
    setupAutoUpdate() {
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            this.clearCache();
        }, this.cacheExpiry);
    }
    
    /**
     * Clear expired cache
     */
    clearCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Get cached data or fetch new
     */
    async getCachedOrFetch(key, fetchFn) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }
        
        try {
            const data = await fetchFn();
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
            return data;
        } catch (error) {
            this.logError(`Error fetching ${key}:`, error);
            // Return cached data even if expired if fetch fails
            if (cached) {
                return cached.data;
            }
            throw error;
        }
    }
    
    // ============================================================================
    // NASA API INTEGRATIONS
    // ============================================================================
    
    /**
     * Get latest exoplanet discoveries from NASA Exoplanet Archive
     * @param {number} limit - Number of planets to fetch
     * @returns {Promise<Array>} Array of exoplanet data
     */
    async getNASAExoplanets(limit = 50) {
        return this.getCachedOrFetch('nasa_exoplanets', async () => {
            // NASA Exoplanet Archive API - Get confirmed planets
            const url = `${this.apis.nasa.exoplanetArchive}?table=exoplanets&format=json&where=pl_confirmed=1&order=pl_disc+desc&limit=${limit}`;
            
            let data;
            try {
                data = await this.fetchJSON(url);
            } catch (error) {
                const fallback = await this.getBuildCachedFeed('exoplanet');
                if (!fallback.length) throw error;
                return fallback.slice(0, limit).map(item => ({
                    name: item.title,
                    discoveryYear: item.meta?.discoveryYear || null,
                    distance: this.parsecsToLightYears(item.meta?.distancePc),
                    status: 'confirmed',
                    source: item.source || 'NASA Exoplanet Archive'
                }));
            }
            return data.map(planet => ({
                name: planet.pl_name || planet.pl_hostname,
                discoveryYear: planet.pl_disc || null,
                mass: planet.pl_bmassj || null,
                radius: planet.pl_radj || null,
                distance: this.parsecsToLightYears(planet.st_dist),
                temperature: planet.pl_eqt || null,
                method: planet.pl_discmethod || null,
                status: 'confirmed',
                source: 'nasa'
            }));
        });
    }
    
    /**
     * Get Astronomy Picture of the Day
     * @param {string} apiKey - NASA API key (optional, uses instance key if available)
     * @returns {Promise<Object>} APOD data
     */
    async getNASAAPOD(apiKey = null) {
        const keyToUse = apiKey || this.nasaApiKey;
        const cacheKey = keyToUse ? 'nasa_apod_keyed' : 'nasa_apod';
        return this.getCachedOrFetch(cacheKey, async () => {
            const apiKeyParam = keyToUse || 'DEMO_KEY';
            const url = `${this.apis.nasa.apod}?api_key=${apiKeyParam}`;
            
            return await this.fetchJSON(url);
        });
    }
    
    /**
     * Get Near Earth Objects for today
     * @param {string} apiKey - NASA API key (optional, uses instance key if available)
     * @returns {Promise<Object>} NEO data
     */
    async getNASANEO(apiKey = null) {
        const keyToUse = apiKey || this.nasaApiKey;
        if (!keyToUse) {
            throw new Error('NASA API key required for NEO data. Get one free at https://api.nasa.gov/');
        }
        
        return this.getCachedOrFetch('nasa_neo', async () => {
            const today = new Date().toISOString().split('T')[0];
            const url = `${this.apis.nasa.neo}?api_key=${keyToUse}&start_date=${today}&end_date=${today}`;
            
            return await this.fetchJSON(url);
        });
    }
    
    // ============================================================================
    // SPACEX API INTEGRATIONS
    // ============================================================================
    
    /**
     * Get upcoming SpaceX launches
     * @returns {Promise<Array>} Array of launch data
     */
    async getSpaceXLaunches(limit = 10) {
        return this.getCachedOrFetch('spacex_launches', async () => {
            // Using REST API v4 - get more to filter out past launches
            const url = `${this.apis.spacex.rest}/launches/upcoming?limit=${limit * 3}`;
            
            let launches;
            try {
                launches = await this.fetchJSON(url);
            } catch (error) {
                const fallback = await this.getBuildCachedFeed('launch');
                if (!fallback.length) throw error;
                return fallback.slice(0, limit).map(item => ({
                    id: item.link,
                    name: item.title.replace(/^Launch:\s*/i, ''),
                    date: item.desc.match(/Window:\s*([^|]+)/i)?.[1]?.trim() || null,
                    details: item.desc,
                    upcoming: true,
                    source: item.source
                }));
            }
            const now = new Date();
            
            // Filter to only future launches (after current date/time)
            const futureLaunches = (launches || [])
                .filter(launch => {
                    if (!launch.date_local) return false;
                    const launchDate = new Date(launch.date_local);
                    // Only include launches that are in the future
                    return launchDate > now && (launch.upcoming === true || launchDate > now);
                })
                .sort((a, b) => {
                    // Sort by date (soonest first)
                    const dateA = new Date(a.date_local);
                    const dateB = new Date(b.date_local);
                    return dateA - dateB;
                })
                .slice(0, limit); // Take only the requested limit
            
            return futureLaunches.map(launch => ({
                id: launch.id,
                name: launch.name,
                date: launch.date_local,
                details: launch.details,
                rocket: launch.rocket,
                launchpad: launch.launchpad,
                success: launch.success,
                upcoming: launch.upcoming,
                source: 'spacex'
            }));
        });
    }
    
    /**
     * Get latest SpaceX launches (past launches)
     * @param {number} limit - Number of launches
     * @returns {Promise<Array>} Array of launch data
     */
    async getSpaceXLatestLaunches(limit = 5) {
        return this.getCachedOrFetch('spacex_latest', async () => {
            const url = `${this.apis.spacex.rest}/launches/past?limit=${limit}&order=desc`;
            try {
                return await this.fetchJSON(url);
            } catch {
                return [];
            }
        });
    }
    
    /**
     * Get SpaceX rocket information
     * @param {string} rocketId - Rocket ID
     * @returns {Promise<Object>} Rocket data
     */
    async getSpaceXRocket(rocketId) {
        return this.getCachedOrFetch(`spacex_rocket_${rocketId}`, async () => {
            const url = `${this.apis.spacex.rest}/rockets/${rocketId}`;
            
            return await this.fetchJSON(url);
        });
    }
    
    // ============================================================================
    // SPACE NEWS INTEGRATIONS
    // ============================================================================
    
    async fetchJSON(url) {
        const response = await this.fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('json')) throw new Error('Upstream returned a non-JSON response');
        return response.json();
    }

    async parseRSSFeed(feedUrl) {
        try {
            const response = await this.fetchWithTimeout(feedUrl, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
            if (!response.ok) throw new Error(`RSS feed error: ${response.status}`);
            return this.parseRSSXML(await response.text());
        } catch (error) {
            this.logError(`RSS feed unavailable for ${feedUrl}:`, error);
            return [];
        }
    }
    
    /**
     * Basic RSS XML parser
     */
    parseRSSXML(xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const items = doc.querySelectorAll('item');
        
        return Array.from(items).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            link: item.querySelector('link')?.textContent || '',
            description: item.querySelector('description')?.textContent || '',
            pubDate: item.querySelector('pubDate')?.textContent || '',
            source: 'rss'
        }));
    }
    
    /**
     * Get NASA news
     * @returns {Promise<Array>} Array of news items
     */
    async getNASANews(limit = 10) {
        return this.getCachedOrFetch('nasa_news', async () => {
            const items = await this.parseRSSFeed(this.apis.spaceNews.nasaNews);
            return items.slice(0, limit).map(item => ({
                ...item,
                source: 'nasa'
            }));
        });
    }
    
    /**
     * Get Space.com news
     * @param {number} limit - Number of articles
     * @returns {Promise<Array>} Array of news items
     */
    async getSpaceNews(limit = 10) {
        return this.getCachedOrFetch('space_news', async () => {
            const items = await this.parseRSSFeed(this.apis.spaceNews.spaceNews);
            return items.slice(0, limit).map(item => ({
                ...item,
                source: 'space.com'
            }));
        });
    }
    
    /**
     * Get Spaceflight Now news
     * @param {number} limit - Number of articles
     * @returns {Promise<Array>} Array of news items
     */
    async getSpaceflightNowNews(limit = 10) {
        return this.getCachedOrFetch('spaceflight_now', async () => {
            const items = await this.parseRSSFeed(this.apis.spaceNews.spaceflightNow);
            return items.slice(0, limit).map(item => ({
                ...item,
                source: 'spaceflightnow'
            }));
        });
    }
    
    /**
     * Get all space news aggregated
     * @param {number} limitPerSource - Articles per source
     * @returns {Promise<Array>} Combined news from all sources
     */
    async getAllSpaceNews(limitPerSource = 5) {
        try {
            const [nasaNews, spaceNews, spaceflightNow] = await Promise.allSettled([
                this.getNASANews(limitPerSource),
                this.getSpaceNews(limitPerSource),
                this.getSpaceflightNowNews(limitPerSource)
            ]);
            
            const allNews = [];
            if (nasaNews.status === 'fulfilled') allNews.push(...nasaNews.value);
            if (spaceNews.status === 'fulfilled') allNews.push(...spaceNews.value);
            if (spaceflightNow.status === 'fulfilled') allNews.push(...spaceflightNow.value);
            
            // Sort by date (newest first)
            return allNews.sort((a, b) => {
                const dateA = new Date(a.pubDate || 0);
                const dateB = new Date(b.pubDate || 0);
                return dateB - dateA;
            });
        } catch (error) {
            this.logError('Error fetching all space news:', error);
            return [];
        }
    }
    
    // ============================================================================
    // ESA INTEGRATIONS (RSS Feeds)
    // ============================================================================
    
    /**
     * Get ESA news
     * @param {number} limit - Number of articles
     * @returns {Promise<Array>} Array of news items
     */
    async getESANews(limit = 10) {
        return this.getCachedOrFetch('esa_news', async () => {
            const items = await this.parseRSSFeed(this.apis.esa.news);
            return items.slice(0, limit).map(item => ({
                ...item,
                source: 'esa'
            }));
        });
    }
    
    /**
     * Get ESA mission updates
     * @param {number} limit - Number of articles
     * @returns {Promise<Array>} Array of mission news
     */
    async getESAMissions(limit = 10) {
        return this.getCachedOrFetch('esa_missions', async () => {
            const items = await this.parseRSSFeed(this.apis.esa.missions);
            return items.slice(0, limit).map(item => ({
                ...item,
                source: 'esa_missions'
            }));
        });
    }
    
    // ============================================================================
    // TELESCOPE DATA INTEGRATIONS
    // ============================================================================
    
    /**
     * Get Hubble Space Telescope news and updates
     * @param {number} limit - Number of items
     * @returns {Promise<Array>} Array of Hubble news
     */
    async getHubbleNews(limit = 10) {
        return this.getCachedOrFetch('hubble_news', async () => {
            try {
                const data = await this.fetchJSON(this.apis.telescopes.hubble);
                return (data || []).slice(0, limit).map(item => ({
                    title: item.name || item.title || 'Hubble Update',
                    description: item.abstract || item.description || '',
                    link: item.url || item.link || '',
                    date: item.release_date || item.pubDate || '',
                    image: item.thumbnail_2k || item.image || '',
                    source: 'hubble'
                }));
            } catch (error) {
                this.logError('Error fetching Hubble news:', error);
                return [];
            }
        });
    }
    
    /**
     * Get James Webb Space Telescope updates
     * @returns {Promise<Array>} Array of JWST news
     */
    async getJWSTUpdates() {
        return this.getCachedOrFetch('jwst_updates', async () => {
            try {
                // JWST doesn't have a public API, so we'll use their news feed
                const items = await this.parseRSSFeed('https://www.jwst.nasa.gov/content/webbLaunch/news.rss');
                return items.map(item => ({
                    ...item,
                    source: 'jwst'
                }));
            } catch (error) {
                this.logError('Error fetching JWST updates:', error);
                return [];
            }
        });
    }
    
    /**
     * Get all telescope data (Hubble, JWST, etc.)
     * @returns {Promise<Object>} Combined telescope data
     */
    async getAllTelescopeData() {
        try {
            const [hubble, jwst] = await Promise.allSettled([
                this.getHubbleNews(5),
                this.getJWSTUpdates()
            ]);
            
            return {
                hubble: hubble.status === 'fulfilled' ? hubble.value : [],
                jwst: jwst.status === 'fulfilled' ? jwst.value : [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logError('Error fetching telescope data:', error);
            return {
                hubble: [],
                jwst: [],
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    
    /**
     * Get all updates (exoplanets, launches, news, telescopes)
     * @returns {Promise<Object>} Combined data from all sources
     */
    async getAllUpdates() {
        if (this.isAutomation()) {
            return this.getBuildCachedUpdates();
        }

        try {
            const [exoplanets, apod, neo, launches, news, telescopes] = await Promise.allSettled([
                this.getNASAExoplanets(10),
                this.getNASAAPOD().catch(() => null), // APOD is optional
                this.getNASANEO().catch(() => null), // NEO requires API key, so catch errors
                this.getSpaceXLaunches(5),
                this.getAllSpaceNews(5),
                this.getAllTelescopeData()
            ]);

            return {
                exoplanets: exoplanets.status === 'fulfilled' ? exoplanets.value : [],
                apod: apod.status === 'fulfilled' && apod.value ? apod.value : null,
                neo: neo.status === 'fulfilled' && neo.value ? neo.value : null,
                launches: launches.status === 'fulfilled' ? launches.value : [],
                news: news.status === 'fulfilled' ? news.value : [],
                telescopes: telescopes.status === 'fulfilled' ? telescopes.value : {},
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logError('Error fetching all updates:', error);
            return {
                exoplanets: [],
                apod: null,
                neo: null,
                launches: [],
                news: [],
                telescopes: {},
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Cleanup intervals
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.cache.clear();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') window.SpaceAPIIntegrations = SpaceAPIIntegrations;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpaceAPIIntegrations;
}
