import { generateTile } from './terrain.js';
let recipe = null,
    version = null;
self.onmessage = (event) => {
    const m = event.data;
    if (m.type === 'recipe') {
        recipe = m.recipe;
        version = m.version;
        return;
    }
    if (m.type !== 'tile' || !recipe || m.version !== version) return;
    try {
        const tile = generateTile(m.tile, recipe, m.neighbourLevels);
        self.postMessage({ type: 'tile', id: m.id, version, ...tile }, [
            tile.positions.buffer,
            tile.normals.buffer,
            tile.colours.buffer,
            tile.directions.buffer,
            tile.detailOrigins.buffer,
            tile.roughness.buffer,
            tile.indices.buffer,
        ]);
    } catch (error) {
        self.postMessage({ type: 'error', id: m.id, version, message: error.message });
    }
};
