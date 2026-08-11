/**
 * Interactive Astronomy Courses
 * Course structure, lessons, progress tracking, quizzes, certificates
 */

class AstronomyCourses {
    constructor() {
        this.courses = [];
        this.userProgress = {};
        this.currentCourse = null;
        this.currentLesson = null;
        this.isInitialized = false;

        this.init();
    }

    /**
     * Initialize astronomy courses
     */
    async init() {
        // Load courses
        this.loadCourses();

        // Load user progress
        this.loadUserProgress();

        this.isInitialized = true;
        this.trackEvent('astronomy_courses_initialized');
    }

    /**
     * Load course structure
     */
    loadCourses() {
        this.courses = [
            {
                id: 'intro-astronomy',
                title: 'Introduction to Astronomy',
                description: 'Learn the basics of astronomy, stars, planets, and the universe',
                icon: '🌟',
                difficulty: 'beginner',
                duration: '2-3 hours',
                lessons: [
                    {
                        id: 'intro-1',
                        title: 'What is Astronomy?',
                        content: `
                            <h2>What is Astronomy?</h2>
                            <p>Astronomy is the study of celestial objects and phenomena beyond Earth's atmosphere.</p>
                            ${this.getVideoEmbed('https://www.youtube.com/embed/example-intro-astronomy')}
                            <h3>Key Topics:</h3>
                            <ul>
                                <li>Stars and galaxies</li>
                                <li>Planets and exoplanets</li>
                                <li>Cosmic phenomena</li>
                                <li>Observational methods</li>
                            </ul>
                            ${this.getInteractiveElement('star-map', 'Explore the night sky')}
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What is astronomy?',
                                    options: [
                                        'Study of Earth',
                                        'Study of celestial objects',
                                        'Study of weather',
                                        'Study of oceans'
                                    ],
                                    correct: 1
                                }
                            ]
                        }
                    },
                    {
                        id: 'intro-2',
                        title: 'The Solar System',
                        content: `
                            <h2>The Solar System</h2>
                            <p>Our solar system consists of the Sun and all objects orbiting it.</p>
                            <h3>Components:</h3>
                            <ul>
                                <li>Sun (star)</li>
                                <li>8 planets</li>
                                <li>Dwarf planets</li>
                                <li>Asteroids and comets</li>
                            </ul>
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'How many planets are in our solar system?',
                                    options: ['7', '8', '9', '10'],
                                    correct: 1
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'exoplanets',
                title: 'Exoplanets: Worlds Beyond Our Solar System',
                description: 'Discover planets orbiting other stars and learn about their characteristics',
                icon: '🪐',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                lessons: [
                    {
                        id: 'exo-1',
                        title: 'What are Exoplanets?',
                        content: `
                            <h2>What are Exoplanets?</h2>
                            <p>Exoplanets are planets that orbit stars outside our solar system.</p>
                            <h3>Discovery Methods:</h3>
                            <ul>
                                <li>Transit method</li>
                                <li>Radial velocity</li>
                                <li>Direct imaging</li>
                                <li>Microlensing</li>
                            </ul>
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What is an exoplanet?',
                                    options: [
                                        'A planet in our solar system',
                                        'A planet orbiting another star',
                                        'A moon',
                                        'An asteroid'
                                    ],
                                    correct: 1
                                }
                            ]
                        }
                    },
                    {
                        id: 'exo-2',
                        title: 'Types of Exoplanets',
                        content: `
                            <h2>Types of Exoplanets</h2>
                            <p>Exoplanets come in many varieties based on size and composition.</p>
                            <h3>Categories:</h3>
                            <ul>
                                <li>Terrestrial planets</li>
                                <li>Super-Earths</li>
                                <li>Gas giants</li>
                                <li>Ice giants</li>
                            </ul>
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'Which is NOT a type of exoplanet?',
                                    options: [
                                        'Terrestrial',
                                        'Super-Earth',
                                        'Gas Giant',
                                        'Solar Planet'
                                    ],
                                    correct: 3
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'kepler-mission',
                title: 'The Kepler Mission',
                description: 'Learn about NASA\'s Kepler space telescope and its discoveries',
                icon: '🔭',
                difficulty: 'intermediate',
                duration: '2-3 hours',
                lessons: [
                    {
                        id: 'kepler-1',
                        title: 'Kepler Mission Overview',
                        content: `
                            <h2>Kepler Mission Overview</h2>
                            <p>The Kepler space telescope was launched in 2009 to search for exoplanets.</p>
                            ${this.getVideoEmbed('https://www.youtube.com/embed/example-kepler-mission', 'Kepler Mission Documentary')}
                            <h3>Key Achievements:</h3>
                            <ul>
                                <li>Discovered 2,600+ confirmed exoplanets</li>
                                <li>Identified 2,900+ planet candidates</li>
                                <li>Revolutionized our understanding of planetary systems</li>
                            </ul>
                            ${this.getInteractiveElement('planet-comparison', 'Compare Kepler Discoveries')}
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'When was Kepler launched?',
                                    options: ['2007', '2009', '2011', '2013'],
                                    correct: 1
                                },
                                {
                                    question: 'How many exoplanets did Kepler discover?',
                                    options: ['1,000+', '2,000+', '2,600+', '3,000+'],
                                    correct: 2
                                }
                            ]
                        }
                    },
                    {
                        id: 'kepler-2',
                        title: 'Kepler\'s Discovery Methods',
                        content: `
                            <h2>Kepler's Discovery Methods</h2>
                            <p>Kepler used the transit method to detect exoplanets by measuring brightness dips.</p>
                            ${this.getVideoEmbed('https://www.youtube.com/embed/example-transit-method', 'Transit Method Explained')}
                            <h3>How It Works:</h3>
                            <ol>
                                <li>Monitor star brightness continuously</li>
                                <li>Detect periodic dimming events</li>
                                <li>Analyze light curve patterns</li>
                                <li>Confirm planet characteristics</li>
                            </ol>
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What method did Kepler primarily use?',
                                    options: ['Radial velocity', 'Transit method', 'Direct imaging', 'Microlensing'],
                                    correct: 1
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'stellar-evolution',
                title: 'Stellar Evolution',
                description: 'Learn how stars are born, live, and die',
                icon: '⭐',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                lessons: [
                    {
                        id: 'stellar-1',
                        title: 'Star Formation',
                        content: `
                            <h2>Star Formation</h2>
                            <p>Stars form from collapsing clouds of gas and dust in space.</p>
                            ${this.getVideoEmbed('https://www.youtube.com/embed/example-star-formation', 'Star Formation Process')}
                            <h3>Stages:</h3>
                            <ul>
                                <li>Molecular cloud collapse</li>
                                <li>Protostar formation</li>
                                <li>Main sequence entry</li>
                                <li>Nuclear fusion begins</li>
                            </ul>
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What do stars form from?',
                                    options: ['Asteroids', 'Gas and dust clouds', 'Planets', 'Comets'],
                                    correct: 1
                                }
                            ]
                        }
                    },
                    {
                        id: 'stellar-2',
                        title: 'Main Sequence Stars',
                        content: `
                            <h2>Main Sequence Stars</h2>
                            <p>Most stars spend their lives on the main sequence, fusing hydrogen into helium.</p>
                            ${this.getInteractiveElement('star-map', 'Explore Different Star Types')}
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What do main sequence stars fuse?',
                                    options: ['Helium to carbon', 'Hydrogen to helium', 'Carbon to oxygen', 'Oxygen to iron'],
                                    correct: 1
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'galaxies',
                title: 'Galaxies and the Universe',
                description: 'Explore galaxies, dark matter, and the expanding universe',
                icon: '🌌',
                difficulty: 'advanced',
                duration: '4-5 hours',
                lessons: [
                    {
                        id: 'galaxy-1',
                        title: 'Types of Galaxies',
                        content: `
                            <h2>Types of Galaxies</h2>
                            <p>Galaxies come in three main types: spiral, elliptical, and irregular.</p>
                            ${this.getVideoEmbed('https://www.youtube.com/embed/example-galaxies', 'Galaxy Types Explained')}
                            <h3>Galaxy Types:</h3>
                            <ul>
                                <li><strong>Spiral:</strong> Disk-shaped with spiral arms (e.g., Milky Way)</li>
                                <li><strong>Elliptical:</strong> Ellipsoidal shape, older stars</li>
                                <li><strong>Irregular:</strong> No defined shape</li>
                            </ul>
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What type of galaxy is the Milky Way?',
                                    options: ['Elliptical', 'Spiral', 'Irregular', 'Lenticular'],
                                    correct: 1
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'habitability',
                title: 'Planet Habitability',
                description: 'Learn what makes a planet habitable and how we search for life',
                icon: '🌍',
                difficulty: 'intermediate',
                duration: '3-4 hours',
                lessons: [
                    {
                        id: 'hab-1',
                        title: 'The Habitable Zone',
                        content: `
                            <h2>The Habitable Zone</h2>
                            <p>The habitable zone is the region around a star where liquid water could exist.</p>
                            ${this.getVideoEmbed('https://www.youtube.com/embed/example-habitable-zone', 'Habitable Zone Explained')}
                            ${this.getInteractiveElement('planet-comparison', 'Compare Habitable Planets')}
                        `,
                        quiz: {
                            questions: [
                                {
                                    question: 'What is the habitable zone?',
                                    options: [
                                        'Where planets orbit',
                                        'Where liquid water could exist',
                                        'Where stars form',
                                        'Where comets come from'
                                    ],
                                    correct: 1
                                }
                            ]
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Get video embed HTML
     */
    getVideoEmbed(videoUrl, title = 'Video') {
        if (!videoUrl || videoUrl.includes('example')) {
            // Default placeholder video (e.g. Earth from Space)
            return `
                 <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 12px; border: 2px solid rgba(186,148,79,0.3);">
                     <iframe src="https://www.youtube.com/embed/libKVRa01L8" title="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            `;
        }
        return `
            <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 12px; border: 2px solid rgba(186,148,79,0.3);">
                <iframe src="${videoUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
    }
    /**
     * Get interactive element HTML
     */
    getInteractiveElement(type, title) {
        const elements = {
            'star-map': `
                <div class="interactive-element star-map" style="background: rgba(0,0,0,0.5); border: 2px solid rgba(186,148,79,0.3); border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">${title}</h4>
                    <div id="interactive-star-map-${Date.now()}" style="height: 400px; background: linear-gradient(180deg, #1a0a2e 0%, #000 100%); border-radius: 8px; position: relative; overflow: hidden;">
                        <canvas id="star-map-canvas" style="width: 100%; height: 100%;"></canvas>
                    </div>
                    <button onclick="window.interactiveStarMaps?.init()" style="margin-top: 1rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                        Launch Interactive Map
                    </button>
                </div>
                `,
            'planet-comparison': `
                <div class="interactive-element planet-comparison" style="background: rgba(0,0,0,0.5); border: 2px solid rgba(186,148,79,0.3); border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">${title}</h4>
                    <div id="interactive-comparison-${Date.now()}" style="height: 300px; display: flex; align-items: center; justify-content: space-around; padding: 1rem;">
                        <div class="planet-visual" style="text-align: center;">
                            <div style="width: 50px; height: 50px; background: radial-gradient(circle, #4a90e2, #1a4a90); border-radius: 50%; margin: 0 auto;"></div>
                            <p style="margin-top: 0.5rem; color: rgba(255,255,255,0.7);">Earth</p>
                        </div>
                        <div style="font-size: 2rem; color: #ba944f;">vs</div>
                        <div class="planet-visual" style="text-align: center;">
                            <div style="width: 75px; height: 75px; background: radial-gradient(circle, #ba944f, #8b6f3a); border-radius: 50%; margin: 0 auto;"></div>
                            <p style="margin-top: 0.5rem; color: rgba(255,255,255,0.7);">Exoplanet</p>
                        </div>
                    </div>
                </div>
                `,
            'quiz-interactive': `
                <div class="interactive-element quiz" style="background: rgba(0,0,0,0.5); border: 2px solid rgba(186,148,79,0.3); border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">${title}</h4>
                    <p style="color: rgba(255,255,255,0.7);">Interactive quiz will appear here</p>
                </div>
                `
        };
        return elements[type] || '';
    }

    /**
     * Load user progress
     */
    loadUserProgress() {
        try {
            const stored = localStorage.getItem('astronomy-courses-progress');
            if (stored) {
                this.userProgress = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            this.userProgress = {};
        }
    }

    /**
     * Save user progress
     */
    saveUserProgress() {
        try {
            localStorage.setItem('astronomy-courses-progress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    /**
     * Get course progress
     */
    getCourseProgress(courseId) {
        const progress = this.userProgress[courseId] || {
            completedLessons: [],
            quizScores: {},
            startedAt: null,
            completedAt: null
        };

        const course = this.courses.find(c => c.id === courseId);
        if (!course) return null;

        const totalLessons = course.lessons.length;
        const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
        const quizScores = progress.quizScores && typeof progress.quizScores === 'object' ? progress.quizScores : {};
        const completedLessonsCount = completedLessons.length;
        const percentage = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

        return {
            ...progress,
            completedLessons,
            quizScores,
            totalLessons,
            completedLessonsCount,
            percentage: Math.round(percentage)
        };
    }

    /**
     * Mark lesson as complete
     */
    completeLesson(courseId, lessonId) {
        if (!this.userProgress[courseId]) {
            this.userProgress[courseId] = {
                completedLessons: [],
                quizScores: {},
                startedAt: new Date().toISOString()
            };
        }

        if (!Array.isArray(this.userProgress[courseId].completedLessons)) {
            this.userProgress[courseId].completedLessons = [];
        }

        if (!this.userProgress[courseId].quizScores || typeof this.userProgress[courseId].quizScores !== 'object') {
            this.userProgress[courseId].quizScores = {};
        }

        if (!this.userProgress[courseId].completedLessons.includes(lessonId)) {
            this.userProgress[courseId].completedLessons.push(lessonId);
        }

        // Check if course is complete
        const course = this.courses.find(c => c.id === courseId);
        if (course && this.userProgress[courseId].completedLessons.length === course.lessons.length) {
            this.userProgress[courseId].completedAt = new Date().toISOString();
            this.generateCertificate(courseId);
        }

        this.saveUserProgress();
    }

    /**
     * Submit quiz answer
     */
    submitQuiz(courseId, lessonId, answers) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return null;

        const lesson = course.lessons.find(l => l.id === lessonId);
        if (!lesson || !lesson.quiz) return null;

        let score = 0;
        const results = [];

        lesson.quiz.questions.forEach((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correct;
            if (isCorrect) score++;

            results.push({
                question: q.question,
                userAnswer,
                correctAnswer: q.correct,
                isCorrect
            });
        });

        const percentage = (score / lesson.quiz.questions.length) * 100;

        // Save quiz score
        if (!this.userProgress[courseId]) {
            this.userProgress[courseId] = {
                completedLessons: [],
                quizScores: {},
                startedAt: new Date().toISOString()
            };
        }

        if (!this.userProgress[courseId].quizScores || typeof this.userProgress[courseId].quizScores !== 'object') {
            this.userProgress[courseId].quizScores = {};
        }

        if (!Array.isArray(this.userProgress[courseId].quizScores[lessonId])) {
            this.userProgress[courseId].quizScores[lessonId] = [];
        }

        this.userProgress[courseId].quizScores[lessonId].push({
            score: percentage,
            date: new Date().toISOString()
        });

        this.saveUserProgress();

        return {
            score,
            total: lesson.quiz.questions.length,
            percentage: Math.round(percentage),
            results
        };
    }

    /**
     * Generate certificate
     */
    generateCertificate(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return null;

        const certificate = {
            courseId: course.id,
            courseTitle: course.title,
            issuedAt: new Date().toISOString(),
            certificateId: `CERT-${courseId}-${Date.now()}`
        };

        // Store certificate
        const certificates = JSON.parse(localStorage.getItem('astronomy-certificates') || '[]');
        certificates.push(certificate);
        localStorage.setItem('astronomy-certificates', JSON.stringify(certificates));

        // Show certificate notification
        this.showCertificateNotification(certificate);

        return certificate;
    }

    /**
     * Show certificate notification
     */
    showCertificateNotification(certificate) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
            border: 3px solid #ba944f;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(186, 148, 79, 0.5);
            animation: slideIn 0.5s ease;
            `;

        notification.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 1rem 0; font-family: 'Cormorant Garamond', serif;">🏆 Course Complete!</h3>
            <p style="color: rgba(255,255,255,0.9); margin-bottom: 1rem;">You've completed: <strong>${certificate.courseTitle}</strong></p>
            <button id="view-certificate-btn" style="background: #ba944f; color: #000; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">
                View Certificate
            </button>
            `;

        document.body.appendChild(notification);

        document.getElementById('view-certificate-btn').addEventListener('click', () => {
            this.displayCertificate(certificate);
            notification.remove();
        });

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    /**
     * Display certificate
     */
    displayCertificate(certificate) {
        const modal = document.createElement('div');
        modal.className = 'certificate-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border: 4px solid #ba944f; border-radius: 16px; padding: 3rem; max-width: 700px; width: 90%; text-align: center; color: #fff; font-family: 'Cormorant Garamond', serif;">
                <h1 style="color: #ba944f; font-size: 3rem; margin: 0 0 1rem 0;">🏆</h1>
                <h2 style="color: #ba944f; font-size: 2rem; margin: 0 0 0.5rem 0;">Certificate of Completion</h2>
                <p style="font-size: 1.2rem; margin: 1rem 0;">This certifies that</p>
                <p style="font-size: 1.5rem; font-weight: bold; color: #ba944f; margin: 1rem 0;">${certificate.courseTitle}</p>
                <p style="font-size: 1.2rem; margin: 1rem 0;">has been successfully completed</p>
                <div style="margin: 2rem 0; padding: 1rem; background: rgba(0,0,0,0.3); border-radius: 8px;">
                    <p style="font-size: 0.9rem; opacity: 0.7;">Certificate ID: ${certificate.certificateId}</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">Issued: ${new Date(certificate.issuedAt).toLocaleDateString()}</p>
                </div>
                <button id="close-certificate" style="background: #ba944f; color: #000; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 1rem;">
                    Close
                </button>
            </div>
            `;

        document.body.appendChild(modal);

        document.getElementById('close-certificate').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Display courses UI
     */
    displayCourses(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        container.innerHTML = `
            <div class="astronomy-courses">
                <div class="courses-header">
                    <h2>📚 Interactive Astronomy Courses</h2>
                    <p>Learn about astronomy, exoplanets, and space exploration</p>
                </div>

                <div class="courses-grid">
                    ${this.courses.map(course => {
            const progress = this.getCourseProgress(course.id);
            return `
                            <div class="course-card" data-course-id="${course.id}">
                                <div class="course-icon">${course.icon}</div>
                                <h3>${course.title}</h3>
                                <p class="course-description">${course.description}</p>
                                <div class="course-meta">
                                    <span class="difficulty ${course.difficulty}">${course.difficulty}</span>
                                    <span class="duration">⏱️ ${course.duration}</span>
                                </div>
                                ${progress ? `
                                    <div class="course-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                                        </div>
                                        <div class="progress-text">${progress.percentage}% Complete</div>
                                    </div>
                                ` : ''}
                                <button class="btn-start-course" data-course-id="${course.id}">
                                    ${progress && progress.percentage > 0 ? 'Continue Course' : 'Start Course'}
                                </button>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
            `;

        this.setupCourseEventListeners(container);
        this.injectCourseStyles();
    }

    /**
     * Setup course event listeners
     */
    setupCourseEventListeners(container) {
        container.querySelectorAll('.btn-start-course').forEach(btn => {
            btn.addEventListener('click', () => {
                const courseId = btn.dataset.courseId;
                this.startCourse(courseId);
            });
        });
    }

    /**
     * Start course
     */
    startCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        this.currentCourse = course;
        this.displayCourseLessons(course);
    }

    /**
     * Display course lessons
     */
    displayCourseLessons(course) {
        const modal = document.createElement('div');
        modal.id = 'course-lessons-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            overflow-y: auto;
            `;

        const progress = this.getCourseProgress(course.id);

        this.trackEvent('course_displayed', { courseId: course.id });

        modal.innerHTML = `
            <div style="padding: 2rem; max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="color: #ba944f; font-family: 'Cormorant Garamond', serif; margin: 0;">${course.icon} ${course.title}</h1>
                    <button id="close-course-modal" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                ${progress ? `
                    <div style="margin-bottom: 2rem; padding: 1rem; background: rgba(0,0,0,0.5); border-radius: 12px; border: 1px solid rgba(186, 148, 79, 0.3);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: rgba(255,255,255,0.7);">Progress</span>
                            <span style="color: #ba944f; font-weight: 600;">${progress.percentage}%</span>
                        </div>
                        <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, #4a90e2, #ba944f); width: ${progress.percentage}%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                ` : ''}
                <div id="lessons-container">
                    ${course.lessons.map((lesson, index) => {
            const isCompleted = progress?.completedLessons.includes(lesson.id);
            return `
                            <div class="lesson-card ${isCompleted ? 'completed' : ''}" data-lesson-id="${lesson.id}">
                                <div class="lesson-number">${index + 1}</div>
                                <div class="lesson-content">
                                    <h3>${lesson.title}</h3>
                                    ${isCompleted ? '<span class="completed-badge">✓ Completed</span>' : ''}
                                </div>
                                <button class="btn-start-lesson" data-lesson-id="${lesson.id}">
                                    ${isCompleted ? 'Review' : 'Start'}
                                </button>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
            `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-course-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelectorAll('.btn-start-lesson').forEach(btn => {
            btn.addEventListener('click', () => {
                const lessonId = btn.dataset.lessonId;
                this.startLesson(course.id, lessonId);
            });
        });
    }

    /**
     * Start lesson
     */
    startLesson(courseId, lessonId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const lesson = course.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        this.currentLesson = lesson;
        this.displayLesson(courseId, lesson);
    }

    /**
     * Display lesson content
     */
    displayLesson(courseId, lesson) {
        const modal = document.createElement('div');
        modal.id = 'lesson-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10002;
            overflow-y: auto;
            `;

        modal.innerHTML = `
            <div style="padding: 2rem; max-width: 900px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="color: #ba944f; font-family: 'Cormorant Garamond', serif; margin: 0;">${lesson.title}</h1>
                    <button id="close-lesson-modal" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                <div class="lesson-content-display" style="background: rgba(0,0,0,0.5); padding: 2rem; border-radius: 12px; border: 1px solid rgba(186, 148, 79, 0.3); color: rgba(255,255,255,0.9); line-height: 1.8;">
                    ${lesson.content}
                </div>
                ${lesson.quiz ? `
                    <div id="lesson-quiz" style="margin-top: 2rem; padding: 2rem; background: rgba(0,0,0,0.5); border-radius: 12px; border: 1px solid rgba(186, 148, 79, 0.3);">
                        <h2 style="color: #ba944f; margin-bottom: 1.5rem;">Quiz</h2>
                        ${lesson.quiz.questions.map((q, qIndex) => `
                            <div class="quiz-question" style="margin-bottom: 2rem;">
                                <h3 style="color: #ba944f; margin-bottom: 1rem;">${qIndex + 1}. ${q.question}</h3>
                                <div class="quiz-options">
                                    ${q.options.map((option, oIndex) => `
                                        <label style="display: block; padding: 0.75rem; margin-bottom: 0.5rem; background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">
                                            <input type="radio" name="quiz-${qIndex}" value="${oIndex}" style="margin-right: 0.5rem;">
                                            ${option}
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                        <button id="submit-quiz-btn" style="background: #ba944f; color: #000; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Submit Quiz
                        </button>
                    </div>
                ` : ''}
                <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                    <button id="complete-lesson-btn" style="background: rgba(74, 144, 226, 0.2); border: 2px solid rgba(74, 144, 226, 0.5); color: #4a90e2; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Mark as Complete
                    </button>
                </div>
            </div>
            `;

        document.body.appendChild(modal);

        // Submit quiz
        if (lesson.quiz) {
            document.getElementById('submit-quiz-btn').addEventListener('click', () => {
                const answers = [];
                lesson.quiz.questions.forEach((q, index) => {
                    const selected = modal.querySelector(`input[name="quiz-${index}"]:checked`);
                    answers.push(selected ? parseInt(selected.value, 10) : -1);
                });

                const result = this.submitQuiz(courseId, lesson.id, answers);
                if (result) {
                    alert(`Quiz Score: ${result.percentage}% (${result.score}/${result.total})`);
                }
            });
        }

        // Complete lesson
        const courseRef = this.courses.find(c => c.id === courseId);
        document.getElementById('complete-lesson-btn').addEventListener('click', () => {
            this.completeLesson(courseId, lesson.id);
            alert('Lesson marked as complete!');
            modal.remove();
            this.displayCourseLessons(courseRef);
        });

        // Close button
        document.getElementById('close-lesson-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Inject course styles
     */
    injectCourseStyles() {
        if (document.getElementById('astronomy-courses-styles')) return;

        const style = document.createElement('style');
        style.id = 'astronomy-courses-styles';
        style.textContent = `
            .astronomy-courses {
                padding: 2rem;
                max-width: 1400px;
                margin: 0 auto;
            }

            .courses-header {
                text-align: center;
                margin-bottom: 3rem;
            }

            .courses-header h2 {
                color: #ba944f;
                font-family: 'Cormorant Garamond', serif;
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }

            .courses-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 2rem;
            }

            .course-card {
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                transition: all 0.3s ease;
            }

            .course-card:hover {
                border-color: #ba944f;
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(186, 148, 79, 0.3);
            }

            .course-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }

            .course-card h3 {
                color: #ba944f;
                font-family: 'Cormorant Garamond', serif;
                font-size: 1.5rem;
                margin-bottom: 1rem;
            }

            .course-description {
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }

            .course-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1.5rem;
                font-size: 0.9rem;
            }

            .difficulty {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-weight: 600;
            }

            .difficulty.beginner {
                background: rgba(74, 144, 226, 0.2);
                color: #4a90e2;
            }

            .difficulty.intermediate {
                background: rgba(186, 148, 79, 0.2);
                color: #ba944f;
            }

            .difficulty.advanced {
                background: rgba(255, 100, 100, 0.2);
                color: #ff6464;
            }

            .course-progress {
                margin-bottom: 1.5rem;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4a90e2, #ba944f);
                transition: width 0.5s ease;
            }

            .progress-text {
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
            }

            .btn-start-course {
                width: 100%;
                padding: 0.75rem;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.5);
                color: #ba944f;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .btn-start-course:hover {
                background: rgba(186, 148, 79, 0.4);
            }

            .lesson-card {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.5rem;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                margin-bottom: 1rem;
            }

            .lesson-card.completed {
                border-color: rgba(74, 144, 226, 0.5);
            }

            .lesson-number {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #ba944f;
            }

            .lesson-content {
                flex: 1;
            }

            .lesson-content h3 {
                color: #ba944f;
                margin: 0 0 0.5rem 0;
            }

            .completed-badge {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                background: rgba(74, 144, 226, 0.2);
                color: #4a90e2;
                border-radius: 12px;
                font-size: 0.85rem;
                font-weight: 600;
            }

            .btn-start-lesson {
                padding: 0.75rem 1.5rem;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.5);
                color: #ba944f;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            }
            `;

        document.head.appendChild(style);
    }

    /**
     * Render the course list UI
     */
    renderCourseList() {
        const existing = document.getElementById('courses-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'courses-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            box-sizing: border-box;
            overflow-y: auto;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            width: 100%;
            max-width: 1000px;
            background: rgba(16, 16, 20, 0.9);
            border: 2px solid rgba(186, 148, 79, 0.3);
            border-radius: 12px;
            padding: 2rem;
            position: relative;
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: #ba944f;
            font-size: 2rem;
            cursor: pointer;
        `;
        closeBtn.onclick = () => modal.remove();

        // Header
        const header = document.createElement('h2');
        header.textContent = 'Astronomy Academy';
        header.style.cssText = `
            color: #ba944f;
            font-family: 'Orbitron', sans-serif;
            text-align: center;
            margin-bottom: 2rem;
            font-size: 2rem;
        `;

        // Grid
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        `;

        this.courses.forEach(course => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(186, 148, 79, 0.2);
                border-radius: 8px;
                padding: 1.5rem;
                transition: transform 0.2s;
            `;

            card.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">${course.icon}</div>
                <h3 style="color: #fff; margin: 0 0 0.5rem 0; font-family: 'Inter', sans-serif;">${course.title}</h3>
                <p style="color: #aaa; font-size: 0.9rem; line-height: 1.4;">${course.description}</p>
                <div style="margin-top: 1rem; color: #888; font-size: 0.8rem;">
                    <span>⏱ ${course.duration}</span> • <span>📊 ${course.difficulty}</span>
                </div>
                <button class="start-course-btn" data-id="${course.id}" style="
                    margin-top: 1.5rem;
                    width: 100%;
                    padding: 0.8rem;
                    background: rgba(186, 148, 79, 0.2);
                    border: 1px solid rgba(186, 148, 79, 0.5);
                    color: #ba944f;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">Start Course</button>
            `;
            grid.appendChild(card);
        });

        content.appendChild(closeBtn);
        content.appendChild(header);
        content.appendChild(grid);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Events
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-course-btn')) {
                const courseId = e.target.dataset.id;
                modal.remove();
                this.startCourse(courseId);
            }
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`astronomy_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.astronomyCourses = new AstronomyCourses();

    // Make available globally
    window.getAstronomyCourses = () => window.astronomyCourses;
}
