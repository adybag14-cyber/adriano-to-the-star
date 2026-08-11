/**
 * Space Mission Planner
 * Plan and track space missions
 */

class SpaceMissionPlanner {
    constructor() {
        this.missions = [];
        this.currentMission = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.loadMissions();
        this.isInitialized = true;
        console.log('🚀 Space Mission Planner initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_pa_ce_mi_ss_io_np_la_nn_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadMissions() {
        try {
            const stored = localStorage.getItem('space-missions');
            if (stored) {
                this.missions = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading missions:', error);
        }
    }

    saveMissions() {
        try {
            localStorage.setItem('space-missions', JSON.stringify(this.missions));
        } catch (error) {
            console.error('Error saving missions:', error);
        }
    }

    /**
     * Create new mission
     */
    createMission(missionData) {
        const mission = {
            id: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            name: missionData.name,
            target: missionData.target, // planet kepid or name
            missionType: missionData.missionType || 'exploration', // exploration, research, colonization
            objectives: missionData.objectives || [],
            timeline: {
                startDate: missionData.startDate || new Date().toISOString(),
                estimatedDuration: missionData.duration || 365, // days
                milestones: []
            },
            resources: {
                crew: missionData.crew || 0,
                equipment: missionData.equipment || [],
                budget: missionData.budget || 0
            },
            status: 'planned', // planned, in-progress, completed, cancelled
            progress: 0,
            createdAt: new Date().toISOString()
        };

        this.missions.push(mission);
        this.saveMissions();

        return mission;
    }

    /**
     * Add milestone to mission
     */
    addMilestone(missionId, milestone) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission) return false;

        mission.timeline.milestones.push({
            id: `milestone-${Date.now()}`,
            name: milestone.name,
            description: milestone.description,
            targetDate: milestone.targetDate,
            status: 'pending',
            completedAt: null
        });

        this.saveMissions();
        return true;
    }

    /**
     * Update mission progress
     */
    updateProgress(missionId, progress) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission) return false;

        mission.progress = Math.max(0, Math.min(100, progress));
        
        if (mission.progress >= 100) {
            mission.status = 'completed';
        } else if (mission.progress > 0) {
            mission.status = 'in-progress';
        }

        this.saveMissions();
        return true;
    }

    /**
     * Render mission planner
     */
    renderMissionPlanner(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="mission-planner" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🚀 Space Mission Planner</h3>
                
                <button id="create-mission-btn" class="btn-primary" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; margin-bottom: 2rem;">
                    ➕ Create New Mission
                </button>

                <div class="missions-list">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Active Missions (${this.missions.filter(m => m.status !== 'completed').length})</h4>
                    ${this.renderMissionsList()}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderMissionsList() {
        const activeMissions = this.missions.filter(m => m.status !== 'completed');

        if (activeMissions.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No active missions. Create one to get started!</p>';
        }

        return activeMissions.map(mission => {
            const statusColor = {
                'planned': '#fbbf24',
                'in-progress': '#4a90e2',
                'completed': '#4ade80',
                'cancelled': '#ef4444'
            }[mission.status] || '#ba944f';

            return `
                <div class="mission-card" style="padding: 1.5rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h5 style="color: #ba944f; margin: 0 0 0.5rem 0;">${mission.name}</h5>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Target: ${mission.target}</div>
                        </div>
                        <span style="padding: 0.5rem 1rem; background: ${statusColor}20; border: 1px solid ${statusColor}50; border-radius: 6px; color: ${statusColor}; font-size: 0.85rem; font-weight: 600;">
                            ${mission.status}
                        </span>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Progress</span>
                            <span style="color: #ba944f; font-weight: 600;">${mission.progress}%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${mission.progress}%; height: 100%; background: linear-gradient(90deg, #ba944f, #4ade80); transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                        <span>👥 Crew: ${mission.resources.crew}</span>
                        <span>💰 Budget: $${mission.resources.budget.toLocaleString()}</span>
                        <span>📅 Duration: ${mission.timeline.estimatedDuration} days</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        const createBtn = document.getElementById('create-mission-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const name = prompt('Mission name:');
                if (name) {
                    this.createMission({
                        name: name,
                        target: 'Unknown',
                        missionType: 'exploration'
                    });
                    this.renderMissionPlanner('mission-planner-container');
                }
            });
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.SpaceMissionPlanner = SpaceMissionPlanner;
    window.spaceMissionPlanner = new SpaceMissionPlanner();
}

