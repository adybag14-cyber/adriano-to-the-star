/**
 * Space Education System
 * Interactive tutorials and courses about exoplanets and astronomy
 */

class EducationSystem {
    constructor() {
        this.courses = [
            {
                id: 'exoplanets-101',
                title: 'Exoplanets 101',
                description: 'Introduction to exoplanets and how they are discovered',
                duration: '15 min',
                level: 'Beginner',
                lessons: [
                    {
                        title: 'What are Exoplanets?',
                        content: `
                            <h3>What are Exoplanets?</h3>
                            <p>Exoplanets, or extrasolar planets, are planets that orbit stars outside our solar system. 
                            The first confirmed exoplanet was discovered in 1992, and since then, thousands have been found.</p>
                            <p>Key characteristics:</p>
                            <ul>
                                <li>Orbit stars other than our Sun</li>
                                <li>Can be rocky, gas giants, or ice worlds</li>
                                <li>Range from smaller than Earth to larger than Jupiter</li>
                                <li>Some may be in the "habitable zone" where liquid water could exist</li>
                            </ul>
                        `,
                        quiz: {
                            question: 'What is an exoplanet?',
                            options: [
                                'A planet in our solar system',
                                'A planet orbiting a star outside our solar system',
                                'A type of star',
                                'A moon'
                            ],
                            correct: 1
                        }
                    },
                    {
                        title: 'Discovery Methods',
                        content: `
                            <h3>How We Discover Exoplanets</h3>
                            <p>Scientists use several methods to detect exoplanets:</p>
                            <ol>
                                <li><strong>Transit Method:</strong> Detects planets when they pass in front of their star, 
                                causing a slight dimming of the star's light.</li>
                                <li><strong>Radial Velocity:</strong> Measures the star's wobble caused by an orbiting planet's gravity.</li>
                                <li><strong>Direct Imaging:</strong> Takes pictures of planets directly (very difficult and rare).</li>
                                <li><strong>Gravitational Microlensing:</strong> Uses the bending of light by gravity to detect planets.</li>
                            </ol>
                            <p>The Kepler Space Telescope used the transit method to discover thousands of exoplanets!</p>
                        `,
                        quiz: {
                            question: 'Which method did the Kepler Space Telescope primarily use?',
                            options: [
                                'Radial Velocity',
                                'Direct Imaging',
                                'Transit Method',
                                'Gravitational Microlensing'
                            ],
                            correct: 2
                        }
                    },
                    {
                        title: 'Types of Exoplanets',
                        content: `
                            <h3>Types of Exoplanets</h3>
                            <p>Exoplanets come in many varieties:</p>
                            <ul>
                                <li><strong>Super-Earths:</strong> Larger than Earth but smaller than Neptune</li>
                                <li><strong>Hot Jupiters:</strong> Gas giants very close to their stars</li>
                                <li><strong>Ice Giants:</strong> Similar to Neptune and Uranus</li>
                                <li><strong>Terrestrial:</strong> Rocky planets like Earth, Venus, or Mars</li>
                                <li><strong>Rogue Planets:</strong> Planets not orbiting any star</li>
                            </ul>
                            <p>Some exoplanets have extreme conditions, like temperatures hot enough to melt metal or 
                            atmospheres of pure diamond!</p>
                        `
                    }
                ]
            },
            {
                id: 'planet-claiming',
                title: 'Planet Claiming Guide',
                description: 'Learn how to claim and manage your exoplanet claims',
                duration: '10 min',
                level: 'Beginner',
                lessons: [
                    {
                        title: 'How to Claim a Planet',
                        content: `
                            <h3>Claiming Your First Exoplanet</h3>
                            <p>Follow these steps to claim an exoplanet:</p>
                            <ol>
                                <li>Browse the <a href="database.html">Exoplanet Database</a> to find available planets</li>
                                <li>Click the "Claim Planet" button on any available planet</li>
                                <li>You'll receive a certificate of ownership</li>
                                <li>Track your claims in your dashboard</li>
                            </ol>
                            <p><strong>Tips:</strong></p>
                            <ul>
                                <li>Planets can only be claimed once per user</li>
                                <li>Each claim earns you reputation points</li>
                                <li>You can trade or sell your claims on the marketplace</li>
                            </ul>
                        `
                    },
                    {
                        title: 'Understanding Planet Data',
                        content: `
                            <h3>Reading Planet Information</h3>
                            <p>Each exoplanet has important data:</p>
                            <ul>
                                <li><strong>KEPID:</strong> Unique identifier from the Kepler mission</li>
                                <li><strong>Distance:</strong> How far the planet is from Earth (in light-years)</li>
                                <li><strong>Radius:</strong> Size compared to Earth</li>
                                <li><strong>Mass:</strong> Weight of the planet</li>
                                <li><strong>Temperature:</strong> Surface or equilibrium temperature</li>
                                <li><strong>Orbital Period:</strong> How long a year lasts on that planet</li>
                            </ul>
                            <p>Understanding these values helps you choose interesting planets to claim!</p>
                        `
                    }
                ]
            },
            {
                id: 'marketplace-guide',
                title: 'Marketplace Tutorial',
                description: 'Buy, sell, and trade exoplanet claims',
                duration: '12 min',
                level: 'Intermediate',
                lessons: [
                    {
                        title: 'Creating Listings',
                        content: `
                            <h3>How to Create a Marketplace Listing</h3>
                            <p>To sell or trade your planet claims:</p>
                            <ol>
                                <li>Go to the <a href="marketplace.html">Marketplace</a></li>
                                <li>Click "Create Listing"</li>
                                <li>Select a planet from your claims</li>
                                <li>Choose listing type: Sale, Trade, or Auction</li>
                                <li>Set price (for sales) or trade description</li>
                                <li>Publish your listing!</li>
                            </ol>
                        `
                    },
                    {
                        title: 'Making Purchases',
                        content: `
                            <h3>Buying Planets</h3>
                            <p>To purchase a planet:</p>
                            <ol>
                                <li>Browse available listings</li>
                                <li>Review planet details and seller information</li>
                                <li>Click "Buy Now" or "Place Bid"</li>
                                <li>Complete the transaction</li>
                                <li>The planet ownership transfers to you</li>
                            </ol>
                            <p><strong>Note:</strong> Transactions are final. Make sure you want the planet before purchasing!</p>
                        `
                    }
                ]
            }
        ];
        this.progress = JSON.parse(localStorage.getItem('education_progress') || '{}');
        this.currentCourse = null;
        this.currentLesson = 0;
    }

    render() {
        const container = document.getElementById('education-container');
        if (!container) return;

        container.innerHTML = `
            <div class="education-dashboard">
                <div class="education-header">
                    <h2>📚 Space Education Courses</h2>
                    <p>Learn about exoplanets, astronomy, and space exploration at your own pace</p>
                </div>

                <div class="courses-grid">
                    ${this.courses.map(course => {
            const progress = this.progress[course.id] || 0;
            const totalLessons = course.lessons.length;
            const completedLessons = Math.floor((progress / 100) * totalLessons);

            return `
                            <div class="course-card" data-course-id="${course.id}">
                                <div class="course-header">
                                    <h3>${course.title}</h3>
                                    <span class="course-level ${course.level.toLowerCase()}">${course.level}</span>
                                </div>
                                <p class="course-description">${course.description}</p>
                                <div class="course-meta">
                                    <span>⏱️ ${course.duration}</span>
                                    <span>📖 ${totalLessons} lessons</span>
                                </div>
                                ${progress > 0 ? `
                                    <div class="course-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <span class="progress-text">${completedLessons}/${totalLessons} lessons completed</span>
                                    </div>
                                ` : ''}
                                <button class="start-course-btn" onclick="educationSystem.startCourse('${course.id}')">
                                    ${progress > 0 ? 'Continue Course' : 'Start Course'}
                                </button>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    startCourse(courseId) {
        console.log('Starting course:', courseId);
        // Logic to start course
        this.currentCourse = this.courses.find(c => c.id === courseId);
        this.renderCourse();
    }

    /**
     * Render current course
     */
    renderCourse() {
        const container = document.getElementById('education-container');
        if (!container || !this.currentCourse) return;

        const courseId = this.currentCourse.id;
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        this.currentLesson = this.progress[courseId] ?
            Math.floor((this.progress[courseId] / 100) * course.lessons.length) : 0;
        this.render();
    }
}

// Initialize
let educationSystemInstance = null;
function initEducation() {
    educationSystemInstance = new EducationSystem();
    educationSystemInstance.render();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEducation);
} else {
    initEducation();
}

// Make available globally
window.EducationSystem = EducationSystem;
window.educationSystem = educationSystemInstance;

