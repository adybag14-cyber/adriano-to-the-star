/**
 * Quiz and Assessment System
 * @class QuizAssessmentSystem
 * @description Provides quiz and assessment functionality with various question types and scoring.
 */
class QuizAssessmentSystem {
    constructor() {
        this.quizzes = new Map();
        this.assessments = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.trackEvent('q_ui_za_ss_es_sm_en_ts_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("q_ui_za_ss_es_sm_en_ts_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a quiz.
     * @param {string} quizId - Quiz identifier.
     * @param {object} quizData - Quiz data.
     */
    createQuiz(quizId, quizData) {
        this.quizzes.set(quizId, {
            ...quizData,
            questions: quizData.questions || [],
            timeLimit: quizData.timeLimit || null,
            passingScore: quizData.passingScore || 70,
            shuffleQuestions: quizData.shuffleQuestions || false,
            showResults: quizData.showResults || true,
            createdAt: new Date()
        });
        console.log(`Quiz created: ${quizId}`);
    }

    /**
     * Add a question to a quiz.
     * @param {string} quizId - Quiz identifier.
     * @param {object} question - Question data.
     */
    addQuestion(quizId, question) {
        const quiz = this.quizzes.get(quizId);
        if (quiz) {
            quiz.questions.push({
                ...question,
                id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: question.type || 'multiple-choice'
            });
            console.log(`Question added to quiz ${quizId}`);
        }
    }

    /**
     * Take a quiz.
     * @param {string} userId - User identifier.
     * @param {string} quizId - Quiz identifier.
     * @param {Array<object>} answers - User answers.
     * @returns {object} Quiz result.
     */
    takeQuiz(userId, quizId, answers) {
        const quiz = this.quizzes.get(quizId);
        if (!quiz) {
            throw new Error(`Quiz not found: ${quizId}`);
        }

        let score = 0;
        let totalPoints = 0;
        const questionResults = [];

        quiz.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const points = this.gradeQuestion(question, userAnswer);
            score += points;
            totalPoints += question.points || 1;

            questionResults.push({
                questionId: question.id,
                points,
                maxPoints: question.points || 1,
                userAnswer,
                correct: points > 0
            });
        });

        const percentage = (score / totalPoints) * 100;
        const passed = percentage >= quiz.passingScore;

        const result = {
            id: `result_${Date.now()}`,
            userId,
            quizId,
            score,
            totalPoints,
            percentage,
            passed,
            questionResults,
            completedAt: new Date()
        };

        const resultKey = `${userId}_${quizId}`;
        this.results.set(resultKey, result);

        return result;
    }

    /**
     * Grade a question.
     * @param {object} question - Question object.
     * @param {any} userAnswer - User's answer.
     * @returns {number} Points awarded.
     */
    gradeQuestion(question, userAnswer) {
        const maxPoints = question.points || 1;

        switch (question.type) {
            case 'multiple-choice':
            case 'true-false':
                return JSON.stringify(question.correctAnswer) === JSON.stringify(userAnswer) 
                    ? maxPoints : 0;
            
            case 'short-answer':
                const correctAnswers = Array.isArray(question.correctAnswer) 
                    ? question.correctAnswer 
                    : [question.correctAnswer];
                const normalized = correctAnswers.map(a => a.toLowerCase().trim());
                return normalized.includes(userAnswer.toLowerCase().trim()) ? maxPoints : 0;
            
            case 'essay':
                // Placeholder for essay grading (would need AI or manual grading)
                return 0;
            
            default:
                return 0;
        }
    }

    /**
     * Get quiz results for a user.
     * @param {string} userId - User identifier.
     * @param {string} quizId - Quiz identifier.
     * @returns {object} Quiz result.
     */
    getResults(userId, quizId) {
        const resultKey = `${userId}_${quizId}`;
        return this.results.get(resultKey);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.quizAssessmentSystem = new QuizAssessmentSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizAssessmentSystem;
}
