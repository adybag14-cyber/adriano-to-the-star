/**
 * Exoplanet SDK (API)
 * Provides programmatic access to the Exoplanet Database for external developers/console use.
 * 
 * Usage:
 * const api = new ExoplanetSDK();
 * api.getPlanet(234).then(data => console.log(data));
 */
class ExoplanetSDK {
    constructor() {
        this.version = '1.0.0';
    }

    /**
     * Get planet data by Kepler ID
     * @param {string|number} kepid 
     * @returns {Promise<Object>}
     */
    async getPlanet(kepid) {
        return new Promise((resolve, reject) => {
            this._waitForDB().then(db => {
                const planet = db.allData.find(p => db.compareKepid(p.kepid, kepid));
                if (planet) resolve(this._sanitize(planet));
                else reject(new Error('Planet not found'));
            });
        });
    }

    /**
     * Search for planets matching a query
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async search(query) {
        return new Promise((resolve) => {
            this._waitForDB().then(db => {
                const results = db.allData.filter(p =>
                    (p.kepler_name && p.kepler_name.toLowerCase().includes(query.toLowerCase())) ||
                    (p.kepoi_name && p.kepoi_name.toLowerCase().includes(query.toLowerCase())) ||
                    String(p.kepid).includes(query)
                ).slice(0, 50);
                resolve(results.map(p => this._sanitize(p)));
            });
        });
    }

    /**
     * Get a random planet
     * @returns {Promise<Object>}
     */
    async random() {
        return new Promise((resolve) => {
            this._waitForDB().then(db => {
                const random = db.allData[Math.floor(Math.random() * db.allData.length)];
                resolve(this._sanitize(random));
            });
        });
    }

    /**
     * Internal helper to wait for database initialization
     * @private
     */
    async _waitForDB() {
        return new Promise((resolve) => {
            if (window.databaseInstance && window.databaseInstance.isReady) {
                resolve(window.databaseInstance);
            } else {
                const check = setInterval(() => {
                    if (window.databaseInstance && window.databaseInstance.isReady) {
                        clearInterval(check);
                        resolve(window.databaseInstance);
                    }
                }, 500);
            }
        });
    }

    /**
     * Sanitize internal data for public consumption
     * @private
     */
    _sanitize(planet) {
        // Return a clean copy without internal flags if any
        return {
            id: planet.kepid,
            name: planet.kepler_name || planet.kepoi_name,
            designation: planet.kepoi_name,
            radius_earth: planet.radius,
            mass_earth: planet.mass,
            temperature_k: planet.temp,
            period_days: planet.period,
            distance_ly: planet.distance,
            status: planet.status,
            discovery_year: planet.disc_year,
            type: planet.type // inferred type if present
        };
    }
}

// Expose globally
window.ExoplanetSDK = ExoplanetSDK;

console.log('📡 Exoplanet SDK initialized. Type "new ExoplanetSDK()" to explore.');
