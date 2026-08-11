/**
 * User History (Flight Recorder)
 * Tracks user activity and provides a "Recent History" widget.
 */
class UserHistory {
    constructor() {
        this.maxItems = 10;
        this.storageKey = 'ita_flight_recorder';
        this.history = this.loadHistory();

        this.initUI();
    }

    loadHistory() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveHistory() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        this.updateUI();
    }

    addVisit(planet) {
        if (!planet) return;

        // Remove duplicate if exists
        this.history = this.history.filter(h => String(h.kepid) !== String(planet.kepid));

        // Add to top
        this.history.unshift({
            kepid: planet.kepid,
            name: planet.kepler_name || planet.kepoi_name,
            timestamp: new Date().toISOString()
        });

        // Limit size
        if (this.history.length > this.maxItems) {
            this.history.pop();
        }

        this.saveHistory();
    }

    initUI() {
        // Create sidebar widget
        const widget = document.createElement('div');
        widget.id = 'history-widget';
        widget.style.cssText = `
            position: fixed;
            top: 100px;
            right: -250px; /* Hidden initially */
            width: 250px;
            background: rgba(0, 0, 0, 0.9);
            border-left: 1px solid #ba944f;
            color: #fff;
            padding: 1rem;
            transition: right 0.3s ease;
            z-index: 1000;
            max-height: 80vh;
            overflow-y: auto;
            border-bottom-left-radius: 10px;
        `;

        // Toggle tab
        const toggle = document.createElement('div');
        toggle.innerHTML = '🕒 Recents';
        toggle.style.cssText = `
            position: absolute;
            left: -80px;
            top: 20px;
            width: 80px;
            height: 30px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #ba944f;
            border-right: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
            color: #ba944f;
            font-size: 0.8rem;
        `;

        toggle.onclick = () => {
            const currentRight = parseInt(widget.style.right || '-250');
            widget.style.right = currentRight === 0 ? '-250px' : '0';
        };

        widget.appendChild(toggle);

        // Content container
        const content = document.createElement('div');
        content.id = 'history-list';
        widget.appendChild(content);

        document.body.appendChild(widget);
        this.updateUI();
    }

    updateUI() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = '<div style="opacity:0.6;font-style:italic;">No recent flight data.</div>';
            return;
        }

        container.innerHTML = '<h3 style="margin-top:0;color:#ba944f;border-bottom:1px solid #333;padding-bottom:5px;">Flight Log</h3>';

        this.history.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = `
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                transition: background 0.2s;
            `;
            const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = `
                <div style="color:#fff;font-weight:bold;">${item.name}</div>
                <div style="color:rgba(255,255,255,0.5);font-size:0.8em;">${date}</div>
            `;
            div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.1)';
            div.onmouseout = () => div.style.background = 'transparent';
            div.onclick = () => {
                // Trigger view
                if (typeof window.showPlanetDetails === 'function') {
                    window.showPlanetDetails(item.kepid);
                } else if (window.databaseInstance && Array.isArray(window.databaseInstance.allData)) {
                    // Fallback check if global function isn't ready but DB is
                    const planet = window.databaseInstance.allData.find(d => String(d.kepid) === String(item.kepid));
                    // If we found the planet but can't show details, log warning or try alternative
                    if (planet) {
                        console.warn('showPlanetDetails not available, but planet found:', planet.kepler_name);
                    }
                }
            };
            container.appendChild(div);
        });
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.userHistory = new UserHistory();
});
