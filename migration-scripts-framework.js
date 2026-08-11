class MigrationScriptsFramework {
    constructor() {
        this.migrations = [];
        this.applied = new Set();
    }
    register(id, up, down = null) {
        this.migrations.push({ id, up, down });
        return id;
    }
    async applyAll() {
        const results = [];
        for (const m of this.migrations) {
            if (this.applied.has(m.id)) continue;
            try { await Promise.resolve(m.up()); this.applied.add(m.id); results.push({ id: m.id, success: true }); }
            catch (e) { results.push({ id: m.id, success: false, error: e.message }); }
        }
        return results;
    }
    async rollback(id) {
        const m = this.migrations.find(x => x.id === id);
        if (!m || !m.down) return false;
        await Promise.resolve(m.down());
        this.applied.delete(id);
        return true;
    }
}
const migrationFramework = new MigrationScriptsFramework();
if (typeof window !== 'undefined') {
    window.migrationFramework = migrationFramework;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MigrationScriptsFramework;
}
