/**
 * Program Management
 * Program management system
 */

class ProgramManagement {
    constructor() {
        this.programs = new Map();
        this.projects = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_gr_am_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_gr_am_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createProgram(programId, programData) {
        const program = {
            id: programId,
            ...programData,
            name: programData.name || programId,
            projects: [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.programs.set(programId, program);
        console.log(`Program created: ${programId}`);
        return program;
    }

    addProject(programId, projectId, projectData) {
        const program = this.programs.get(programId);
        if (!program) {
            throw new Error('Program not found');
        }
        
        const project = {
            id: projectId,
            programId,
            ...projectData,
            name: projectData.name || projectId,
            status: 'active',
            createdAt: new Date()
        };
        
        this.projects.set(projectId, project);
        
        if (!program.projects.includes(projectId)) {
            program.projects.push(projectId);
        }
        
        return { program, project };
    }

    getProgram(programId) {
        return this.programs.get(programId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.programManagement = new ProgramManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgramManagement;
}

