/**
 * Planet Discovery Educational Courses System
 * Comprehensive courses about exoplanet discovery and astronomy
 */

class PlanetDiscoveryEducationalCourses {
    constructor() {
        this.courses = [];
        this.userProgress = {};
        this.currentCourse = null;
        this.currentLesson = null;
        this.init();
    }

    init() {
        this.loadCourses();
        this.loadUserProgress();
        console.log('📚 Educational courses initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ed_uc_at_io_na_lc_ou_rs_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadCourses() {
        this.courses = [
            {
                id: 'exoplanets-101',
                title: 'Exoplanets 101',
                description: 'Introduction to exoplanets and discovery methods',
                duration: '2 hours',
                level: 'Beginner',
                lessons: [
                    {
                        id: 'l1',
                        title: 'What are Exoplanets?',
                        content: this.getLessonContent('exoplanets-intro'),
                        quiz: this.getQuiz('exoplanets-intro')
                    },
                    {
                        id: 'l2',
                        title: 'Discovery Methods',
                        content: this.getLessonContent('discovery-methods'),
                        quiz: this.getQuiz('discovery-methods')
                    },
                    {
                        id: 'l3',
                        title: 'The Kepler Mission',
                        content: this.getLessonContent('kepler-mission'),
                        quiz: this.getQuiz('kepler-mission')
                    }
                ],
                certificate: true
            },
            {
                id: 'advanced-discovery',
                title: 'Advanced Discovery Techniques',
                description: 'Deep dive into exoplanet detection methods',
                duration: '4 hours',
                level: 'Intermediate',
                lessons: [
                    {
                        id: 'l1',
                        title: 'Transit Photometry',
                        content: this.getLessonContent('transit-photometry'),
                        quiz: this.getQuiz('transit-photometry')
                    },
                    {
                        id: 'l2',
                        title: 'Radial Velocity Method',
                        content: this.getLessonContent('radial-velocity'),
                        quiz: this.getQuiz('radial-velocity')
                    },
                    {
                        id: 'l3',
                        title: 'Direct Imaging',
                        content: this.getLessonContent('direct-imaging'),
                        quiz: this.getQuiz('direct-imaging')
                    }
                ],
                certificate: true
            },
            {
                id: 'habitable-worlds',
                title: 'Habitable Worlds',
                description: 'Understanding the search for life',
                duration: '3 hours',
                level: 'Intermediate',
                lessons: [
                    {
                        id: 'l1',
                        title: 'The Habitable Zone',
                        content: this.getLessonContent('habitable-zone'),
                        quiz: this.getQuiz('habitable-zone')
                    },
                    {
                        id: 'l2',
                        title: 'Biosignatures',
                        content: this.getLessonContent('biosignatures'),
                        quiz: this.getQuiz('biosignatures')
                    }
                ],
                certificate: true
            }
        ];
    }

    getLessonContent(lessonId) {
        const content = {
            'exoplanets-intro': `
                <h3>What are Exoplanets?</h3>
                <p>Exoplanets, or extrasolar planets, are planets that orbit stars outside our solar system. The first confirmed exoplanet was discovered in 1992, orbiting a pulsar.</p>
                <h4>Key Characteristics:</h4>
                <ul>
                    <li>Orbit stars other than our Sun</li>
                    <li>Can be rocky, gas giants, or ice worlds</li>
                    <li>Range from smaller than Earth to larger than Jupiter</li>
                    <li>Some may be in the "habitable zone"</li>
                </ul>
            `,
            'discovery-methods': `
                <h3>Discovery Methods</h3>
                <p>Scientists use several methods to detect exoplanets:</p>
                <ol>
                    <li><strong>Transit Method:</strong> Detects planets when they pass in front of their star</li>
                    <li><strong>Radial Velocity:</strong> Measures star wobble caused by orbiting planets</li>
                    <li><strong>Direct Imaging:</strong> Takes pictures of planets directly</li>
                    <li><strong>Gravitational Microlensing:</strong> Uses light bending to detect planets</li>
                </ol>
            `,
            'kepler-mission': `
                <h3>The Kepler Mission</h3>
                <p>The Kepler Space Telescope was launched in 2009 with the goal of discovering Earth-sized exoplanets in the habitable zone.</p>
                <h4>Key Achievements:</h4>
                <ul>
                    <li>Discovered over 2,000 confirmed exoplanets</li>
                    <li>Identified thousands of planet candidates</li>
                    <li>Revolutionized our understanding of planetary systems</li>
                </ul>
            `
        };
        return content[lessonId] || '<p>Lesson content coming soon...</p>';
    }

    getQuiz(lessonId) {
        const quizzes = {
            'exoplanets-intro': {
                question: 'What is an exoplanet?',
                options: [
                    'A planet in our solar system',
                    'A planet orbiting a star outside our solar system',
                    'A type of star',
                    'A moon'
                ],
                correct: 1,
                explanation: 'Exoplanets are planets that orbit stars other than our Sun.'
            },
            'discovery-methods': {
                question: 'Which method did Kepler primarily use?',
                options: [
                    'Radial Velocity',
                    'Direct Imaging',
                    'Transit Method',
                    'Gravitational Microlensing'
                ],
                correct: 2,
                explanation: 'Kepler used the transit method to detect planets by observing star dimming.'
            }
        };
        return quizzes[lessonId] || null;
    }

    loadUserProgress() {
        try {
            const saved = localStorage.getItem('course-progress');
            if (saved) {
                this.userProgress = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    saveUserProgress() {
        try {
            localStorage.setItem('course-progress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    renderCourses(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="courses-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📚 Educational Courses</h3>
                
                <div class="courses-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
        `;

        this.courses.forEach(course => {
            html += this.createCourseCard(course);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Setup event listeners
        this.courses.forEach(course => {
            const card = document.querySelector(`[data-course-id="${course.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.startCourse(course.id);
                });
            }
        });
    }

    createCourseCard(course) {
        const progress = this.getCourseProgress(course.id);
        const progressPercent = progress ? (progress.completedLessons / course.lessons.length * 100).toFixed(0) : 0;

        return `
            <div class="course-card" data-course-id="${course.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${course.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${course.description}</p>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                        <span>⏱️ ${course.duration}</span>
                        <span>📊 ${course.level}</span>
                        ${course.certificate ? '<span>🏅 Certificate</span>' : ''}
                    </div>
                    
                    ${progress ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                                <span>Progress</span>
                                <span>${progressPercent}%</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 5px; overflow: hidden;">
                                <div style="width: ${progressPercent}%; height: 100%; background: #ba944f; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 1rem;">
                        <span style="font-size: 0.85rem; opacity: 0.7;">${course.lessons.length} lessons</span>
                    </div>
                    
                    <button style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; width: 100%;">
                        ${progress ? 'Continue Course' : 'Start Course'}
                    </button>
                </div>
            </div>
        `;
    }

    getCourseProgress(courseId) {
        return this.userProgress[courseId] || null;
    }

    startCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) {
            console.error(`Course ${courseId} not found`);
            return;
        }

        this.currentCourse = course;
        const progress = this.getCourseProgress(courseId);
        const startLesson = progress ? progress.currentLesson : 0;
        
        this.showCourseModal(course, startLesson);
    }

    showCourseModal(course, lessonIndex = 0) {
        const modal = document.createElement('div');
        modal.id = 'course-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        const lesson = course.lessons[lessonIndex];
        const progress = this.getCourseProgress(course.id);

        modal.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2 style="color: #ba944f; margin-bottom: 0.5rem;">${course.title}</h2>
                        <p style="opacity: 0.8;">Lesson ${lessonIndex + 1} of ${course.lessons.length}</p>
                    </div>
                    <button id="close-course-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <h3 style="color: #ba944f; margin-bottom: 1.5rem;">${lesson.title}</h3>
                    
                    <div class="lesson-content" style="color: rgba(255, 255, 255, 0.9); line-height: 1.8; margin-bottom: 2rem;">
                        ${lesson.content}
                    </div>
                    
                    ${lesson.quiz ? `
                        <div class="lesson-quiz" style="background: rgba(186, 148, 79, 0.1); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                            <h4 style="color: #ba944f; margin-bottom: 1rem;">🧠 Quiz</h4>
                            <p style="margin-bottom: 1rem; font-weight: 600;">${lesson.quiz.question}</p>
                            <div class="quiz-options">
                                ${lesson.quiz.options.map((opt, i) => `
                                    <button class="quiz-option-btn" data-answer="${i}" style="display: block; width: 100%; padding: 1rem; margin-bottom: 0.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; text-align: left;">
                                        ${opt}
                                    </button>
                                `).join('')}
                            </div>
                            <div id="quiz-result" style="margin-top: 1rem; display: none;"></div>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 1rem; justify-content: space-between;">
                        <button id="prev-lesson-btn" ${lessonIndex === 0 ? 'disabled' : ''} style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; ${lessonIndex === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                            ← Previous Lesson
                        </button>
                        <button id="next-lesson-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            ${lessonIndex === course.lessons.length - 1 ? 'Complete Course' : 'Next Lesson →'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        document.getElementById('close-course-modal').addEventListener('click', () => {
            modal.remove();
        });

        if (lesson.quiz) {
            document.querySelectorAll('.quiz-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.handleQuizAnswer(lesson.quiz, parseInt(btn.dataset.answer));
                });
            });
        }

        document.getElementById('prev-lesson-btn').addEventListener('click', () => {
            if (lessonIndex > 0) {
                modal.remove();
                this.showCourseModal(course, lessonIndex - 1);
            }
        });

        document.getElementById('next-lesson-btn').addEventListener('click', () => {
            this.completeLesson(course.id, lesson.id);
            if (lessonIndex < course.lessons.length - 1) {
                modal.remove();
                this.showCourseModal(course, lessonIndex + 1);
            } else {
                this.completeCourse(course.id);
                modal.remove();
            }
        });
    }

    handleQuizAnswer(quiz, selectedAnswer) {
        const resultDiv = document.getElementById('quiz-result');
        const isCorrect = selectedAnswer === quiz.correct;

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="padding: 1rem; background: ${isCorrect ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; border: 2px solid ${isCorrect ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)'}; border-radius: 10px;">
                <p style="color: ${isCorrect ? '#4ade80' : '#f87171'}; font-weight: 600; margin-bottom: 0.5rem;">
                    ${isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </p>
                <p style="opacity: 0.8;">${quiz.explanation}</p>
            </div>
        `;

        // Disable all buttons
        document.querySelectorAll('.quiz-option-btn').forEach(btn => {
            btn.disabled = true;
            if (parseInt(btn.dataset.answer) === quiz.correct) {
                btn.style.background = 'rgba(74, 222, 128, 0.3)';
                btn.style.borderColor = 'rgba(74, 222, 128, 0.7)';
            } else if (parseInt(btn.dataset.answer) === selectedAnswer && !isCorrect) {
                btn.style.background = 'rgba(239, 68, 68, 0.3)';
                btn.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            }
        });
    }

    completeLesson(courseId, lessonId) {
        if (!this.userProgress[courseId]) {
            this.userProgress[courseId] = {
                completedLessons: [],
                currentLesson: 0
            };
        }

        if (!this.userProgress[courseId].completedLessons.includes(lessonId)) {
            this.userProgress[courseId].completedLessons.push(lessonId);
        }

        this.saveUserProgress();
    }

    completeCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        if (course.certificate) {
            this.generateCertificate(course);
        }

        alert(`Congratulations! You've completed ${course.title}!`);
    }

    generateCertificate(course) {
        // Generate certificate (would integrate with certificate system)
        console.log(`Generating certificate for ${course.title}`);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryEducationalCourses = new PlanetDiscoveryEducationalCourses();
}

