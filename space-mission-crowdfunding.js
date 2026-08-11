/**
 * Space Mission Crowdfunding
 * Allow users to fund space exploration projects
 */

class SpaceMissionCrowdfunding {
    constructor() {
        this.campaigns = [];
        this.contributions = [];
        this.currentUser = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
            }
        }

        this.loadData();

        this.isInitialized = true;
        console.log('🚀 Space Mission Crowdfunding initialized');
    }

    loadData() {
        try {
            const stored = localStorage.getItem('space-crowdfunding-campaigns');
            if (stored) {
                this.campaigns = JSON.parse(stored);
            }

            const storedContributions = localStorage.getItem('space-crowdfunding-contributions');
            if (storedContributions) {
                this.contributions = JSON.parse(storedContributions);
            }
        } catch (error) {
            console.error('Error loading crowdfunding data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('space-crowdfunding-campaigns', JSON.stringify(this.campaigns));
            localStorage.setItem('space-crowdfunding-contributions', JSON.stringify(this.contributions));
        } catch (error) {
            console.error('Error saving crowdfunding data:', error);
        }
    }

    /**
     * Create crowdfunding campaign
     */
    async createCampaign(campaignData) {
        if (!this.currentUser) {
            throw new Error('Please log in to create campaigns');
        }

        const campaign = {
            id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            creatorId: this.currentUser.id,
            creatorEmail: this.currentUser.email,
            title: campaignData.title,
            description: campaignData.description,
            goal: parseFloat(campaignData.goal),
            currentAmount: 0,
            missionType: campaignData.missionType || 'exploration', // exploration, research, telescope, etc.
            targetPlanet: campaignData.targetPlanet || null,
            deadline: campaignData.deadline,
            status: 'active', // active, funded, completed, cancelled
            createdAt: new Date().toISOString(),
            contributors: [],
            updates: []
        };

        this.campaigns.push(campaign);
        this.saveData();

        return campaign;
    }

    /**
     * Contribute to campaign
     */
    async contributeToCampaign(campaignId, amount, message = '') {
        if (!this.currentUser) {
            throw new Error('Please log in to contribute');
        }

        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'active') {
            throw new Error('Campaign is not accepting contributions');
        }

        if (new Date(campaign.deadline) < new Date()) {
            campaign.status = 'expired';
            this.saveData();
            throw new Error('Campaign deadline has passed');
        }

        const contribution = {
            id: `contribution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            campaignId: campaignId,
            contributorId: this.currentUser.id,
            contributorEmail: this.currentUser.email,
            amount: parseFloat(amount),
            message: message,
            createdAt: new Date().toISOString()
        };

        this.contributions.push(contribution);
        campaign.currentAmount += contribution.amount;

        if (!campaign.contributors.includes(this.currentUser.id)) {
            campaign.contributors.push(this.currentUser.id);
        }

        // Check if goal reached
        if (campaign.currentAmount >= campaign.goal) {
            campaign.status = 'funded';
        }

        this.saveData();

        return contribution;
    }

    /**
     * Get active campaigns
     */
    getActiveCampaigns(filters = {}) {
        let active = this.campaigns.filter(c => c.status === 'active');

        if (filters.missionType) {
            active = active.filter(c => c.missionType === filters.missionType);
        }

        if (filters.minGoal) {
            active = active.filter(c => c.goal >= filters.minGoal);
        }

        if (filters.maxGoal) {
            active = active.filter(c => c.goal <= filters.maxGoal);
        }

        return active;
    }

    /**
     * Get campaign progress
     */
    getCampaignProgress(campaignId) {
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) return null;

        const progress = (campaign.currentAmount / campaign.goal) * 100;
        const daysRemaining = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));

        return {
            progress: Math.min(100, progress),
            currentAmount: campaign.currentAmount,
            goal: campaign.goal,
            remaining: campaign.goal - campaign.currentAmount,
            contributors: campaign.contributors.length,
            daysRemaining: Math.max(0, daysRemaining)
        };
    }

    /**
     * Add campaign update
     */
    async addCampaignUpdate(campaignId, updateText) {
        if (!this.currentUser) {
            throw new Error('Please log in to add updates');
        }

        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.creatorId !== this.currentUser.id) {
            throw new Error('Only campaign creator can add updates');
        }

        const update = {
            id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: updateText,
            createdAt: new Date().toISOString()
        };

        campaign.updates.push(update);
        this.saveData();

        return update;
    }

    /**
     * Render crowdfunding UI
     */
    renderCrowdfundingUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const activeCampaigns = this.getActiveCampaigns();

        container.innerHTML = `
            <div class="crowdfunding-container" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🚀 Space Mission Crowdfunding</h3>
                
                ${this.currentUser ? `
                    <button id="create-campaign-btn" class="btn-primary" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; margin-bottom: 2rem;">
                        ➕ Create Campaign
                    </button>
                ` : ''}

                <div class="campaigns-list">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Active Campaigns (${activeCampaigns.length})</h4>
                    ${this.renderCampaignsList(activeCampaigns)}
                </div>
            </div>
        `;

        if (this.currentUser) {
            const createBtn = document.getElementById('create-campaign-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.showCreateCampaignModal();
                });
            }
        }
    }

    renderCampaignsList(campaigns) {
        if (campaigns.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No active campaigns</p>';
        }

        return campaigns.map(campaign => {
            const progress = this.getCampaignProgress(campaign.id);
            const progressPercent = progress.progress;

            return `
                <div class="campaign-item" style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 1rem;">
                    <h5 style="color: #ba944f; margin: 0 0 0.5rem 0;">${campaign.title}</h5>
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0.5rem 0;">${campaign.description}</p>
                    
                    <div style="margin: 1rem 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: rgba(255, 255, 255, 0.8);">Progress</span>
                            <span style="color: #ba944f; font-weight: 600;">$${campaign.currentAmount.toFixed(2)} / $${campaign.goal.toFixed(2)}</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #ba944f, #4ade80); transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">
                            👥 ${progress.contributors} contributors • ⏰ ${progress.daysRemaining} days left
                        </div>
                        ${this.currentUser ? `
                            <button class="contribute-btn" data-campaign-id="${campaign.id}" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                                💰 Contribute
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    showCreateCampaignModal() {
        // Implementation for create campaign modal
        alert('Create campaign modal - to be implemented with full form');
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.SpaceMissionCrowdfunding = SpaceMissionCrowdfunding;
    window.spaceMissionCrowdfunding = new SpaceMissionCrowdfunding();
}
