/**
 * Real-time Collaboration Indicators System
 * Shows who is viewing/editing content in real-time
 */
(function() {
    'use strict';

    class RealtimeCollaborationIndicators {
        constructor() {
            this.activeUsers = new Map();
            this.userColors = new Map();
            this.cursorPositions = new Map();
            this.editingIndicators = new Map();
            this.websocket = null;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 5;
            this.init();
        }

        init() {
            this.setupWebSocket();
            this.setupUI();
            this.setupEventListeners();
            this.startPresenceSync();
        }

        setupWebSocket() {
            // Connect to WebSocket server for real-time updates
            const wsUrl = this.getWebSocketUrl();
            if (!wsUrl) {
                console.warn('WebSocket URL not configured, using polling fallback');
                this.startPollingFallback();
                return;
            }

            try {
                this.websocket = new WebSocket(wsUrl);
                this.websocket.onopen = () => {
                    console.log('✅ Collaboration WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.sendPresenceUpdate();
                };
                this.websocket.onmessage = (event) => {
                    this.handleWebSocketMessage(JSON.parse(event.data));
                };
                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
                this.websocket.onclose = () => {
                    console.warn('WebSocket closed, attempting reconnect...');
                    this.attemptReconnect();
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                this.startPollingFallback();
            }
        }

        getWebSocketUrl() {
            // Try to get from config or environment
            return window.COLLABORATION_WS_URL || 
                   (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
                   window.location.host + '/collaboration';
        }

        startPollingFallback() {
            // Fallback to polling if WebSocket unavailable
            setInterval(() => {
                this.fetchPresenceUpdates();
            }, 3000); // Poll every 3 seconds
        }

        attemptReconnect() {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(() => {
                    this.setupWebSocket();
                }, 1000 * this.reconnectAttempts);
            } else {
                console.error('Max reconnection attempts reached, using polling');
                this.startPollingFallback();
            }
        }

        setupUI() {
            // Create collaboration indicators container
            if (!document.getElementById('collaboration-indicators')) {
                const container = document.createElement('div');
                container.id = 'collaboration-indicators';
                container.className = 'collaboration-indicators';
                container.innerHTML = `
                    <div class="collaboration-header">
                        <span class="collaboration-title">Active Users</span>
                        <span class="user-count" id="user-count">0</span>
                    </div>
                    <div class="active-users-list" id="active-users-list"></div>
                `;
                document.body.appendChild(container);
            }

            // Add cursor tracking overlay
            if (!document.getElementById('cursor-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'cursor-overlay';
                overlay.className = 'cursor-overlay';
                document.body.appendChild(overlay);
            }
        }

        setupEventListeners() {
            // Track mouse movement for cursor sharing
            document.addEventListener('mousemove', (e) => {
                this.sendCursorPosition(e.clientX, e.clientY);
            });

            // Track scroll position
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.sendScrollPosition();
                }, 100);
            });

            // Track focus/blur for presence
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.sendPresenceUpdate('away');
                } else {
                    this.sendPresenceUpdate('active');
                }
            });

            // Track editing events
            document.addEventListener('input', (e) => {
                if (this.isEditableElement(e.target)) {
                    this.sendEditingIndicator(e.target, true);
                }
            });

            document.addEventListener('blur', (e) => {
                if (this.isEditableElement(e.target)) {
                    this.sendEditingIndicator(e.target, false);
                }
            }, true);
        }

        isEditableElement(element) {
            return element.isContentEditable || 
                   element.tagName === 'INPUT' || 
                   element.tagName === 'TEXTAREA';
        }

        sendPresenceUpdate(status = 'active') {
            const user = this.getCurrentUser();
            if (!user) return;

            const message = {
                type: 'presence',
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                status: status,
                timestamp: Date.now()
            };

            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            } else {
                // Fallback to HTTP
                this.sendPresenceUpdateHTTP(message);
            }
        }

        sendPresenceUpdateHTTP(message) {
            fetch('/api/collaboration/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            }).catch(err => console.error('Failed to send presence update:', err));
        }

        sendCursorPosition(x, y) {
            const user = this.getCurrentUser();
            if (!user) return;

            const message = {
                type: 'cursor',
                userId: user.id,
                x: x,
                y: y,
                timestamp: Date.now()
            };

            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            }
        }

        sendScrollPosition() {
            const user = this.getCurrentUser();
            if (!user) return;

            const message = {
                type: 'scroll',
                userId: user.id,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                timestamp: Date.now()
            };

            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            }
        }

        sendEditingIndicator(element, isEditing) {
            const user = this.getCurrentUser();
            if (!user) return;

            const elementId = element.id || this.getElementPath(element);
            const message = {
                type: 'editing',
                userId: user.id,
                elementId: elementId,
                isEditing: isEditing,
                timestamp: Date.now()
            };

            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            }
        }

        getElementPath(element) {
            const path = [];
            while (element && element !== document.body) {
                let selector = element.tagName.toLowerCase();
                if (element.id) {
                    selector += '#' + element.id;
                } else if (element.className) {
                    selector += '.' + element.className.split(' ')[0];
                }
                path.unshift(selector);
                element = element.parentElement;
            }
            return path.join(' > ');
        }

        handleWebSocketMessage(data) {
            switch (data.type) {
                case 'presence':
                    this.handlePresenceUpdate(data);
                    break;
                case 'cursor':
                    this.handleCursorUpdate(data);
                    break;
                case 'scroll':
                    this.handleScrollUpdate(data);
                    break;
                case 'editing':
                    this.handleEditingUpdate(data);
                    break;
                case 'user_joined':
                    this.handleUserJoined(data);
                    break;
                case 'user_left':
                    this.handleUserLeft(data);
                    break;
            }
        }

        handlePresenceUpdate(data) {
            if (data.userId === this.getCurrentUser()?.id) return;

            this.activeUsers.set(data.userId, {
                id: data.userId,
                name: data.userName,
                avatar: data.userAvatar,
                status: data.status,
                lastSeen: data.timestamp
            });

            this.updateUI();
        }

        handleCursorUpdate(data) {
            if (data.userId === this.getCurrentUser()?.id) return;

            this.cursorPositions.set(data.userId, {
                x: data.x,
                y: data.y,
                timestamp: data.timestamp
            });

            this.renderCursors();
        }

        handleScrollUpdate(data) {
            // Optionally sync scroll position (can be disabled)
            if (this.shouldSyncScroll() && data.userId !== this.getCurrentUser()?.id) {
                // Smooth scroll to position
                window.scrollTo({
                    left: data.scrollX,
                    top: data.scrollY,
                    behavior: 'smooth'
                });
            }
        }

        handleEditingUpdate(data) {
            if (data.userId === this.getCurrentUser()?.id) return;

            if (data.isEditing) {
                this.editingIndicators.set(data.userId, {
                    elementId: data.elementId,
                    timestamp: data.timestamp
                });
            } else {
                this.editingIndicators.delete(data.userId);
            }

            this.renderEditingIndicators();
        }

        handleUserJoined(data) {
            console.log(`User joined: ${data.userName}`);
            this.handlePresenceUpdate(data);
        }

        handleUserLeft(data) {
            console.log(`User left: ${data.userName}`);
            this.activeUsers.delete(data.userId);
            this.cursorPositions.delete(data.userId);
            this.editingIndicators.delete(data.userId);
            this.updateUI();
            this.renderCursors();
        }

        renderCursors() {
            const overlay = document.getElementById('cursor-overlay');
            if (!overlay) return;

            overlay.innerHTML = '';

            this.cursorPositions.forEach((position, userId) => {
                const user = this.activeUsers.get(userId);
                if (!user) return;

                // Remove stale cursors (older than 2 seconds)
                if (Date.now() - position.timestamp > 2000) {
                    this.cursorPositions.delete(userId);
                    return;
                }

                const cursor = document.createElement('div');
                cursor.className = 'remote-cursor';
                cursor.style.left = position.x + 'px';
                cursor.style.top = position.y + 'px';
                cursor.style.borderColor = this.getUserColor(userId);
                cursor.innerHTML = `
                    <div class="cursor-name" style="background-color: ${this.getUserColor(userId)}">
                        ${user.name}
                    </div>
                `;
                overlay.appendChild(cursor);
            });
        }

        renderEditingIndicators() {
            // Remove existing indicators
            document.querySelectorAll('.editing-indicator').forEach(el => el.remove());

            this.editingIndicators.forEach((indicator, userId) => {
                const user = this.activeUsers.get(userId);
                if (!user) return;

                const element = document.getElementById(indicator.elementId) || 
                               this.findElementByPath(indicator.elementId);
                if (!element) return;

                const indicatorEl = document.createElement('div');
                indicatorEl.className = 'editing-indicator';
                indicatorEl.style.borderColor = this.getUserColor(userId);
                indicatorEl.innerHTML = `
                    <span style="background-color: ${this.getUserColor(userId)}">
                        ${user.name} is editing
                    </span>
                `;
                element.style.position = 'relative';
                element.appendChild(indicatorEl);
            });
        }

        findElementByPath(path) {
            // Try to find element by ID first
            const byId = document.getElementById(path);
            if (byId) return byId;

            // Otherwise try to parse the path
            try {
                return document.querySelector(path);
            } catch {
                return null;
            }
        }

        updateUI() {
            const userCount = document.getElementById('user-count');
            const userList = document.getElementById('active-users-list');
            if (!userCount || !userList) return;

            const currentUserId = this.getCurrentUser()?.id;
            const otherUsers = Array.from(this.activeUsers.values())
                .filter(user => user.id !== currentUserId);

            userCount.textContent = otherUsers.length;

            userList.innerHTML = otherUsers.map(user => `
                <div class="active-user-item" data-user-id="${user.id}">
                    <div class="user-avatar" style="background-color: ${this.getUserColor(user.id)}">
                        ${user.avatar || user.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-status ${user.status}">${user.status}</div>
                    </div>
                </div>
            `).join('');
        }

        getUserColor(userId) {
            if (!this.userColors.has(userId)) {
                const colors = [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
                ];
                const color = colors[this.userColors.size % colors.length];
                this.userColors.set(userId, color);
            }
            return this.userColors.get(userId);
        }

        getCurrentUser() {
            // Try to get from auth system
            if (window.supabase?.auth?.user) {
                const user = window.supabase.auth.user();
                if (user) {
                    return {
                        id: user.id,
                        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                        avatar: user.user_metadata?.avatar_url
                    };
                }
            }

            // Fallback to localStorage
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                return JSON.parse(stored);
            }

            // Generate temporary user
            const tempId = localStorage.getItem('tempUserId') || 
                          'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tempUserId', tempId);
            return {
                id: tempId,
                name: 'Guest User',
                avatar: null
            };
        }

        fetchPresenceUpdates() {
            fetch('/api/collaboration/presence')
                .then(res => res.json())
                .then(data => {
                    if (data.users) {
                        data.users.forEach(user => {
                            if (user.id !== this.getCurrentUser()?.id) {
                                this.handlePresenceUpdate(user);
                            }
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch presence:', err));
        }

        startPresenceSync() {
            // Send presence update every 30 seconds
            setInterval(() => {
                this.sendPresenceUpdate();
            }, 30000);
        }

        shouldSyncScroll() {
            return localStorage.getItem('syncScroll') === 'true';
        }

        cleanup() {
            if (this.websocket) {
                this.websocket.close();
            }
            this.sendPresenceUpdate('offline');
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.realtimeCollaboration = new RealtimeCollaborationIndicators();
        });
    } else {
        window.realtimeCollaboration = new RealtimeCollaborationIndicators();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.realtimeCollaboration) {
            window.realtimeCollaboration.cleanup();
        }
    });
})();


