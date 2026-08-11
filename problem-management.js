/**
 * Problem Management
 * Problem management system
 */

class ProblemManagement {
    constructor() {
        this.problems = new Map();
        this.rootCauses = new Map();
        this.solutions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_bl_em_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_bl_em_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createProblem(problemId, problemData) {
        const problem = {
            id: problemId,
            ...problemData,
            name: problemData.name || problemId,
            description: problemData.description || '',
            severity: problemData.severity || 'medium',
            priority: problemData.priority || 'medium',
            status: 'open',
            relatedIncidents: problemData.relatedIncidents || [],
            createdAt: new Date()
        };
        
        this.problems.set(problemId, problem);
        console.log(`Problem created: ${problemId}`);
        return problem;
    }

    identifyRootCause(problemId, rootCauseId, rootCauseData) {
        const problem = this.problems.get(problemId);
        if (!problem) {
            throw new Error('Problem not found');
        }
        
        const rootCause = {
            id: rootCauseId,
            problemId,
            ...rootCauseData,
            description: rootCauseData.description || '',
            identifiedAt: new Date(),
            createdAt: new Date()
        };
        
        this.rootCauses.set(rootCauseId, rootCause);
        problem.rootCauseId = rootCauseId;
        
        return rootCause;
    }

    createSolution(problemId, solutionId, solutionData) {
        const problem = this.problems.get(problemId);
        if (!problem) {
            throw new Error('Problem not found');
        }
        
        const solution = {
            id: solutionId,
            problemId,
            ...solutionData,
            description: solutionData.description || '',
            status: 'proposed',
            createdAt: new Date()
        };
        
        this.solutions.set(solutionId, solution);
        problem.solutionId = solutionId;
        
        return solution;
    }

    async resolve(problemId) {
        const problem = this.problems.get(problemId);
        if (!problem) {
            throw new Error('Problem not found');
        }
        
        problem.status = 'resolved';
        problem.resolvedAt = new Date();
        
        return problem;
    }

    getProblem(problemId) {
        return this.problems.get(problemId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.problemManagement = new ProblemManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProblemManagement;
}

