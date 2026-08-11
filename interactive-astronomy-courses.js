/**
 * Interactive Astronomy Courses
 * Educational astronomy course system
 * 
 * Features:
 * - Course modules
 * - Progress tracking
 * - Quizzes
 * - Certificates
 */

class InteractiveAstronomyCourses {
    constructor() {
        this.courses = [];
        this.progress = new Map();
        this.init();
    }

    init() {
        this.loadCourses();
        this.createUI();
        console.log('📚 Interactive Astronomy Courses initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_er_ac_ti_ve_as_tr_on_om_yc_ou_rs_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadCourses() {
        this.courses = [
            {
                id: 'intro-astronomy',
                title: 'Introduction to Astronomy',
                modules: ['Stars', 'Planets', 'Galaxies'],
                duration: '4 hours'
            },
            {
                id: 'exoplanets',
                title: 'Exoplanet Discovery',
                modules: ['Detection Methods', 'Habitability', 'Kepler Mission'],
                duration: '3 hours'
            }
        ];
    }

    createUI() {
        const button = document.createElement('button');
        button.id = 'courses-toggle';
        button.textContent = '📚 Courses';
        button.style.cssText = `
            position: fixed;
            bottom: 500px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9993;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;

        button.addEventListener('click', () => this.showCourses());
        document.body.appendChild(button);
    }

    showCourses() {
        const modal = document.createElement('div');
        modal.className = 'courses-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            ">
                <h2 style="color: #ba944f; margin: 0 0 20px 0;">Astronomy Courses</h2>
                <div>
                    ${this.courses.map(course => `
                        <div style="
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            border-radius: 8px;
                            padding: 20px;
                            margin-bottom: 15px;
                        ">
                            <h3 style="color: #ba944f; margin: 0 0 10px 0;">${course.title}</h3>
                            <p style="margin: 5px 0;">Duration: ${course.duration}</p>
                            <p style="margin: 5px 0;">Modules: ${course.modules.join(', ')}</p>
                            <button onclick="window.interactiveAstronomyCourses.startCourse('${course.id}')" style="
                                margin-top: 10px;
                                padding: 8px 15px;
                                background: rgba(186, 148, 79, 0.3);
                                border: 1px solid #ba944f;
                                color: white;
                                border-radius: 6px;
                                cursor: pointer;
                            ">Start Course</button>
                        </div>
                    `).join('')}
                </div>
                <button id="close-courses" style="
                    width: 100%;
                    margin-top: 20px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;

        modal.querySelector('#close-courses').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    startCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            console.log(`Starting course: ${course.title}`);
            // Logic to start the course (Mock for now, upgrading to live soon)
            // Remove existing modal if any
            const existing = document.getElementById('course-player-modal');
            if (existing) existing.remove();

            const playerModal = document.createElement('div');
            playerModal.id = 'course-player-modal';
            playerModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 11000;
                display: flex;
                flex-direction: column;
                color: #fff;
                font-family: 'Raleway', sans-serif;
            `;

            playerModal.innerHTML = `
                <div style="padding: 20px; border-bottom: 1px solid #ba944f; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #ba944f;">${course.title}</h2>
                    <button id="close-player" style="background: transparent; border: none; color: #fff; font-size: 24px; cursor: pointer;">×</button>
                </div>
                <div style="flex: 1; padding: 40px; overflow-y: auto;">
                    <h1 style="text-align: center;">${course.title}</h1>
                    <div id="course-content-container"></div>
                </div>
            `;
            document.body.appendChild(playerModal);

            const contentContainer = document.getElementById('course-content-container');
            if (contentContainer) {
                contentContainer.innerHTML = this.getCourseContentHtml(course);
            }

            document.getElementById('close-player').addEventListener('click', () => {
                playerModal.remove();
            });

            // Trigger "Live" fetch if it's the Intro course
            if (courseId === 'intro-astronomy') {
                this.fetchLiveAPOD();
            }
        }
    }

    getYouTubeEmbed(videoId, title) {
        if (!videoId) return '';
        const safeTitle = String(title || 'Video').replace(/"/g, '&quot;');
        const src = `https://www.youtube.com/embed/${videoId}`;
        return `
            <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; border: 1px solid rgba(186, 148, 79, 0.35); margin: 16px 0;">
                <iframe src="${src}" title="${safeTitle}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
    }

    getCourseContentHtml(course) {
        if (!course || !course.id) {
            return '<p style="opacity: 0.85;">Course content unavailable.</p>';
        }

        if (course.id === 'intro-astronomy') {
            const modulesHtml = Array.isArray(course.modules)
                ? course.modules.map(m => `<li>${m}</li>`).join('')
                : '';

            return `
                <div style="max-width: 900px; margin: 0 auto; text-align: left;">
                    <h2 style="color: #ba944f; margin-top: 0;">Course Overview</h2>
                    <p style="opacity: 0.9; line-height: 1.6;">A practical introduction to how astronomers study stars, planets, and galaxies — plus a daily live lesson from NASA’s Astronomy Picture of the Day.</p>

                    <h3 style="color: #ba944f;">Modules</h3>
                    <ul style="line-height: 1.8; margin-top: 0;">
                        ${modulesHtml}
                    </ul>

                    ${this.getYouTubeEmbed('libKVRa01L8', 'Earth From Space')}

                    <div id="apod-live-content" style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(186,148,79,0.25); border-radius: 12px;">
                        <h3 style="margin: 0 0 8px 0; color: #ba944f;">Today's Astronomy Lesson</h3>
                        <p style="opacity: 0.85; margin: 0;">Loading NASA Astronomy Picture of the Day…</p>
                    </div>
                </div>
            `;
        }

        if (course.id === 'exoplanets') {
            return `
                <div style="max-width: 900px; margin: 0 auto; text-align: left;">
                    <h2 style="color: #ba944f; margin-top: 0;">Course Overview</h2>
                    <p style="opacity: 0.9; line-height: 1.6;">Learn how scientists find planets around other stars, interpret transit signals, and connect discoveries to the Kepler catalog you browse on this page.</p>

                    <h3 style="color: #ba944f;">Key Topics</h3>
                    <ul style="line-height: 1.8; margin-top: 0;">
                        <li>What exoplanets are and why they matter</li>
                        <li>Transit method and light curves</li>
                        <li>Kepler mission highlights</li>
                        <li>Habitability basics and the “Goldilocks zone”</li>
                    </ul>

                    ${this.getYouTubeEmbed('0ZOhJe_7GrE', 'What Is an Exoplanet? (NASA)')}
                    ${this.getYouTubeEmbed('xNeRqbw18Jk', 'Detecting Exoplanets with the Transit Method')}
                    ${this.getYouTubeEmbed('cwDkPKPi1mY', 'Reflections from NASA\'s Kepler Mission')}

                    <div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(186,148,79,0.25); border-radius: 12px;">
                        <h3 style="margin: 0 0 8px 0; color: #ba944f;">Try it in the Database</h3>
                        <p style="opacity: 0.85; margin: 0;">Close this course, then use the filters/search above to compare Kepler objects by radius, period, and discovery method.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div style="max-width: 900px; margin: 0 auto; text-align: left;">
                <h2 style="color: #ba944f; margin-top: 0;">Course Overview</h2>
                <p style="opacity: 0.9; line-height: 1.6;">${course.title}</p>
            </div>
        `;
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[interactive-astronomy-courses] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[interactive-astronomy-courses] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[interactive-astronomy-courses] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async fetchLiveAPOD() {
        const container = document.getElementById('apod-live-content') || document.getElementById('course-content-container');
        if (!container) return;

        try {
            const data = await this.fetchJSON('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
            if (!data) throw new Error('No data received from NASA APOD');

            const title = data?.title || 'Astronomy Picture of the Day';
            const explanation = data?.explanation || '';
            const mediaType = data?.media_type;
            const mediaUrl = data?.url;

            let mediaHtml = '';
            if (mediaType === 'image' && mediaUrl) {
                mediaHtml = `<img src="${mediaUrl}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" alt="${title}">`;
            } else if (mediaType === 'video' && mediaUrl) {
                mediaHtml = `
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; border: 1px solid rgba(186, 148, 79, 0.35); margin: 16px 0;">
                        <iframe src="${mediaUrl}" title="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                `;
            }

            container.innerHTML = `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <h3>Today's Astronomy Lesson (Live from NASA)</h3>
                    <h4>${title}</h4>
                    ${mediaHtml}
                    <p style="text-align: left; line-height: 1.6;">${explanation || 'No explanation available right now.'}</p>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `
                <div style="background: rgba(255, 255, 255, 0.08); padding: 16px; border-radius: 10px; margin-top: 20px; border: 1px solid rgba(186, 148, 79, 0.25);">
                    <h3 style="margin-top: 0;">Today's Astronomy Lesson</h3>
                    <p style="opacity: 0.85; margin: 0;">Unable to load the live NASA APOD right now. (${e?.message || e})</p>
                </div>
            `;
        }
    }
}

// Initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.interactiveAstronomyCourses = new InteractiveAstronomyCourses();
        });
    } else {
        window.interactiveAstronomyCourses = new InteractiveAstronomyCourses();
    }
}
