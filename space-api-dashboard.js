/**
 * Space API Dashboard UI
 * Displays real-time data from NASA, ESA, SpaceX, and space news
 */

class SpaceAPIDashboard {
    constructor(apiIntegrations) {
        this.api = apiIntegrations;
        this.container = null;
        this.updateInterval = null;
        this.isVisible = false;
    }
    
    /**
     * Initialize the dashboard
     * @param {HTMLElement} container - Container element for the dashboard
     */
    init(container) {
        this.container = container;
        if (!this.container) {
            console.error('Space API Dashboard: Container not found');
            return;
        }
        
        this.render();
        this.startAutoUpdate();
    }
    
    /**
     * Render the dashboard
     */
    async render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="space-api-dashboard">
                <div class="dashboard-header">
                    <h2>🌌 Real-Time Space Updates</h2>
                    <button class="refresh-btn" id="refresh-space-data">🔄 Refresh</button>
                </div>
                
                <div class="dashboard-tabs">
                    <button class="tab-btn active" data-tab="all">All Updates</button>
                    <button class="tab-btn" data-tab="exoplanets">Exoplanets</button>
                    <button class="tab-btn" data-tab="apod">APOD</button>
                    <button class="tab-btn" data-tab="neo">NEO</button>
                    <button class="tab-btn" data-tab="launches">Launches</button>
                    <button class="tab-btn" data-tab="telescopes">Telescopes</button>
                    <button class="tab-btn" data-tab="news">News</button>
                    <button class="tab-btn" data-tab="esa">ESA</button>
                </div>
                
                <div class="dashboard-content">
                    <div id="space-data-loading" class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading space data...</p>
                    </div>
                    
                    <div id="space-data-content" class="data-content" style="display: none;">
                        <!-- Content will be populated here -->
                    </div>
                    
                    <div id="space-data-error" class="error-state" style="display: none;">
                        <p>⚠️ Unable to load space data. Please try again later.</p>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        await this.loadData();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        const tabButtons = this.container.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                this.showTab(tab);
            });
        });
        
        // Refresh button
        const refreshBtn = this.container.querySelector('#refresh-space-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData(true);
            });
        }
    }
    
    /**
     * Show specific tab
     */
    async showTab(tab) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        if (tab === 'all') {
            await this.loadData();
        } else {
            await this.loadTabData(tab);
        }
    }
    
    /**
     * Load data for all tabs
     */
    async loadData(forceRefresh = false) {
        const loading = this.container.querySelector('#space-data-loading');
        const content = this.container.querySelector('#space-data-content');
        const error = this.container.querySelector('#space-data-error');
        
        if (loading) loading.style.display = 'block';
        if (content) content.style.display = 'none';
        if (error) error.style.display = 'none';
        
        try {
            if (forceRefresh) {
                // Clear cache to force refresh
                this.api.cache.clear();
            }
            
            const data = await this.api.getAllUpdates();
            
            if (loading) loading.style.display = 'none';
            if (content) {
                content.style.display = 'block';
                this.renderAllData(data);
            }
        } catch (err) {
            console.error('Error loading space data:', err);
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'block';
        }
    }
    
    /**
     * Load data for specific tab
     */
    async loadTabData(tab) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        try {
            let data;
            switch (tab) {
                case 'exoplanets':
                    data = await this.api.getNASAExoplanets(20);
                    this.renderExoplanets(data);
                    break;
                case 'apod':
                    data = await this.api.getNASAAPOD();
                    this.renderAPOD(data);
                    break;
                case 'neo':
                    try {
                        data = await this.api.getNASANEO();
                        this.renderNEO(data);
                    } catch (err) {
                        content.innerHTML = `<p class="error">⚠️ NASA API key required for NEO data. Please configure your API key.</p>`;
                    }
                    break;
                case 'launches':
                    const [upcoming, latest] = await Promise.all([
                        this.api.getSpaceXLaunches(5),
                        this.api.getSpaceXLatestLaunches(5)
                    ]);
                    this.renderLaunches({ upcoming, latest });
                    break;
                case 'telescopes':
                    data = await this.api.getAllTelescopeData();
                    this.renderTelescopes(data);
                    break;
                case 'news':
                    data = await this.api.getAllSpaceNews(10);
                    this.renderNews(data);
                    break;
                case 'esa':
                    const [esaNews, esaMissions] = await Promise.allSettled([
                        this.api.getESANews(10),
                        this.api.getESAMissions(10)
                    ]);
                    this.renderESA({
                        news: esaNews.status === 'fulfilled' ? esaNews.value : [],
                        missions: esaMissions.status === 'fulfilled' ? esaMissions.value : []
                    });
                    break;
            }
        } catch (err) {
            console.error(`Error loading ${tab} data:`, err);
            content.innerHTML = `<p class="error">⚠️ Error loading ${tab} data</p>`;
        }
    }
    
    /**
     * Render all data
     */
    renderAllData(data) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        // Get telescope data if available
        const telescopeData = data.telescopes || {};
        const hubbleCount = telescopeData.hubble ? telescopeData.hubble.length : 0;
        const jwstCount = telescopeData.jwst ? telescopeData.jwst.length : 0;
        
        content.innerHTML = `
            <div class="data-grid">
                <div class="data-section">
                    <h3>🪐 Latest Exoplanets (${data.exoplanets.length})</h3>
                    <div class="exoplanets-list">
                        ${this.renderExoplanetsList(data.exoplanets.slice(0, 5))}
                    </div>
                    ${data.exoplanets.length > 5 ? `<button class="view-more-btn" data-tab="exoplanets">View All →</button>` : ''}
                </div>
                
                <div class="data-section">
                    <h3>🚀 Upcoming Launches (${data.launches.length})</h3>
                    <div class="launches-list">
                        ${this.renderLaunchesList(data.launches)}
                    </div>
                    ${data.launches.length > 0 ? `<button class="view-more-btn" data-tab="launches">View All →</button>` : ''}
                </div>
                
                <div class="data-section">
                    <h3>📰 Space News (${data.news.length})</h3>
                    <div class="news-list">
                        ${this.renderNewsList(data.news.slice(0, 5))}
                    </div>
                    ${data.news.length > 5 ? `<button class="view-more-btn" data-tab="news">View All →</button>` : ''}
                </div>
                
                ${hubbleCount > 0 || jwstCount > 0 ? `
                <div class="data-section">
                    <h3>🔭 Telescope Updates</h3>
                    <div class="telescopes-preview">
                        ${hubbleCount > 0 ? `<div class="telescope-item">Hubble: ${hubbleCount} updates</div>` : ''}
                        ${jwstCount > 0 ? `<div class="telescope-item">JWST: ${jwstCount} updates</div>` : ''}
                    </div>
                    <button class="view-more-btn" data-tab="telescopes">View All →</button>
                </div>
                ` : ''}
            </div>
            
            <div class="last-updated">
                Last updated: ${new Date(data.timestamp).toLocaleString()}
            </div>
        `;
        
        // Add click handlers for "View All" buttons
        content.querySelectorAll('.view-more-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                const tabBtn = this.container.querySelector(`[data-tab="${tab}"]`);
                if (tabBtn) tabBtn.click();
            });
        });
    }
    
    /**
     * Render exoplanets list
     */
    renderExoplanetsList(exoplanets) {
        if (!exoplanets || exoplanets.length === 0) {
            return '<p class="no-data">No exoplanet data available</p>';
        }
        
        return exoplanets.map(planet => `
            <div class="exoplanet-item">
                <div class="planet-name">${planet.name || 'Unknown'}</div>
                <div class="planet-details">
                    ${planet.discoveryYear ? `<span>Discovered: ${planet.discoveryYear}</span>` : ''}
                    ${planet.distance ? `<span>Distance: ${planet.distance.toFixed(2)} ly</span>` : ''}
                    ${planet.method ? `<span>Method: ${planet.method}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render exoplanets tab
     */
    renderExoplanets(exoplanets) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="exoplanets-full">
                <h3>Latest Exoplanet Discoveries</h3>
                <div class="exoplanets-grid">
                    ${this.renderExoplanetsList(exoplanets)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render launches list
     */
    renderLaunchesList(launches) {
        if (!launches || launches.length === 0) {
            return '<p class="no-data">No launch data available</p>';
        }
        
        return launches.map(launch => `
            <div class="launch-item ${launch.upcoming ? 'upcoming' : ''}">
                <div class="launch-name">${launch.name || 'Unknown Mission'}</div>
                <div class="launch-date">${launch.date ? new Date(launch.date).toLocaleDateString() : 'TBD'}</div>
                ${launch.details ? `<div class="launch-details">${launch.details.substring(0, 100)}...</div>` : ''}
            </div>
        `).join('');
    }
    
    /**
     * Render launches tab
     */
    renderLaunches(data) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="launches-full">
                <div class="launches-section">
                    <h3>🚀 Upcoming Launches</h3>
                    <div class="launches-list">
                        ${this.renderLaunchesList(data.upcoming || [])}
                    </div>
                </div>
                
                <div class="launches-section">
                    <h3>📅 Recent Launches</h3>
                    <div class="launches-list">
                        ${this.renderLaunchesList(data.latest || [])}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render news list
     */
    renderNewsList(news) {
        if (!news || news.length === 0) {
            return '<p class="no-data">No news available</p>';
        }
        
        return news.map(item => `
            <div class="news-item">
                <div class="news-source">${item.source || 'Unknown'}</div>
                <div class="news-title">
                    <a href="${item.link || '#'}" target="_blank" rel="noopener">
                        ${item.title || 'No title'}
                    </a>
                </div>
                ${item.pubDate ? `<div class="news-date">${new Date(item.pubDate).toLocaleDateString()}</div>` : ''}
            </div>
        `).join('');
    }
    
    /**
     * Render news tab
     */
    renderNews(news) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="news-full">
                <h3>Latest Space News</h3>
                <div class="news-list">
                    ${this.renderNewsList(news)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render NASA APOD (Astronomy Picture of the Day)
     */
    renderAPOD(apod) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="apod-full">
                <h3>🌌 Astronomy Picture of the Day</h3>
                <div class="apod-card">
                    <div class="apod-date">${apod.date ? new Date(apod.date).toLocaleDateString() : 'Today'}</div>
                    <h4 class="apod-title">${apod.title || 'NASA APOD'}</h4>
                    ${apod.url ? `
                        <div class="apod-image">
                            ${apod.media_type === 'video' ? 
                                `<iframe src="${apod.url}" frameborder="0" allowfullscreen></iframe>` :
                                `<img src="${apod.url}" alt="${apod.title || 'APOD'}" loading="lazy">`
                            }
                        </div>
                    ` : ''}
                    <div class="apod-explanation">${apod.explanation || 'No explanation available.'}</div>
                    ${apod.copyright ? `<div class="apod-copyright">© ${apod.copyright}</div>` : ''}
                    ${apod.hdurl ? `<a href="${apod.hdurl}" target="_blank" rel="noopener" class="apod-hd-link">View HD Version →</a>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render NASA NEO (Near Earth Objects)
     */
    renderNEO(neo) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        const today = new Date().toISOString().split('T')[0];
        const neoData = neo.near_earth_objects && neo.near_earth_objects[today] ? neo.near_earth_objects[today] : [];
        const elementCount = neo.element_count || 0;
        
        content.innerHTML = `
            <div class="neo-full">
                <h3>🌍 Near Earth Objects - ${today}</h3>
                <div class="neo-stats">
                    <div class="stat-item">Total NEOs Today: <strong>${elementCount}</strong></div>
                </div>
                <div class="neo-list">
                    ${neoData.length > 0 ? neoData.map(obj => `
                        <div class="neo-item ${obj.is_potentially_hazardous_asteroid ? 'hazardous' : ''}">
                            <div class="neo-name">${obj.name || 'Unknown'}</div>
                            <div class="neo-details">
                                ${obj.is_potentially_hazardous_asteroid ? '<span class="hazard-badge">⚠️ Potentially Hazardous</span>' : ''}
                                ${obj.estimated_diameter ? `
                                    <span>Diameter: ${obj.estimated_diameter.kilometers.estimated_diameter_min.toFixed(2)} - ${obj.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2)} km</span>
                                ` : ''}
                                ${obj.close_approach_data && obj.close_approach_data[0] ? `
                                    <span>Miss Distance: ${parseFloat(obj.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km</span>
                                    <span>Velocity: ${parseFloat(obj.close_approach_data[0].relative_velocity.kilometers_per_hour).toLocaleString()} km/h</span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('') : '<p class="no-data">No near Earth objects for today</p>'}
                </div>
            </div>
        `;
    }
    
    /**
     * Render Telescope data (Hubble & JWST)
     */
    renderTelescopes(telescopeData) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        const hubble = telescopeData.hubble || [];
        const jwst = telescopeData.jwst || [];
        
        content.innerHTML = `
            <div class="telescopes-full">
                <div class="telescope-section">
                    <h3>🔭 Hubble Space Telescope</h3>
                    <div class="telescope-list">
                        ${hubble.length > 0 ? hubble.map(item => `
                            <div class="telescope-item">
                                <div class="telescope-title">${item.title || 'Hubble Update'}</div>
                                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="telescope-image" loading="lazy">` : ''}
                                <div class="telescope-description">${item.description || ''}</div>
                                ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="telescope-link">Read More →</a>` : ''}
                                ${item.date ? `<div class="telescope-date">${new Date(item.date).toLocaleDateString()}</div>` : ''}
                            </div>
                        `).join('') : '<p class="no-data">No Hubble updates available</p>'}
                    </div>
                </div>
                
                <div class="telescope-section">
                    <h3>🛰️ James Webb Space Telescope</h3>
                    <div class="telescope-list">
                        ${jwst.length > 0 ? jwst.map(item => `
                            <div class="telescope-item">
                                <div class="telescope-title">${item.title || 'JWST Update'}</div>
                                <div class="telescope-description">${item.description || ''}</div>
                                ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="telescope-link">Read More →</a>` : ''}
                                ${item.pubDate ? `<div class="telescope-date">${new Date(item.pubDate).toLocaleDateString()}</div>` : ''}
                            </div>
                        `).join('') : '<p class="no-data">No JWST updates available</p>'}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render ESA news and missions
     */
    renderESA(esaData) {
        const content = this.container.querySelector('#space-data-content');
        if (!content) return;
        
        const news = esaData.news || [];
        const missions = esaData.missions || [];
        
        content.innerHTML = `
            <div class="esa-full">
                <div class="esa-section">
                    <h3>🇪🇺 ESA News</h3>
                    <div class="news-list">
                        ${news.length > 0 ? news.map(item => `
                            <div class="news-item">
                                <div class="news-source">ESA</div>
                                <div class="news-title">
                                    <a href="${item.link || '#'}" target="_blank" rel="noopener">
                                        ${item.title || 'No title'}
                                    </a>
                                </div>
                                ${item.pubDate ? `<div class="news-date">${new Date(item.pubDate).toLocaleDateString()}</div>` : ''}
                            </div>
                        `).join('') : '<p class="no-data">No ESA news available</p>'}
                    </div>
                </div>
                
                <div class="esa-section">
                    <h3>🚀 ESA Missions</h3>
                    <div class="news-list">
                        ${missions.length > 0 ? missions.map(item => `
                            <div class="news-item">
                                <div class="news-source">ESA Missions</div>
                                <div class="news-title">
                                    <a href="${item.link || '#'}" target="_blank" rel="noopener">
                                        ${item.title || 'No title'}
                                    </a>
                                </div>
                                ${item.pubDate ? `<div class="news-date">${new Date(item.pubDate).toLocaleDateString()}</div>` : ''}
                            </div>
                        `).join('') : '<p class="no-data">No ESA mission updates available</p>'}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Start auto-update
     */
    startAutoUpdate() {
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.loadData();
            }
        }, 5 * 60 * 1000);
    }
    
    /**
     * Stop auto-update
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Show dashboard
     */
    show() {
        this.isVisible = true;
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    
    /**
     * Hide dashboard
     */
    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.stopAutoUpdate();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpaceAPIDashboard;
}

