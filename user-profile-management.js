/**
 * User Profile Management with Avatar Uploads
 * 
 * Adds comprehensive user profile management with avatar uploads.
 * 
 * @module UserProfileManagement
 * @version 1.0.0
 * @author Adriano To The Star
 */

class UserProfileManagement {
    constructor() {
        this.profiles = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize user profile system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('UserProfileManagement already initialized');
            return;
        }

        this.loadProfiles();
        
        this.isInitialized = true;
    }

    /**
     * Get profile
     * @public
     * @param {string} userId - User ID
     * @returns {Object|null} Profile object
     */
    getProfile(userId) {
        return this.profiles.get(userId) || this.createDefaultProfile(userId);
    }

    /**
     * Create default profile
     * @private
     * @param {string} userId - User ID
     * @returns {Object} Default profile
     */
    createDefaultProfile(userId) {
        const profile = {
            userId,
            name: '',
            email: '',
            avatar: null,
            bio: '',
            location: '',
            website: '',
            socialLinks: {},
            preferences: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.profiles.set(userId, profile);
        return profile;
    }

    /**
     * Update profile
     * @public
     * @param {string} userId - User ID
     * @param {Object} updates - Profile updates
     * @returns {Object} Updated profile
     */
    updateProfile(userId, updates) {
        const profile = this.getProfile(userId);
        
        Object.assign(profile, updates, {
            updatedAt: new Date().toISOString()
        });

        this.profiles.set(userId, profile);
        this.saveProfiles();
        this.trackEvent('profile_updated', { userId });

        return profile;
    }

    /**
     * Upload avatar
     * @public
     * @param {string} userId - User ID
     * @param {File} file - Avatar file
     * @returns {Promise<Object>} Upload result
     */
    async uploadAvatar(userId, file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }

        // Convert to base64 or data URL
        const avatar = await this.fileToDataURL(file);

        // Resize if needed
        const resized = await this.resizeImage(avatar, 200, 200);

        // Update profile
        const profile = this.updateProfile(userId, { avatar: resized });

        this.trackEvent('avatar_uploaded', { userId });
        return {
            success: true,
            avatar: resized,
            profile
        };
    }

    /**
     * File to data URL
     * @private
     * @param {File} file - File object
     * @returns {Promise<string>} Data URL
     */
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Resize image
     * @private
     * @param {string} dataURL - Image data URL
     * @param {number} maxWidth - Max width
     * @param {number} maxHeight - Max height
     * @returns {Promise<string>} Resized image data URL
     */
    resizeImage(dataURL, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = dataURL;
        });
    }

    /**
     * Create profile editor
     * @public
     * @param {HTMLElement} container - Container element
     * @param {string} userId - User ID
     * @returns {HTMLElement} Editor element
     */
    createProfileEditor(container, userId) {
        const profile = this.getProfile(userId);
        const editor = document.createElement('div');
        editor.className = 'profile-editor';
        editor.innerHTML = `
            <div class="profile-avatar-section">
                <img src="${profile.avatar || 'https://via.placeholder.com/200'}" alt="Avatar" class="profile-avatar-preview">
                <input type="file" accept="image/*" class="avatar-upload" id="avatar-upload">
                <label for="avatar-upload" class="avatar-upload-label">Upload Avatar</label>
            </div>
            <form class="profile-form">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value="${profile.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value="${profile.email || ''}" required>
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio" rows="4">${profile.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value="${profile.location || ''}">
                </div>
                <div class="form-group">
                    <label>Website</label>
                    <input type="url" name="website" value="${profile.website || ''}">
                </div>
                <button type="submit" class="save-profile-btn">Save Profile</button>
            </form>
        `;

        // Avatar upload
        const avatarInput = editor.querySelector('#avatar-upload');
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const result = await this.uploadAvatar(userId, file);
                    editor.querySelector('.profile-avatar-preview').src = result.avatar;
                } catch (error) {
                    alert(error.message);
                }
            }
        });

        // Form submit
        const form = editor.querySelector('.profile-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updates = Object.fromEntries(formData);
            this.updateProfile(userId, updates);
            
            if (window.notifications) {
                window.notifications.notify('Profile Updated', {
                    channels: ['toast'],
                    priority: 'success'
                });
            }
        });

        container.appendChild(editor);
        return editor;
    }

    /**
     * Save profiles
     * @private
     */
    saveProfiles() {
        try {
            const profiles = Object.fromEntries(this.profiles);
            localStorage.setItem('user-profiles', JSON.stringify(profiles));
        } catch (e) {
            console.warn('Failed to save profiles:', e);
        }
    }

    /**
     * Load profiles
     * @private
     */
    loadProfiles() {
        try {
            const saved = localStorage.getItem('user-profiles');
            if (saved) {
                const profiles = JSON.parse(saved);
                Object.entries(profiles).forEach(([key, value]) => {
                    this.profiles.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load profiles:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`userProfile:${eventName}`, 1, {
                    source: 'user-profile-management',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record profile event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('User Profile', { event: eventName, ...data });
        }
    }
}

// Create global instance
window.UserProfileManagement = UserProfileManagement;
window.userProfile = new UserProfileManagement();
window.userProfile.init();

