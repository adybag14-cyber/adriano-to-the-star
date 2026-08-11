/**
 * Planet Discovery Image Gallery
 * Gallery of planet images, artwork, and visualizations
 */

class PlanetDiscoveryImageGallery {
    constructor() {
        this.images = [];
        this.categories = ['Planets', 'Artwork', 'Visualizations', 'Telescope Images'];
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.loadImages();
        console.log('🖼️ Image gallery initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_im_ag_eg_al_le_ry_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadImages() {
        this.images = [
            {
                id: 'img-1',
                title: 'Kepler-186f Visualization',
                category: 'Visualizations',
                url: 'https://via.placeholder.com/800x600/1a1a2e/ba944f?text=Kepler-186f',
                description: 'Artist\'s impression of Kepler-186f',
                likes: 156,
                author: 'NASA'
            },
            {
                id: 'img-2',
                title: 'Exoplanet Artwork',
                category: 'Artwork',
                url: 'https://via.placeholder.com/800x600/1a1a2e/ba944f?text=Exoplanet+Art',
                description: 'Digital artwork of an exoplanet',
                likes: 89,
                author: 'Community Artist'
            }
        ];
    }

    renderImageGallery(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="image-gallery-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🖼️ Image Gallery</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                        <button class="gallery-filter-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            All
                        </button>
                        ${this.categories.map(cat => `
                            <button class="gallery-filter-btn" data-category="${cat}" style="padding: 0.75rem 1.5rem; background: rgba(107, 114, 128, 0.2); border: 2px solid rgba(107, 114, 128, 0.5); border-radius: 10px; color: rgba(255, 255, 255, 0.7); cursor: pointer; font-weight: 600;">
                                ${cat}
                            </button>
                        `).join('')}
                        <button id="upload-image-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            📤 Upload Image
                        </button>
                    </div>
                </div>
                
                <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
                    ${this.renderImages()}
                </div>
            </div>
        `;

        document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterGallery(e.target.dataset.category);
            });
        });

        document.getElementById('upload-image-btn')?.addEventListener('click', () => {
            this.showUploadForm();
        });

        const rerunButtons = container.querySelectorAll('.gallery-image-ml-rerun-btn');
        rerunButtons.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const card = btn.closest('.gallery-image-card');
                if (!card) {
                    return;
                }
                const img = card.querySelector('.gallery-image-media img');
                if (!img) {
                    return;
                }
                try {
                    if (typeof computerVisionCapabilities !== 'undefined' &&
                        computerVisionCapabilities &&
                        typeof computerVisionCapabilities.reprocessImage === 'function') {
                        computerVisionCapabilities.reprocessImage(img);
                    }
                } catch (error) {
                    console.warn('Re-run ML analysis failed:', error);
                }
            });
        });
    }

    renderImages() {
        const filtered = this.currentCategory === 'all' 
            ? this.images 
            : this.images.filter(img => img.category === this.currentCategory);

        return filtered.map(image => this.createImageCard(image)).join('');
    }

    createImageCard(image) {
        return `
            <div class="gallery-image-card" data-image-id="${image.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; overflow: hidden; cursor: pointer; transition: all 0.3s ease;">
                <div class="gallery-image-media" style="position: relative; width: 100%; height: 250px; overflow: hidden;">
                    <img src="${image.url}" alt="${image.title}" data-cv-classify data-cv-detect-objects style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                </div>
                <div style="padding: 1.5rem;">
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${image.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem;">${image.description}</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7;">
                        <span>👤 ${image.author}</span>
                        <span>❤️ ${image.likes}</span>
                    </div>
                    <div class="gallery-image-ml-summary" style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.7;"></div>
                    <div class="gallery-image-actions" style="margin-top: 0.75rem; display: flex; justify-content: flex-end;">
                        <button type="button" class="gallery-image-ml-rerun-btn" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 9999px; border: 1px solid rgba(186, 148, 79, 0.7); background: rgba(0, 0, 0, 0.6); color: #ba944f; cursor: pointer;">
                            🔄 Re-run ML analysis
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    filterGallery(category) {
        this.currentCategory = category;
        this.renderImageGallery('image-gallery-container');
    }

    showUploadForm() {
        alert('Image upload form coming soon!');
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryImageGallery = new PlanetDiscoveryImageGallery();
}

