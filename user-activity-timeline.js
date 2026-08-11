/**
 * User Activity Timeline Visualization
 * Visualize user activity over time
 */
(function() {
    'use strict';

    class UserActivityTimeline {
        constructor() {
            this.activities = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('activity-timeline')) {
                const timeline = document.createElement('div');
                timeline.id = 'activity-timeline';
                timeline.className = 'activity-timeline';
                timeline.innerHTML = `
                    <div class="timeline-header">
                        <h2>Activity Timeline</h2>
                    </div>
                    <div class="timeline-content" id="timeline-content"></div>
                `;
                document.body.appendChild(timeline);
            }
        }

        addActivity(activity) {
            this.activities.push({
                ...activity,
                timestamp: new Date().toISOString()
            });
            this.render();
        }

        render() {
            const content = document.getElementById('timeline-content');
            if (!content) return;

            const sorted = this.activities.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            content.innerHTML = sorted.map(activity => `
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content-item">
                        <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                        <div class="activity-action">${activity.action}</div>
                        <div class="activity-details">${activity.details || ''}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.activityTimeline = new UserActivityTimeline();
        });
    } else {
        window.activityTimeline = new UserActivityTimeline();
    }
})();


