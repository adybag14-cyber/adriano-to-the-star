/**
 * Team Workspace
 * Team workspace management
 */

class TeamWorkspace {
    constructor() {
        this.workspaces = new Map();
        this.members = new Map();
        this.projects = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_ea_mw_or_ks_pa_ce_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ea_mw_or_ks_pa_ce_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createWorkspace(workspaceId, workspaceData) {
        const workspace = {
            id: workspaceId,
            ...workspaceData,
            name: workspaceData.name || workspaceId,
            members: [],
            projects: [],
            createdAt: new Date()
        };
        
        this.workspaces.set(workspaceId, workspace);
        console.log(`Team workspace created: ${workspaceId}`);
        return workspace;
    }

    addMember(workspaceId, memberId, memberData) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        
        const member = {
            id: memberId,
            workspaceId,
            ...memberData,
            name: memberData.name || memberId,
            role: memberData.role || 'member',
            joinedAt: new Date(),
            createdAt: new Date()
        };
        
        this.members.set(memberId, member);
        
        if (!workspace.members.includes(memberId)) {
            workspace.members.push(memberId);
        }
        
        return member;
    }

    createProject(workspaceId, projectId, projectData) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        
        const project = {
            id: projectId,
            workspaceId,
            ...projectData,
            name: projectData.name || projectId,
            status: 'active',
            createdAt: new Date()
        };
        
        this.projects.set(projectId, project);
        workspace.projects.push(projectId);
        
        return project;
    }

    getWorkspace(workspaceId) {
        return this.workspaces.get(workspaceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.teamWorkspace = new TeamWorkspace();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamWorkspace;
}

