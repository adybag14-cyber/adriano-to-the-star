/**
 * Changelog and Release Notes System
 * Manage changelog and release notes
 */
(function() {
    'use strict';

    class ChangelogReleaseNotes {
        constructor() {
            this.releases = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.loadReleases();
            this.trackEvent('changelog_release_initialized');
        }

        setupUI() {
            if (!document.getElementById('changelog')) {
                const changelog = document.createElement('div');
                changelog.id = 'changelog';
                changelog.className = 'changelog';
                changelog.innerHTML = `<h2>Changelog</h2>`;
                document.body.appendChild(changelog);
            }
        }

        addRelease(version, date, notes) {
            const release = {
                version: version,
                date: date,
                notes: notes
            };
            this.releases.unshift(release);
            this.saveReleases();
            return release;
        }

        getLatestRelease() {
            return this.releases[0] || null;
        }

        saveReleases() {
            localStorage.setItem('releases', JSON.stringify(this.releases));
        }

        loadReleases() {
            const stored = localStorage.getItem('releases');
            if (stored) {
                try {
                    this.releases = JSON.parse(stored);
                } catch (error) {
                    this.releases = [];
                }
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`changelog_release_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.changelog = new ChangelogReleaseNotes();
        });
    } else {
        window.changelog = new ChangelogReleaseNotes();
    }
})();

