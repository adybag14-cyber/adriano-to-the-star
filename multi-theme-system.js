/**
 * Multi-Theme System with 20+ Pre-built Themes
 * Advanced theme management with CSS custom properties and smooth transitions
 * @author Agent 3 - Adriano To The Star
 * @version 1.0.0
 */

class MultiThemeSystem {
    constructor() {
        this.currentTheme = 'cosmic-dark';
        this.themes = this.initializeThemes();
        this.transitionDuration = 300;
        this.customProperties = new Map();
        this.observers = [];
        this.init();
    }

    initializeThemes() {
        return {
            'cosmic-dark': {
                name: 'Cosmic Dark',
                category: 'space',
                colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    accent: '#ec4899',
                    background: '#0f172a',
                    surface: '#1e293b',
                    text: '#f1f5f9',
                    textSecondary: '#94a3b8'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
                },
                effects: {
                    glow: '0 0 20px rgba(99, 102, 241, 0.5)',
                    shadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }
            },
            'stellar-light': {
                name: 'Stellar Light',
                category: 'space',
                colors: {
                    primary: '#3b82f6',
                    secondary: '#8b5cf6',
                    accent: '#f59e0b',
                    background: '#ffffff',
                    surface: '#f8fafc',
                    text: '#1e293b',
                    textSecondary: '#64748b'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    secondary: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
                },
                effects: {
                    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
                    shadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }
            },
            'nebula-purple': {
                name: 'Nebula Purple',
                category: 'space',
                colors: {
                    primary: '#9333ea',
                    secondary: '#ec4899',
                    accent: '#f59e0b',
                    background: '#1a0b2e',
                    surface: '#2d1b69',
                    text: '#f3e8ff',
                    textSecondary: '#c4b5fd'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                    secondary: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                    background: 'linear-gradient(180deg, #1a0b2e 0%, #2d1b69 100%)'
                },
                effects: {
                    glow: '0 0 30px rgba(147, 51, 234, 0.6)',
                    shadow: '0 15px 40px rgba(147, 51, 234, 0.3)'
                }
            },
            'solar-orange': {
                name: 'Solar Orange',
                category: 'space',
                colors: {
                    primary: '#f97316',
                    secondary: '#f59e0b',
                    accent: '#ef4444',
                    background: '#1c1917',
                    surface: '#292524',
                    text: '#fef3c7',
                    textSecondary: '#fde68a'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
                    secondary: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    background: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)'
                },
                effects: {
                    glow: '0 0 25px rgba(249, 115, 22, 0.5)',
                    shadow: '0 12px 35px rgba(249, 115, 22, 0.3)'
                }
            },
            'ocean-blue': {
                name: 'Ocean Blue',
                category: 'nature',
                colors: {
                    primary: '#0ea5e9',
                    secondary: '#06b6d4',
                    accent: '#14b8a6',
                    background: '#083344',
                    surface: '#164e63',
                    text: '#e0f2fe',
                    textSecondary: '#7dd3fc'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                    secondary: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
                    background: 'linear-gradient(180deg, #083344 0%, #164e63 100%)'
                },
                effects: {
                    glow: '0 0 20px rgba(14, 165, 233, 0.5)',
                    shadow: '0 10px 30px rgba(14, 165, 233, 0.3)'
                }
            },
            'forest-green': {
                name: 'Forest Green',
                category: 'nature',
                colors: {
                    primary: '#16a34a',
                    secondary: '#22c55e',
                    accent: '#84cc16',
                    background: '#052e16',
                    surface: '#14532d',
                    text: '#dcfce7',
                    textSecondary: '#86efac'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                    secondary: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
                    background: 'linear-gradient(180deg, #052e16 0%, #14532d 100%)'
                },
                effects: {
                    glow: '0 0 20px rgba(22, 163, 74, 0.5)',
                    shadow: '0 10px 30px rgba(22, 163, 74, 0.3)'
                }
            },
            'sunset-red': {
                name: 'Sunset Red',
                category: 'nature',
                colors: {
                    primary: '#dc2626',
                    secondary: '#ef4444',
                    accent: '#f97316',
                    background: '#450a0a',
                    surface: '#7f1d1d',
                    text: '#fee2e2',
                    textSecondary: '#fca5a5'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    secondary: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    background: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 100%)'
                },
                effects: {
                    glow: '0 0 25px rgba(220, 38, 38, 0.5)',
                    shadow: '0 12px 35px rgba(220, 38, 38, 0.3)'
                }
            },
            'minimal-white': {
                name: 'Minimal White',
                category: 'minimal',
                colors: {
                    primary: '#374151',
                    secondary: '#6b7280',
                    accent: '#3b82f6',
                    background: '#ffffff',
                    surface: '#f9fafb',
                    text: '#111827',
                    textSecondary: '#4b5563'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
                    secondary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)'
                },
                effects: {
                    glow: '0 0 10px rgba(55, 65, 81, 0.2)',
                    shadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }
            },
            'cyberpunk': {
                name: 'Cyberpunk',
                category: 'futuristic',
                colors: {
                    primary: '#00ff88',
                    secondary: '#ff0080',
                    accent: '#ffff00',
                    background: '#0a0a0a',
                    surface: '#1a1a1a',
                    text: '#00ff88',
                    textSecondary: '#ff0080'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #00ff88 0%, #00ffff 100%)',
                    secondary: 'linear-gradient(135deg, #ff0080 0%, #ff00ff 100%)',
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)'
                },
                effects: {
                    glow: '0 0 30px rgba(0, 255, 136, 0.8)',
                    shadow: '0 15px 40px rgba(0, 255, 136, 0.4)'
                }
            },
            'retro-terminal': {
                name: 'Retro Terminal',
                category: 'retro',
                colors: {
                    primary: '#00ff00',
                    secondary: '#00aa00',
                    accent: '#ffff00',
                    background: '#000000',
                    surface: '#111111',
                    text: '#00ff00',
                    textSecondary: '#00aa00'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)',
                    secondary: 'linear-gradient(135deg, #ffff00 0%, #ffaa00 100%)',
                    background: 'linear-gradient(180deg, #000000 0%, #111111 100%)'
                },
                effects: {
                    glow: '0 0 20px rgba(0, 255, 0, 0.6)',
                    shadow: '0 10px 30px rgba(0, 255, 0, 0.3)'
                }
            },
            'golden-age': {
                name: 'Golden Age',
                category: 'elegant',
                colors: {
                    primary: '#fbbf24',
                    secondary: '#f59e0b',
                    accent: '#dc2626',
                    background: '#451a03',
                    surface: '#78350f',
                    text: '#fef3c7',
                    textSecondary: '#fde68a'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    secondary: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    background: 'linear-gradient(180deg, #451a03 0%, #78350f 100%)'
                },
                effects: {
                    glow: '0 0 25px rgba(251, 191, 36, 0.5)',
                    shadow: '0 12px 35px rgba(251, 191, 36, 0.3)'
                }
            },
            'crystal-blue': {
                name: 'Crystal Blue',
                category: 'elegant',
                colors: {
                    primary: '#60a5fa',
                    secondary: '#3b82f6',
                    accent: '#8b5cf6',
                    background: '#1e3a8a',
                    surface: '#1e40af',
                    text: '#dbeafe',
                    textSecondary: '#93c5fd'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)'
                },
                effects: {
                    glow: '0 0 25px rgba(96, 165, 250, 0.5)',
                    shadow: '0 12px 35px rgba(96, 165, 250, 0.3)'
                }
            },
            'midnight-purple': {
                name: 'Midnight Purple',
                category: 'dark',
                colors: {
                    primary: '#a855f7',
                    secondary: '#9333ea',
                    accent: '#ec4899',
                    background: '#0f0a1f',
                    surface: '#1f1b3a',
                    text: '#f3e8ff',
                    textSecondary: '#d8b4fe'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    secondary: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    background: 'linear-gradient(180deg, #0f0a1f 0%, #1f1b3a 100%)'
                },
                effects: {
                    glow: '0 0 30px rgba(168, 85, 247, 0.6)',
                    shadow: '0 15px 40px rgba(168, 85, 247, 0.3)'
                }
            },
            'volcanic-red': {
                name: 'Volcanic Red',
                category: 'dark',
                colors: {
                    primary: '#ef4444',
                    secondary: '#dc2626',
                    accent: '#f97316',
                    background: '#450a0a',
                    surface: '#7f1d1d',
                    text: '#fee2e2',
                    textSecondary: '#fca5a5'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    secondary: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    background: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 100%)'
                },
                effects: {
                    glow: '0 0 30px rgba(239, 68, 68, 0.6)',
                    shadow: '0 15px 40px rgba(239, 68, 68, 0.3)'
                }
            },
            'arctic-white': {
                name: 'Arctic White',
                category: 'light',
                colors: {
                    primary: '#0284c7',
                    secondary: '#0ea5e9',
                    accent: '#06b6d4',
                    background: '#f8fafc',
                    surface: '#ffffff',
                    text: '#0f172a',
                    textSecondary: '#475569'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                    secondary: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
                },
                effects: {
                    glow: '0 0 15px rgba(2, 132, 199, 0.3)',
                    shadow: '0 8px 25px rgba(2, 132, 199, 0.2)'
                }
            },
            'desert-sand': {
                name: 'Desert Sand',
                category: 'light',
                colors: {
                    primary: '#d97706',
                    secondary: '#ea580c',
                    accent: '#dc2626',
                    background: '#fef3c7',
                    surface: '#fffbeb',
                    text: '#78350f',
                    textSecondary: '#92400e'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
                    secondary: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    background: 'linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)'
                },
                effects: {
                    glow: '0 0 15px rgba(217, 119, 6, 0.3)',
                    shadow: '0 8px 25px rgba(217, 119, 6, 0.2)'
                }
            },
            'aurora-borealis': {
                name: 'Aurora Borealis',
                category: 'special',
                colors: {
                    primary: '#10b981',
                    secondary: '#06b6d4',
                    accent: '#8b5cf6',
                    background: '#0f172a',
                    surface: '#1e293b',
                    text: '#ecfdf5',
                    textSecondary: '#a7f3d0'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
                    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                },
                effects: {
                    glow: '0 0 35px rgba(16, 185, 129, 0.7)',
                    shadow: '0 20px 50px rgba(16, 185, 129, 0.4)'
                }
            },
            'galaxy-pink': {
                name: 'Galaxy Pink',
                category: 'special',
                colors: {
                    primary: '#ec4899',
                    secondary: '#f472b6',
                    accent: '#fbbf24',
                    background: '#500724',
                    surface: '#831843',
                    text: '#fce7f3',
                    textSecondary: '#f9a8d4'
                },
                gradients: {
                    primary: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                    secondary: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    background: 'linear-gradient(180deg, #500724 0%, #831843 100%)'
                },
                effects: {
                    glow: '0 0 30px rgba(236, 72, 153, 0.6)',
                    shadow: '0 15px 40px rgba(236, 72, 153, 0.3)'
                }
            }
        };
    }

    init() {
        this.loadSavedTheme();
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.createThemeSelector();
        this.startAutoThemeDetection();
    }

    applyTheme(themeName, transition = true) {
        const theme = this.themes[themeName];
        if (!theme) return false;

        if (transition) {
            this.transitionToTheme(theme);
        } else {
            this.setThemeProperties(theme);
        }

        this.currentTheme = themeName;
        this.saveThemePreference(themeName);
        this.notifyThemeChange(themeName);
        
        return true;
    }

    transitionToTheme(theme) {
        const root = document.documentElement;
        root.style.transition = `all ${this.transitionDuration}ms ease-in-out`;
        
        this.setThemeProperties(theme);
        
        setTimeout(() => {
            root.style.transition = '';
        }, this.transitionDuration);
    }

    setThemeProperties(theme) {
        const root = document.documentElement;
        
        // Set color variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });

        // Set gradient variables
        Object.entries(theme.gradients).forEach(([key, value]) => {
            root.style.setProperty(`--gradient-${key}`, value);
        });

        // Set effect variables
        Object.entries(theme.effects).forEach(([key, value]) => {
            root.style.setProperty(`--effect-${key}`, value);
        });

        // Set theme metadata
        root.style.setProperty('--theme-name', theme.name);
        root.style.setProperty('--theme-category', theme.category);
    }

    createThemeSelector() {
        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <div class="theme-selector-header">
                <h3>Theme Selector</h3>
                <button class="theme-selector-toggle">×</button>
            </div>
            <div class="theme-grid">
                ${Object.entries(this.themes).map(([key, theme]) => `
                    <div class="theme-option ${key === this.currentTheme ? 'active' : ''}" 
                         data-theme="${key}"
                         title="${theme.name}">
                        <div class="theme-preview" style="
                            background: ${theme.colors.primary};
                            border: 2px solid ${theme.colors.accent};
                        "></div>
                        <span class="theme-name">${theme.name}</span>
                        <span class="theme-category">${theme.category}</span>
                    </div>
                `).join('')}
            </div>
            <div class="theme-controls">
                <button class="random-theme-btn">Random Theme</button>
                <button class="auto-theme-btn">Auto Theme</button>
                <button class="custom-theme-btn">Create Custom</button>
            </div>
        `;

        this.addThemeSelectorStyles();
        document.body.appendChild(selector);
        this.setupThemeSelectorEvents(selector);
    }

    addThemeSelectorStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .theme-selector {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--color-surface);
                border: 1px solid var(--color-primary);
                border-radius: 12px;
                padding: 20px;
                min-width: 300px;
                max-width: 400px;
                z-index: 10000;
                box-shadow: var(--effect-shadow);
                transform: translateX(350px);
                transition: transform 0.3s ease;
            }

            .theme-selector.open {
                transform: translateX(0);
            }

            .theme-selector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                color: var(--color-text);
            }

            .theme-selector-toggle {
                background: none;
                border: none;
                color: var(--color-text);
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
                max-height: 400px;
                overflow-y: auto;
            }

            .theme-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                padding: 10px;
                border-radius: 8px;
                transition: all 0.2s ease;
                border: 2px solid transparent;
            }

            .theme-option:hover {
                background: var(--color-background);
                transform: translateY(-2px);
            }

            .theme-option.active {
                border-color: var(--color-accent);
                background: var(--color-surface);
            }

            .theme-preview {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                margin-bottom: 8px;
                position: relative;
                overflow: hidden;
            }

            .theme-preview::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                background: inherit;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.7;
            }

            .theme-name {
                font-size: 12px;
                font-weight: 600;
                color: var(--color-text);
                text-align: center;
                margin-bottom: 2px;
            }

            .theme-category {
                font-size: 10px;
                color: var(--color-text-secondary);
                text-align: center;
                opacity: 0.8;
            }

            .theme-controls {
                display: flex;
                gap: 10px;
            }

            .theme-controls button {
                flex: 1;
                padding: 8px 12px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .theme-controls button:hover {
                background: var(--color-accent);
                transform: translateY(-1px);
            }

            .theme-selector-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--color-primary);
                border: none;
                color: white;
                cursor: pointer;
                z-index: 9999;
                box-shadow: var(--effect-shadow);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: all 0.3s ease;
            }

            .theme-selector-toggle-btn:hover {
                transform: scale(1.1);
                background: var(--color-accent);
            }
        `;
        document.head.appendChild(style);
    }

    setupThemeSelectorEvents(selector) {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-selector-toggle-btn';
        toggleBtn.innerHTML = '🎨';
        toggleBtn.setAttribute('aria-label', 'Toggle Theme Selector');
        document.body.appendChild(toggleBtn);

        // Toggle selector
        toggleBtn.addEventListener('click', () => {
            selector.classList.toggle('open');
        });

        // Close button
        selector.querySelector('.theme-selector-toggle').addEventListener('click', () => {
            selector.classList.remove('open');
        });

        // Theme selection
        selector.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeName = option.dataset.theme;
                this.applyTheme(themeName);
                
                // Update active state
                selector.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            });
        });

        // Random theme
        selector.querySelector('.random-theme-btn').addEventListener('click', () => {
            const themeKeys = Object.keys(this.themes);
            const randomKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
            this.applyTheme(randomKey);
            
            // Update active state
            selector.querySelectorAll('.theme-option').forEach(opt => {
                opt.classList.remove('active');
            });
            selector.querySelector(`[data-theme="${randomKey}"]`).classList.add('active');
        });

        // Auto theme (based on time of day)
        selector.querySelector('.auto-theme-btn').addEventListener('click', () => {
            this.applyAutoTheme();
        });

        // Custom theme creation
        selector.querySelector('.custom-theme-btn').addEventListener('click', () => {
            this.openCustomThemeEditor();
        });
    }

    applyAutoTheme() {
        const hour = new Date().getHours();
        let themeName;

        if (hour >= 6 && hour < 12) {
            // Morning - light themes
            themeName = 'arctic-white';
        } else if (hour >= 12 && hour < 18) {
            // Afternoon - bright themes
            themeName = 'stellar-light';
        } else if (hour >= 18 && hour < 21) {
            // Evening - sunset themes
            themeName = 'sunset-red';
        } else {
            // Night - dark themes
            themeName = 'cosmic-dark';
        }

        this.applyTheme(themeName);
        
        // Update selector
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.remove('active');
        });
        document.querySelector(`[data-theme="${themeName}"]`)?.classList.add('active');
    }

    startAutoThemeDetection() {
        // Check for system preference changes
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addListener((e) => {
                if (e.matches) {
                    this.applyTheme('cosmic-dark');
                } else {
                    this.applyTheme('stellar-light');
                }
            });
        }

        // Time-based theme changes
        setInterval(() => {
            const savedPreference = localStorage.getItem('auto-theme-enabled');
            if (savedPreference === 'true') {
                this.applyAutoTheme();
            }
        }, 60000); // Check every minute
    }

    openCustomThemeEditor() {
        // Implementation for custom theme editor
        console.log('Custom theme editor - coming soon!');
        // This would open a modal for creating custom themes
    }

    saveThemePreference(themeName) {
        localStorage.setItem('selected-theme', themeName);
    }

    loadSavedTheme() {
        const saved = localStorage.getItem('selected-theme');
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
        }
    }

    notifyThemeChange(themeName) {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: themeName, themeData: this.themes[themeName] }
        });
        document.dispatchEvent(event);
    }

    // Public API methods
    getAvailableThemes() {
        return Object.entries(this.themes).map(([key, theme]) => ({
            key,
            name: theme.name,
            category: theme.category
        }));
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    addCustomTheme(name, themeData) {
        this.themes[name] = themeData;
        // Refresh selector
        const selector = document.querySelector('.theme-selector');
        if (selector) {
            selector.remove();
            this.createThemeSelector();
        }
    }

    // Accessibility features
    getHighContrastVersion(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return null;

        return {
            ...theme,
            name: `${theme.name} (High Contrast)`,
            colors: {
                ...theme.colors,
                text: this.getContrastColor(theme.colors.background),
                textSecondary: this.getContrastColor(theme.colors.surface)
            }
        };
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    // Performance optimization
    preloadTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        // Preload any theme-specific assets
        Object.values(theme.gradients).forEach(gradient => {
            // Create offscreen element to preload gradient
            const div = document.createElement('div');
            div.style.background = gradient;
            div.style.position = 'absolute';
            div.style.left = '-9999px';
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 100);
        });
    }
}

// Initialize the multi-theme system
const multiThemeSystem = new MultiThemeSystem();

// Export for use in other modules
window.MultiThemeSystem = MultiThemeSystem;
window.themeSystem = multiThemeSystem;
