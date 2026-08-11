/**
 * Secure Chat Logic
 * Handles UI interactions, key management, and message exchange
 */

class SecureChatApp {
    constructor() {
        this.currentUser = null;
        this.keys = {
            public: null,
            private: null,
        };
        this.selectedUser = null;
        this.users = [];
        this.uiInitialized = false;
        this.authListenerAttached = false;
        this.loginPromptShown = false;

        this.handleAuthChange = this.handleAuthChange.bind(this);

        this.init();
    }

    async init() {
        await this.waitForAuthManager();
        this.bindAuthListeners();
        this.syncAuthState();
    }

    waitForAuthManager() {
        return new Promise((resolve) => {
            if (window.authManager && window.authManager.isReady) {
                resolve();
                return;
            }

            let resolved = false;

            const finish = () => {
                if (resolved) {
                    return;
                }
                resolved = true;
                if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
                    document.removeEventListener('auth:ready', onReady);
                }
                resolve();
            };

            const onReady = () => {
                finish();
            };

            if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
                document.addEventListener('auth:ready', onReady, { once: true });
            }

            const interval = setInterval(() => {
                if (window.authManager && window.authManager.isReady) {
                    clearInterval(interval);
                    finish();
                }
            }, 150);

            setTimeout(() => {
                clearInterval(interval);
                finish();
            }, 5000);
        });
    }

    bindAuthListeners() {
        if (this.authListenerAttached || typeof document === 'undefined') {
            return;
        }
        document.addEventListener('auth:state-changed', this.handleAuthChange);
        this.authListenerAttached = true;
    }

    syncAuthState() {
        if (window.authManager && window.authManager.isAuthenticated()) {
            this.onAuthenticated();
        } else {
            this.onLoggedOut();
        }
    }

    handleAuthChange(event) {
        const isAuthenticated = event && event.detail ? event.detail.isAuthenticated : false;
        if (isAuthenticated) {
            this.onAuthenticated();
        } else {
            this.onLoggedOut();
        }
    }

    onAuthenticated() {
        this.loginPromptShown = false;

        if (!window.authManager) {
            return;
        }

        this.currentUser = window.authManager.getCurrentUser();

        if (!this.currentUser) {
            return;
        }

        if (!this.uiInitialized) {
            this.initUI();
            this.uiInitialized = true;
        } else {
            this.loadUsers();
        }

        this.updateUserDisplay();
        this.enableChatShell();
        this.checkKeys();
    }

    onLoggedOut() {
        this.currentUser = null;
        this.selectedUser = null;
        this.keys = {
            public: null,
            private: null,
        };
        this.disableChatShell();
        this.showLoginRequired(true);
    }

    enableChatShell() {
        const container = document.getElementById('messages-container');
        if (container && !container.innerHTML.trim()) {
            container.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🛡️</div>
                    <h2>Secure & Private</h2>
                    <p>Messages are encrypted on your device before sending.</p>
                    <p>Only you and the recipient can read them.</p>
                </div>
            `;
        }

        this.setComposerState({
            canType: true,
            canSend: Boolean(this.selectedUser && this.keys.private),
        });
    }

    disableChatShell() {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const title = document.getElementById('current-chat-title');
        const indicator = document.getElementById('secure-indicator');

        if (input) {
            input.value = '';
            input.disabled = true;
        }

        if (sendBtn) {
            sendBtn.disabled = true;
        }

        if (title) {
            title.textContent = 'Select a user to chat';
        }

        if (indicator) {
            indicator.style.display = 'none';
        }

        this.setComposerState({ canType: false, canSend: false });
    }

    showLoginRequired(openModal = false) {
        const container = document.getElementById('messages-container');
        if (container) {
            container.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🔑</div>
                    <h2>Login Required</h2>
                    <p>Please log in to unlock Secure Chat.</p>
                    <p>Use the Log In button above to authenticate.</p>
                </div>
            `;
        }

        this.setComposerState({ canType: false, canSend: false });

        if (openModal && typeof showModal === 'function' && !this.loginPromptShown) {
            this.loginPromptShown = true;
            setTimeout(() => showModal('login-modal'), 300);
        }
    }

    initUI() {
        // Key Management
        document.getElementById('manage-keys-btn').addEventListener('click', () => {
            this.showKeySetup();
        });

        document.getElementById('generate-keys-btn').addEventListener('click', () => {
            this.generateAndSaveKeys();
        });

        document.getElementById('unlock-keys-btn').addEventListener('click', () => {
            this.unlockKeys();
        });

        // User List
        document.getElementById('refresh-users-btn').addEventListener('click', () => {
            this.loadUsers();
        });

        // Messaging
        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('message-input');

        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Initial Load
        this.loadUsers();
        this.updateUserDisplay();
        this.setComposerState({ canType: true, canSend: false });
    }

    async updateUserDisplay() {
        if (!this.currentUser) {
            return;
        }

        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) {
            // Try to fetch profile for better name
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .eq('id', this.currentUser.id)
                    .single();

                if (data) {
                    userNameEl.textContent = data.full_name || data.username || this.currentUser.email;
                } else {
                    userNameEl.textContent = this.currentUser.fullName || this.currentUser.username || this.currentUser.email;
                }
            } catch (e) {
                userNameEl.textContent = this.currentUser.fullName || this.currentUser.username || this.currentUser.email;
            }
        }
    }

    // --- Key Management ---

    async checkKeys() {
        const statusEl = document.getElementById('key-status');

        if (!statusEl) {
            return;
        }

        statusEl.textContent = 'Checking keys...';

        // 1. Check LocalStorage for Private Key
        // Note: In a real app, we'd store the encrypted key in LocalStorage
        // For this demo, we'll check if we have the key in memory or need to import

        try {
            // Check Supabase for Public Key (Identity)
            const { data: publicData, error: publicError } = await supabase.storage
                .from('secure-files')
                .download(`keys/${this.currentUser.id}/public.json`);

            if (publicError) {
                console.log('No public key found on server');
                statusEl.textContent = '⚠️ No keys setup';
                statusEl.style.color = '#ef4444';
                this.showKeySetup();
                return;
            }

            // If we have public key, check if we have private key
            // For now, prompt to unlock (download encrypted private key)
            statusEl.textContent = '🔒 Keys locked';
            statusEl.style.color = '#eab308';

            const importModal = document.getElementById('key-import-modal');
            if (importModal) {
                importModal.style.display = 'flex';
            }

        } catch (err) {
            console.error('Key check error:', err);
        }
    }

    showKeySetup() {
        const modal = document.getElementById('key-setup-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    async generateAndSaveKeys() {
        const password = document.getElementById('key-password').value;
        const confirm = document.getElementById('key-password-confirm').value;
        const status = document.getElementById('setup-status');

        if (password !== confirm) {
            status.textContent = '❌ Passwords do not match';
            status.style.color = '#ef4444';
            return;
        }

        if (password.length < 8) {
            status.textContent = '❌ Password must be at least 8 characters';
            status.style.color = '#ef4444';
            return;
        }

        status.textContent = '⏳ Generating keys (this may take a moment)...';
        status.style.color = '#eab308';

        try {
            // 1. Generate Key Pair
            const keyPair = await window.secureCrypto.generateKeyPair();
            this.keys.public = keyPair.publicKey;
            this.keys.private = keyPair.privateKey;

            // 2. Export Public Key
            const publicKeyJWK = await window.secureCrypto.exportKey(keyPair.publicKey);

            // 3. Encrypt Private Key
            const encryptedPrivate = await window.secureCrypto.encryptPrivateKey(keyPair.privateKey, password);

            // 4. Upload to Supabase
            // Upload Public Key
            const { error: pubError } = await supabase.storage
                .from('secure-files')
                .upload(`keys/${this.currentUser.id}/public.json`, JSON.stringify(publicKeyJWK), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (pubError) throw pubError;

            // Upload Encrypted Private Key
            const { error: privError } = await supabase.storage
                .from('secure-files')
                .upload(`keys/${this.currentUser.id}/private.enc`, JSON.stringify(encryptedPrivate), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (privError) throw privError;

            // Success
            status.textContent = '✅ Keys generated and saved securely!';
            status.style.color = '#4ade80';

            setTimeout(() => {
                document.getElementById('key-setup-modal').style.display = 'none';
                document.getElementById('key-status').textContent = '✅ Secure Identity Active';
                document.getElementById('key-status').style.color = '#4ade80';
            }, 1500);

        } catch (err) {
            console.error('Key generation error:', err);
            status.textContent = '❌ Error: ' + err.message;
            status.style.color = '#ef4444';
        }
    }

    async unlockKeys() {
        const password = document.getElementById('import-password').value;
        const status = document.getElementById('unlock-status');

        status.textContent = '⏳ Unlocking...';
        status.style.color = '#eab308';

        try {
            // 1. Download Encrypted Private Key
            const { data, error } = await supabase.storage
                .from('secure-files')
                .download(`keys/${this.currentUser.id}/private.enc`);

            if (error) throw error;

            const encryptedData = JSON.parse(await data.text());

            // 2. Decrypt Private Key
            this.keys.private = await window.secureCrypto.decryptPrivateKey(encryptedData, password);

            // 3. Load Public Key (just to have it)
            const { data: pubData } = await supabase.storage
                .from('secure-files')
                .download(`keys/${this.currentUser.id}/public.json`);

            if (pubData) {
                const pubJWK = JSON.parse(await pubData.text());
                this.keys.public = await window.secureCrypto.importKey(pubJWK, 'public');
            }

            // Success
            status.textContent = '✅ Keys unlocked!';
            status.style.color = '#4ade80';

            setTimeout(() => {
                document.getElementById('key-import-modal').style.display = 'none';
                document.getElementById('key-status').textContent = '✅ Secure Identity Active';
                document.getElementById('key-status').style.color = '#4ade80';
            }, 1000);

        } catch (err) {
            console.error('Unlock error:', err);
            status.textContent = '❌ Incorrect password or error';
            status.style.color = '#ef4444';
        }
    }

    // --- User Management ---

    async loadUsers() {
        const listEl = document.getElementById('user-list');
        listEl.innerHTML = '<div style="padding: 20px; text-align: center;">Loading...</div>';

        try {
            // Fetch users from the 'profiles' table
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .neq('id', this.currentUser.id) // Exclude self
                .order('username', { ascending: true });

            if (error) throw error;

            listEl.innerHTML = '';

            if (!data || data.length === 0) {
                listEl.innerHTML = '<div style="padding: 20px; text-align: center;">No other users found.</div>';
                return;
            }

            for (const user of data) {
                const displayName = user.full_name || user.username || `User ${user.id.substring(0, 8)}...`;
                let avatarUrl = user.avatar_url || null;

                // Sanitize avatar URL to prevent XSS
                if (avatarUrl && !avatarUrl.match(/^(https?|data):/i)) {
                    // Invalid protocol, discard
                    avatarUrl = null;
                }
                if (avatarUrl) {
                    avatarUrl = this.escapeHtml(avatarUrl);
                }

                const el = document.createElement('div');
                el.className = 'user-list-item';
                el.innerHTML = `
                    <div class="user-status online"></div>
                    ${avatarUrl ? `<img src="${avatarUrl}" class="user-avatar-small" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">` : ''}
                    <div class="user-info-item">
                        <div class="user-name">${this.escapeHtml(displayName)}</div>
                        <div style="font-size: 0.7rem; opacity: 0.7;">Click to chat</div>
                    </div>
                `;
                el.onclick = () => this.selectUser(user.id, displayName);
                listEl.appendChild(el);
            }

        } catch (err) {
            console.error('Error loading users:', err);
            listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Error loading users</div>';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async selectUser(userId, displayName = null) {
        this.selectedUser = userId;
        const nameToShow = displayName || `User ${userId.substring(0, 8)}...`;
        document.getElementById('current-chat-title').textContent = `Chat with ${nameToShow}`;
        document.getElementById('secure-indicator').style.display = 'inline-flex';

        this.setComposerState({
            canType: true,
            canSend: Boolean(this.keys.private),
        });

        // Load messages
        this.loadMessages(userId);
    }

    // --- Messaging ---

    async sendMessage() {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        if (!this.selectedUser) {
            alert('Select a user from the directory before sending a message.');
            return;
        }

        if (!this.keys.private) {
            alert('Unlock or generate your secure keys to send encrypted messages.');
            this.showKeySetup();
            this.setComposerState({ canSend: false });
            return;
        }

        if (!input) {
            return;
        }

        const text = input.value.trim();
        if (!text) {
            return;
        }

        this.setComposerState({ canSend: false });
        if (sendBtn) {
            sendBtn.dataset.originalLabel = sendBtn.dataset.originalLabel || sendBtn.innerHTML;
            sendBtn.textContent = 'Sending…';
        }

        try {
            // 1. Fetch Recipient's Public Key
            const { data: pubData, error: pubError } = await supabase.storage
                .from('secure-files')
                .download(`keys/${this.selectedUser}/public.json`);

            if (pubError) {
                alert('Recipient has not set up secure keys yet.');
                return;
            }

            const recipientPubJWK = JSON.parse(await pubData.text());
            const recipientKey = await window.secureCrypto.importKey(recipientPubJWK, 'public');

            // 2. Encrypt Message
            const payload = await window.secureCrypto.encryptMessage(text, recipientKey);

            // 3. Upload Encrypted Message
            const timestamp = Date.now();
            const filename = `messages/${this.selectedUser}/${this.currentUser.id}_${timestamp}.json`;

            const { error: uploadError } = await supabase.storage
                .from('secure-files')
                .upload(filename, JSON.stringify(payload), {
                    contentType: 'application/json'
                });

            if (uploadError) throw uploadError;

            // 4. Add to UI (Optimistic)
            this.addMessageToUI(text, 'sent');
            input.value = '';

            // 5. Insert Metadata (so recipient knows)
            const { error: dbError } = await supabase
                .from('secure_messages_metadata')
                .insert({
                    sender_id: this.currentUser.id,
                    receiver_id: this.selectedUser,
                    storage_path: filename,
                    created_at: new Date().toISOString()
                });

            if (dbError) console.error('Metadata insert error:', dbError);

        } catch (err) {
            console.error('Send error:', err);
            alert('Failed to send message: ' + err.message);
        } finally {
            if (sendBtn) {
                sendBtn.innerHTML = sendBtn.dataset.originalLabel || '<span class="send-icon">➤</span>';
            }
            this.setComposerState({
                canSend: true,
            });
        }
    }

    async loadMessages(userId) {
        const container = document.getElementById('messages-container');
        container.innerHTML = ''; // Clear

        try {
            // Fetch metadata for messages between me and selected user
            const { data, error } = await supabase
                .from('secure_messages_metadata')
                .select('*')
                .or(`and(sender_id.eq.${this.currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${this.currentUser.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            for (const msg of data) {
                const isMe = msg.sender_id === this.currentUser.id;

                if (isMe) {
                    // I sent it. I can't decrypt it unless I stored a copy encrypted for myself!
                    // For this MVP, we'll just show "Encrypted Message Sent" unless we implement self-encryption.
                    // Or we can store the plain text in local storage for history.
                    // Let's show a placeholder for sent messages for now.
                    this.addMessageToUI('🔒 Encrypted Message Sent', 'sent');
                } else {
                    // I received it. Download and decrypt.
                    this.downloadAndDecryptMessage(msg.storage_path);
                }
            }

        } catch (err) {
            console.error('Load messages error:', err);
        }
    }

    async downloadAndDecryptMessage(path) {
        try {
            const { data, error } = await supabase.storage
                .from('secure-files')
                .download(path);

            if (error) throw error;

            const payload = JSON.parse(await data.text());
            const text = await window.secureCrypto.decryptMessage(payload, this.keys.private);

            this.addMessageToUI(text, 'received');

        } catch (err) {
            console.error('Decrypt error:', err);
            this.addMessageToUI('❌ Decryption Failed', 'received');
        }
    }

    addMessageToUI(text, type) {
        const container = document.getElementById('messages-container');
        const el = document.createElement('div');
        el.className = `message ${type} encrypted`;

        const lockIcon = document.createElement('span');
        lockIcon.className = 'message-lock-icon';
        lockIcon.textContent = '🔒 '; // Added space for visual separation

        const textNode = document.createTextNode(text);

        el.appendChild(lockIcon);
        el.appendChild(textNode);

        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    setComposerState(options) {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        if (input && Object.prototype.hasOwnProperty.call(options, 'canType')) {
            if (options.canType) {
                input.disabled = false;
                input.removeAttribute('disabled');
            } else {
                input.disabled = true;
                if (!input.hasAttribute('disabled')) {
                    input.setAttribute('disabled', 'disabled');
                }
            }
        }

        if (sendBtn && Object.prototype.hasOwnProperty.call(options, 'canSend')) {
            if (options.canSend) {
                sendBtn.disabled = false;
                sendBtn.removeAttribute('disabled');
            } else {
                sendBtn.disabled = true;
                if (!sendBtn.hasAttribute('disabled')) {
                    sendBtn.setAttribute('disabled', 'disabled');
                }
            }
        }
    }
}

// Initialize
window.secureChat = new SecureChatApp();
