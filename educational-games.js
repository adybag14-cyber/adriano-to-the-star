/**
 * Educational Games
 * Space-themed educational games for learning
 */

class EducationalGames {
    constructor() {
        this.games = [];
        this.scores = this.loadScores();
        this.init();
    }

    init() {
        this.loadGames();
        const isEducationViewer = document.getElementById('viewer-container') !== null;
        if (!isEducationViewer) {
            this.createGamesWidget();
        }
        console.log('🎮 Educational Games initialized');
    }

    createGamesWidget() {
        // Check if already exists
        const existing = document.getElementById('educational-games-widget');
        if (existing) {
            existing.style.display = 'block';
            existing.scrollIntoView({ behavior: 'smooth' });
            if (Array.isArray(this.games) && this.games.length > 0) {
                this.renderGames();
            }
            return;
        }

        const container = document.createElement('div');
        container.id = 'educational-games-widget';
        container.className = 'educational-games-widget';

        // Modal style for Education 3D page (which has overflow hidden)
        const isEducationViewer = document.getElementById('viewer-container') !== null;

        if (isEducationViewer) {
            container.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 1000px;
                max-height: 90vh;
                overflow-y: auto;
                background: rgba(16, 16, 20, 0.95);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 2rem;
                z-index: 10000;
                box-shadow: 0 0 50px rgba(0,0,0,0.8);
                backdrop-filter: blur(10px);
            `;
        } else {
            container.style.cssText = `
                padding: 2rem;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 10px;
                margin: 2rem 0;
                color: white;
            `;
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="color: #ba944f; margin: 0; font-family: 'Orbitron', sans-serif;">🎮 Educational Games</h2>
                ${isEducationViewer ? '<button onclick="document.getElementById(\'educational-games-widget\').style.display=\'none\'" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">&times;</button>' : ''}
            </div>
            <div id="games-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                <div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">
                    Loading games...
                </div>
            </div>
        `;

        if (isEducationViewer) {
            document.body.appendChild(container);
        } else {
            const main = document.querySelector('main') || document.body;
            const simulationsWidget = document.getElementById('nasa-simulations-widget');
            if (simulationsWidget) {
                simulationsWidget.insertAdjacentElement('afterend', container);
            } else {
                const firstSection = main.querySelector('section');
                if (firstSection) {
                    firstSection.insertAdjacentElement('afterend', container);
                } else {
                    main.appendChild(container);
                }
            }
        }

        if (Array.isArray(this.games) && this.games.length > 0) {
            this.renderGames();
        }
    }

    loadGames() {
        this.games = [
            {
                id: 'planet-quiz',
                title: 'Planet Quiz Challenge',
                description: 'Test your knowledge of exoplanets with interactive quizzes.',
                type: 'Quiz',
                difficulty: 'Beginner',
                highScore: this.scores['planet-quiz'] || 0
            },
            {
                id: 'star-system-builder',
                title: 'Star System Builder',
                description: 'Build your own star system and learn about orbital mechanics.',
                type: 'Simulation',
                difficulty: 'Intermediate',
                highScore: this.scores['star-system-builder'] || 0
            },
            {
                id: 'planet-hunter',
                title: 'Planet Hunter',
                description: 'Discover exoplanets by analyzing light curves and data patterns.',
                type: 'Puzzle',
                difficulty: 'Advanced',
                highScore: this.scores['planet-hunter'] || 0
            },
            {
                id: 'space-explorer',
                title: 'Space Explorer',
                description: 'Navigate through space and learn about different celestial objects.',
                type: 'Adventure',
                difficulty: 'Beginner',
                highScore: this.scores['space-explorer'] || 0
            },
            {
                id: 'exoplanet-pioneer',
                title: 'Exoplanet Pioneer',
                description: 'Manage a colony on a remote exoplanet. Build, survive, and thrive.',
                type: 'Strategy',
                difficulty: 'Expert',
                highScore: this.scores['exoplanet-pioneer'] || 0
            }
        ];
        this.renderGames();
    }

    renderGames() {
        const container = document.getElementById('games-content');
        if (!container) return;

        container.innerHTML = this.games.map(game => {
            const difficultyColors = {
                'Beginner': 'rgba(74,222,128,0.2)',
                'Intermediate': 'rgba(251,191,36,0.2)',
                'Advanced': 'rgba(239,68,68,0.2)'
            };
            const difficultyTextColors = {
                'Beginner': '#4ade80',
                'Intermediate': '#fbbf24',
                'Advanced': '#ef4444'
            };

            return `
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1.5rem; border: 1px solid rgba(186,148,79,0.3); cursor: pointer;" 
                     onclick="window.educationalGames.startGame('${game.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <h3 style="color: #ba944f; margin: 0;">${game.title}</h3>
                        <span style="background: ${difficultyColors[game.difficulty]}; 
                                     color: ${difficultyTextColors[game.difficulty]}; 
                                     padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem;">
                            ${game.difficulty}
                        </span>
                    </div>
                    <p style="color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 1rem;">${game.description}</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 1rem;">
                        <span>Type: ${game.type}</span>
                        ${game.highScore > 0 ? `<span>High Score: ${game.highScore}</span>` : ''}
                    </div>
                    <button style="width: 100%; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.75rem; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        Play Game
                    </button>
                </div>
            `;
        }).join('');
    }

    startGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;
        this.showGameModal(game);
    }

    showGameModal(game) {
        // Remove existing if any
        const existing = document.getElementById('game-modal');
        if (existing) existing.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'game-modal';
        // Allow clicking outside to close? Maybe not if we want it draggable/interactive.
        // Let's make it a pointer-events-none overlay that darkens, but the modal itself accepts events.
        // Actually, for a game interaction, usually we want a modal state.
        // The user wants it movable.

        modalOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            pointer-events: auto; /* Catch clicks */
        `;

        // The dragging container
        const modalContent = document.createElement('div');
        modalContent.id = 'game-modal-content';
        modalContent.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(16, 16, 20, 0.95);
            border: 2px solid rgba(186,148,79,0.5);
            border-radius: 10px;
            padding: 0; /* Padding moved to inner */
            width: 80vw;
            height: 80vh;
            max-width: 1200px;
            max-height: 900px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
            backdrop-filter: blur(15px);
        `;

        modalContent.innerHTML = `
            <div id="game-modal-header" style="
                padding: 1rem 1.5rem;
                background: rgba(255,255,255,0.05);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: grab;
                user-select: none;
            ">
                <h2 style="color: #ba944f; margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.2rem;">${game.title}</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 0.8rem; color: #888;">Example: Drag Header to Move</span>
                    <button onclick="document.getElementById('game-modal').remove()" 
                            style="background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; line-height: 1;">×</button>
                </div>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 1.5rem; position: relative; display: flex; flex-direction: column;">
                <div id="game-container" style="
                    flex: 1;
                    width: 100%;
                    background: #000;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    border: 1px solid #333;
                ">
                    <!-- Pre-Game Screen -->
                    <div id="pre-game" style="text-align: center; padding: 2rem;">
                        <p style="color: rgba(255,255,255,0.8); font-size: 1.2rem; margin-bottom: 2rem;">${game.description}</p>
                        ${game.highScore > 0 ? `<p style="color: #4ade80; margin-bottom: 2rem;">High Score: ${game.highScore}</p>` : ''}
                        <button onclick="window.educationalGames.launchLogic('${game.id}')" 
                                style="font-size: 1.2rem; background: #ba944f; color: black; border: none; padding: 1rem 3rem; border-radius: 5px; cursor: pointer; font-weight: bold; font-family: 'Orbitron';">
                            START MISSION
                        </button>
                    </div>
                </div>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // --- Draggable Logic ---
        const header = modalContent.querySelector('#game-modal-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        const xOffset = 0;
        const yOffset = 0;

        // Reset transform to work with offsets
        // We need to handle the initial centering 'translate(-50%, -50%)'
        // Strategy: When drag starts, calculate current pixel position, remove transform, set left/top explicitly.

        header.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);

        function dragStart(e) {
            // If we are currently centered via transform, lock in the position
            const rect = modalContent.getBoundingClientRect();
            // Remove transform centering
            modalContent.style.transform = 'none';
            modalContent.style.left = rect.left + 'px';
            modalContent.style.top = rect.top + 'px';
            modalContent.style.width = rect.width + 'px';
            modalContent.style.height = rect.height + 'px';

            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                header.style.cursor = 'grabbing';
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            header.style.cursor = 'grab';
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                modalContent.style.left = currentX + 'px';
                modalContent.style.top = currentY + 'px';
            }
        }
    }

    launchLogic(gameId) {
        const container = document.getElementById('game-container');
        container.innerHTML = ''; // Clear pre-game screen

        switch (gameId) {
            case 'planet-quiz':
                new PlanetQuiz(container, (score) => this.submitScore(gameId, score));
                break;
            case 'planet-hunter':
                new PlanetHunter(container, (score) => this.submitScore(gameId, score));
                break;
            case 'space-explorer':
                new SpaceExplorer(container, (score) => this.submitScore(gameId, score));
                break;
            case 'star-system-builder':
                if (window.StarSystemBuilder) {
                    new StarSystemBuilder(container); // Assumes it can take an element or ID
                } else {
                    container.innerHTML = '<p style="color:red">Error: Star System Builder module not loaded.</p>';
                }
                break;
            case 'exoplanet-pioneer':
                window.location.href = 'exoplanet-pioneer.html';
                break;
            default:
                container.innerHTML = '<p>Game module not found.</p>';
        }
    }

    submitScore(gameId, score) {
        const currentHigh = this.scores[gameId] || 0;
        if (score > currentHigh) {
            this.scores[gameId] = score;
            this.saveScores();
            // Confetti effect or success message
            // alert(`New High Score: ${score}!`);
        }
        // Refresh menu
        this.loadGames();
    }

    loadScores() {
        const saved = localStorage.getItem('educational-games-scores');
        return saved ? JSON.parse(saved) : {};
    }

    saveScores() {
        localStorage.setItem('educational-games-scores', JSON.stringify(this.scores));
    }
}

// --- GAME CLASSES ---

class PlanetQuiz {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.score = 0;
        this.questionIndex = 0;

        this.questions = [
            { q: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars", "Earth"], a: 1 },
            { q: "What is the largest planet in our solar system?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], a: 1 },
            { q: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], a: 0 },
            { q: "What is the term for a planet outside our solar system?", options: ["Exoplanet", "Protoplanet", "Dwarf Planet", "Rogue Planet"], a: 0 },
            { q: "Which space telescope discovered thousands of exoplanets?", options: ["Hubble", "James Webb", "Kepler", "Spitzer"], a: 2 }
        ];

        this.render();
    }

    render() {
        if (this.questionIndex >= this.questions.length) {
            this.endGame();
            return;
        }

        const q = this.questions[this.questionIndex];

        this.container.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 2rem; box-sizing: border-box; color: white;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2rem;">
                    <span>Question ${this.questionIndex + 1}/${this.questions.length}</span>
                    <span>Score: ${this.score}</span>
                </div>
                <h3 style="font-size: 1.5rem; margin-bottom: 2rem; text-align: center;">${q.q}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    ${q.options.map((opt, i) => `
                        <button class="quiz-btn" data-idx="${i}" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: white; padding: 1.5rem; cursor: pointer; border-radius: 8px; font-size: 1rem; transition: background 0.2s;">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this.container.querySelectorAll('.quiz-btn').forEach(btn => {
            btn.onclick = (e) => this.handleAnswer(parseInt(e.target.dataset.idx));
            btn.onmouseover = (e) => e.target.style.background = 'rgba(186,148,79,0.3)';
            btn.onmouseout = (e) => e.target.style.background = 'rgba(255,255,255,0.1)';
        });
    }

    handleAnswer(idx) {
        if (idx === this.questions[this.questionIndex].a) {
            this.score += 100;
        }
        this.questionIndex++;
        this.render();
    }

    endGame() {
        this.container.innerHTML = `
            <div style="text-align: center; color: white;">
                <h2>Quiz Complete!</h2>
                <p style="font-size: 2rem; color: #ba944f; margin: 2rem 0;">Score: ${this.score}</p>
                <button id="close-quiz" style="background: #ba944f; color: black; border: none; padding: 1rem 2rem; cursor: pointer; border-radius: 5px;">Return to Menu</button>
            </div>
        `;
        this.onComplete(this.score);
        document.getElementById('close-quiz').onclick = () => {
            document.getElementById('game-modal').remove();
        };
    }
}

class PlanetHunter {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.score = 0;
        this.isPlaying = true;
        this.canvas = document.createElement('canvas');
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Game State
        this.stars = [];
        this.createLevel();
        this.transitActive = false;
        this.transitFrame = 0;
        this.btnPressed = false;

        // Loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);

        // Input
        this.addControls();
    }

    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    createLevel() {
        // We simulate a light curve scroll
        this.dataPoints = new Array(100).fill(0).map(() => Math.random() * 0.1);
        this.transitChance = 0.005;
    }

    addControls() {
        const btn = document.createElement('button');
        btn.textContent = "DETECT TRANSIT";
        btn.style.cssText = `position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); padding: 1rem 2rem; font-size: 1.2rem; background: #ef4444; color: white; border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);`;
        this.container.appendChild(btn);

        btn.onmousedown = () => {
            this.checkTransit();
            btn.style.transform = 'translateX(-50%) scale(0.95)';
        };
        btn.onmouseup = () => btn.style.transform = 'translateX(-50%) scale(1)';
    }

    checkTransit() {
        if (this.transitActive) {
            this.score += 500;
            this.showFeedback("TRANSIT DETECTED!", "#4ade80");
            this.transitActive = false; // Transit discovered
        } else {
            this.score = Math.max(0, this.score - 50);
            this.showFeedback("FALSE POSITIVE", "#ef4444");
        }
    }

    showFeedback(text, color) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); color: ${color}; font-size: 2rem; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5); pointer-events: none; animation: floatUp 1s forwards;`;
        this.container.appendChild(el);
        setTimeout(() => el.remove(), 1000);

        // Style animation for this
        if (!document.getElementById('anim-style')) {
            const s = document.createElement('style');
            s.id = 'anim-style';
            s.innerHTML = `@keyframes floatUp { 0% { opacity: 1; transform: translate(-50%, -50%); } 100% { opacity: 0; transform: translate(-50%, -100%); } }`;
            document.head.appendChild(s);
        }
    }

    loop() {
        if (!this.container.isConnected) return; // Stop if modal closed

        // Update Logic
        this.dataPoints.shift();

        // Randomly start transit
        if (!this.transitActive && Math.random() < this.transitChance) {
            this.transitActive = true;
            this.transitLength = 40;
            this.transitCounter = 0;
        }

        let nextVal = Math.random() * 0.1; // Base noise

        if (this.transitActive) {
            nextVal -= Math.sin((this.transitCounter / this.transitLength) * Math.PI) * 0.6; // Dip
            this.transitCounter++;
            if (this.transitCounter > this.transitLength) {
                this.transitActive = false;
            }
        }

        this.dataPoints.push(nextVal);

        // Draw
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < w; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, h); }
        for (let i = 0; i < h; i += 50) { ctx.moveTo(0, i); ctx.lineTo(w, i); }
        ctx.stroke();

        // Light Curve
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < this.dataPoints.length; i++) {
            const x = (i / (this.dataPoints.length - 1)) * w;
            const y = (h / 2) - (this.dataPoints[i] * (h / 4));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // UI
        ctx.fillStyle = 'white';
        ctx.font = '20px monospace';
        ctx.fillText(`SCORE: ${this.score}`, 20, 40);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText(`FLUX: ${(1 + this.dataPoints[this.dataPoints.length - 1]).toFixed(4)}`, 20, 65);

        requestAnimationFrame(this.loop);
    }
}

class SpaceExplorer {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.score = 0;
        this.canvas = document.createElement('canvas');
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();

        this.ship = { x: 50, y: 0, v: 0 };
        this.ship.y = this.canvas.height / 2;

        this.obstacles = [];
        this.stars = [];
        this.speed = 4;
        this.gameOver = false;

        // Inputs
        this.keys = { up: false, down: false };
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowUp') this.keys.up = true;
            if (e.key === 'ArrowDown') this.keys.down = true;
        });
        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowUp') this.keys.up = false;
            if (e.key === 'ArrowDown') this.keys.down = false;
        });

        // Loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);

        // Instructions
        this.showFeedback("USE ARROW KEYS", "#fff");
    }

    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    loop() {
        if (!this.container.isConnected || this.gameOver) return;

        const h = this.canvas.height;
        const w = this.canvas.width;

        // Physics
        if (this.keys.up) this.ship.y -= 5;
        if (this.keys.down) this.ship.y += 5;
        this.ship.y = Math.max(20, Math.min(h - 20, this.ship.y));

        // Spawn Obstacles (Asteroids)
        if (Math.random() < 0.02) {
            this.obstacles.push({
                x: w,
                y: Math.random() * h,
                r: 15 + Math.random() * 20,
                type: Math.random() > 0.8 ? 'fuel' : 'rock'
            });
        }

        // Logic
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.x -= this.speed;

            // Collision
            const dx = o.x - this.ship.x;
            const dy = o.y - this.ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < o.r + 15) { // 15 is ship radius
                if (o.type === 'rock') {
                    this.doGameOver();
                } else {
                    this.score += 100;
                    this.speed += 0.1;
                    this.obstacles.splice(i, 1);
                }
            }

            if (o.x < -50) {
                this.score += 10; // Pass asteroid
                this.obstacles.splice(i, 1);
            }
        }

        // Drawing
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, w, h);

        // Starfield
        this.ctx.fillStyle = 'white';
        if (Math.random() < 0.5) {
            this.ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }

        // Ship
        this.ctx.fillStyle = '#60a5fa';
        this.ctx.beginPath();
        this.ctx.moveTo(this.ship.x + 15, this.ship.y);
        this.ctx.lineTo(this.ship.x - 10, this.ship.y - 10);
        this.ctx.lineTo(this.ship.x - 10, this.ship.y + 10);
        this.ctx.fill();

        // Obstacles
        for (const o of this.obstacles) {
            this.ctx.fillStyle = o.type === 'rock' ? '#888' : '#facc15';
            this.ctx.beginPath();
            this.ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // HUD
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`DISTANCE: ${this.score}`, 20, 40);

        requestAnimationFrame(this.loop);
    }

    doGameOver() {
        this.gameOver = true;
        this.onComplete(this.score);
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'red';
        this.ctx.font = '40px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("CRITICAL FAILURE", this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px monospace';
        this.ctx.fillText("Click 'X' to return", this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    showFeedback(text, color) {
        // ... (Similar to PlanetHunter)
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.educationalGames = new EducationalGames();
    });
} else {
    window.educationalGames = new EducationalGames();
}
