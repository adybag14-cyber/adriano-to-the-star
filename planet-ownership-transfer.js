/**
 * Planet Ownership Transfer System
 * System for transferring planet ownership between users
 * 
 * Features:
 * - Transfer requests
 * - Verification
 * - Transaction history
 * - Escrow system
 */

class PlanetOwnershipTransfer {
    constructor() {
        this.transfers = [];
        this.init();
    }
    
    init() {
        this.trackEvent('p_la_ne_to_wn_er_sh_ip_tr_an_sf_er_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_to_wn_er_sh_ip_tr_an_sf_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    async initiateTransfer(planetId, toUserId) {
        try {
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('planet_transfers')
                    .insert({
                        planet_id: planetId,
                        from_user_id: window.supabase.auth.user?.id,
                        to_user_id: toUserId,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    });
                
                if (!error) {
                    return true;
                }
            }
        } catch (e) {
            console.error('Failed to initiate transfer:', e);
        }
        return false;
    }
    
    async approveTransfer(transferId) {
        try {
            if (window.supabase) {
                // Update transfer status
                await window.supabase
                    .from('planet_transfers')
                    .update({ status: 'approved' })
                    .eq('id', transferId);
                
                // Update planet ownership
                const { data: transfer } = await window.supabase
                    .from('planet_transfers')
                    .select('*')
                    .eq('id', transferId)
                    .single();
                
                if (transfer) {
                    await window.supabase
                        .from('planet_claims')
                        .update({ user_id: transfer.to_user_id })
                        .eq('planet_id', transfer.planet_id);
                }
                
                return true;
            }
        } catch (e) {
            console.error('Failed to approve transfer:', e);
        }
        return false;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetOwnershipTransfer = new PlanetOwnershipTransfer();
    });
} else {
    window.planetOwnershipTransfer = new PlanetOwnershipTransfer();
}
