/**
 * Lesson Builder
 * @class LessonBuilder
 * @description Provides tools for building lessons with content, media, and activities.
 */
class LessonBuilder {
    constructor() {
        this.lessons = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_es_so_nb_ui_ld_er_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_es_so_nb_ui_ld_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a lesson.
     * @param {string} lessonId - Lesson identifier.
     * @param {object} lessonData - Lesson data.
     */
    createLesson(lessonId, lessonData) {
        this.lessons.set(lessonId, {
            ...lessonData,
            id: lessonId,
            content: lessonData.content || [],
            duration: lessonData.duration || 0,
            createdAt: new Date()
        });
        console.log(`Lesson created: ${lessonId}`);
    }

    /**
     * Add content block to lesson.
     * @param {string} lessonId - Lesson identifier.
     * @param {object} contentBlock - Content block data.
     */
    addContentBlock(lessonId, contentBlock) {
        const lesson = this.lessons.get(lessonId);
        if (lesson) {
            lesson.content.push({
                ...contentBlock,
                type: contentBlock.type || 'text', // text, video, image, quiz, etc.
                order: lesson.content.length + 1
            });
            console.log(`Content block added to lesson ${lessonId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.lessonBuilder = new LessonBuilder();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LessonBuilder;
}

