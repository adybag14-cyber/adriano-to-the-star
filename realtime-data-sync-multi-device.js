/**
 * Real-time Data Synchronization Across Devices
 * Sync data in real-time across multiple devices
 */
(function() {
    'use strict';

    class RealtimeDataSyncMultiDevice {
        constructor() {
            this.syncState = new Map();
            this.devices = new Map();
            this.conflicts = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.setupWebSocket();
            this.startSync();
        }

        setupUI() {
            if (!document.getElementById('realtime-sync')) {
                const sync = document.createElement('div');
                sync.id = 'realtime-sync';
                sync.className = 'realtime-sync';
                sync.innerHTML = `
                    <div class="sync-header">
                        <h2>Real-time Sync</h2>
                        <div class="sync-status" id="sync-status">Connecting...</div>
                    </div>
                    <div class="devices-list" id="devices-list"></div>
                    <div class="sync-queue" id="sync-queue"></div>
                `;
                document.body.appendChild(sync);
            }
        }

        setupWebSocket() {
            const wsUrl = this.getWebSocketUrl();
            if (!wsUrl) {
                this.startPollingFallback();
                return;
            }

            try {
                this.websocket = new WebSocket(wsUrl);
                this.websocket.onopen = () => {
                    this.updateStatus('connected');
                    this.sendDeviceInfo();
                };
                this.websocket.onmessage = (event) => {
                    this.handleSyncMessage(JSON.parse(event.data));
                };
                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.updateStatus('error');
                };
                this.websocket.onclose = () => {
                    this.updateStatus('disconnected');
                    this.attemptReconnect();
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                this.startPollingFallback();
            }
        }

        getWebSocketUrl() {
            return window.SYNC_WS_URL || 
                   (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
                   window.location.host + '/sync';
        }

        startPollingFallback() {
            setInterval(() => {
                this.syncViaHTTP();
            }, 5000);
        }

        sendDeviceInfo() {
            const deviceInfo = {
                type: 'device-info',
                deviceId: this.getDeviceId(),
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            };
            this.sendMessage(deviceInfo);
        }

        getDeviceId() {
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('deviceId', deviceId);
            }
            return deviceId;
        }

        sendMessage(message) {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            }
        }

        handleSyncMessage(data) {
            switch (data.type) {
                case 'sync':
                    this.handleSyncData(data);
                    break;
                case 'conflict':
                    this.handleConflict(data);
                    break;
                case 'device-list':
                    this.updateDevicesList(data.devices);
                    break;
            }
        }

        handleSyncData(data) {
            // Apply sync data
            if (window.database?.applySync) {
                window.database.applySync(data.changes);
            }
        }

        handleConflict(data) {
            this.conflicts.push(data);
            this.showConflictResolution(data);
        }

        showConflictResolution(conflict) {
            if (window.conflictResolver) {
                window.conflictResolver.addConflict(conflict);
            }
        }

        startSync() {
            setInterval(() => {
                this.collectChanges();
            }, 2000);
        }

        collectChanges() {
            // Collect local changes
            const changes = this.getLocalChanges();
            if (changes.length > 0) {
                this.sendSyncChanges(changes);
            }
        }

        getLocalChanges() {
            // Get changes from local database
            if (window.database?.getPendingChanges) {
                return window.database.getPendingChanges();
            }
            return [];
        }

        sendSyncChanges(changes) {
            const message = {
                type: 'sync-changes',
                deviceId: this.getDeviceId(),
                changes: changes,
                timestamp: Date.now()
            };
            this.sendMessage(message);
        }

        async syncViaHTTP() {
            try {
                const response = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deviceId: this.getDeviceId(),
                        changes: this.getLocalChanges()
                    })
                });
                const data = await response.json();
                if (data.changes) {
                    this.handleSyncData({ type: 'sync', changes: data.changes });
                }
            } catch (error) {
                console.error('HTTP sync failed:', error);
            }
        }

        updateStatus(status) {
            const statusEl = document.getElementById('sync-status');
            if (statusEl) {
                statusEl.textContent = status;
                statusEl.className = `sync-status ${status}`;
            }
        }

        updateDevicesList(devices) {
            const list = document.getElementById('devices-list');
            if (!list) return;
            
            list.innerHTML = devices.map(device => `
                <div class="device-item">
                    <div class="device-id">${device.id}</div>
                    <div class="device-status ${device.status}">${device.status}</div>
                </div>
            `).join('');
        }

        attemptReconnect() {
            setTimeout(() => {
                this.setupWebSocket();
            }, 5000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.realtimeSync = new RealtimeDataSyncMultiDevice();
        });
    } else {
        window.realtimeSync = new RealtimeDataSyncMultiDevice();
    }
})();

