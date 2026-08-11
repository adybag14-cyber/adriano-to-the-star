/**
 * Collaboration Platform
 * Collaboration platform
 */

class CollaborationPlatform {
    constructor() {
        this.workspaces = new Map();
        this.teams = new Map();
        this.channels = new Map();
        this.init();
    }

    init() {
        this.trackEvent('collab_platform_initialized');
    }

    createWorkspace(workspaceId, workspaceData) {
        const workspace = {
            id: workspaceId,
            ...workspaceData,
            name: workspaceData.name || workspaceId,
            teams: [],
            createdAt: new Date()
        };
        
        this.workspaces.set(workspaceId, workspace);
        console.log(`Workspace created: ${workspaceId}`);
        return workspace;
    }

    createTeam(workspaceId, teamId, teamData) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        
        const team = {
            id: teamId,
            workspaceId,
            ...teamData,
            name: teamData.name || teamId,
            members: teamData.members || [],
            channels: [],
            createdAt: new Date()
        };
        
        this.teams.set(teamId, team);
        workspace.teams.push(teamId);
        
        return team;
    }

    createChannel(teamId, channelId, channelData) {
        const team = this.teams.get(teamId);
        if (!team) {
            throw new Error('Team not found');
        }
        
        const channel = {
            id: channelId,
            teamId,
            ...channelData,
            name: channelData.name || channelId,
            type: channelData.type || 'public',
            messages: [],
            createdAt: new Date()
        };
        
        this.channels.set(channelId, channel);
        team.channels.push(channelId);
        
        return channel;
    }

    sendMessage(channelId, messageData) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        
        const message = {
            id: `message_${Date.now()}`,
            channelId,
            ...messageData,
            text: messageData.text || '',
            author: messageData.author || 'user',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        channel.messages.push(message.id);
        
        return message;
    }

    getWorkspace(workspaceId) {
        return this.workspaces.get(workspaceId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`collab_platform_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.collaborationPlatform = new CollaborationPlatform();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationPlatform;
}

