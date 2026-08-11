/**
 * Personalized Learning Paths
 * Adaptive learning experience with customized educational journeys
 * @author Agent 3 - Adriano To The Star
 */

class PersonalizedLearningPaths {
    constructor() {
        this.studentProfile = null;
        this.learningPaths = new Map();
        this.currentPath = null;
        this.progressTracker = new Map();
        this.init();
    }

    init() {
        this.loadStudentProfile();
        this.initializeLearningPaths();
        this.createPathInterface();
        this.setupEventListeners();
    }

    loadStudentProfile() {
        const saved = localStorage.getItem('student-profile');
        if (saved) {
            this.studentProfile = JSON.parse(saved);
        } else {
            this.studentProfile = {
                interests: ['astronomy', 'physics'],
                learningStyle: 'visual',
                pace: 'normal',
                strengths: [],
                weaknesses: [],
                goals: ['understand-basics', 'explore-careers'],
                completedModules: [],
                currentLevel: 1
            };
        }
    }

    initializeLearningPaths() {
        const paths = [
            {
                id: 'space-explorer',
                name: 'Space Explorer',
                description: 'Journey through the cosmos, from planets to galaxies',
                difficulty: 'beginner',
                duration: '8 weeks',
                modules: [
                    {
                        id: 'solar-system',
                        name: 'Our Solar System',
                        topics: ['planets', 'moons', 'asteroids'],
                        activities: ['videos', 'quizzes', 'simulations'],
                        estimatedTime: '2 weeks'
                    },
                    {
                        id: 'stars-galaxies',
                        name: 'Stars and Galaxies',
                        topics: ['stellar-lifecycle', 'galaxy-types', 'nebulae'],
                        activities: ['observations', 'calculations', 'research'],
                        estimatedTime: '3 weeks'
                    },
                    {
                        id: 'cosmology',
                        name: 'Understanding the Universe',
                        topics: ['big-bang', 'dark-matter', 'expansion'],
                        activities: ['theory-study', 'data-analysis', 'discussions'],
                        estimatedTime: '3 weeks'
                    }
                ]
            },
            {
                id: 'rocket-science',
                name: 'Rocket Science Fundamentals',
                description: 'Master the physics and engineering of space travel',
                difficulty: 'intermediate',
                duration: '10 weeks',
                modules: [
                    {
                        id: 'propulsion',
                        name: 'Propulsion Systems',
                        topics: ['chemical-rockets', 'ion-thrusters', 'future-tech'],
                        activities: ['calculations', 'design-challenges', 'simulations'],
                        estimatedTime: '3 weeks'
                    },
                    {
                        id: 'orbital-mechanics',
                        name: 'Orbital Mechanics',
                        topics: ['kepler-laws', 'transfer-orbits', 'rendezvous'],
                        activities: ['problem-solving', 'mission-planning', 'visualization'],
                        estimatedTime: '4 weeks'
                    },
                    {
                        id: 'spacecraft-design',
                        name: 'Spacecraft Design',
                        topics: ['systems-engineering', 'materials', 'life-support'],
                        activities: ['design-projects', 'case-studies', 'presentations'],
                        estimatedTime: '3 weeks'
                    }
                ]
            },
            {
                id: 'astrobiology',
                name: 'Astrobiology and Life in Space',
                description: 'Explore the possibility of life beyond Earth',
                difficulty: 'intermediate',
                duration: '6 weeks',
                modules: [
                    {
                        id: 'origins-life',
                        name: 'Origins of Life',
                        topics: ['abiogenesis', 'extremophiles', 'early-earth'],
                        activities: ['research', 'experiments', 'debates'],
                        estimatedTime: '2 weeks'
                    },
                    {
                        id: 'habitable-worlds',
                        name: 'Habitable Worlds',
                        topics: ['goldilocks-zone', 'exoplanets', 'biosignatures'],
                        activities: ['data-analysis', 'modeling', 'observations'],
                        estimatedTime: '2 weeks'
                    },
                    {
                        id: 'search-life',
                        name: 'The Search for Extraterrestrial Life',
                        topics: ['seti', 'mars-missions', 'ocean-worlds'],
                        activities: ['signal-analysis', 'mission-design', 'discussions'],
                        estimatedTime: '2 weeks'
                    }
                ]
            }
        ];

        paths.forEach(path => {
            this.learningPaths.set(path.id, path);
        });
    }

    createPathInterface() {
        const pathInterface = document.createElement('div');
        pathInterface.id = 'learning-paths-interface';
        pathInterface.innerHTML = `
            <div class="learning-paths-container">
                <div class="paths-header">
                    <h2>🎯 Your Learning Journey</h2>
                    <div class="path-selector">
                        <select id="path-dropdown">
                            <option value="">Choose a learning path...</option>
                            ${Array.from(this.learningPaths.values()).map(path =>
            `<option value="${path.id}">${path.name}</option>`
        ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="paths-content">
                    <div class="path-overview" id="path-overview">
                        <div class="empty-state">
                            <h3>Select a Learning Path</h3>
                            <p>Choose from our personalized learning paths to begin your space education journey.</p>
                        </div>
                    </div>
                    
                    <div class="current-progress" id="current-progress" style="display: none;">
                        <h3>Your Progress</h3>
                        <div class="progress-overview">
                            <div class="overall-progress">
                                <div class="progress-circle">
                                    <span class="progress-percentage">0%</span>
                                </div>
                                <div class="progress-details">
                                    <div class="modules-completed">0 modules completed</div>
                                    <div class="time-spent">0 hours invested</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="path-modules" id="path-modules"></div>
                </div>
                
                <div class="learning-recommendations">
                    <h3>Recommended for You</h3>
                    <div class="recommendations-grid" id="recommendations-grid"></div>
                </div>
            </div>
        `;

        document.body.appendChild(pathInterface);
        this.addPathStyles();
        this.generateRecommendations();
    }

    selectLearningPath(pathId) {
        const path = this.learningPaths.get(pathId);
        if (!path) return;

        this.currentPath = path;
        this.initializeProgress(pathId);
        this.displayPathOverview(path);
        this.displayPathModules(path);
        this.showCurrentProgress(pathId);
    }

    initializeProgress(pathId) {
        if (!this.progressTracker.has(pathId)) {
            this.progressTracker.set(pathId, {
                currentModule: 0,
                completedModules: [],
                moduleProgress: {},
                totalTimeSpent: 0,
                quizScores: {},
                activitiesCompleted: [],
                lastAccessed: new Date().toISOString()
            });
        }
    }

    displayPathOverview(path) {
        const overview = document.getElementById('path-overview');
        overview.innerHTML = `
            <div class="path-card">
                <div class="path-header">
                    <h3>${path.name}</h3>
                    <span class="difficulty-badge ${path.difficulty}">${path.difficulty}</span>
                </div>
                <p class="path-description">${path.description}</p>
                <div class="path-stats">
                    <div class="stat">
                        <span class="stat-icon">📚</span>
                        <span class="stat-value">${path.modules.length} modules</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-value">${path.duration}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-value">Personalized for you</span>
                    </div>
                </div>
                <button class="start-path-btn" onclick="learningPaths.startPath('${path.id}')">
                    Start Learning
                </button>
            </div>
        `;
    }

    displayPathModules(path) {
        const modulesContainer = document.getElementById('path-modules');
        const progress = this.progressTracker.get(path.id);

        modulesContainer.innerHTML = `
            <h3>Learning Modules</h3>
            <div class="modules-timeline">
                ${path.modules.map((module, index) => `
                    <div class="module-card ${this.getModuleStatus(path.id, index)}" 
                         data-module="${module.id}">
                        <div class="module-number">${index + 1}</div>
                        <div class="module-content">
                            <h4>${module.name}</h4>
                            <p>${module.topics.join(' • ')}</p>
                            <div class="module-activities">
                                ${module.activities.map(activity =>
            `<span class="activity-tag">${activity}</span>`
        ).join('')}
                            </div>
                            <div class="module-time">⏱️ ${module.estimatedTime}</div>
                        </div>
                        <div class="module-actions">
                            ${this.getModuleAction(path.id, index)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getModuleStatus(pathId, moduleIndex) {
        const progress = this.progressTracker.get(pathId);
        if (!progress) return 'locked';

        if (progress.completedModules.includes(moduleIndex)) return 'completed';
        if (progress.currentModule === moduleIndex) return 'current';
        if (progress.currentModule > moduleIndex) return 'available';
        return 'locked';
    }

    getModuleAction(pathId, moduleIndex) {
        const status = this.getModuleStatus(pathId, moduleIndex);

        switch (status) {
            case 'completed':
                return '<span class="status-badge completed">✓ Completed</span>';
            case 'current':
                return '<button class="continue-btn">Continue</button>';
            case 'available':
                return '<button class="start-btn">Start</button>';
            case 'locked':
                return '<span class="status-badge locked">🔒 Locked</span>';
            default:
                return '';
        }
    }

    showCurrentProgress(pathId) {
        const progressContainer = document.getElementById('current-progress');
        const progress = this.progressTracker.get(pathId);

        if (!progress) return;

        progressContainer.style.display = 'block';

        const completedModules = progress.completedModules.length;
        const totalModules = this.currentPath.modules.length;
        const percentage = Math.round((completedModules / totalModules) * 100);

        progressContainer.innerHTML = `
            <h3>Your Progress</h3>
            <div class="progress-overview">
                <div class="overall-progress">
                    <div class="progress-circle">
                        <span class="progress-percentage">${percentage}%</span>
                    </div>
                    <div class="progress-details">
                        <div class="modules-completed">${completedModules} of ${totalModules} modules completed</div>
                        <div class="time-spent">${Math.round(progress.totalTimeSpent / 60)} hours invested</div>
                    </div>
                </div>
            </div>
        `;
    }

    startPath(pathId) {
        this.selectLearningPath(pathId);
        const progress = this.progressTracker.get(pathId);
        if (progress) {
            progress.currentModule = 0;
            progress.lastAccessed = new Date().toISOString();
            this.saveProgress();
        }

        // Start first module
        this.startModule(pathId, 0);
    }

    startModule(pathId, moduleIndex) {
        const path = this.learningPaths.get(pathId);
        const module = path.modules[moduleIndex];

        // Update progress
        const progress = this.progressTracker.get(pathId);
        progress.currentModule = moduleIndex;
        progress.lastAccessed = new Date().toISOString();

        // Launch module interface
        this.launchModuleInterface(module, pathId, moduleIndex);
    }

    launchModuleInterface(module, pathId, moduleIndex) {
        const modal = document.createElement('div');
        modal.className = 'module-modal';
        modal.innerHTML = `
            <div class="module-modal-content">
                <div class="module-header">
                    <h2>${module.name}</h2>
                    <button class="close-modal">×</button>
                </div>
                <div class="module-body">
                    <div class="module-tabs">
                        <button class="tab-btn active" data-tab="overview">Overview</button>
                        <button class="tab-btn" data-tab="content">Content</button>
                        <button class="tab-btn" data-tab="activities">Activities</button>
                        <button class="tab-btn" data-tab="quiz">Quiz</button>
                    </div>
                    <div class="tab-content active" id="overview">
                        <h3>Module Overview</h3>
                        <p>You'll learn about: ${module.topics.join(', ')}</p>
                        <div class="learning-objectives">
                            <h4>Learning Objectives:</h4>
                            <ul>
                                <li>Understand fundamental concepts</li>
                                <li>Apply knowledge to real problems</li>
                                <li>Develop practical skills</li>
                            </ul>
                        </div>
                    </div>
                    <div class="tab-content" id="content">
                        <h3>Learning Content</h3>
                        <div class="content-sections">
                            ${module.topics.map(topic => `
                                <div class="content-section">
                                    <h4>${topic}</h4>
                                    <p>Interactive content for ${topic} will appear here.</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tab-content" id="activities">
                        <h3>Learning Activities</h3>
                        <div class="activities-grid">
                            ${module.activities.map(activity => `
                                <div class="activity-card">
                                    <h4>${activity}</h4>
                                    <p>Interactive ${activity} exercise</p>
                                    <button class="start-activity-btn">Start Activity</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tab-content" id="quiz">
                        <h3>Module Quiz</h3>
                        <p>Test your knowledge with a comprehensive quiz.</p>
                        <button class="start-quiz-btn">Start Quiz</button>
                    </div>
                </div>
                <div class="module-footer">
                    <button class="prev-module-btn" ${moduleIndex === 0 ? 'disabled' : ''}>
                        Previous Module
                    </button>
                    <button class="complete-module-btn">
                        Complete Module
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModuleEvents(modal, pathId, moduleIndex);
    }

    setupModuleEvents(modal, pathId, moduleIndex) {
        // Tab switching
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                modal.querySelector(`#${tabId}`).classList.add('active');
            });
        });

        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Complete module
        modal.querySelector('.complete-module-btn').addEventListener('click', () => {
            this.completeModule(pathId, moduleIndex);
            modal.remove();
        });
    }

    completeModule(pathId, moduleIndex) {
        const progress = this.progressTracker.get(pathId);
        if (!progress) return;

        progress.completedModules.push(moduleIndex);
        progress.currentModule = Math.min(moduleIndex + 1, this.currentPath.modules.length - 1);
        progress.lastAccessed = new Date().toISOString();

        this.saveProgress();
        this.displayPathModules(this.currentPath);
        this.showCurrentProgress(pathId);

        // Show completion celebration
        this.showModuleCompletion();
    }

    showModuleCompletion() {
        const celebration = document.createElement('div');
        celebration.className = 'module-completion';
        celebration.innerHTML = `
            <div class="celebration-content">
                <h2>🎉 Module Complete!</h2>
                <p>Great job! You've successfully completed this module.</p>
                <button class="continue-learning">Continue Learning</button>
            </div>
        `;

        document.body.appendChild(celebration);

        celebration.querySelector('.continue-learning').addEventListener('click', () => {
            celebration.remove();
        });

        setTimeout(() => celebration.remove(), 5000);
    }

    generateRecommendations() {
        const recommendations = [
            {
                type: 'path',
                title: 'Quick Start: Space Basics',
                description: 'Perfect for beginners wanting to explore space',
                difficulty: 'beginner',
                duration: '2 weeks'
            },
            {
                type: 'skill',
                title: 'Improve Your Math Skills',
                description: 'Strengthen your foundation for advanced topics',
                difficulty: 'intermediate',
                duration: '1 week'
            },
            {
                type: 'challenge',
                title: 'Space Mission Design Challenge',
                description: 'Apply your knowledge to a real-world problem',
                difficulty: 'advanced',
                duration: '3 days'
            }
        ];

        const grid = document.getElementById('recommendations-grid');
        grid.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card ${rec.type}">
                <div class="rec-header">
                    <h4>${rec.title}</h4>
                    <span class="rec-badge ${rec.difficulty}">${rec.difficulty}</span>
                </div>
                <p>${rec.description}</p>
                <div class="rec-meta">
                    <span class="rec-duration">⏱️ ${rec.duration}</span>
                    <button class="rec-action">Start</button>
                </div>
            </div>
        `).join('');
    }

    saveProgress() {
        const progressData = Array.from(this.progressTracker.entries());
        localStorage.setItem('learning-paths-progress', JSON.stringify(progressData));
    }

    loadProgress() {
        const saved = localStorage.getItem('learning-paths-progress');
        if (saved) {
            const progressData = JSON.parse(saved);
            progressData.forEach(([pathId, progress]) => {
                this.progressTracker.set(pathId, progress);
            });
        }
    }

    setupEventListeners() {
        const pathDropdown = document.getElementById('path-dropdown');
        pathDropdown.addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectLearningPath(e.target.value);
            }
        });

        this.loadProgress();
    }

    addPathStyles() {
        if (document.querySelector('#learning-paths-styles')) return;

        const style = document.createElement('style');
        style.id = 'learning-paths-styles';
        style.textContent = `
            #learning-paths-interface {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 1400px;
                height: 85vh;
                background: var(--color-surface);
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }
            
            .learning-paths-container {
                height: 100%;
                display: flex;
                flex-direction: column;
                padding: 20px;
            }
            
            .paths-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            }
            
            .paths-header h2 {
                margin: 0;
                color: var(--color-text);
            }
            
            .path-selector select {
                padding: 10px 15px;
                background: var(--color-background);
                color: var(--color-text);
                border: 1px solid var(--color-background);
                border-radius: 6px;
                font-size: 14px;
            }
            
            .paths-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 30px;
                overflow-y: auto;
            }
            
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--color-text-secondary);
            }
            
            .path-card {
                background: var(--color-background);
                border-radius: 12px;
                padding: 30px;
                border: 1px solid var(--color-surface);
            }
            
            .path-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .path-header h3 {
                margin: 0;
                color: var(--color-text);
            }
            
            .difficulty-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .difficulty-badge.beginner { background: #22c55e; color: white; }
            .difficulty-badge.intermediate { background: #f59e0b; color: white; }
            .difficulty-badge.advanced { background: #ef4444; color: white; }
            
            .path-description {
                color: var(--color-text-secondary);
                margin-bottom: 20px;
                line-height: 1.6;
            }
            
            .path-stats {
                display: flex;
                gap: 30px;
                margin-bottom: 25px;
            }
            
            .stat {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--color-text);
            }
            
            .start-path-btn {
                background: var(--color-primary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .start-path-btn:hover {
                background: var(--color-accent);
                transform: translateY(-1px);
            }
            
            .modules-timeline {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .module-card {
                display: flex;
                gap: 20px;
                padding: 20px;
                background: var(--color-background);
                border-radius: 8px;
                border-left: 4px solid var(--color-surface);
                transition: all 0.2s ease;
            }
            
            .module-card.current {
                border-left-color: var(--color-primary);
                background: var(--color-surface);
            }
            
            .module-card.completed {
                border-left-color: #22c55e;
            }
            
            .module-card.available:hover {
                transform: translateX(4px);
            }
            
            .module-number {
                width: 40px;
                height: 40px;
                background: var(--color-primary);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .module-content {
                flex: 1;
            }
            
            .module-content h4 {
                margin: 0 0 8px 0;
                color: var(--color-text);
            }
            
            .module-content p {
                margin: 0 0 12px 0;
                color: var(--color-text-secondary);
            }
            
            .module-activities {
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .activity-tag {
                background: var(--color-surface);
                color: var(--color-text);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
            }
            
            .module-time {
                font-size: 12px;
                color: var(--color-text-secondary);
            }
            
            .module-actions {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }
            
            .status-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .status-badge.completed {
                background: #22c55e;
                color: white;
            }
            
            .status-badge.locked {
                background: var(--color-background);
                color: var(--color-text-secondary);
            }
            
            .continue-btn, .start-btn {
                background: var(--color-primary);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s ease;
            }
            
            .continue-btn:hover, .start-btn:hover {
                background: var(--color-accent);
            }
            
            .module-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }
            
            .module-modal-content {
                background: var(--color-surface);
                border-radius: 12px;
                width: 90%;
                max-width: 1000px;
                height: 80vh;
                display: flex;
                flex-direction: column;
            }
            
            .module-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--color-background);
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--color-text);
            }
            
            .module-body {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .module-tabs {
                display: flex;
                border-bottom: 1px solid var(--color-background);
            }
            
            .tab-btn {
                flex: 1;
                padding: 15px;
                background: none;
                border: none;
                cursor: pointer;
                color: var(--color-text-secondary);
                transition: all 0.2s ease;
            }
            
            .tab-btn.active {
                color: var(--color-primary);
                border-bottom: 2px solid var(--color-primary);
            }
            
            .tab-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .module-completion {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--color-surface);
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                z-index: 10002;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .celebration-content h2 {
                color: #22c55e;
                margin-bottom: 10px;
            }
            
            .continue-learning {
                background: var(--color-primary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize
window.PersonalizedLearningPaths = PersonalizedLearningPaths;
window.learningPaths = new PersonalizedLearningPaths();
