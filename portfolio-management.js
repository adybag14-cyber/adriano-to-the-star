/**
 * Portfolio Management
 * Portfolio management system
 */

class PortfolioManagement {
    constructor() {
        this.portfolios = new Map();
        this.projects = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_or_tf_ol_io_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_or_tf_ol_io_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createPortfolio(portfolioId, portfolioData) {
        const portfolio = {
            id: portfolioId,
            ...portfolioData,
            name: portfolioData.name || portfolioId,
            projects: [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.portfolios.set(portfolioId, portfolio);
        console.log(`Portfolio created: ${portfolioId}`);
        return portfolio;
    }

    addProject(portfolioId, projectId, projectData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            throw new Error('Portfolio not found');
        }
        
        const project = {
            id: projectId,
            portfolioId,
            ...projectData,
            name: projectData.name || projectId,
            status: 'active',
            createdAt: new Date()
        };
        
        this.projects.set(projectId, project);
        
        if (!portfolio.projects.includes(projectId)) {
            portfolio.projects.push(projectId);
        }
        
        return { portfolio, project };
    }

    getPortfolioMetrics(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            throw new Error('Portfolio not found');
        }
        
        const projects = portfolio.projects
            .map(id => this.projects.get(id))
            .filter(Boolean);
        
        return {
            portfolioId,
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            completedProjects: projects.filter(p => p.status === 'completed').length
        };
    }

    getPortfolio(portfolioId) {
        return this.portfolios.get(portfolioId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.portfolioManagement = new PortfolioManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioManagement;
}

