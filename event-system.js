/**
 * Event System
 * Random and story events that add variety to gameplay
 */

class GameEvent {
    constructor(id, title, desc, type, effects, choices = null) {
        this.id = id;
        this.title = title;
        this.desc = desc;
        this.type = type; // 'random', 'story', 'crisis', 'opportunity'
        this.effects = effects; // Applied when event triggers (or based on choice)
        this.choices = choices; // Array of { text, effects } or null for auto-resolve
    }

    static ICONS = {
        random: '🎲',
        story: '📜',
        crisis: '⚠️',
        opportunity: '✨'
    };
}

class EventManager {
    constructor(game) {
        this.game = game;
        this.events = [];
        this.history = []; // Past events
        this.cooldown = 0;
        this.minCooldown = 30; // Min 30 game ticks between events
    }

    init() {
        this.registerEvents();
        console.log("Event System Initialized:", this.events.length, "events");
    }

    registerEvents() {
        // Random Events
        this.add('meteor_shower', 'Meteor Shower',
            'A spectacular meteor shower lights up the sky! Minerals rain down on the surface.',
            'random',
            { resources: { minerals: 50 } });

        this.add('solar_flare', 'Solar Flare',
            'A massive solar flare hits the planet. Your solar arrays are supercharged!',
            'random',
            { resources: { energy: 100 } });

        this.add('disease_outbreak', 'Disease Outbreak',
            'A mysterious illness spreads through the colony. Morale is affected.',
            'crisis',
            { morale: -15 });

        this.add('refugee_arrival', 'Refugee Ship',
            'A refugee ship arrives from a dying world. They seek shelter in your colony.',
            'opportunity',
            null, // Has choices
            [
                { text: 'Welcome them (+ Colonists, - Food)', effects: { colonists: 3, resources: { food: -50 } } },
                { text: 'Turn them away (No change)', effects: {} }
            ]);

        this.add('resource_vein', 'Resource Discovery',
            'Scouts have discovered a rich mineral vein nearby!',
            'opportunity',
            { resources: { minerals: 150 } });

        this.add('equipment_malfunction', 'Equipment Malfunction',
            'Critical equipment has malfunctioned. Repairs are needed.',
            'crisis',
            { resources: { energy: -30, minerals: -20 } });

        this.add('alien_artifact', 'Alien Artifact',
            'Your colonists have discovered a mysterious alien artifact!',
            'story',
            null,
            [
                { text: 'Study it (+Data)', effects: { resources: { data: 100 } } },
                { text: 'Sell it (+Credits)', effects: { resources: { credits: 500 } } },
                { text: 'Destroy it (Safe)', effects: { morale: 5 } }
            ]);

        this.add('bountiful_harvest', 'Bountiful Harvest',
            'The farms have produced an exceptional yield this season!',
            'random',
            { resources: { food: 80 } });

        this.add('dust_storm', 'Dust Storm',
            'A massive dust storm has reduced solar panel efficiency temporarily.',
            'crisis',
            { resources: { energy: -40 } });

        this.add('tech_breakthrough', 'Research Breakthrough',
            'Your scientists have made an unexpected discovery!',
            'story',
            { resources: { data: 75 } });

        // Story Milestones (triggered by conditions)
        this.add('first_child', 'New Generation',
            'The first child has been born in the colony! A new chapter begins.',
            'story',
            { morale: 20 });
    }

    add(id, title, desc, type, effects, choices = null) {
        this.events.push(new GameEvent(id, title, desc, type, effects, choices));
    }

    update() {
        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        // Random chance for event
        if (Math.random() < 0.002) { // ~0.2% per tick
            this.triggerRandom();
        }

        // Check story triggers
        this.checkStoryTriggers();
    }

    checkStoryTriggers() {
        const g = this.game;

        // First child born at 15 colonists
        if (g.colonists.length >= 15 && !this.hasOccurred('first_child')) {
            this.trigger('first_child');
        }
    }

    hasOccurred(eventId) {
        return this.history.some(e => e.id === eventId);
    }

    triggerRandom() {
        const randomEvents = this.events.filter(e =>
            (e.type === 'random' || e.type === 'crisis' || e.type === 'opportunity') &&
            !this.hasOccurred(e.id) // Only trigger each once
        );

        if (randomEvents.length === 0) return;

        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        this.trigger(event.id);
    }

    trigger(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.history.push({ id: event.id, day: this.game.day });
        this.cooldown = this.minCooldown;

        if (event.choices) {
            this.showChoiceModal(event);
        } else {
            this.applyEffects(event.effects);
            this.showNotification(event);
            if (this.game.triggerVisuals) {
                this.game.triggerVisuals(event.id);
            }
        }
    }

    applyEffects(effects) {
        if (!effects) return;

        if (effects.resources) {
            for (const [res, amount] of Object.entries(effects.resources)) {
                this.game.resources[res] = Math.max(0, (this.game.resources[res] || 0) + amount);
            }
        }

        if (effects.morale !== undefined) {
            this.game.morale = Math.max(0, Math.min(100, this.game.morale + effects.morale));
        }

        if (effects.colonists) {
            for (let i = 0; i < effects.colonists; i++) {
                this.game.addColonist();
            }
        }

        this.game.updateResourceUI();
    }

    showNotification(event) {
        const icon = GameEvent.ICONS[event.type];
        const color = event.type === 'crisis' ? 'danger' : (event.type === 'opportunity' ? 'success' : 'info');
        this.game.notify(`${icon} ${event.title}: ${event.desc}`, color);
    }

    showChoiceModal(event) {
        let modal = document.getElementById('ep-event-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-event-modal';
            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #38bdf8;border-radius:15px;padding:30px;z-index:1001;min-width:400px;max-width:500px;';
            document.body.appendChild(modal);
        }

        const icon = GameEvent.ICONS[event.type];
        const borderColor = {
            random: '#64748b',
            story: '#fbbf24',
            crisis: '#ef4444',
            opportunity: '#22c55e'
        }[event.type];

        modal.style.borderColor = borderColor;

        modal.innerHTML = `
            <div style="text-align:center;font-size:3em;margin-bottom:10px;">${icon}</div>
            <h2 style="color:#38bdf8;margin:0 0 10px 0;text-align:center;">${event.title}</h2>
            <p style="color:#94a3b8;text-align:center;margin-bottom:20px;">${event.desc}</p>
            <div id="event-choices" style="display:flex;flex-direction:column;gap:10px;"></div>
        `;

        const choicesDiv = modal.querySelector('#event-choices');
        event.choices.forEach((choice, idx) => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.style.cssText = 'padding:12px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;cursor:pointer;transition:background 0.2s;';
            btn.onmouseenter = () => btn.style.background = '#334155';
            btn.onmouseleave = () => btn.style.background = '#1e293b';
            btn.onclick = () => {
                this.applyEffects(choice.effects);
                this.game.notify(`${icon} ${event.title}: You chose to ${choice.text.toLowerCase()}`, 'info');
                modal.remove();
            };
            choicesDiv.appendChild(btn);
        });
    }

    // Get recent events for UI
    getRecent(count = 5) {
        return this.history.slice(-count).reverse();
    }
}

window.GameEvent = GameEvent;
window.EventManager = EventManager;
