/**
 * Captain's Log Archive (UPGRADED)
 * Secure digital storage for player events and narrative persistence.
 */
class CaptainsArchive {
    constructor() {
        this.entries = [];
    }

    addEntry(content, tags = []) {
        const entry = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date(),
            content,
            tags,
            stardate: (Date.now() / 1000000).toFixed(2)
        };
        this.entries.push(entry);
        return entry;
    }
}
if (typeof module !== 'undefined') module.exports = CaptainsArchive;