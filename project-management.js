/**
 * Project Management
 * Project management system
 */

class ProjectManagement {
    constructor() {
        this.projects = new Map();
        this.tasks = new Map();
        this.milestones = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_je_ct_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_je_ct_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createProject(projectId, projectData) {
        const project = {
            id: projectId,
            ...projectData,
            name: projectData.name || projectId,
            status: 'planning',
            tasks: [],
            milestones: [],
            createdAt: new Date()
        };
        
        this.projects.set(projectId, project);
        console.log(`Project created: ${projectId}`);
        return project;
    }

    createTask(projectId, taskId, taskData) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const task = {
            id: taskId,
            projectId,
            ...taskData,
            name: taskData.name || taskId,
            status: 'todo',
            assignee: taskData.assignee || null,
            dueDate: taskData.dueDate || null,
            createdAt: new Date()
        };
        
        this.tasks.set(taskId, task);
        project.tasks.push(taskId);
        
        return task;
    }

    createMilestone(projectId, milestoneId, milestoneData) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const milestone = {
            id: milestoneId,
            projectId,
            ...milestoneData,
            name: milestoneData.name || milestoneId,
            targetDate: milestoneData.targetDate || null,
            status: 'pending',
            createdAt: new Date()
        };
        
        this.milestones.set(milestoneId, milestone);
        project.milestones.push(milestoneId);
        
        return milestone;
    }

    getProject(projectId) {
        return this.projects.get(projectId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.projectManagement = new ProjectManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManagement;
}

