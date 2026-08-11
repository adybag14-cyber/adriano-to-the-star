
// Standalone verification of the filter logic
// We copy the critical methods from database-optimized.js to verify their correctness independent of DOM/Environment

class MockDatabase {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.activeFilters = { status: 'all', type: 'all', availability: 'all' };
        this.rangeFilters = { radiusMin: null, radiusMax: null, distanceMin: null, distanceMax: null, yearMin: null, yearMax: null };
        this.searchTerm = '';
        this.currentPage = 1;
    }

    normalizeKepid(kepid) {
        if (kepid === null || kepid === undefined) return null;
        const num = typeof kepid === 'string' ? parseInt(kepid, 10) : Number(kepid);
        return isNaN(num) ? null : num;
    }

    compareKepid(kepid1, kepid2) {
        const n1 = this.normalizeKepid(kepid1);
        const n2 = this.normalizeKepid(kepid2);
        if (n1 === null || n2 === null) return false;
        return n1 === n2;
    }

    logSearchAnalytics() { }
    searchUsingIndex() { return this.allData; } // Mock search
    updateURLFromState() { }
    renderPage() { }

    // COPIED LOGIC FROM database-optimized.js (Lines ~1585)
    applyFilters(preservePage = false) {
        // Use search index for fast search results
        let dataToFilter = this.allData;

        const hasSearch = this.searchTerm && this.searchTerm.length >= 2;
        if (hasSearch) {
            this.logSearchAnalytics(this.searchTerm);
            // Use indexed search for instant results
            dataToFilter = this.searchUsingIndex(this.searchTerm);
        }

        const ranges = this.rangeFilters || {};
        const radiusMin = typeof ranges.radiusMin === 'number' && !isNaN(ranges.radiusMin) ? ranges.radiusMin : null;
        const radiusMax = typeof ranges.radiusMax === 'number' && !isNaN(ranges.radiusMax) ? ranges.radiusMax : null;
        const distanceMin = typeof ranges.distanceMin === 'number' && !isNaN(ranges.distanceMin) ? ranges.distanceMin : null;
        const distanceMax = typeof ranges.distanceMax === 'number' && !isNaN(ranges.distanceMax) ? ranges.distanceMax : null;
        const yearMin = typeof ranges.yearMin === 'number' && !isNaN(ranges.yearMin) ? ranges.yearMin : null;
        const yearMax = typeof ranges.yearMax === 'number' && !isNaN(ranges.yearMax) ? ranges.yearMax : null;

        this.filteredData = dataToFilter.filter(planet => {

            // Status filter - handle 'CONFIRMED', 'Confirmed Planet', 'CANDIDATE', etc.
            if (this.activeFilters.status !== 'all') {
                const planetStatus = planet.status || '';
                const planetStatusUpper = planetStatus.toUpperCase();
                const filterStatusUpper = this.activeFilters.status.toUpperCase();

                let matchesStatus = false;
                if (filterStatusUpper === 'CONFIRMED') {
                    // Match "CONFIRMED", "Confirmed Planet", "CONFIRMED PLANET", etc.
                    matchesStatus = planetStatusUpper.includes('CONFIRMED') ||
                        planetStatusUpper === 'CONFIRMED PLANET' ||
                        planetStatus === 'Confirmed Planet';
                } else if (filterStatusUpper === 'CANDIDATE') {
                    // Match "CANDIDATE" - but exclude confirmed and false positives
                    matchesStatus = (planetStatusUpper.includes('CANDIDATE') || planetStatus === 'CANDIDATE') &&
                        !planetStatusUpper.includes('CONFIRMED') &&
                        !planetStatusUpper.includes('FALSE');
                } else {
                    matchesStatus = planetStatusUpper.includes(filterStatusUpper);
                }

                if (!matchesStatus) {
                    return false; // Doesn't match status filter
                }
            }

            if (this.activeFilters.type !== 'all' && planet.type !== this.activeFilters.type) {
                return false; // Doesn't match type filter
            }

            if (this.activeFilters.availability !== 'all' && planet.availability !== this.activeFilters.availability) {
                return false; // Doesn't match availability filter
            }

            const radius = planet.radius;
            if (radiusMin !== null && (radius === null || radius === undefined || isNaN(radius) || radius < radiusMin)) {
                return false;
            }
            if (radiusMax !== null && (radius === null || radius === undefined || isNaN(radius) || radius > radiusMax)) {
                return false;
            }

            const distance = planet.distance;
            if (distanceMin !== null && (distance === null || distance === undefined || isNaN(distance) || distance < distanceMin)) {
                return false;
            }
            if (distanceMax !== null && (distance === null || distance === undefined || isNaN(distance) || distance > distanceMax)) {
                return false;
            }

            const year = planet.disc_year;
            if (yearMin !== null && (year === null || year === undefined || isNaN(year) || year < yearMin)) {
                return false;
            }
            if (yearMax !== null && (year === null || year === undefined || isNaN(year) || year > yearMax)) {
                return false;
            }

            return true; // Passes all filters
        });

        if (!preservePage || !this.currentPage || this.currentPage < 1) {
            this.currentPage = 1;
        }

        // Removed DOM update calls for this test
    }
}

// Tests
console.log("Starting Logic Tests...");
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
        process.exitCode = 1;
    }
}

const db = new MockDatabase();
db.allData = [
    { kepid: 1, kepler_name: 'Earth 2', status: 'CONFIRMED', type: 'Earth-like', radius: 1.1, distance: 100, disc_year: 2020, availability: 'available' },
    { kepid: 2, kepler_name: 'Jupiter 2', status: 'CANDIDATE', type: 'Gas Giant', radius: 11.2, distance: 500, disc_year: 2021, availability: 'available' },
    { kepid: 3, kepler_name: 'Super Earth', status: 'Confirmed Planet', type: 'Super-Earth', radius: 2.5, distance: 50, disc_year: 2019, availability: 'claimed' },
    { kepid: 4, kepler_name: 'Kepler-452b', status: 'CONFIRMED', type: 'Super-Earth', radius: 1.6, distance: 1400, disc_year: 2015, availability: 'available' }
];

// Test 1: Status 'CONFIRMED' matching variants
db.activeFilters.status = 'CONFIRMED';
db.applyFilters();
assert(db.filteredData.length === 3, "Confirmed filter catches 'CONFIRMED' and 'Confirmed Planet' (3 items)");

// Test 2: Type 'Super-Earth'
db.activeFilters.status = 'all';
db.activeFilters.type = 'Super-Earth';
db.applyFilters();
assert(db.filteredData.length === 2, "Type filter finds 2 Super-Earths");

// Test 3: Radius Range (1.0 - 2.0)
db.activeFilters.type = 'all';
db.rangeFilters.radiusMin = 1.0;
db.rangeFilters.radiusMax = 2.0;
db.applyFilters();
assert(db.filteredData.length === 2, "Radius 1.0-2.0 finds Earth 2 (1.1) and Kepler-452b (1.6)");

console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
if (failed === 0) {
    console.log("Success: Filter logic is robust.");
} else {
    process.exit(1);
}
