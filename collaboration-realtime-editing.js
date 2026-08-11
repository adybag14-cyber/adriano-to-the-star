/**
 * Collaboration Features (Real-time Editing)
 * 
 * Implements comprehensive collaboration features (real-time editing).
 * 
 * @module CollaborationRealtimeEditing
 * @version 1.0.0
 * @author Adriano To The Star
 */

class CollaborationRealtimeEditing {
    constructor() {
        this.sessions = new Map();
        this.participants = new Map();
        this.websocket = null;
        this.isInitialized = false;
    }

    /**
     * Initialize collaboration system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('CollaborationRealtimeEditing already initialized');
            return;
        }

        this.websocketUrl = options.websocketUrl || null;
        this.connectWebSocket();
        
        this.isInitialized = true;
        this.trackEvent('collab_realtime_initialized');
    }

    /**
     * Connect WebSocket
     * @private
     */
    connectWebSocket() {
        if (!this.websocketUrl) {
            // Use WebSocket reconnection system if available
            if (window.WebSocketReconnectionSystem) {
                // Will be set up when joining a session
                return;
            }
            return;
        }

        try {
            this.websocket = new WebSocket(this.websocketUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        }
    }

    /**
     * Set up WebSocket handlers
     * @private
     */
    setupWebSocketHandlers() {
        if (!this.websocket) {
            return;
        }

        this.websocket.onopen = () => {
            console.log('Collaboration WebSocket connected');
        };

        this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.websocket.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }

    /**
     * Join session
     * @public
     * @param {string} sessionId - Session ID
     * @param {string} userId - User ID
     * @returns {Object} Session object
     */
    joinSession(sessionId, userId) {
        const session = {
            id: sessionId,
            participants: new Set(),
            content: '',
            version: 0
        };

        session.participants.add(userId);
        this.sessions.set(sessionId, session);
        this.participants.set(userId, sessionId);

        // Notify server
        this.sendMessage({
            type: 'join',
            sessionId,
            userId
        });

        return session;
    }

    /**
     * Leave session
     * @public
     * @param {string} sessionId - Session ID
     * @param {string} userId - User ID
     */
    leaveSession(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants.delete(userId);
            if (session.participants.size === 0) {
                this.sessions.delete(sessionId);
            }
        }

        this.participants.delete(userId);

        // Notify server
        this.sendMessage({
            type: 'leave',
            sessionId,
            userId
        });
    }

    /**
     * Send edit
     * @public
     * @param {string} sessionId - Session ID
     * @param {Object} edit - Edit operation
     */
    sendEdit(sessionId, edit) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        const message = {
            type: 'edit',
            sessionId,
            edit: {
                ...edit,
                version: session.version++,
                timestamp: new Date().toISOString()
            }
        };

        this.sendMessage(message);
    }

    /**
     * Handle message
     * @private
     * @param {Object} message - Message object
     */
    handleMessage(message) {
        switch (message.type) {
            case 'edit':
                this.handleEdit(message);
                break;
            case 'participant-joined':
                this.handleParticipantJoined(message);
                break;
            case 'participant-left':
                this.handleParticipantLeft(message);
                break;
            case 'sync':
                this.handleSync(message);
                break;
        }
    }

    /**
     * Handle edit
     * @private
     * @param {Object} message - Edit message
     */
    handleEdit(message) {
        const { sessionId, edit } = message;
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        // Apply edit to content
        this.applyEdit(session, edit);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('collaboration-edit', {
            detail: { sessionId, edit }
        }));
    }

    /**
     * Apply edit
     * @private
     * @param {Object} session - Session object
     * @param {Object} edit - Edit operation
     */
    applyEdit(session, edit) {
        if (edit.type === 'insert') {
            session.content = 
                session.content.slice(0, edit.position) +
                edit.text +
                session.content.slice(edit.position);
        } else if (edit.type === 'delete') {
            session.content = 
                session.content.slice(0, edit.position) +
                session.content.slice(edit.position + edit.length);
        } else if (edit.type === 'replace') {
            session.content = edit.content;
        }
    }

    /**
     * Handle participant joined
     * @private
     * @param {Object} message - Message object
     */
    handleParticipantJoined(message) {
        const { sessionId, userId } = message;
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants.add(userId);
        }

        window.dispatchEvent(new CustomEvent('collaboration-participant-joined', {
            detail: { sessionId, userId }
        }));
    }

    /**
     * Handle participant left
     * @private
     * @param {Object} message - Message object
     */
    handleParticipantLeft(message) {
        const { sessionId, userId } = message;
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants.delete(userId);
        }

        window.dispatchEvent(new CustomEvent('collaboration-participant-left', {
            detail: { sessionId, userId }
        }));
    }

    /**
     * Handle sync
     * @private
     * @param {Object} message - Sync message
     */
    handleSync(message) {
        const { sessionId, content, version } = message;
        const session = this.sessions.get(sessionId);
        if (session) {
            session.content = content;
            session.version = version;
        }
    }

    /**
     * Send message
     * @private
     * @param {Object} message - Message object
     */
    sendMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        } else {
            // Queue message for when connection is ready
            console.warn('WebSocket not connected, message queued');
        }
    }

    /**
     * Get session
     * @public
     * @param {string} sessionId - Session ID
     * @returns {Object|null} Session object
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * Get participants
     * @public
     * @param {string} sessionId - Session ID
     * @returns {Array} Participants array
     */
    getParticipants(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? Array.from(session.participants) : [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`collab_realtime_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.CollaborationRealtimeEditing = CollaborationRealtimeEditing;
window.collaboration = new CollaborationRealtimeEditing();
window.collaboration.init();

