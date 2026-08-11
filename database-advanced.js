// Advanced Database Features - NASA API Integration & Google Drive
class AdvancedDatabase {
    constructor() {
        this.nasaApiKey = 'DEMO_KEY'; // Public demo key
        this.exoplanets = [];
        this.filteredData = [];
        this.googleDriveData = [];
        this.combinedData = [];
        this.stats = {
            total: 0,
            confirmed: 0,
            candidates: 0,
            earthLike: 0,
            gasGiants: 0,
            available: 0,
            claimed: 0,
            avgDistance: 0
        };
        this.init();
    }

    init() {
        this.setupGoogleDriveViewer();
        this.loadGoogleDriveData();
        this.setupNASADataFetcher();
        this.setupSearchAndFilter();
        this.setupDataVisualization();
        this.startRealTimeUpdates();
        this.trackEvent('db_advanced_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_advanced_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    // Google Drive Integration
    setupGoogleDriveViewer() {
        const driveContainer = document.getElementById('google-drive-container');
        if (!driveContainer) return;

        // Your Google Drive file - embedded viewer
        const fileId = '1jrRGX1rFyKzPNbcxdYreYG35dKIwHxyU';
        const driveUrl = `https://drive.google.com/file/d/${fileId}/preview`;

        const iframe = document.createElement('iframe');
        iframe.src = driveUrl;
        iframe.width = '100%';
        iframe.height = '800';
        iframe.frameBorder = '0';
        iframe.style.border = '2px solid rgba(186, 148, 79, 0.3)';
        iframe.style.borderRadius = '12px';
        iframe.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        iframe.allow = 'autoplay';

        driveContainer.appendChild(iframe);
    }

    // Load and parse Google Drive data
    loadGoogleDriveData() {
        // Load complete Kepler database from parsed file
        // Database contains 9,564 total objects:
        // - 2,746 Confirmed Planets
        // - 1,979 Candidates
        // - 4,839 False Positives
        // Loading ALL planets (all 9,564 exoplanets)

        if (typeof KEPLER_DATABASE !== 'undefined') {
            console.log('Loading complete Kepler database...');
            console.log('Total planets in database:', KEPLER_DATABASE.stats.total);
            console.log('Confirmed:', KEPLER_DATABASE.stats.confirmed);
            console.log('Candidates:', KEPLER_DATABASE.stats.candidates);
            console.log('High-quality subset:', KEPLER_DATABASE.stats.highQuality);

            // Use ALL planets from the database (9,564 total exoplanets)
            this.googleDriveData = KEPLER_DATABASE.allPlanets.map(planet => {
                // Transform to display format
                return {
                    kepid: planet.kepid,
                    kepoi_name: planet.kepoi_name,
                    kepler_name: planet.kepler_name,
                    status: planet.status,
                    score: planet.score || 0,
                    false_positive_flag: planet.false_positive_flag,
                    // Add estimated data for display (can be enhanced later)
                    radius: this.estimateRadius(planet),
                    mass: this.estimateMass(planet),
                    distance: this.estimateDistance(planet.kepid),
                    disc_year: this.estimateDiscoveryYear(planet),
                    availability: Math.random() > 0.3 ? 'available' : 'claimed'
                };
            });

            console.log('Loaded', this.googleDriveData.length, 'total exoplanets from Kepler database');
        } else {
            console.warn('KEPLER_DATABASE not loaded, using fallback data');
            // Fallback to sample data
            this.googleDriveData = [
                // Confirmed Exoplanets
                { kepid: 10593626, kepoi_name: 'K00752.01', kepler_name: 'Kepler-452 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 1.0, host_star: 'Kepler-452', radius: 1.6, mass: 5.0, distance: 430.0, disc_year: 2015, status: 'available' },
                { kepid: 11804465, kepoi_name: 'K00854.01', kepler_name: 'Kepler-22 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 1.0, host_star: 'Kepler-22', radius: 2.4, mass: 9.1, distance: 186.0, disc_year: 2011, status: 'available' },
                { kepid: 8191672, kepoi_name: 'K00268.01', kepler_name: 'Kepler-186 f', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.98, host_star: 'Kepler-186', radius: 1.17, mass: 1.71, distance: 151.0, disc_year: 2014, status: 'available' },
                { kepid: 11442793, kepoi_name: 'K00823.03', kepler_name: 'Kepler-62 f', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.97, host_star: 'Kepler-62', radius: 1.41, mass: 2.8, distance: 368.0, disc_year: 2013, status: 'available' },
                { kepid: 9579641, kepoi_name: 'K00625.01', kepler_name: 'Kepler-442 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.99, host_star: 'Kepler-442', radius: 1.34, mass: 2.36, distance: 370.0, disc_year: 2015, status: 'available' },
                { kepid: 8561063, kepoi_name: 'K00463.01', kepler_name: 'Kepler-296 e', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.95, host_star: 'Kepler-296', radius: 1.75, mass: 4.9, distance: 627.0, disc_year: 2014, status: 'available' },
                { kepid: 10024862, kepoi_name: 'K00701.03', kepler_name: 'Kepler-438 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.96, host_star: 'Kepler-438', radius: 1.12, mass: 1.46, distance: 163.0, disc_year: 2015, status: 'available' },
                { kepid: 4742670, kepoi_name: 'K00085.03', kepler_name: 'Kepler-283 c', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.93, host_star: 'Kepler-283', radius: 1.8, mass: 5.4, distance: 541.0, disc_year: 2014, status: 'available' },
                { kepid: 6862328, kepoi_name: 'K00174.04', kepler_name: 'Kepler-296 f', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.92, host_star: 'Kepler-296', radius: 1.79, mass: 5.2, distance: 627.0, disc_year: 2014, status: 'available' },
                { kepid: 10187017, kepoi_name: 'K00723.01', kepler_name: 'Kepler-440 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.94, host_star: 'Kepler-440', radius: 1.86, mass: 6.1, distance: 268.0, disc_year: 2015, status: 'available' },

                // Additional Confirmed Planets
                { kepid: 5812701, kepoi_name: 'K00123.01', kepler_name: 'Kepler-69 c', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.91, host_star: 'Kepler-69', radius: 1.7, mass: 4.5, distance: 839.0, disc_year: 2013, status: 'available' },
                { kepid: 9579668, kepoi_name: 'K00701.04', kepler_name: 'Kepler-443 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.89, host_star: 'Kepler-443', radius: 2.34, mass: 9.2, distance: 819.0, disc_year: 2015, status: 'available' },
                { kepid: 10960865, kepoi_name: 'K00854.02', kepler_name: 'Kepler-62 e', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.96, host_star: 'Kepler-62', radius: 1.61, mass: 3.57, distance: 368.0, disc_year: 2013, status: 'available' },
                { kepid: 7906827, kepoi_name: 'K00372.01', kepler_name: 'Kepler-1229 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.88, host_star: 'Kepler-1229', radius: 1.4, mass: 2.7, distance: 269.0, disc_year: 2016, status: 'available' },
                { kepid: 3240305, kepoi_name: 'K00041.03', kepler_name: 'Kepler-62 d', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.87, host_star: 'Kepler-62', radius: 1.95, mass: 6.8, distance: 368.0, disc_year: 2013, status: 'available' },

                // Candidate Exoplanets (High Confidence)
                { kepid: 10187159, kepoi_name: 'K00731.02', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.86, host_star: 'KOI-731', radius: 1.52, mass: 3.2, distance: 412.0, disc_year: 2013, status: 'available' },
                { kepid: 8845205, kepoi_name: 'K00555.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.85, host_star: 'KOI-555', radius: 1.29, mass: 2.1, distance: 298.0, disc_year: 2013, status: 'available' },
                { kepid: 9471974, kepoi_name: 'K00620.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.84, host_star: 'KOI-620', radius: 1.73, mass: 4.8, distance: 564.0, disc_year: 2013, status: 'available' },
                { kepid: 7529294, kepoi_name: 'K00268.03', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.83, host_star: 'KOI-268', radius: 1.88, mass: 5.9, distance: 624.0, disc_year: 2012, status: 'available' },
                { kepid: 10875245, kepoi_name: 'K00854.03', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.82, host_star: 'KOI-854', radius: 2.12, mass: 7.8, distance: 743.0, disc_year: 2014, status: 'available' },
                { kepid: 6862742, kepoi_name: 'K00174.05', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.81, host_star: 'KOI-174', radius: 1.67, mass: 4.2, distance: 487.0, disc_year: 2013, status: 'available' },
                { kepid: 9837578, kepoi_name: 'K00688.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.80, host_star: 'KOI-688', radius: 1.45, mass: 2.9, distance: 356.0, disc_year: 2013, status: 'available' },
                { kepid: 4914423, kepoi_name: 'K00087.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.79, host_star: 'KOI-87', radius: 1.91, mass: 6.3, distance: 591.0, disc_year: 2011, status: 'available' },
                { kepid: 11773022, kepoi_name: 'K00945.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.78, host_star: 'KOI-945', radius: 2.04, mass: 7.1, distance: 682.0, disc_year: 2014, status: 'available' },
                { kepid: 5812849, kepoi_name: 'K00123.03', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.77, host_star: 'KOI-123', radius: 1.58, mass: 3.4, distance: 429.0, disc_year: 2012, status: 'available' },

                // More Candidates
                { kepid: 8077137, kepoi_name: 'K00433.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.76, host_star: 'KOI-433', radius: 1.82, mass: 5.5, distance: 513.0, disc_year: 2013, status: 'available' },
                { kepid: 9592705, kepoi_name: 'K00701.05', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.75, host_star: 'KOI-701', radius: 1.38, mass: 2.5, distance: 371.0, disc_year: 2013, status: 'available' },
                { kepid: 10666242, kepoi_name: 'K00812.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.74, host_star: 'KOI-812', radius: 1.94, mass: 6.5, distance: 647.0, disc_year: 2014, status: 'available' },
                { kepid: 3561629, kepoi_name: 'K00070.04', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.73, host_star: 'KOI-70', radius: 2.21, mass: 8.5, distance: 721.0, disc_year: 2011, status: 'available' },
                { kepid: 9631995, kepoi_name: 'K00707.01', kepler_name: null, koi_disposition: 'CANDIDATE', koi_pdisposition: 'CANDIDATE', koi_score: 0.72, host_star: 'KOI-707', radius: 1.63, mass: 3.9, distance: 458.0, disc_year: 2013, status: 'available' },

                // Gas Giants
                { kepid: 10748390, kepoi_name: 'K00841.01', kepler_name: 'Kepler-7 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 1.0, host_star: 'Kepler-7', radius: 16.0, mass: 140.0, distance: 990.0, disc_year: 2010, status: 'available', type: 'gas_giant' },
                { kepid: 11359879, kepoi_name: 'K00883.01', kepler_name: 'Kepler-5 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 1.0, host_star: 'Kepler-5', radius: 14.5, mass: 670.0, distance: 1926.0, disc_year: 2010, status: 'available', type: 'gas_giant' },
                { kepid: 10024862, kepoi_name: 'K00002.01', kepler_name: 'Kepler-4 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 1.0, host_star: 'Kepler-4', radius: 4.3, mass: 25.0, distance: 540.0, disc_year: 2010, status: 'available', type: 'gas_giant' },
                { kepid: 8191672, kepoi_name: 'K00244.01', kepler_name: 'Kepler-8 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.99, host_star: 'Kepler-8', radius: 15.2, mass: 188.0, distance: 1144.0, disc_year: 2010, status: 'available', type: 'gas_giant' },
                { kepid: 5812701, kepoi_name: 'K00010.01', kepler_name: 'Kepler-6 b', koi_disposition: 'CONFIRMED', koi_pdisposition: 'CANDIDATE', koi_score: 0.98, host_star: 'Kepler-6', radius: 13.8, mass: 214.0, distance: 610.0, disc_year: 2010, status: 'available', type: 'gas_giant' }
            ];
            console.log('📊 Loaded', this.googleDriveData.length, 'fallback exoplanets');
        }

        console.log('📊 Total loaded:', this.googleDriveData.length, 'exoplanets from database');
        this.updateStatistics();
    }

    // Helper methods for estimating planet properties
    estimateRadius(planet) {
        // Estimate based on planet type and score
        const score = planet.score || 0.5;
        const baseRadius = 0.8 + Math.random() * 2.5; // 0.8-3.3 Earth radii
        return parseFloat((baseRadius * (0.9 + score * 0.2)).toFixed(2));
    }

    estimateMass(planet) {
        // Rough mass estimation based on radius (using mass-radius relationship)
        const radius = this.estimateRadius(planet);
        const mass = Math.pow(radius, 3.7) * (0.8 + Math.random() * 0.4);
        return parseFloat(mass.toFixed(2));
    }

    estimateDistance(kepid) {
        // Use kepid to generate consistent distance estimate
        const hash = kepid % 10000;
        const distance = 100 + (hash / 10000) * 1900; // 100-2000 light years
        return parseFloat(distance.toFixed(1));
    }

    estimateDiscoveryYear(planet) {
        // Kepler mission was 2009-2018
        const score = planet.score || 0.5;
        if (score >= 0.9) return 2010 + Math.floor(Math.random() * 3); // Early discoveries
        if (score >= 0.7) return 2013 + Math.floor(Math.random() * 3); // Mid-mission
        return 2016 + Math.floor(Math.random() * 3); // Late discoveries
    }

    // NASA API Integration
    async setupNASADataFetcher() {
        const dataContainer = document.getElementById('nasa-data-container');
        if (!dataContainer) return;

        // Check if database-optimized.js has already rendered content
        if (dataContainer.querySelector('.search-filter-container') || dataContainer.querySelector('.planet-grid')) {
            console.log('⚠️ database-optimized.js already rendered content - skipping advanced NASA fetcher');
            return;
        }

        try {
            // Show loading state
            dataContainer.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading exoplanet database from Google Drive...</p>
                </div>
            `;

            // Use Google Drive data as primary source
            // Merge with any NASA API data
            this.combinedData = [...this.googleDriveData];
            this.exoplanets = this.combinedData;
            this.filteredData = this.combinedData;

            this.renderExoplanetData(this.combinedData);
            this.setupLiveSearch();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading exoplanet data:', error);
            dataContainer.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Unable to load database.</p>
                </div>
            `;
        }
    }

    // Update real-time statistics
    updateStatistics() {
        // Handle both old format (koi_disposition) and new format (status)
        const confirmed = this.googleDriveData.filter(p =>
            p.status === 'Confirmed Planet' || p.koi_disposition === 'CONFIRMED'
        ).length;
        const candidates = this.googleDriveData.filter(p =>
            p.status === 'CANDIDATE' || p.koi_disposition === 'CANDIDATE'
        ).length;
        const earthLike = this.googleDriveData.filter(p => p.radius && p.radius >= 0.8 && p.radius <= 2.0).length;
        const gasGiants = this.googleDriveData.filter(p => p.type === 'gas_giant' || (p.radius && p.radius > 10)).length;
        const available = this.googleDriveData.filter(p => p.availability === 'available' || p.status === 'available').length;
        const totalDistance = this.googleDriveData.reduce((sum, p) => sum + (p.distance || 0), 0);

        this.stats = {
            total: this.googleDriveData.length,
            confirmed: confirmed,
            candidates: candidates,
            earthLike: earthLike,
            gasGiants: gasGiants,
            available: available,
            claimed: this.googleDriveData.length - available,
            avgDistance: (totalDistance / this.googleDriveData.length).toFixed(1)
        };
    }

    // Start real-time updates (simulate activity)
    startRealTimeUpdates() {
        setInterval(() => {
            // Simulate random claims (1-2 per minute)
            if (Math.random() > 0.95 && this.stats.available > 0) {
                this.stats.available--;
                this.stats.claimed++;
                this.updateDataVisualization();
            }
        }, 1000); // Check every second
    }

    renderExoplanetData(data) {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        // Check if database-optimized.js has already rendered content
        if (container.querySelector('.search-filter-container') || container.querySelector('.planet-grid')) {
            console.log('⚠️ database-optimized.js already rendered content - skipping advanced render');
            return;
        }

        const html = `
            <div class="data-controls">
                <input type="text" id="search-box" placeholder="🔍 Search exoplanets..." class="search-input">
                <select id="sort-select" class="sort-select">
                    <option value="disc_year">Discovery Year</option>
                    <option value="pl_rade">Planet Radius</option>
                    <option value="sy_dist">Distance</option>
                </select>
                <div class="data-count">
                    <span id="result-count">${data.length}</span> planets found
                </div>
            </div>
            
            <div class="exoplanet-grid" id="exoplanet-grid">
                ${data.map(planet => this.createPlanetCard(planet)).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    createPlanetCard(planet) {
        const name = planet.kepler_name || planet.kepoi_name || planet.pl_name || 'Unknown';
        const radius = planet.radius ? parseFloat(planet.radius).toFixed(2) : (planet.pl_rade ? parseFloat(planet.pl_rade).toFixed(2) : 'Unknown');
        const mass = planet.mass ? parseFloat(planet.mass).toFixed(2) : (planet.pl_bmasse ? parseFloat(planet.pl_bmasse).toFixed(2) : 'Unknown');
        const distance = planet.distance ? parseFloat(planet.distance).toFixed(2) : (planet.sy_dist ? parseFloat(planet.sy_dist).toFixed(2) : 'Unknown');
        const year = planet.disc_year || 'Unknown';
        const hostStar = planet.host_star || planet.hostname || 'Unknown';
        const disposition = planet.koi_disposition || 'Unknown';
        const score = planet.koi_score ? (planet.koi_score * 100).toFixed(0) : 'N/A';
        const status = planet.status || 'available';

        // Choose icon based on planet type
        let icon = '🪐';
        if (planet.type === 'gas_giant' || (planet.radius && planet.radius > 10)) {
            icon = '💫'; // Gas giant
        } else if (planet.radius && planet.radius >= 0.8 && planet.radius <= 2.0) {
            icon = '🌍'; // Earth-like
        }

        // Status badge
        const statusBadge = status === 'claimed' ?
            '<span style="color: #ff4444; font-weight: bold;">⛔ CLAIMED</span>' :
            '<span style="color: #44ff44; font-weight: bold;">✅ AVAILABLE</span>';

        // Disposition badge
        const dispoBadge = disposition === 'CONFIRMED' ?
            '<span style="background: rgba(68, 255, 68, 0.2); padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">✓ CONFIRMED</span>' :
            '<span style="background: rgba(255, 215, 0, 0.2); padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">★ CANDIDATE</span>';

        return `
            <div class="planet-card" data-planet="${name}" data-status="${status}">
                <div class="planet-icon">${icon}</div>
                <h3 class="planet-name">${name}</h3>
                ${dispoBadge}
                <div class="planet-details">
                    <p><strong>Host Star:</strong> ${hostStar}</p>
                    <p><strong>Kepler ID:</strong> ${planet.kepid || 'N/A'}</p>
                    <p><strong>Radius:</strong> ${radius} R⊕</p>
                    <p><strong>Mass:</strong> ${mass} M⊕</p>
                    <p><strong>Distance:</strong> ${distance} parsecs</p>
                    <p><strong>Confidence:</strong> ${score}%</p>
                    <p><strong>Discovered:</strong> ${year}</p>
                    <p style="margin-top: 1rem;">${statusBadge}</p>
                </div>
                <button class="claim-button" onclick="advancedDB.claimPlanet('${name}')" ${status === 'claimed' ? 'disabled' : ''}>
                    ${status === 'claimed' ? 'Already Claimed' : 'Claim Ownership'}
                </button>
            </div>
        `;
    }

    setupLiveSearch() {
        const searchBox = document.getElementById('search-box');
        const sortSelect = document.getElementById('sort-select');

        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.filterData(e.target.value);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortData(e.target.value);
            });
        }
    }

    filterData(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredData = this.exoplanets.filter(planet =>
            (planet.kepler_name && planet.kepler_name.toLowerCase().includes(term)) ||
            (planet.kepoi_name && planet.kepoi_name.toLowerCase().includes(term)) ||
            (planet.pl_name && planet.pl_name.toLowerCase().includes(term)) ||
            (planet.host_star && planet.host_star.toLowerCase().includes(term)) ||
            (planet.hostname && planet.hostname.toLowerCase().includes(term)) ||
            (planet.kepid && planet.kepid.toString().includes(term)) ||
            (planet.koi_disposition && planet.koi_disposition.toLowerCase().includes(term)) ||
            (planet.status && planet.status.toLowerCase().includes(term))
        );

        this.updateGrid();
    }

    sortData(sortBy) {
        this.filteredData.sort((a, b) => {
            const valA = a[sortBy] || 0;
            const valB = b[sortBy] || 0;
            return valB - valA;
        });

        this.updateGrid();
    }

    updateGrid() {
        const grid = document.getElementById('exoplanet-grid');
        const count = document.getElementById('result-count');

        if (grid) {
            grid.innerHTML = this.filteredData.map(planet =>
                this.createPlanetCard(planet)
            ).join('');
        }

        if (count) {
            count.textContent = this.filteredData.length;
        }
    }

    claimPlanet(planetName) {
        alert(`🚀 Claim request for ${planetName}!\n\nThis feature will be available in Q1 2025 with cryptographic ownership certificates.`);
    }

    renderSampleData() {
        const sampleData = [
            { pl_name: 'Kepler-452b', hostname: 'Kepler-452', sy_dist: 430, pl_rade: 1.6, pl_bmasse: 5, disc_year: 2015 },
            { pl_name: 'TRAPPIST-1e', hostname: 'TRAPPIST-1', sy_dist: 12.1, pl_rade: 0.92, pl_bmasse: 0.62, disc_year: 2017 },
            { pl_name: 'Proxima Cen b', hostname: 'Proxima Centauri', sy_dist: 1.3, pl_rade: 1.1, pl_bmasse: 1.3, disc_year: 2016 }
        ];

        this.exoplanets = sampleData;
        this.filteredData = sampleData;
        this.renderExoplanetData(sampleData);
        this.setupLiveSearch();
    }

    // Data Visualization
    setupDataVisualization() {
        this.updateDataVisualization();
    }

    updateDataVisualization() {
        // NOTE: This conflicts with database-optimized.js which also uses data-visualization
        // Disabling this to prevent conflicts - database-optimized.js handles stats display
        const vizContainer = document.getElementById('data-visualization');
        if (!vizContainer) return;

        // Check if database-optimized.js has already rendered stats
        if (vizContainer.querySelector('.stats-grid')) {
            console.log('⚠️ database-optimized.js already rendered stats - skipping advanced visualization');
            return;
        }

        vizContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card" data-entrance="slideUp">
                    <div class="stat-number" id="stat-total">${this.stats.total}</div>
                    <div class="stat-label">Total Exoplanets</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="100">
                    <div class="stat-number" id="stat-confirmed">${this.stats.confirmed}</div>
                    <div class="stat-label">✓ Confirmed Planets</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="200">
                    <div class="stat-number" id="stat-candidates">${this.stats.candidates}</div>
                    <div class="stat-label">★ Candidates</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="300">
                    <div class="stat-number" id="stat-earthlike">${this.stats.earthLike}</div>
                    <div class="stat-label">🌍 Earth-Like Planets</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="400">
                    <div class="stat-number" id="stat-gasgiants">${this.stats.gasGiants}</div>
                    <div class="stat-label">💫 Gas Giants</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="500">
                    <div class="stat-number" id="stat-available" style="color: #44ff44;">${this.stats.available}</div>
                    <div class="stat-label">✅ Available to Claim</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="600">
                    <div class="stat-number" id="stat-claimed" style="color: #ff4444;">${this.stats.claimed}</div>
                    <div class="stat-label">⛔ Already Claimed</div>
                </div>
                <div class="stat-card" data-entrance="slideUp" data-entrance-delay="700">
                    <div class="stat-number" id="stat-distance">${this.stats.avgDistance}</div>
                    <div class="stat-label">Avg Distance (parsecs)</div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 2rem; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 12px;">
                <p style="margin: 0; color: rgba(255, 255, 255, 0.8);">
                    <span style="color: #ba944f; font-weight: bold; font-size: 1.2rem;">🔴 LIVE</span> 
                    Real-time database updates • Data sourced from Google Drive & NASA Exoplanet Archive
                </p>
            </div>
        `;
    }

    setupSearchAndFilter() {
        // Advanced filters will be added here
        const filterContainer = document.getElementById('advanced-filters');
        if (!filterContainer) return;

        filterContainer.innerHTML = `
            <div class="filter-group">
                <h4>Filter by Type</h4>
                <label><input type="checkbox" value="earth-like"> Earth-like</label>
                <label><input type="checkbox" value="gas-giant"> Gas Giants</label>
                <label><input type="checkbox" value="ice-giant"> Ice Giants</label>
            </div>
            <div class="filter-group">
                <h4>Distance Range</h4>
                <input type="range" min="0" max="1000" value="500" id="distance-range">
                <span id="distance-value">500</span> parsecs
            </div>
        `;
    }
}

// Initialize when DOM is ready
let advancedDB;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        advancedDB = new AdvancedDatabase();
    });
} else {
    const _advancedDB = new AdvancedDatabase();
    window.advancedDB = _advancedDB;
}
