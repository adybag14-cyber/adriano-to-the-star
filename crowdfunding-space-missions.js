/**
 * Crowdfunding for Space Missions
 * System for crowdfunding space missions and projects
 * 
 * Features:
 * - Campaign creation
 * - Donation processing
 * - Progress tracking
 * - Rewards system
 */

class CrowdfundingSpaceMissions {
    constructor() {
        this.campaigns = [];
        this.init();
    }
    
    init() {
        this.loadCampaigns();
        this.createUI();
        this.trackEvent('crowdfunding_initialized');
    }
    
    async loadCampaigns() {
        try {
            if (typeof window !== 'undefined' && window.SUPABASE_ENABLE_OPTIONAL_TABLES === true && window.supabase) {
                const { data } = await window.supabase
                    .from('crowdfunding_campaigns')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                
                if (data) {
                    this.campaigns = data;
                }
            }
        } catch (e) {
            console.warn('Failed to load campaigns:', e);
        }
    }
    
    createUI() {
        const button = document.createElement('button');
        button.id = 'crowdfunding-toggle';
        button.textContent = '💰 Crowdfund';
        button.style.cssText = `
            position: fixed;
            bottom: 620px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9991;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        button.addEventListener('click', () => this.showCampaigns());
        document.body.appendChild(button);
    }
    
    showCampaigns() {
        const modal = document.createElement('div');
        modal.className = 'crowdfunding-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            ">
                <h2 style="color: #ba944f; margin: 0 0 20px 0;">Crowdfunding Campaigns</h2>
                <div>
                    ${this.campaigns.length > 0 ? this.campaigns.map(campaign => `
                        <div style="
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            border-radius: 8px;
                            padding: 20px;
                            margin-bottom: 15px;
                        ">
                            <h3 style="color: #ba944f; margin: 0 0 10px 0;">${campaign.title}</h3>
                            <p style="margin: 5px 0;">${campaign.description}</p>
                            <p style="margin: 5px 0;">Progress: $${campaign.raised || 0} / $${campaign.goal}</p>
                            <button onclick="window.crowdfundingSpaceMissions.contribute('${campaign.id}')" style="
                                margin-top: 10px;
                                padding: 8px 15px;
                                background: rgba(186, 148, 79, 0.3);
                                border: 1px solid #ba944f;
                                color: white;
                                border-radius: 6px;
                                cursor: pointer;
                            ">Contribute</button>
                        </div>
                    `).join('') : '<p>No active campaigns</p>'}
                </div>
                <button id="close-crowdfunding" style="
                    width: 100%;
                    margin-top: 20px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        modal.querySelector('#close-crowdfunding').addEventListener('click', () => {
            modal.remove();
        });
        
        document.body.appendChild(modal);
    }
    
    contribute(campaignId) {
        alert(`Contributing to campaign ${campaignId}`);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`crowdfunding_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.crowdfundingSpaceMissions = new CrowdfundingSpaceMissions();
    });
} else {
    window.crowdfundingSpaceMissions = new CrowdfundingSpaceMissions();
}
