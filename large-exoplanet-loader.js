/**
 * Large Exoplanet Database Loader
 * Handles loading and parsing of 1M+ exoplanet records from Google Drive file
 * Uses streaming/chunked loading for performance
 */

class LargeExoplanetLoader {
    constructor() {
        this.largeDataset = [];
        this.isLoading = false;
        this.loadProgress = 0;
        this.totalRecords = 0;
        this.loadedRecords = 0;
        this.chunkSize = 10000; // Load 10k records at a time
        this.searchIndex = new Map(); // For fast search
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res; // Return the response object for streaming
        } catch (e) {
            console.warn(`[large-exoplanet-loader] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    // AllOrigins returns the content as a string in 'contents'
                    return new Response(data.contents, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (proxyError) {
                console.warn('[large-exoplanet-loader] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return proxyRes;
            } catch (proxyError) {
                console.error('[large-exoplanet-loader] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Load large exoplanet dataset from file
     * Supports JSONL format (one JSON object per line)
     */
    async loadLargeDataset(filePath) {
        if (this.isLoading) {
            console.log('â³ Already loading dataset...');
            return;
        }

        this.isLoading = true;
        this.loadProgress = 0;
        this.largeDataset = [];
        this.searchIndex.clear();

        console.log(`ðŸš€ Loading large exoplanet dataset from: ${filePath}`);

        try {
            const response = await this.fetchJSON(filePath);
            
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.statusText}`);
            }

            // Check if it's a streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let lineCount = 0;

            // Update progress
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                this.totalRecords = parseInt(contentLength, 10) / 200; // Rough estimate
            }

            // Process stream
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep last incomplete line in buffer
                buffer = lines.pop() || '';

                // Process complete lines
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const planet = JSON.parse(line.trim());
                            this.processPlanetRecord(planet);
                            lineCount++;
                            
                            // Update progress every chunk
                            if (lineCount % this.chunkSize === 0) {
                                this.loadedRecords = lineCount;
                                this.loadProgress = (lineCount / (this.totalRecords || 1000000)) * 100;
                                this.updateProgressUI();
                                console.log(`ðŸ“Š Loaded ${lineCount.toLocaleString()} records...`);
                            }
                        } catch (_e) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                try {
                    const planet = JSON.parse(buffer.trim());
                    this.processPlanetRecord(planet);
                    lineCount++;
                } catch (_e) {
                    // Ignore
                }
            }

            this.loadedRecords = lineCount;
            this.totalRecords = lineCount;
            this.loadProgress = 100;

            console.log(`âœ… Loaded ${this.largeDataset.length.toLocaleString()} exoplanets from large dataset`);
            this.updateProgressUI();
            this.isLoading = false;

            return this.largeDataset;

        } catch (error) {
            console.error('âŒ Error loading large dataset:', error);
            this.isLoading = false;
            return [];
        }
    }

    /**
     * Process and normalize a planet record
     * Only includes planets with false_positive_flag: 0 (or missing flag)
     */
    processPlanetRecord(planet) {
        // Filter: Only include planets with false_positive_flag: 0
        // This ensures we only include valid planets (not false positives)
        const falsePositiveFlag = planet.false_positive_flag !== undefined ? planet.false_positive_flag : 
                                 (planet.falsePositiveFlag !== undefined ? planet.falsePositiveFlag : undefined);
        
        // Include if false_positive_flag is 0, undefined, or null (treat missing as valid)
        // Only exclude if flag is explicitly 1 (false positive)
        if (falsePositiveFlag === 1) {
            return; // Skip false positives
        }
        
        // Normalize the planet data
        const normalized = {
            kepid: planet.kepid || planet.koi_id || null,
            kepoi_name: planet.kepoi_name || planet.koi_name || `KOI-${planet.kepid || 'unknown'}`,
            kepler_name: planet.kepler_name || planet.planet_name || null,
            status: this.normalizeStatus(planet.status || planet.koi_disposition || planet.disposition),
            score: planet.score || planet.koi_score || planet.confidence || 0,
            radius: this.extractRadius(planet),
            mass: this.extractMass(planet),
            distance: this.extractDistance(planet),
            disc_year: this.extractDiscoveryYear(planet),
            type: this.classifyPlanet(this.extractRadius(planet)),
            availability: 'available', // Default to available
            source: 'large-dataset', // Mark as from large dataset
            false_positive_flag: falsePositiveFlag // Preserve the flag
        };

        this.largeDataset.push(normalized);

        // Build search index
        this.indexPlanet(normalized);
    }

    /**
     * Normalize status values
     */
    normalizeStatus(status) {
        if (!status) return 'CANDIDATE';
        
        const s = status.toString().toUpperCase();
        if (s.includes('CONFIRMED') || s.includes('CONFIRM') || s === 'CONFIRMED PLANET') {
            return 'CONFIRMED';
        } else if (s.includes('CANDIDATE') || s.includes('CAND')) {
            return 'CANDIDATE';
        } else if (s.includes('FALSE') || s.includes('FALSE POSITIVE')) {
            return 'FALSE POSITIVE';
        }
        return 'CANDIDATE';
    }

    /**
     * Extract radius from various field names
     */
    extractRadius(planet) {
        return planet.radius || 
               planet.koi_ror || 
               planet.planet_radius || 
               planet.r_planet || 
               (planet.r_star && planet.r_planet ? planet.r_planet / planet.r_star : null) ||
               this.estimateRadius(planet);
    }

    /**
     * Extract mass from various field names
     */
    extractMass(planet) {
        return planet.mass || 
               planet.koi_mass || 
               planet.planet_mass || 
               planet.m_planet || 
               this.estimateMass(planet);
    }

    /**
     * Extract distance from various field names
     */
    extractDistance(planet) {
        return planet.distance || 
               planet.st_dist || 
               planet.host_distance || 
               planet.distance_pc || 
               this.estimateDistance(planet.kepid || planet.koi_id);
    }

    /**
     * Extract discovery year
     */
    extractDiscoveryYear(planet) {
        return planet.disc_year || 
               planet.discovery_year || 
               planet.year || 
               this.estimateDiscoveryYear(planet);
    }

    /**
     * Estimate radius if not available
     */
    estimateRadius(planet) {
        // Use period and other data to estimate
        if (planet.period && planet.depth) {
            // Rough estimation based on transit depth
            return Math.sqrt(planet.depth) * 10; // Simplified
        }
        return 1.0 + Math.random() * 5; // Default range
    }

    /**
     * Estimate mass if not available
     */
    estimateMass(planet) {
        if (this.extractRadius(planet)) {
            const radius = this.extractRadius(planet);
            // Rough mass-radius relationship
            return Math.pow(radius, 2.5) * 0.5;
        }
        return 1.0 + Math.random() * 10;
    }

    /**
     * Estimate distance
     */
    estimateDistance(kepid) {
        // Use kepid to generate consistent distance
        if (kepid) {
            return 100 + (kepid % 5000);
        }
        return 100 + Math.random() * 5000;
    }

    /**
     * Estimate discovery year
     */
    estimateDiscoveryYear(planet) {
        // Kepler mission years: 2009-2018
        if (planet.kepid) {
            return 2009 + (planet.kepid % 10);
        }
        return 2014;
    }

    /**
     * Classify planet type based on radius
     */
    classifyPlanet(radius) {
        if (!radius) return 'Unknown';
        if (radius < 0.8) return 'Sub-Earth';
        if (radius <= 1.25) return 'Earth-like';
        if (radius <= 2.0) return 'Super-Earth';
        if (radius <= 4.0) return 'Mini-Neptune';
        if (radius <= 10.0) return 'Neptune-like';
        return 'Gas Giant';
    }

    /**
     * Build search index for fast lookups
     */
    indexPlanet(planet) {
        const searchTerms = [
            planet.kepoi_name?.toLowerCase(),
            planet.kepler_name?.toLowerCase(),
            planet.kepid?.toString(),
            planet.status?.toLowerCase(),
            planet.type?.toLowerCase()
        ].filter(Boolean);

        searchTerms.forEach(term => {
            if (!this.searchIndex.has(term)) {
                this.searchIndex.set(term, []);
            }
            this.searchIndex.get(term).push(this.largeDataset.length - 1);
        });
    }

    /**
     * Fast search using index
     */
    search(query) {
        if (!query || query.length < 2) {
            return this.largeDataset;
        }

        const lowerQuery = query.toLowerCase();
        const results = new Set();
        
        // Search in index
        for (const [term, indices] of this.searchIndex.entries()) {
            if (term.includes(lowerQuery)) {
                indices.forEach(idx => results.add(idx));
            }
        }

        // Also do direct search for names
        this.largeDataset.forEach((planet, idx) => {
            if (planet.kepoi_name?.toLowerCase().includes(lowerQuery) ||
                planet.kepler_name?.toLowerCase().includes(lowerQuery) ||
                planet.kepid?.toString().includes(lowerQuery)) {
                results.add(idx);
            }
        });

        return Array.from(results).map(idx => this.largeDataset[idx]);
    }

    /**
     * Update progress UI
     */
    updateProgressUI() {
        const status = document.getElementById('database-debug-status');
        if (!status) return;

        if (this.isLoading) {
            const loaded = Number.isFinite(this.loadedRecords) ? this.loadedRecords : 0;
            const total = Number.isFinite(this.totalRecords) ? this.totalRecords : 0;
            const progress = Number.isFinite(this.loadProgress) ? Math.min(100, Math.max(0, this.loadProgress)) : 0;
            status.textContent = progress >= 100
                ? `Extended catalogue ready: ${this.largeDataset.length.toLocaleString()} validated records indexed.`
                : `Indexing extended catalogue: ${loaded.toLocaleString()}${total ? ` / ${Math.round(total).toLocaleString()}` : ''} records`;
            status.setAttribute('data-large-dataset-progress', String(Math.round(progress)));
        }
    }

    /**
     * Get statistics from large dataset
     */
    getStatistics() {
        const stats = {
            total: this.largeDataset.length,
            confirmed: 0,
            candidates: 0,
            earthLike: 0,
            superEarths: 0,
            gasGiants: 0,
            available: 0
        };

        this.largeDataset.forEach(planet => {
            if (planet.status === 'CONFIRMED') stats.confirmed++;
            else if (planet.status === 'CANDIDATE') stats.candidates++;
            
            if (planet.type === 'Earth-like') stats.earthLike++;
            else if (planet.type === 'Super-Earth') stats.superEarths++;
            else if (planet.type === 'Gas Giant') stats.gasGiants++;
            
            if (planet.availability === 'available') stats.available++;
        });

        return stats;
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.LargeExoplanetLoader = LargeExoplanetLoader;
}

