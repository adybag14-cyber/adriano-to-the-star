/**
 * Cosmic Chat System
 * Phase 12: The Omni-Verse
 * Real-time messaging for Deities (Players).
 */

class CosmicChat {
    constructor() {
        this.messages = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        console.log("💬 Cosmic Chat: ONLINE");
        this.channel = new BroadcastChannel('cosmic_chat_channel');
        this.channel.onmessage = (event) => {
            this.addMessage(event.data.user, event.data.text, false);
        };
        this.createChatButton();
    }

    createChatButton() {
        const btn = document.createElement('button');
        btn.innerHTML = "💬 Gen Chat";
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            color: #a78bfa;
            border: 1px solid #a78bfa;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
        `;
        btn.addEventListener('click', () => this.toggleChat());
        document.body.appendChild(btn);
    }

    toggleChat() {
        if (this.isOpen) {
            document.getElementById('cosmic-chat-window')?.remove();
            this.isOpen = false;
        } else {
            this.openChat();
            this.isOpen = true;
        }
    }

    openChat() {
        const chatWindow = document.createElement('div');
        chatWindow.id = 'cosmic-chat-window';
        chatWindow.style.cssText = `
            position: fixed;
            bottom: 70px;
            left: 20px;
            width: 300px;
            height: 400px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #a78bfa;
            border-radius: 10px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            font-family: 'Courier New', monospace;
        `;

        chatWindow.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #333; color: #a78bfa; font-weight: bold;">
                Global Channel (Region: Earth-Prime)
            </div>
            <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 10px; color: #ddd; font-size: 0.8rem;">
                <div style="opacity: 0.5; font-style: italic;">Connecting to subspace...</div>
            </div>
            <div style="padding: 10px; border-top: 1px solid #333; display: flex;">
                <input type="text" id="chat-input" placeholder="Broadcast message..." style="flex: 1; background: #222; border: none; color: white; padding: 5px;">
                <button id="send-btn" style="background: #a78bfa; border: none; cursor: pointer; color: black; font-weight: bold;">></button>
            </div>
        `;

        document.body.appendChild(chatWindow);

        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const msgContainer = document.getElementById('chat-messages');

        const send = () => {
            const text = input.value;
            if (!text) return;
            this.addMessage("Me", text, true);
            this.channel.postMessage({ user: "RemoteUser", text: text }); // Broadcast
            input.value = "";
        };

        sendBtn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') send();
        });

        setTimeout(() => this.addMessage("System", "Subspace Link Established (BroadcastChannel).", false), 500);
    }

    addMessage(user, text, isMe) {
        const container = document.getElementById('chat-messages');
        if (container) {
            const msg = document.createElement('div');
            msg.style.marginBottom = "5px";
            msg.style.textAlign = isMe ? "right" : "left";
            msg.innerHTML = isMe
                ? `<span style="background: #333; padding: 2px 5px; border-radius: 4px;">${text}</span>`
                : `<span style="color: #a78bfa;">[${user}]</span>: ${text}`;
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;
        }
    }
}

if (typeof window !== 'undefined') {
    window.CosmicChat = CosmicChat;
    window.cosmicChat = new CosmicChat();
}
