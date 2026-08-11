/**
 * Grading System
 * @class GradingSystem
 * @description Manages grading with rubrics, scales, and grade calculations.
 */
class GradingSystem {
    constructor() {
        this.grades = new Map();
        this.rubrics = new Map();
        this.gradeScales = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_ra_di_ng_sy_st_em_initialized');
        this.setupGradeScales();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_ra_di_ng_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupGradeScales() {
        this.gradeScales.set('percentage', {
            name: 'Percentage',
            scale: { A: 90, B: 80, C: 70, D: 60, F: 0 }
        });

        this.gradeScales.set('points', {
            name: 'Points',
            scale: null
        });
    }

    /**
     * Create a rubric.
     * @param {string} rubricId - Rubric identifier.
     * @param {object} rubricData - Rubric data.
     */
    createRubric(rubricId, rubricData) {
        this.rubrics.set(rubricId, {
            ...rubricData,
            id: rubricId,
            criteria: rubricData.criteria || [],
            createdAt: new Date()
        });
        console.log(`Rubric created: ${rubricId}`);
    }

    /**
     * Calculate grade.
     * @param {string} submissionId - Submission identifier.
     * @param {string} rubricId - Rubric identifier.
     * @param {object} scores - Scores for each criterion.
     * @returns {object} Grade result.
     */
    calculateGrade(submissionId, rubricId, scores) {
        const rubric = this.rubrics.get(rubricId);
        if (!rubric) {
            throw new Error(`Rubric not found: ${rubricId}`);
        }

        let totalScore = 0;
        let maxScore = 0;

        rubric.criteria.forEach(criterion => {
            const score = scores[criterion.id] || 0;
            totalScore += score;
            maxScore += criterion.maxPoints;
        });

        const percentage = (totalScore / maxScore) * 100;
        const letterGrade = this.getLetterGrade(percentage);

        const grade = {
            submissionId,
            rubricId,
            totalScore,
            maxScore,
            percentage,
            letterGrade,
            calculatedAt: new Date()
        };

        this.grades.set(submissionId, grade);
        return grade;
    }

    /**
     * Get letter grade.
     * @param {number} percentage - Percentage score.
     * @returns {string} Letter grade.
     */
    getLetterGrade(percentage) {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.gradingSystem = new GradingSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GradingSystem;
}

