/**
 * Planet Photo Gallery
 * User-uploaded planet images and artwork
 */

class PlanetPhotoGallery {
    constructor() {
        this.galleries = [];
        this.photos = [];
        this.currentUser = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
            }
        }

        this.loadPhotos();
        this.isInitialized = true;
        console.log('📸 Planet Photo Gallery initialized');
    }

    loadPhotos() {
        try {
            const stored = localStorage.getItem('planet-photos');
            if (stored) {
                this.photos = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading photos:', error);
        }
    }

    savePhotos() {
        try {
            localStorage.setItem('planet-photos', JSON.stringify(this.photos));
        } catch (error) {
            console.error('Error saving photos:', error);
        }
    }

    /**
     * Upload photo
     */
    async uploadPhoto(file, planetData, description = '') {
        if (!this.currentUser) {
            throw new Error('Please log in to upload photos');
        }

        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File size must be less than 10MB');
        }

        // Convert to base64 or upload to storage
        const photoData = await this.processImage(file);

        const photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            planetId: planetData.kepid,
            planetName: planetData.kepler_name || planetData.kepoi_name,
            uploaderId: this.currentUser.id,
            uploaderEmail: this.currentUser.email,
            imageData: photoData,
            description: description,
            likes: 0,
            views: 0,
            createdAt: new Date().toISOString(),
            tags: []
        };

        this.photos.push(photo);
        this.savePhotos();

        // Upload to Supabase Storage if available
        if (window.supabase) {
            try {
                const fileName = `${photo.id}.${file.name.split('.').pop()}`;
                const { data, error } = await window.supabase.storage
                    .from('planet-photos')
                    .upload(fileName, file);

                if (!error && data) {
                    const { data: urlData } = window.supabase.storage
                        .from('planet-photos')
                        .getPublicUrl(fileName);

                    photo.storageUrl = urlData.publicUrl;
                    this.savePhotos();
                }
            } catch (error) {
                console.warn('Error uploading to Supabase:', error);
            }
        }

        return photo;
    }

    /**
     * Process image file
     */
    async processImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get photos for a planet
     */
    getPlanetPhotos(kepid) {
        return this.photos.filter(p => p.planetId === kepid);
    }

    /**
     * Get user's photos
     */
    getUserPhotos(userId = null) {
        const userIdToCheck = userId || this.currentUser?.id;
        if (!userIdToCheck) return [];

        return this.photos.filter(p => p.uploaderId === userIdToCheck);
    }

    /**
     * Like a photo
     */
    likePhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            photo.likes++;
            this.savePhotos();
            return photo.likes;
        }
        return null;
    }

    /**
     * Render photo gallery
     */
    renderGallery(containerId, kepid = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const photos = kepid ? this.getPlanetPhotos(kepid) : this.photos.slice(0, 20);

        container.innerHTML = `
            <div class="planet-photo-gallery" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h3 style="color: #ba944f; margin: 0;">📸 Planet Photo Gallery</h3>
                    ${this.currentUser ? `
                        <button id="upload-photo-btn" class="btn-primary" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            📤 Upload Photo
                        </button>
                    ` : ''}
                </div>

                <div class="photos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
                    ${this.renderPhotos(photos)}
                </div>
            </div>
        `;

        this.setupGalleryEventListeners(kepid);
    }

    renderPhotos(photos) {
        if (photos.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5); grid-column: 1 / -1; text-align: center; padding: 3rem;">No photos yet. Be the first to upload!</p>';
        }

        return photos.map(photo => {
            let imgUrl = photo.storageUrl || photo.imageData;
            // Sanitize URL
            if (imgUrl && !imgUrl.match(/^(https?|data):/i)) {
                imgUrl = ''; // Block unsafe protocols
            }
            if (imgUrl) imgUrl = this.escapeHtml(imgUrl);

            return `
            <div class="photo-card" style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(186, 148, 79, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(186, 148, 79, 0.3)'">
                <div class="photo-image" style="width: 100%; height: 200px; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${imgUrl ? `<img src="${imgUrl}" alt="${this.escapeHtml(photo.planetName)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'color: rgba(255,255,255,0.5)\\'>📷</span>'">` : '<span style="color: rgba(255,255,255,0.5)">📷</span>'}
                </div>
                <div class="photo-info" style="padding: 1rem;">
                    <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.5rem;">${this.escapeHtml(photo.planetName)}</div>
                    ${photo.description ? `<p style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin: 0.5rem 0;">${this.escapeHtml(photo.description)}</p>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                        <span>❤️ ${photo.likes}</span>
                        <span>👁️ ${photo.views}</span>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    setupGalleryEventListeners(kepid) {
        const uploadBtn = document.getElementById('upload-photo-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showUploadModal(kepid);
            });
        }

        // Photo click to view
        document.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                // Show full-size photo modal
                const img = card.querySelector('img');
                if (img) {
                    this.showPhotoModal(img.src);
                }
            });
        });
    }

    showUploadModal(kepid) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const description = prompt('Photo description (optional):');
                try {
                    await this.uploadPhoto(file, { kepid: kepid }, description || '');
                    alert('Photo uploaded successfully!');
                    this.renderGallery('photo-gallery-container', kepid);
                } catch (error) {
                    alert('Error uploading photo: ' + error.message);
                }
            }
        };
        input.click();
    }

    showPhotoModal(imageSrc) {
        // Create modal for full-size view
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        modal.innerHTML = `
            <div style="position: relative; max-width: 90%; max-height: 90%;">
                <img src="${imageSrc}" style="max-width: 100%; max-height: 90vh; border-radius: 10px;">
                <button style="position: absolute; top: 10px; right: 10px; padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.8); border: none; border-radius: 5px; color: white; cursor: pointer; font-weight: 600;">✕</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('button').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.PlanetPhotoGallery = PlanetPhotoGallery;
    window.planetPhotoGallery = new PlanetPhotoGallery();
}

