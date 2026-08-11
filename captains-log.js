/**
 * Captain's Log
 * automatically records significant game events.
 */
class CaptainsLog {
    constructor(game) {
        this.game = game;
        this.entries = [];
    }

    init() {
        this.addEntry("Captain's Log initialized. Ready to record mission data.", "system");
    }

    /**
     * Add a log entry
     * @param {string} text - The log message
     * @param {string} type - 'info', 'success', 'warning', 'danger', 'system'
     */
    addEntry(text, type = 'info') {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: this.game.day || 0, // Game day
            realTime: new Date(),
            text: text,
            type: type
        };
        this.entries.unshift(entry); // Newest first

        // Limit log size to 500 entries
        if (this.entries.length > 500) {
            this.entries.pop();
        }

        // Optional: Notify UI if open
        if (document.getElementById('ep-log-list')) {
            this.renderEntry(entry, document.getElementById('ep-log-list'), true);
        }
    }

    getEntries() {
        return this.entries;
    }

    // --- UI Helper ---

    renderEntry(entry, container, prepend = false) {
        const div = document.createElement('div');
        div.className = 'ep-log-entry';
        div.style.cssText = `
            padding: 8px;
            border-bottom: 1px solid #334155;
            font-family: 'Space Mono', monospace;
            font-size: 0.9em;
            display: flex;
            gap: 10px;
        `;

        let color = '#94a3b8'; // default
        if (entry.type === 'success') color = '#4ade80';
        if (entry.type === 'warning') color = '#facc15';
        if (entry.type === 'danger') color = '#f87171';
        if (entry.type === 'system') color = '#38bdf8';

        div.innerHTML = `
            <div style="color:#64748b; min-width:60px;">Day ${Math.floor(entry.timestamp)}</div>
            <div style="color:${color};">${entry.text}</div>
        `;

        if (prepend) {
            container.prepend(div);
        } else {
            container.appendChild(div);
        }
    }
}

window.CaptainsLog = CaptainsLog;
