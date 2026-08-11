/**
 * Planet Discovery GraphQL API
 * GraphQL endpoint for planet discovery data
 */

class PlanetDiscoveryGraphQL {
    constructor() {
        this.endpoint = '/graphql';
        this.init();
    }

    init() {
        this.trackEvent('p_la_ne_td_is_co_ve_ry_gr_ap_hq_l_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_gr_ap_hq_l_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Execute GraphQL query
     */
    async query(query, variables = {}) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            const result = await response.json();
            
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data;
        } catch (error) {
            console.error('GraphQL query error:', error);
            throw error;
        }
    }

    /**
     * Get planet by ID
     */
    async getPlanet(planetId) {
        const query = `
            query GetPlanet($id: ID!) {
                planet(id: $id) {
                    id
                    name
                    kepoiName
                    radius
                    mass
                    orbitalPeriod
                    distance
                    temperature
                    discoveryMethod
                    discoveryDate
                    habitable
                }
            }
        `;

        return await this.query(query, { id: planetId });
    }

    /**
     * Search planets
     */
    async searchPlanets(searchTerm, filters = {}) {
        const query = `
            query SearchPlanets($search: String!, $filters: PlanetFilters) {
                searchPlanets(search: $search, filters: $filters) {
                    id
                    name
                    kepoiName
                    radius
                    mass
                    habitable
                }
            }
        `;

        return await this.query(query, { search: searchTerm, filters });
    }

    /**
     * Get user's planets
     */
    async getUserPlanets(userId) {
        const query = `
            query GetUserPlanets($userId: ID!) {
                user(id: $userId) {
                    id
                    planets {
                        id
                        name
                        claimedAt
                    }
                }
            }
        `;

        return await this.query(query, { userId });
    }

    /**
     * Render GraphQL explorer
     */
    renderGraphQLExplorer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="graphql-explorer-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🔷 GraphQL API</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Query planet discovery data using GraphQL. Write queries to get exactly the data you need.
                    </p>
                    <div style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; margin-bottom: 1rem;">
                        <code style="color: #4ade80;">Endpoint: ${this.endpoint}</code>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Query Editor</h4>
                    <textarea id="graphql-query" rows="10" style="width: 100%; padding: 1rem; background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 8px; color: #4ade80; font-family: monospace; font-size: 0.9rem; resize: vertical;" placeholder="Enter your GraphQL query here...">query {
  planets {
    id
    name
    radius
    mass
  }
}</textarea>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button id="execute-query-btn" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            ▶ Execute Query
                        </button>
                        <button id="load-example-btn" style="flex: 1; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            📝 Load Example
                        </button>
                    </div>
                    
                    <div id="query-result" style="margin-top: 2rem; display: none;">
                        <h4 style="color: #ba944f; margin-bottom: 1rem;">Result</h4>
                        <pre id="query-result-content" style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 8px; overflow-x: auto; color: #4ade80; font-family: monospace; font-size: 0.85rem; max-height: 400px; overflow-y: auto;"></pre>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                    <h4 style="color: #ba944f; margin-bottom: 1rem;">Example Queries</h4>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">Get Planet</div>
                            <pre style="color: #4ade80; font-size: 0.85rem; overflow-x: auto;"><code>query {
  planet(id: "kepoi_name_123") {
    name
    radius
    mass
    habitable
  }
}</code></pre>
                        </div>
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px;">
                            <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">Search Planets</div>
                            <pre style="color: #4ade80; font-size: 0.85rem; overflow-x: auto;"><code>query {
  searchPlanets(search: "Kepler") {
    id
    name
    radius
  }
}</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('execute-query-btn')?.addEventListener('click', async () => {
            await this.executeQuery();
        });

        document.getElementById('load-example-btn')?.addEventListener('click', () => {
            document.getElementById('graphql-query').value = `query {
  planets(limit: 10) {
    id
    name
    kepoiName
    radius
    mass
    habitable
  }
}`;
        });
    }

    async executeQuery() {
        const query = document.getElementById('graphql-query').value;
        const resultDiv = document.getElementById('query-result');
        const resultContent = document.getElementById('query-result-content');

        if (!query.trim()) {
            alert('Please enter a query');
            return;
        }

        try {
            resultContent.textContent = 'Executing query...';
            resultDiv.style.display = 'block';

            const data = await this.query(query);
            resultContent.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            resultContent.textContent = `Error: ${error.message}`;
            resultContent.style.color = '#f87171';
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryGraphQL = new PlanetDiscoveryGraphQL();
}

