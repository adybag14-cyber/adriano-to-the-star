/**
 * Exam System
 * Manages exams
 */

class ExamSystem {
    constructor() {
        this.exams = new Map();
        this.init();
    }
    
    init() {
        this.setupExams();
    }
    
    setupExams() {
        // Setup exam system
    }
    
    async createExam(courseId, examData) {
        // Create exam
        const exam = {
            id: Date.now().toString(),
            courseId,
            title: examData.title,
            questions: examData.questions || [],
            timeLimit: examData.timeLimit,
            passingScore: examData.passingScore || 70,
            createdAt: Date.now()
        };
        
        this.exams.set(exam.id, exam);
        return exam;
    }
    
    async gradeExam(examId, studentId, answers) {
        // Grade exam
        const exam = this.exams.get(examId);
        if (!exam) return null;
        
        let score = 0;
        exam.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                score++;
            }
        });
        
        const percentage = (score / exam.questions.length) * 100;
        const passed = percentage >= exam.passingScore;
        
        return {
            examId,
            studentId,
            score,
            total: exam.questions.length,
            percentage,
            passed,
            gradedAt: Date.now()
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.examSystem = new ExamSystem(); });
} else {
    window.examSystem = new ExamSystem();
}

