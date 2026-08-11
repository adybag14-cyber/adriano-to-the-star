/**
 * Security Questions System
 * Security questions for account recovery
 */

class SecurityQuestionsSystem {
    constructor() {
        this.questions = [];
        this.init();
    }
    
    init() {
        this.loadQuestions();
    }
    
    loadQuestions() {
        this.questions = [
            'What was the name of your first pet?',
            'What city were you born in?',
            'What was your mother\'s maiden name?',
            'What was the name of your elementary school?',
            'What was your childhood nickname?'
        ];
    }
    
    async setupQuestions(userId) {
        try {
            if (window.supabase) {
                const { data } = await window.supabase
                    .from('security_questions')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                if (!data) {
                    // Show setup UI
                    this.showSetupUI();
                }
            }
        } catch (e) {
            console.error('Failed to setup questions:', e);
        }
    }
    
    showSetupUI() {
        if (window.modalStackManagement) {
            window.modalStackManagement.showModal(`
                <div>
                    <p>Please set up security questions:</p>
                    <select id="question-1" style="width:100%;padding:10px;margin:10px 0;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;">
                        ${this.questions.map(q => `<option value="${q}">${q}</option>`).join('')}
                    </select>
                    <input type="text" id="answer-1" placeholder="Answer" style="width:100%;padding:10px;margin:10px 0;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;">
                    <button id="save-questions" style="width:100%;padding:10px;background:rgba(186,148,79,0.5);border:1px solid #ba944f;color:white;border-radius:6px;cursor:pointer;margin-top:10px;">Save</button>
                </div>
            `, { title: 'Security Questions' });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.securityQuestionsSystem = new SecurityQuestionsSystem(); });
} else {
    window.securityQuestionsSystem = new SecurityQuestionsSystem();
}


