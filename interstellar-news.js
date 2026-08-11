/**
 * Interstellar News Network (INN)
 * Fetches and displays space news updates.
 */
class InterstellarNews {
    constructor() {
        this.newsItems = [
            { title: "New Exoplanet Discovered in Habitat Zone", source: "NASA Exoplanet Archive", date: "2024-12-05" },
            { title: "James Webb Telescope Detects Water Vapor on K2-18b", source: "ESA", date: "2024-12-01" },
            { title: "Interstellar Trade Route Opened to Trappist-1", source: "ITA Council", date: "2025-01-15" },
            { title: "Anomalous Signal Detected in Sector 7G", source: "Deep Space Network", date: "2025-01-20" }
        ];

        this.init();
    }

    init() {
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #news-ticker {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: rgba(10, 10, 20, 0.95);
                border-top: 1px solid #ba944f;
                color: #ba944f;
                font-family: 'Courier New', monospace;
                padding: 5px 0;
                z-index: 9999;
                overflow: hidden;
                display: none; /* Hidden by default, toggled via UI */
            }
            .ticker-content {
                display: inline-block;
                white-space: nowrap;
                animation: ticker 30s linear infinite;
                padding-left: 100%;
            }
            .news-item {
                display: inline-block;
                margin-right: 50px;
            }
            .news-source {
                color: #4ade80;
                font-size: 0.8em;
                margin-right: 5px;
            }
            @keyframes ticker {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100%); }
            }
            #toggle-news-btn {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 10000;
                background: rgba(0,0,0,0.5);
                border: 1px solid #ba944f;
                color: #ba944f;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                transition: all 0.3s ease;
            }
            #toggle-news-btn:hover {
                background: rgba(186, 148, 79, 0.2);
                box-shadow: 0 0 10px rgba(186, 148, 79, 0.3);
            }
        `;
        document.head.appendChild(style);

        this.renderTicker();
        this.renderToggle();
    }

    renderTicker() {
        const container = document.createElement('div');
        container.id = 'news-ticker';

        const content = document.createElement('div');
        content.className = 'ticker-content';

        this.newsItems.forEach(item => {
            const span = document.createElement('span');
            span.className = 'news-item';
            span.innerHTML = `<span class="news-source">[${item.source}]</span> ${item.title}`;
            content.appendChild(span);
        });

        // Duplicate content for smooth looping if needed, but CSS animation padding-left handles entry
        container.appendChild(content);
        document.body.appendChild(container);
    }

    renderToggle() {
        const btn = document.createElement('button');
        btn.id = 'toggle-news-btn';
        btn.innerHTML = '📰';
        btn.title = "Toggle News Feed";
        btn.onclick = () => this.toggleNews();
        document.body.appendChild(btn);
    }

    toggleNews() {
        const ticker = document.getElementById('news-ticker');
        if (ticker.style.display === 'block') {
            ticker.style.display = 'none';
        } else {
            ticker.style.display = 'block';
        }
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.interstellarNews = new InterstellarNews();
});
