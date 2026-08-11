/**
 * Recorded Lectures
 * @class RecordedLectures
 * @description Manages recorded lectures with playback and access control.
 */
class RecordedLectures {
    constructor() {
        this.lectures = new Map();
        this.playback = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ec_or_de_dl_ec_tu_re_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ec_or_de_dl_ec_tu_re_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add recorded lecture.
     * @param {string} lectureId - Lecture identifier.
     * @param {object} lectureData - Lecture data.
     */
    addLecture(lectureId, lectureData) {
        this.lectures.set(lectureId, {
            ...lectureData,
            id: lectureId,
            courseId: lectureData.courseId,
            title: lectureData.title,
            videoUrl: lectureData.videoUrl,
            duration: lectureData.duration || 0,
            views: 0,
            createdAt: new Date()
        });
        console.log(`Recorded lecture added: ${lectureId}`);
    }

    /**
     * Play lecture.
     * @param {string} lectureId - Lecture identifier.
     * @param {string} userId - User identifier.
     */
    playLecture(lectureId, userId) {
        const lecture = this.lectures.get(lectureId);
        if (lecture) {
            lecture.views++;
            
            const playbackId = `playback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.playback.set(playbackId, {
                id: playbackId,
                lectureId,
                userId,
                startedAt: new Date()
            });
            console.log(`Lecture playback started: ${lectureId} by user ${userId}`);
        }
    }

    /**
     * Get lecture.
     * @param {string} lectureId - Lecture identifier.
     * @returns {object} Lecture data.
     */
    getLecture(lectureId) {
        return this.lectures.get(lectureId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.recordedLectures = new RecordedLectures();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecordedLectures;
}

