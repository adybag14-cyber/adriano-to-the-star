/**
 * Planet Rental/Leasing Options
 * System for renting or leasing planet claims
 * 
 * Features:
 * - Rental listings
 * - Lease agreements
 * - Payment processing
 * - Duration management
 */

class PlanetRentalLeasing {
    constructor() {
        this.rentals = [];
        this.init();
    }

    init() {
        this.loadRentals();
        console.log('🏠 Planet Rental/Leasing initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tr_en_ta_ll_ea_si_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async loadRentals() {
        try {
            if (typeof window !== 'undefined' && window.SUPABASE_ENABLE_OPTIONAL_TABLES === true && window.supabase) {
                const { data } = await window.supabase
                    .from('planet_rentals')
                    .select('*')
                    .eq('status', 'available');

                if (data) {
                    this.rentals = data;
                }
            }
        } catch (e) {
        }
    }

    /**
     * Render the rental UI into a container
     * @param {string} containerId - ID of the container element
     */
    async renderRentalUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Render header and list
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #4a90e2; margin-bottom: 15px;">Planet Rentals & Leasing</h3>
                <p style="color: #ccc; margin-bottom: 20px;">Lease high-resource planets for temporary resource extraction privileges.</p>
                <button onclick="window.planetRentalLeasing.createRentalListing()" style="
                    padding: 8px 16px;
                    background: rgba(74, 144, 226, 0.2);
                    border: 1px solid #4a90e2;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">+ List Planet for Rent</button>
            </div>
            <div id="rental-listings-grid" style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                ${this.renderRentalListings()}
            </div>
        `;
    }

    renderRentalListings() {
        if (this.rentals.length === 0) {
            return `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <p style="color: #888;">No rental listings available at the moment.</p>
                </div>
            `;
        }

        return this.rentals.map(rental => `
            <div style="background: rgba(74, 144, 226, 0.1); border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 8px; padding: 15px;">
                <h4 style="color: #4a90e2; margin: 0 0 10px 0;">Planet #${rental.planet_id}</h4>
                <p>Price: $${rental.price} / day</p>
                <p>Duration: ${rental.duration} days</p>
                <button style="width: 100%; margin-top: 10px; padding: 8px; background: #4a90e2; border: none; color: white; border-radius: 4px; cursor: pointer;">Rent Now</button>
            </div>
        `).join('');
    }

    createRentalListing() {
        alert('Rental creation feature coming soon!');
    }

    async createRental(planetId, price, duration) {
        try {
            if (typeof window !== 'undefined' && window.SUPABASE_ENABLE_OPTIONAL_TABLES === true && window.supabase) {
                const { data, error } = await window.supabase
                    .from('planet_rentals')
                    .insert({
                        planet_id: planetId,
                        owner_id: window.supabase.auth.user?.id,
                        price: price,
                        duration: duration,
                        status: 'available',
                        created_at: new Date().toISOString()
                    });

                return !error;
            }
        } catch (e) {
            console.error('Failed to create rental:', e);
        }
        return false;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetRentalLeasing = new PlanetRentalLeasing();
    });
} else {
    window.planetRentalLeasing = new PlanetRentalLeasing();
}
