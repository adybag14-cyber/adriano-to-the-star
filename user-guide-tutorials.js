/**
 * User Guide and Tutorials
 * User guides and tutorials
 */
(function() {
    'use strict';

    class UserGuideTutorials {
        constructor() {
            this.guides = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('user-guides')) {
                const guides = document.createElement('div');
                guides.id = 'user-guides';
                guides.className = 'user-guides';
                guides.innerHTML = `<h2>User Guides</h2>`;
                document.body.appendChild(guides);
            }
        }

        addGuide(title, content) {
            this.guides.push({ title, content });
        }

        showGuide(title) {
            const guide = this.guides.find(g => g.title === title);
            if (guide) {
                return guide.content;
            }
            return null;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.userGuides = new UserGuideTutorials();
        });
    } else {
        window.userGuides = new UserGuideTutorials();
    }
})();

