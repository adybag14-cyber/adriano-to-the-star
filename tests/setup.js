/**
 * Jest Test Setup
 * 
 * Global test setup and configuration.
 */

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock window
global.window = {
    location: {
        href: 'http://localhost',
        origin: 'http://localhost',
        pathname: '/'
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
};

if (typeof document !== 'undefined' && document.body) {
    const ids = [
        'marketplace-container',
        'trading-notifications-container',
        'leaderboard-container',
        'collections-container',
        'achievements-container',
        'wishlist-container',
        'bookmarks-container',
        'rarity-container',
        'comparison-container'
    ];
    ids.forEach(id => {
        if (!document.getElementById(id)) {
            const el = document.createElement('div');
            el.id = id;
            document.body.appendChild(el);
        }
    });
}

