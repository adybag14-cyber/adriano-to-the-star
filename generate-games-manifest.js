/**
 * Generate Games Manifest
 * Creates a JSON manifest file from all SWF files in the games directory
 * Run with: node generate-games-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gamesDir = path.join(__dirname, 'games');
const manifestPath = path.join(gamesDir, 'games-manifest.json');
const listPath = path.join(gamesDir, 'games-list.txt');

// Read games list file
let gameFiles = [];
if (fs.existsSync(listPath)) {
    const listContent = fs.readFileSync(listPath, 'utf8');
    gameFiles = listContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith('.swf') && line.length > 0);
} else {
    // Fallback: read directory
    if (fs.existsSync(gamesDir)) {
        gameFiles = fs.readdirSync(gamesDir)
            .filter(file => file.endsWith('.swf'))
            .sort();
    }
}

// Categorize games
function categorizeGame(filename) {
    const lower = filename.toLowerCase();
    
    if (lower.includes('tower') || lower.includes('defense') || lower.includes('defence')) {
        return 'Tower Defense';
    }
    if (lower.includes('soccer') || lower.includes('football') || lower.includes('hockey') || lower.includes('basketball') || lower.includes('sports')) {
        return 'Sports';
    }
    if (lower.includes('racing') || lower.includes('race') || lower.includes('car') || lower.includes('truck') || lower.includes('drift')) {
        return 'Racing';
    }
    if (lower.includes('shoot') || lower.includes('gun') || lower.includes('war') || lower.includes('battle') || lower.includes('attack') || lower.includes('assault')) {
        return 'Action';
    }
    if (lower.includes('puzzle') || lower.includes('tetris') || lower.includes('match') || lower.includes('bloxorz') || lower.includes('sugar')) {
        return 'Puzzle';
    }
    if (lower.includes('adventure') || lower.includes('rpg') || lower.includes('quest') || lower.includes('fancy_pants')) {
        return 'Adventure';
    }
    if (lower.includes('strategy') || lower.includes('empire') || lower.includes('warfare') || lower.includes('civilization')) {
        return 'Strategy';
    }
    if (lower.includes('christmas') || lower.includes('xmas') || lower.includes('snow')) {
        return 'Holiday';
    }
    
    return 'Other';
}

// Clean game name
function cleanGameName(filename) {
    let name = filename.replace(/\.swf$/i, '');
    name = name.replace(/_/g, ' ');
    name = name.replace(/^[\d\s\-_]+/, '');
    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    name = name.replace(/\s+/g, ' ').trim();
    return name || filename.replace(/\.swf$/i, '');
}

// Generate manifest
const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    totalGames: gameFiles.length,
    games: gameFiles.map(filename => ({
        filename: filename,
        name: cleanGameName(filename),
        category: categorizeGame(filename),
        path: `games/${filename}`
    }))
};

// Write manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✅ Generated games manifest with ${gameFiles.length} games`);
console.log(`📄 Manifest saved to: ${manifestPath}`);

