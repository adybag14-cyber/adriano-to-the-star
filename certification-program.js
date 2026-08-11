/**
 * Certification Program
 * @class CertificationProgram
 * @description Manages certification programs with exams, certificates, and verification.
 */
class CertificationProgram {
    constructor() {
        this.certifications = new Map();
        this.exams = new Map();
        this.certificates = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cert_prog_initialized');
    }

    /**
     * Create a certification program.
     * @param {string} certId - Certification identifier.
     * @param {object} certData - Certification data.
     */
    createCertification(certId, certData) {
        this.certifications.set(certId, {
            ...certData,
            requirements: certData.requirements || [],
            examId: certData.examId,
            validityPeriod: certData.validityPeriod || null,
            createdAt: new Date()
        });
        console.log(`Certification program created: ${certId}`);
    }

    /**
     * Create an exam.
     * @param {string} examId - Exam identifier.
     * @param {object} examData - Exam data.
     */
    createExam(examId, examData) {
        this.exams.set(examId, {
            ...examData,
            questions: examData.questions || [],
            passingScore: examData.passingScore || 70,
            timeLimit: examData.timeLimit || 60,
            attemptsAllowed: examData.attemptsAllowed || 3,
            createdAt: new Date()
        });
        console.log(`Exam created: ${examId}`);
    }

    /**
     * Take an exam.
     * @param {string} userId - User identifier.
     * @param {string} examId - Exam identifier.
     * @param {Array<object>} answers - User answers.
     * @returns {object} Exam result.
     */
    takeExam(userId, examId, answers) {
        const exam = this.exams.get(examId);
        if (!exam) {
            throw new Error(`Exam not found: ${examId}`);
        }

        let correctAnswers = 0;
        const results = [];

        exam.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = this.checkAnswer(question, userAnswer);
            if (isCorrect) correctAnswers++;
            
            results.push({
                questionId: question.id,
                correct: isCorrect,
                userAnswer,
                correctAnswer: question.correctAnswer
            });
        });

        const score = (correctAnswers / exam.questions.length) * 100;
        const passed = score >= exam.passingScore;

        const result = {
            userId,
            examId,
            score,
            passed,
            correctAnswers,
            totalQuestions: exam.questions.length,
            completedAt: new Date(),
            results
        };

        if (passed) {
            this.issueCertificate(userId, examId);
        }

        return result;
    }

    /**
     * Check if an answer is correct.
     * @param {object} question - Question object.
     * @param {any} userAnswer - User's answer.
     * @returns {boolean} Whether answer is correct.
     */
    checkAnswer(question, userAnswer) {
        return JSON.stringify(question.correctAnswer) === JSON.stringify(userAnswer);
    }

    /**
     * Issue a certificate.
     * @param {string} userId - User identifier.
     * @param {string} examId - Exam identifier.
     */
    issueCertificate(userId, examId) {
        const exam = this.exams.get(examId);
        const certId = `cert_${userId}_${examId}_${Date.now()}`;
        
        this.certificates.set(certId, {
            id: certId,
            userId,
            examId,
            issuedAt: new Date(),
            expiresAt: null,
            verificationCode: this.generateVerificationCode()
        });

        console.log(`Certificate issued: ${certId}`);
    }

    /**
     * Generate verification code.
     * @returns {string} Verification code.
     */
    generateVerificationCode() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Verify a certificate.
     * @param {string} verificationCode - Verification code.
     * @returns {object} Certificate data or null.
     */
    verifyCertificate(verificationCode) {
        for (const cert of this.certificates.values()) {
            if (cert.verificationCode === verificationCode) {
                return cert;
            }
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cert_prog_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.certificationProgram = new CertificationProgram();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificationProgram;
}
