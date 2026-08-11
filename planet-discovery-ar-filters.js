/**
 * Planet Discovery AR Filters for Social Media
 * Creates AR filters and effects for sharing planet discoveries on social media
 */

class PlanetDiscoveryARFilters {
    constructor() {
        this.filters = [];
        this.currentFilter = null;
        this.videoStream = null;
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.loadFilters();
        console.log('📸 AR Filters initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ar_fi_lt_er_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadFilters() {
        this.filters = [
            {
                id: 'planet-overlay',
                name: 'Planet Overlay',
                description: 'Add a 3D planet overlay to your photos',
                icon: '🪐',
                type: 'overlay'
            },
            {
                id: 'cosmic-background',
                name: 'Cosmic Background',
                description: 'Replace background with space scene',
                icon: '🌌',
                type: 'background'
            },
            {
                id: 'star-field',
                name: 'Star Field',
                description: 'Add animated star field effect',
                icon: '⭐',
                type: 'effect'
            },
            {
                id: 'nebula-effect',
                name: 'Nebula Effect',
                description: 'Add colorful nebula effects',
                icon: '🌠',
                type: 'effect'
            },
            {
                id: 'planet-frame',
                name: 'Planet Frame',
                description: 'Add planet-themed frame border',
                icon: '🖼️',
                type: 'frame'
            }
        ];
    }

    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            this.videoStream = stream;
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            return false;
        }
    }

    renderFilters(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="ar-filters-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📸 AR Filters & Effects</h3>
                
                <div class="filters-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        `;

        this.filters.forEach(filter => {
            html += this.createFilterCard(filter);
        });

        html += `
                </div>
                
                <div id="ar-preview-container" style="display: none; margin-top: 2rem;">
                    <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="color: #ba944f;">AR Preview</h4>
                            <button id="close-ar-preview" style="background: transparent; border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                                ✕ Close
                            </button>
                        </div>
                        <div id="ar-canvas-container" style="position: relative; width: 100%; max-width: 640px; margin: 0 auto;">
                            <video id="ar-video" autoplay playsinline style="width: 100%; border-radius: 10px; display: none;"></video>
                            <canvas id="ar-canvas" style="width: 100%; border-radius: 10px; display: none;"></canvas>
                            <div id="ar-placeholder" style="text-align: center; padding: 4rem; background: rgba(0, 0, 0, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7);">
                                <div style="font-size: 4rem; margin-bottom: 1rem;">📷</div>
                                <p>Click "Start Camera" to preview AR filters</p>
                                <button id="start-camera-btn" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                                    📷 Start Camera
                                </button>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
                            <button id="capture-photo-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                                📸 Capture Photo
                            </button>
                            <button id="share-ar-btn" style="padding: 0.75rem 1.5rem; background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); border-radius: 10px; color: #3b82f6; cursor: pointer; font-weight: 600;">
                                📱 Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Setup event listeners
        this.filters.forEach(filter => {
            const card = document.querySelector(`[data-filter-id="${filter.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.applyFilter(filter.id);
                });
            }
        });

        document.getElementById('start-camera-btn')?.addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('close-ar-preview')?.addEventListener('click', () => {
            this.closePreview();
        });

        document.getElementById('capture-photo-btn')?.addEventListener('click', () => {
            this.capturePhoto();
        });

        document.getElementById('share-ar-btn')?.addEventListener('click', () => {
            this.shareAR();
        });
    }

    createFilterCard(filter) {
        return `
            <div class="filter-card" data-filter-id="${filter.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.3s ease;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${filter.icon}</div>
                <h4 style="color: #ba944f; margin-bottom: 0.5rem; font-size: 1rem;">${filter.name}</h4>
                <p style="opacity: 0.7; font-size: 0.85rem;">${filter.description}</p>
            </div>
        `;
    }

    async applyFilter(filterId) {
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter) {
            console.error(`Filter ${filterId} not found`);
            return;
        }

        this.currentFilter = filter;

        // Show preview container
        const previewContainer = document.getElementById('ar-preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'block';
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        }

        // Start camera if not already started
        if (!this.videoStream) {
            await this.startCamera();
        }

        // Apply filter effect
        this.renderFilterEffect(filter);
    }

    async startCamera() {
        const success = await this.initializeCamera();
        if (!success) {
            alert('Unable to access camera. Please check permissions.');
            return;
        }

        const video = document.getElementById('ar-video');
        const canvas = document.getElementById('ar-canvas');
        const placeholder = document.getElementById('ar-placeholder');

        if (video && this.videoStream) {
            video.srcObject = this.videoStream;
            video.style.display = 'block';
            placeholder.style.display = 'none';

            // Setup canvas
            if (canvas) {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                canvas.style.display = 'block';
                video.style.display = 'none';

                // Start rendering loop
                this.startRenderingLoop();
            }
        }
    }

    startRenderingLoop() {
        const video = document.getElementById('ar-video');
        const canvas = document.getElementById('ar-canvas');

        const render = () => {
            if (!video || !canvas || !this.ctx || !this.currentFilter) return;

            // Draw video frame to canvas
            this.ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Apply filter effect
            this.applyFilterEffect(this.currentFilter);

            requestAnimationFrame(render);
        };

        render();
    }

    applyFilterEffect(filter) {
        if (!this.ctx || !this.canvas) return;

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        switch (filter.id) {
            case 'planet-overlay':
                this.drawPlanetOverlay();
                break;
            case 'cosmic-background':
                this.applyCosmicBackground(imageData, data);
                break;
            case 'star-field':
                this.drawStarField();
                break;
            case 'nebula-effect':
                this.applyNebulaEffect(imageData, data);
                break;
            case 'planet-frame':
                this.drawPlanetFrame();
                break;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    drawPlanetOverlay() {
        // Draw a planet overlay in the corner
        const planetSize = 100;
        const x = this.canvas.width - planetSize - 20;
        const y = 20;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x + planetSize / 2, y + planetSize / 2, planetSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(186, 148, 79, 0.7)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ba944f';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.restore();
    }

    applyCosmicBackground(imageData, data) {
        // Simple background replacement (would need ML model for real implementation)
        for (let i = 0; i < data.length; i += 4) {
            // Darken non-face areas (simplified)
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness < 100) {
                data[i] = Math.min(255, data[i] + 20);     // R
                data[i + 1] = Math.min(255, data[i + 1] + 10); // G
                data[i + 2] = Math.min(255, data[i + 2] + 30); // B
            }
        }
    }

    drawStarField() {
        // Draw animated stars
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 3;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    applyNebulaEffect(imageData, data) {
        // Add colorful nebula-like effects
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.1);     // Enhance red
            data[i + 1] = Math.min(255, data[i + 1] * 0.9); // Reduce green
            data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Enhance blue
        }
    }

    drawPlanetFrame() {
        // Draw planet-themed frame border
        const frameWidth = 20;
        this.ctx.strokeStyle = '#ba944f';
        this.ctx.lineWidth = frameWidth;
        this.ctx.strokeRect(frameWidth / 2, frameWidth / 2, 
            this.canvas.width - frameWidth, this.canvas.height - frameWidth);

        // Add corner decorations
        const cornerSize = 30;
        this.ctx.fillStyle = '#ba944f';
        // Top-left
        this.ctx.fillRect(0, 0, cornerSize, 5);
        this.ctx.fillRect(0, 0, 5, cornerSize);
        // Top-right
        this.ctx.fillRect(this.canvas.width - cornerSize, 0, cornerSize, 5);
        this.ctx.fillRect(this.canvas.width - 5, 0, 5, cornerSize);
        // Bottom-left
        this.ctx.fillRect(0, this.canvas.height - 5, cornerSize, 5);
        this.ctx.fillRect(0, this.canvas.height - cornerSize, 5, cornerSize);
        // Bottom-right
        this.ctx.fillRect(this.canvas.width - cornerSize, this.canvas.height - 5, cornerSize, 5);
        this.ctx.fillRect(this.canvas.width - 5, this.canvas.height - cornerSize, 5, cornerSize);
    }

    capturePhoto() {
        if (!this.canvas) {
            alert('Camera not started');
            return;
        }

        // Convert canvas to blob
        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `planet-ar-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    async shareAR() {
        if (!this.canvas) {
            alert('No photo to share');
            return;
        }

        try {
            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/png');
            });

            if (navigator.share) {
                const file = new File([blob], `planet-ar-${Date.now()}.png`, { type: 'image/png' });
                await navigator.share({
                    title: 'Planet Discovery AR Filter',
                    text: 'Check out this cool AR filter!',
                    files: [file]
                });
            } else {
                // Fallback: download
                this.capturePhoto();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback: download
            this.capturePhoto();
        }
    }

    closePreview() {
        // Stop video stream
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }

        const previewContainer = document.getElementById('ar-preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }

        this.currentFilter = null;
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryARFilters = new PlanetDiscoveryARFilters();
}

