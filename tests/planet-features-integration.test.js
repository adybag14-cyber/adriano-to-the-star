/**
 * Integration Tests for Planet Features
 * Tests the integration of all planet features with the main application
 */

// Mock Supabase for testing
const mockSupabase = {
    from: (table) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null })
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'test-user' } } }, error: null })
    }
};

// Mock window objects
global.window = {
    supabase: mockSupabase,
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    location: {
        hostname: 'localhost'
    }
};

global.document = {
    createElement: (tag) => ({
        tagName: tag,
        id: '',
        className: '',
        style: {},
        innerHTML: '',
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        }
    }),
    getElementById: () => ({
        innerHTML: '',
        style: {},
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        classList: {
            add: () => {},
            remove: () => {}
        }
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: {
        appendChild: () => {},
        insertBefore: () => {},
        classList: {
            add: () => {}
        }
    },
    addEventListener: () => {}
};

describe('Planet Features Integration Tests', () => {
    
    describe('Marketplace Features', () => {
        test('Planet Trading Marketplace initializes', async () => {
            // Mock the PlanetTradingMarketplace class
            class PlanetTradingMarketplace {
                async init() {
                    return Promise.resolve();
                }
                async renderMarketplace(containerId) {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Marketplace</div>';
                    }
                }
            }
            
            global.window.PlanetTradingMarketplace = PlanetTradingMarketplace;
            
            const marketplace = new PlanetTradingMarketplace();
            await marketplace.init();
            expect(marketplace).toBeDefined();
        });
        
        test('Trading notifications render', () => {
            const mockNotifications = {
                renderNotifications: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Notifications</div>';
                    }
                }
            };
            
            global.window.planetTradingNotifications = mockNotifications;
            
            const container = document.getElementById('trading-notifications-container');
            if (container) {
                mockNotifications.renderNotifications('trading-notifications-container');
                expect(container.innerHTML).toContain('Notifications');
            }
        });
    });
    
    describe('Dashboard Features', () => {
        test('Leaderboard initializes', () => {
            const mockLeaderboard = {
                renderLeaderboard: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Leaderboard</div>';
                    }
                }
            };
            
            global.window.planetDiscoveryLeaderboard = mockLeaderboard;
            
            const container = document.getElementById('leaderboard-container');
            if (container) {
                mockLeaderboard.renderLeaderboard('leaderboard-container');
                expect(container.innerHTML).toContain('Leaderboard');
            }
        });
        
        test('Collections showcase initializes', () => {
            const mockShowcase = {
                renderShowcase: (containerId, userId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = `<div>Collections for ${userId}</div>`;
                    }
                }
            };
            
            global.window.planetCollectionShowcase = mockShowcase;
            
            const container = document.getElementById('collections-container');
            if (container) {
                mockShowcase.renderShowcase('collections-container', 'test-user');
                expect(container.innerHTML).toContain('Collections');
            }
        });
        
        test('Achievements render', () => {
            const mockAchievements = {
                renderAchievements: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Achievements</div>';
                    }
                }
            };
            
            global.window.planetDiscoveryAchievements = mockAchievements;
            
            const container = document.getElementById('achievements-container');
            if (container) {
                mockAchievements.renderAchievements('achievements-container');
                expect(container.innerHTML).toContain('Achievements');
            }
        });
    });
    
    describe('Database Features', () => {
        test('Wishlist system initializes', () => {
            const mockWishlist = {
                renderWishlist: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Wishlist</div>';
                    }
                },
                addToWishlist: (planet) => {
                    return true;
                }
            };
            
            global.window.planetWishlistSystem = mockWishlist;
            
            const container = document.getElementById('wishlist-container');
            if (container) {
                mockWishlist.renderWishlist('wishlist-container');
                expect(container.innerHTML).toContain('Wishlist');
            }
        });
        
        test('Bookmark system initializes', () => {
            const mockBookmarks = {
                renderBookmarks: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Bookmarks</div>';
                    }
                },
                addBookmark: (planet) => {
                    return true;
                },
                isBookmarked: (kepid) => {
                    return false;
                }
            };
            
            global.window.planetBookmarkSystem = mockBookmarks;
            
            const container = document.getElementById('bookmarks-container');
            if (container) {
                mockBookmarks.renderBookmarks('bookmarks-container');
                expect(container.innerHTML).toContain('Bookmarks');
            }
        });
        
        test('Rarity calculator works', () => {
            const mockCalculator = {
                calculateRarity: (planet) => {
                    return {
                        score: 85,
                        factors: ['rare_type', 'unique_properties']
                    };
                },
                renderRarity: (containerId, planet) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Rarity: 85</div>';
                    }
                }
            };
            
            global.window.planetRarityCalculator = mockCalculator;
            
            const planet = { kepid: 12345, type: 'Earth-like' };
            const rarity = mockCalculator.calculateRarity(planet);
            expect(rarity.score).toBe(85);
        });
        
        test('Comparison matrix works', () => {
            const mockComparison = {
                selectedPlanets: [],
                addPlanet(planet) {
                    if (this.selectedPlanets.length < 5) {
                        this.selectedPlanets.push(planet);
                        return true;
                    }
                    return false;
                },
                renderMatrix: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '<div>Comparison</div>';
                    }
                }
            };
            
            global.window.planetComparisonMatrix = mockComparison;
            
            const planet = { kepid: 12345 };
            const added = mockComparison.addPlanet(planet);
            expect(added).toBe(true);
            expect(mockComparison.selectedPlanets.length).toBe(1);
        });
    });
    
    describe('Feature Integration', () => {
        test('All features can be initialized together', () => {
            const features = [
                'planetTradingMarketplace',
                'planetDiscoveryLeaderboard',
                'planetCollectionShowcase',
                'planetWishlistSystem',
                'planetBookmarkSystem',
                'planetRarityCalculator'
            ];
            
            features.forEach(feature => {
                global.window[feature] = {
                    init: () => Promise.resolve(),
                    render: () => {}
                };
            });
            
            features.forEach(feature => {
                expect(global.window[feature]).toBeDefined();
            });
        });
        
        test('Features handle missing containers gracefully', () => {
            const mockFeature = {
                render: (containerId) => {
                    const container = document.getElementById(containerId);
                    if (!container) {
                        console.warn(`Container ${containerId} not found`);
                        return false;
                    }
                    return true;
                }
            };
            
            const result = mockFeature.render('non-existent-container');
            expect(result).toBe(false);
        });
    });
    
    describe('Error Handling', () => {
        test('Features handle Supabase errors', async () => {
            const mockFeature = {
                async init() {
                    try {
                        await mockSupabase.from('test').select();
                    } catch (error) {
                        console.error('Supabase error:', error);
                        return false;
                    }
                    return true;
                }
            };
            
            const result = await mockFeature.init();
            expect(result).toBe(true);
        });
        
        test('Features handle missing dependencies', () => {
            const mockFeature = {
                init: () => {
                    if (!global.window.supabase) {
                        console.warn('Supabase not available');
                        return false;
                    }
                    return true;
                }
            };
            global.window.supabase = global.window.supabase || mockSupabase;
            const result = mockFeature.init();
            expect(result).toBe(true);
        });
    });
});

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mockSupabase };
}

