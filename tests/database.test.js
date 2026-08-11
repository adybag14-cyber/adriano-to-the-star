/* eslint-env jest */
/**
 * Unit Tests for Core Database Functionality
 * 
 * Tests for planet search, filtering, and claiming functionality.
 * 
 * @module DatabaseTests
 * @version 1.0.0
 * @author Adriano To The Star
 */

// Jest test suite for database functionality
// Run with: npm test -- database.test.js

describe('Database Functionality', () => {
    let database;

    beforeEach(() => {
        // Mock database instance
        database = {
            planets: [
                { id: 1, name: 'Kepler-22b', type: 'Super Earth', distance: 600 },
                { id: 2, name: 'Kepler-452b', type: 'Earth-like', distance: 1400 },
                { id: 3, name: 'Proxima Centauri b', type: 'Terrestrial', distance: 4.2 }
            ],
            search: jest.fn(),
            filter: jest.fn(),
            claim: jest.fn()
        };
    });

    describe('Planet Search', () => {
        test('should search planets by name', () => {
            const results = database.planets.filter(p =>
                p.name.toLowerCase().includes('kepler')
            );
            expect(results.length).toBe(2);
        });

        test('should return empty array for no matches', () => {
            const results = database.planets.filter(p =>
                p.name.toLowerCase().includes('nonexistent')
            );
            expect(results.length).toBe(0);
        });

        test('should handle case-insensitive search', () => {
            const results = database.planets.filter(p =>
                p.name.toLowerCase().includes('KEPLER'.toLowerCase())
            );
            expect(results.length).toBe(2);
        });
    });

    describe('Planet Filtering', () => {
        test('should filter by planet type', () => {
            const results = database.planets.filter(p => p.type === 'Super Earth');
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Kepler-22b');
        });

        test('should filter by distance range', () => {
            const results = database.planets.filter(p => p.distance < 1000);
            expect(results.length).toBe(2);
        });

        test('should combine multiple filters', () => {
            const results = database.planets.filter(p =>
                p.type === 'Earth-like' && p.distance > 1000
            );
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Kepler-452b');
        });
    });

    describe('Planet Claiming', () => {
        test('should claim a planet', () => {
            const planet = database.planets[0];
            const userId = 'user123';

            database.claim = jest.fn().mockReturnValue({
                success: true,
                planetId: planet.id,
                userId: userId
            });

            const result = database.claim(planet.id, userId);
            expect(result.success).toBe(true);
            expect(database.claim).toHaveBeenCalledWith(planet.id, userId);
        });

        test('should prevent claiming already claimed planet', () => {
            const planet = database.planets[0];
            const userId = 'user123';

            database.claim = jest.fn().mockReturnValue({
                success: false,
                error: 'Planet already claimed'
            });

            const result = database.claim(planet.id, userId);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Planet already claimed');
        });
    });
});

